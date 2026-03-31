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

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!mpAccessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    const authedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await authedSupabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = claimsData.claims.sub;
    const { data: adminCheck } = await authedSupabase.rpc("is_admin");
    const isAdmin = Boolean(adminCheck);

    const { order_id } = await req.json();
    if (!order_id) {
      throw new Error("order_id is required");
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: order, error: orderError } = await adminSupabase
      .from("orders")
      .select("id, user_id, status, total_amount, seller_id")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return jsonResponse({ error: "Order not found" }, 404);
    }

    if (!isAdmin && order.user_id !== userId) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const { data: latestPayment } = await adminSupabase
      .from("payments")
      .select("id, status, mp_payment_id, payment_method, mp_status_detail")
      .eq("order_id", order_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let mercadoPagoPayment: any = null;

    if (latestPayment?.mp_payment_id) {
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${latestPayment.mp_payment_id}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      });

      if (paymentResponse.ok) {
        mercadoPagoPayment = await paymentResponse.json();
      }
    }

    if (!mercadoPagoPayment) {
      const searchResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(order_id)}&sort=date_created&criteria=desc&limit=1`,
        {
          headers: { Authorization: `Bearer ${mpAccessToken}` },
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        mercadoPagoPayment = searchData?.results?.[0] || null;
      }
    }

    if (!mercadoPagoPayment) {
      return jsonResponse({
        ok: true,
        synced: false,
        payment_status: latestPayment?.status || "pending",
        order_status: order.status,
      });
    }

    const normalizedPaymentStatus = normalizePaymentStatus(mercadoPagoPayment.status);
    const paidAt = mercadoPagoPayment.date_approved || mercadoPagoPayment.date_last_updated || null;

    const paymentPayload = {
      mp_payment_id: String(mercadoPagoPayment.id),
      status: normalizedPaymentStatus,
      payment_method: mercadoPagoPayment.payment_type_id || latestPayment?.payment_method || null,
      mp_status_detail: mercadoPagoPayment.status_detail || latestPayment?.mp_status_detail || null,
      paid_at: normalizedPaymentStatus === "approved" ? paidAt : null,
      amount: Number(mercadoPagoPayment.transaction_amount || order.total_amount || 0),
    };

    if (latestPayment?.id) {
      await adminSupabase.from("payments").update(paymentPayload).eq("id", latestPayment.id);
    } else {
      await adminSupabase.from("payments").insert({
        order_id,
        user_id: order.user_id,
        ...paymentPayload,
      });
    }

    let resolvedOrderStatus = order.status;

    // ========== PAYMENT APPROVED ==========
    if (normalizedPaymentStatus === "approved" && !isConfirmedOrderStatus(order.status)) {
      // FIX: Use transactional confirm_stock_reservation RPC instead of manual stock decrease
      // This prevents double-deduction when webhook already confirmed the reservation
      const { error: stockError } = await adminSupabase.rpc("confirm_stock_reservation", {
        p_order_id: order_id,
      });

      if (stockError) {
        console.error("Stock confirmation error (reservation may not exist, falling back):", stockError);
        // Fallback: Check if stock was already decreased by webhook
        const { data: existingReservations } = await adminSupabase
          .from("stock_reservations")
          .select("id, status")
          .eq("order_id", order_id);

        const hasConfirmed = existingReservations?.some(r => r.status === "confirmed");
        
        if (!hasConfirmed) {
          // No confirmed reservations — safe to do manual decrease as last resort
          const { data: orderItems } = await adminSupabase
            .from("order_items")
            .select("product_id, quantity")
            .eq("order_id", order_id);
          for (const item of orderItems || []) {
            if (!item.product_id) continue;
            const { data: product } = await adminSupabase
              .from("products")
              .select("stock_quantity")
              .eq("id", item.product_id)
              .single();
            if (product) {
              await adminSupabase.from("products")
                .update({ stock_quantity: Math.max(0, Number(product.stock_quantity) - Number(item.quantity)) })
                .eq("id", item.product_id);
            }
          }
        }
      }

      // FIX: Also decrease reseller stock if order has a seller_id
      if (order.seller_id) {
        await adminSupabase.rpc("decrease_reseller_stock", {
          p_order_id: order_id,
          p_reseller_id: order.seller_id,
        });
        const resellerResult = await adminSupabase.rpc("decrease_reseller_stock", {
          p_order_id: order_id,
          p_reseller_id: order.seller_id,
        });
        if (resellerResult.error) console.error("Reseller stock decrease error:", resellerResult.error);
      }

      await adminSupabase.from("orders").update({ status: "confirmed" }).eq("id", order_id);
      resolvedOrderStatus = "confirmed";

      await adminSupabase.from("order_status_history").insert({
        order_id,
        status: "confirmed",
        notes: `Pagamento confirmado automaticamente via Mercado Pago - ID: ${mercadoPagoPayment.id}`,
      });

      await adminSupabase.from("notifications").insert({
        user_id: order.user_id,
        title: "Pagamento confirmado! ✅",
        message: `Seu pagamento do pedido #${order_id.substring(0, 8)} foi aprovado com sucesso.`,
        type: "order",
        link: "/minha-conta",
      });

      const { data: adminUsers } = await adminSupabase.from("user_roles").select("user_id").eq("role", "admin");
      if (adminUsers?.length) {
        await adminSupabase.from("notifications").insert(
          adminUsers.map((admin) => ({
            user_id: admin.user_id,
            title: "💰 Pagamento confirmado",
            message: `Pedido #${order_id.substring(0, 8)} confirmado no valor de R$ ${Number(order.total_amount).toFixed(2).replace(".", ",")}.`,
            type: "order",
            link: "/admin",
          }))
        );
      }
    }

    // ========== PAYMENT CANCELLED/REJECTED ==========
    if (isCancelledPaymentStatus(normalizedPaymentStatus) && order.status === "pending") {
      // FIX: Release stock reservations
      const releaseResult = await adminSupabase.rpc("release_stock_reservation", { p_order_id: order_id });
      if (releaseResult.error) {
        console.error("Stock release error:", releaseResult.error);
      }

      await adminSupabase.from("orders").update({ status: "cancelled" }).eq("id", order_id);
      resolvedOrderStatus = "cancelled";

      await adminSupabase.from("order_status_history").insert({
        order_id,
        status: "cancelled",
        notes: `Pagamento ${normalizedPaymentStatus} via Mercado Pago - ID: ${mercadoPagoPayment.id}`,
      });
    }

    return jsonResponse({
      ok: true,
      synced: true,
      payment_status: normalizedPaymentStatus,
      order_status: resolvedOrderStatus,
      mercadopago_status: mercadoPagoPayment.status,
    });
  } catch (error) {
    console.error("sync-payment-status error:", error);
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});
