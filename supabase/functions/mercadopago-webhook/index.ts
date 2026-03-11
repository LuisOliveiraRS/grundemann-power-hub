import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const normalizePaymentStatus = (status?: string | null) => {
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

  return statusMap[status || ""] || "pending";
};

const isConfirmedOrderStatus = (status?: string | null) =>
  ["confirmed", "processing", "shipped", "delivered"].includes(status || "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");

    const bodyText = await req.text();
    let body: any = {};

    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      console.error("Invalid JSON body in webhook");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("Webhook received:", JSON.stringify(body));

    const { data: logEntry } = await supabase
      .from("webhook_logs")
      .insert({
        event_type: body.type || body.action || "unknown",
        payment_id: String(body.data?.id || ""),
        raw_payload: body,
      })
      .select("id")
      .maybeSingle();

    if (body.type === "payment" || body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      });

      if (!mpResponse.ok) {
        const errorBody = await mpResponse.text();
        console.error("MP payment fetch error:", errorBody);
        throw new Error(`Failed to fetch payment [${mpResponse.status}]`);
      }

      const payment = await mpResponse.json();
      const orderId = payment.external_reference;
      const paymentStatus = normalizePaymentStatus(payment.status);

      if (logEntry?.id) {
        await supabase
          .from("webhook_logs")
          .update({ order_id: orderId || null, status: payment.status || null })
          .eq("id", logEntry.id);
      }

      if (!orderId) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: latestPayment } = await supabase
        .from("payments")
        .select("id, status, payment_method, mp_status_detail")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestPayment) {
        await supabase
          .from("payments")
          .update({
            mp_payment_id: String(payment.id),
            status: paymentStatus,
            payment_method: payment.payment_type_id || latestPayment.payment_method || null,
            mp_status_detail: payment.status_detail || latestPayment.mp_status_detail || null,
            paid_at: paymentStatus === "approved" ? (payment.date_approved || new Date().toISOString()) : null,
          })
          .eq("id", latestPayment.id);
      }

      const { data: order } = await supabase
        .from("orders")
        .select("id, user_id, status, total_amount")
        .eq("id", orderId)
        .single();

      if (!order) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (paymentStatus === "approved" && !isConfirmedOrderStatus(order.status)) {
        await supabase.from("orders").update({ status: "confirmed" }).eq("id", orderId);

        await supabase.from("order_status_history").insert({
          order_id: orderId,
          status: "confirmed",
          notes: `Pagamento aprovado via ${payment.payment_type_id || "Mercado Pago"} - ID: ${payment.id}`,
        });

        await supabase.from("notifications").insert({
          user_id: order.user_id,
          title: "Pagamento confirmado! ✅",
          message: `Seu pagamento do pedido #${orderId.substring(0, 8)} foi aprovado! Seu pedido está sendo preparado.`,
          type: "order",
          link: "/minha-conta",
        });

        const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
        if (adminRoles?.length) {
          await supabase.from("notifications").insert(
            adminRoles.map((admin) => ({
              user_id: admin.user_id,
              title: "💰 Novo pagamento confirmado!",
              message: `Pedido #${orderId.substring(0, 8)} — R$ ${Number(order.total_amount).toFixed(2).replace(".", ",")} pago via ${payment.payment_type_id || "MP"}.`,
              type: "order",
              link: "/admin",
            }))
          );
        }

        const { data: orderItemsList } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", orderId);

        for (const item of orderItemsList || []) {
          if (!item.product_id) continue;
          const { data: product } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", item.product_id)
            .single();

          if (product) {
            await supabase
              .from("products")
              .update({ stock_quantity: Math.max(0, Number(product.stock_quantity) - Number(item.quantity)) })
              .eq("id", item.product_id);
          }
        }
      }

      if (["rejected", "cancelled", "refunded"].includes(paymentStatus) && order.status === "pending") {
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);

        await supabase.from("order_status_history").insert({
          order_id: orderId,
          status: "cancelled",
          notes: `Pagamento ${paymentStatus} - ${payment.status_detail || "sem detalhes"}`,
        });

        await supabase.from("notifications").insert({
          user_id: order.user_id,
          title: "Pagamento não aprovado ❌",
          message: `O pagamento do pedido #${orderId.substring(0, 8)} não foi aprovado. Tente novamente.`,
          type: "order",
          link: "/minha-conta",
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
