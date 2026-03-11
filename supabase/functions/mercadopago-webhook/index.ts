import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    const bodyText = await req.text();

    // Log webhook for debugging (use anon key for logging only)
    const logSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch {
      console.error("Invalid JSON body");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Webhook received:", JSON.stringify(body));

    await logSupabase.from("webhook_logs").insert({
      event_type: body.type || body.action || "unknown",
      payment_id: String(body.data?.id || ""),
      raw_payload: body,
    }).catch(() => {});

    // Process payment notifications
    if (body.type === "payment" || body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
      });

      if (!mpResponse.ok) {
        const errorBody = await mpResponse.text();
        console.error("MP payment fetch error:", errorBody);
        throw new Error(`Failed to fetch payment [${mpResponse.status}]`);
      }

      const payment = await mpResponse.json();
      console.log("Payment details:", JSON.stringify({
        id: payment.id,
        status: payment.status,
        external_reference: payment.external_reference,
        payment_type: payment.payment_type_id,
      }));

      const orderId = payment.external_reference;
      if (!orderId) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update webhook log with order_id and status
      await logSupabase.from("webhook_logs").update({
        order_id: orderId,
        status: payment.status,
      }).eq("payment_id", String(paymentId)).catch(() => {});

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const statusMap: Record<string, string> = {
        approved: "approved",
        pending: "pending",
        authorized: "pending",
        in_process: "pending",
        in_mediation: "pending",
        rejected: "rejected",
        cancelled: "cancelled",
        refunded: "refunded",
        charged_back: "refunded",
      };

      const paymentStatus = statusMap[payment.status] || "pending";

      // Update payment record
      await supabase.from("payments").update({
        mp_payment_id: String(payment.id),
        status: paymentStatus,
        payment_method: payment.payment_type_id || null,
        mp_status_detail: payment.status_detail || null,
        paid_at: payment.status === "approved" ? new Date().toISOString() : null,
      }).eq("order_id", orderId);

      // If approved, update order + stock + notifications + commission
      if (payment.status === "approved") {
        await supabase.from("orders").update({
          status: "confirmed",
        }).eq("id", orderId);

        await supabase.from("order_status_history").insert({
          order_id: orderId,
          status: "confirmed",
          notes: `Pagamento aprovado via ${payment.payment_type_id || "Mercado Pago"} - ID: ${payment.id}`,
        });

        // Get order details
        const { data: order } = await supabase
          .from("orders")
          .select("user_id, total_amount, seller_id")
          .eq("id", orderId)
          .single();

        if (order) {
          // Notify customer
          await supabase.from("notifications").insert({
            user_id: order.user_id,
            title: "Pagamento confirmado! ✅",
            message: `Seu pagamento do pedido #${orderId.substring(0, 8)} foi aprovado! Seu pedido está sendo preparado.`,
            type: "order",
            link: "/minha-conta",
          });

          // Notify ALL admins
          const { data: adminRoles } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin");

          if (adminRoles) {
            for (const admin of adminRoles) {
              await supabase.from("notifications").insert({
                user_id: admin.user_id,
                title: "💰 Novo pagamento confirmado!",
                message: `Pedido #${orderId.substring(0, 8)} — R$ ${Number(order.total_amount).toFixed(2).replace(".", ",")} pago via ${payment.payment_type_id || "MP"}.`,
                type: "order",
                link: "/admin",
              });
            }
          }

          // Auto commission
          const { data: sellers } = await supabase
            .from("sellers")
            .select("id, user_id, commission_rate")
            .eq("is_active", true)
            .limit(1);

          if (sellers && sellers.length > 0) {
            const seller = sellers[0];
            const commissionAmount = Number(order.total_amount) * (Number(seller.commission_rate) / 100);

            const { data: existingComm } = await supabase
              .from("sale_commissions")
              .select("id")
              .eq("order_id", orderId)
              .eq("seller_id", seller.id)
              .maybeSingle();

            if (!existingComm) {
              await supabase.from("sale_commissions").insert({
                order_id: orderId,
                seller_id: seller.id,
                order_total: order.total_amount,
                commission_rate: seller.commission_rate,
                commission_amount: Math.round(commissionAmount * 100) / 100,
                status: "pending",
              });

              const { data: currentSeller } = await supabase
                .from("sellers")
                .select("total_sales, total_commission")
                .eq("id", seller.id)
                .single();

              if (currentSeller) {
                await supabase.from("sellers").update({
                  total_sales: Number(currentSeller.total_sales) + Number(order.total_amount),
                  total_commission: Number(currentSeller.total_commission) + commissionAmount,
                }).eq("id", seller.id);
              }

              await supabase.from("notifications").insert({
                user_id: seller.user_id,
                title: "🎉 Nova comissão!",
                message: `Comissão de R$ ${commissionAmount.toFixed(2).replace(".", ",")} do pedido #${orderId.substring(0, 8)}.`,
                type: "order",
                link: "/vendedor",
              });
            }
          }
        }

        // Decrease stock
        const { data: orderItemsList } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", orderId);

        if (orderItemsList) {
          for (const item of orderItemsList) {
            if (item.product_id) {
              const { data: product } = await supabase
                .from("products")
                .select("stock_quantity")
                .eq("id", item.product_id)
                .single();

              if (product) {
                await supabase
                  .from("products")
                  .update({ stock_quantity: Math.max(0, product.stock_quantity - item.quantity) })
                  .eq("id", item.product_id);
              }
            }
          }
        }
      }

      // If rejected/cancelled
      if (payment.status === "rejected" || payment.status === "cancelled") {
        await supabase.from("orders").update({
          status: "cancelled",
        }).eq("id", orderId);

        await supabase.from("order_status_history").insert({
          order_id: orderId,
          status: "cancelled",
          notes: `Pagamento ${payment.status} - ${payment.status_detail || "sem detalhes"}`,
        });

        const { data: order } = await supabase
          .from("orders")
          .select("user_id")
          .eq("id", orderId)
          .single();

        if (order) {
          await supabase.from("notifications").insert({
            user_id: order.user_id,
            title: "Pagamento não aprovado ❌",
            message: `O pagamento do pedido #${orderId.substring(0, 8)} não foi aprovado. Tente novamente.`,
            type: "order",
            link: "/minha-conta",
          });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    // Always return 200 to prevent MP from retrying indefinitely
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
