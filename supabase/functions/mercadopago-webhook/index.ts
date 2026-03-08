import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // MP sends different notification types
    if (body.type === "payment" || body.action === "payment.updated" || body.action === "payment.created") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch payment details from MP
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

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Map MP status to our status
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

      // If approved, update order status to confirmed
      if (payment.status === "approved") {
        await supabase.from("orders").update({
          status: "confirmed",
        }).eq("id", orderId);

        await supabase.from("order_status_history").insert({
          order_id: orderId,
          status: "confirmed",
          notes: `Pagamento aprovado via ${payment.payment_type_id || "Mercado Pago"} - ID: ${payment.id}`,
        });

        // Get user_id from order to send notification
        const { data: order } = await supabase
          .from("orders")
          .select("user_id")
          .eq("id", orderId)
          .single();

        if (order) {
          await supabase.from("notifications").insert({
            user_id: order.user_id,
            title: "Pagamento confirmado! ✅",
            message: `Seu pagamento do pedido #${orderId.substring(0, 8)} foi aprovado!`,
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
    // Always return 200 to MP to avoid retries on our errors
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
