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

const isCancelledPaymentStatus = (status?: string | null) =>
  ["rejected", "cancelled", "refunded"].includes(status || "");

const extractPaymentIdFromResource = (resource?: string | null) => {
  if (!resource) return null;
  const parts = resource.split("/").filter(Boolean);
  const maybeId = parts[parts.length - 1];
  return maybeId && /^\d+$/.test(maybeId) ? maybeId : null;
};

const parseWebhookEvent = (reqUrl: string, body: Record<string, any>) => {
  const url = new URL(reqUrl);
  const queryType = url.searchParams.get("type") || url.searchParams.get("topic") || "";
  const queryPaymentId = url.searchParams.get("data.id") || url.searchParams.get("id") || "";

  const action = String(body.action || "");
  const bodyType = String(body.type || "");
  const isPaymentEvent =
    bodyType === "payment" ||
    action === "payment.updated" ||
    action === "payment.created" ||
    queryType === "payment";

  const paymentId =
    String(body.data?.id || "") ||
    String(body.id || "") ||
    queryPaymentId ||
    extractPaymentIdFromResource(String(body.resource || "")) ||
    "";

  const eventType = bodyType || action || queryType || "unknown";

  return { eventType, isPaymentEvent, paymentId };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");

    const bodyText = await req.text();
    let body: Record<string, any> = {};
    try { body = bodyText ? JSON.parse(bodyText) : {}; } catch { body = {}; }

    const { eventType, isPaymentEvent, paymentId } = parseWebhookEvent(req.url, body);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: logEntry } = await supabase
      .from("webhook_logs")
      .insert({
        event_type: eventType,
        payment_id: paymentId || null,
        raw_payload: {
          body,
          query: Object.fromEntries(new URL(req.url).searchParams.entries()),
        },
      })
      .select("id")
      .maybeSingle();

    if (!isPaymentEvent || !paymentId) {
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
    const orderId = String(payment.external_reference || "");
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

    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, status, total_amount, seller_id")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
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

    const paymentPayload = {
      mp_payment_id: String(payment.id),
      status: paymentStatus,
      payment_method: payment.payment_type_id || latestPayment?.payment_method || null,
      mp_status_detail: payment.status_detail || latestPayment?.mp_status_detail || null,
      paid_at: paymentStatus === "approved" ? (payment.date_approved || new Date().toISOString()) : null,
      amount: Number(payment.transaction_amount || order.total_amount || 0),
    };

    if (latestPayment?.id) {
      await supabase.from("payments").update(paymentPayload).eq("id", latestPayment.id);
    } else {
      await supabase.from("payments").insert({
        order_id: orderId,
        user_id: order.user_id,
        ...paymentPayload,
      });
    }

    // ========== PAYMENT APPROVED ==========
    if (paymentStatus === "approved" && !isConfirmedOrderStatus(order.status)) {
      // Confirm stock reservation (decreases actual stock)
      const { error: stockError } = await supabase.rpc("confirm_stock_reservation", {
        p_order_id: orderId,
      });
      if (stockError) {
        console.error("Stock confirmation error (falling back to manual):", stockError);
        // Fallback: manual stock decrease for orders without reservations
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", orderId);
        for (const item of orderItems || []) {
          if (!item.product_id) continue;
          const { data: product } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", item.product_id)
            .single();
          if (product) {
            await supabase.from("products")
              .update({ stock_quantity: Math.max(0, Number(product.stock_quantity) - Number(item.quantity)) })
              .eq("id", item.product_id);
          }
        }
      }

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
          adminRoles.map((admin: any) => ({
            user_id: admin.user_id,
            title: "💰 Novo pagamento confirmado!",
            message: `Pedido #${orderId.substring(0, 8)} — R$ ${Number(order.total_amount).toFixed(2).replace(".", ",")} pago via ${payment.payment_type_id || "MP"}.`,
            type: "order",
            link: "/admin",
          }))
        );
      }

      // Register commission for sellers
      const sellerId = order.seller_id;
      if (sellerId) {
        const { data: existingComm } = await supabase
          .from("sale_commissions").select("id").eq("order_id", orderId).maybeSingle();
        if (!existingComm) {
          const { data: seller } = await supabase
            .from("sellers").select("id, commission_rate").eq("id", sellerId).maybeSingle();
          if (seller) {
            const commissionAmount = Number(order.total_amount) * (Number(seller.commission_rate) / 100);
            await supabase.from("sale_commissions").insert({
              order_id: orderId, seller_id: seller.id,
              order_total: Number(order.total_amount),
              commission_rate: Number(seller.commission_rate),
              commission_amount: commissionAmount, status: "pending",
            });
            const { data: currentSeller } = await supabase
              .from("sellers").select("total_sales, total_commission").eq("id", seller.id).single();
            if (currentSeller) {
              await supabase.from("sellers").update({
                total_sales: Number(currentSeller.total_sales) + Number(order.total_amount),
                total_commission: Number(currentSeller.total_commission) + commissionAmount,
              }).eq("id", seller.id);
            }
          }
        }
      } else {
        const { data: defaultSeller } = await supabase
          .from("sellers")
          .select("id, commission_rate, total_sales, total_commission")
          .eq("is_active", true).limit(1).maybeSingle();
        if (defaultSeller) {
          const { data: existingComm } = await supabase
            .from("sale_commissions").select("id").eq("order_id", orderId).maybeSingle();
          if (!existingComm) {
            const commissionAmount = Number(order.total_amount) * (Number(defaultSeller.commission_rate) / 100);
            await supabase.from("sale_commissions").insert({
              order_id: orderId, seller_id: defaultSeller.id,
              order_total: Number(order.total_amount),
              commission_rate: Number(defaultSeller.commission_rate),
              commission_amount: commissionAmount, status: "pending",
            });
            await supabase.from("sellers").update({
              total_sales: Number(defaultSeller.total_sales) + Number(order.total_amount),
              total_commission: Number(defaultSeller.total_commission) + commissionAmount,
            }).eq("id", defaultSeller.id);
          }
        }
      }
    }

    // ========== PAYMENT CANCELLED/REJECTED ==========
    if (isCancelledPaymentStatus(paymentStatus) && order.status === "pending") {
      // Release stock reservations
      try {
        await supabase.rpc("release_stock_reservation", { p_order_id: orderId });
      } catch (err: any) {
        console.error("Stock release error:", err);
      }

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
