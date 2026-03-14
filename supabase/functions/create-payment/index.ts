import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const resolveOrigin = (req: Request) => {
  const originHeader = req.headers.get("origin");
  if (originHeader) return originHeader;

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // ignore invalid referer
    }
  }

  return "https://grundemann.com.br";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mercadopagoAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mercadopagoAccessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    }

    const isTestToken = mercadopagoAccessToken.startsWith("TEST-");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = claimsData.claims.sub;
    const userEmail = String(claimsData.claims.email || "");

    const { order_id } = await req.json();
    if (!order_id) {
      throw new Error("order_id is required");
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, total_amount, status")
      .eq("id", order_id)
      .eq("user_id", userId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    const origin = resolveOrigin(req);

    if (order.status === "confirmed") {
      return jsonResponse({
        init_point: `${origin}/pedido-confirmado?order_id=${order_id}`,
        already_paid: true,
      });
    }

    const [{ data: orderItems }, { data: profile }] = await Promise.all([
      supabase
        .from("order_items")
        .select("product_name, quantity, price_at_purchase")
        .eq("order_id", order_id),
      supabase
        .from("profiles")
        .select("full_name, email, cpf_cnpj, phone, address, address_number, zip_code")
        .eq("user_id", userId)
        .single(),
    ]);

    const items = (orderItems || []).map((item: any) => ({
      title: String(item.product_name || "Produto").substring(0, 256),
      quantity: Number(item.quantity) || 1,
      unit_price: Math.max(0.01, Math.round(Number(item.price_at_purchase || 0) * 100) / 100),
      currency_id: "BRL",
    }));

    const itemsTotal = items.reduce((sum: number, i: any) => sum + i.unit_price * i.quantity, 0);
    if (Number(order.total_amount) > itemsTotal + 0.01) {
      const shippingAmount = Math.round((Number(order.total_amount) - itemsTotal) * 100) / 100;
      if (shippingAmount > 0) {
        items.push({
          title: "Frete",
          quantity: 1,
          unit_price: shippingAmount,
          currency_id: "BRL",
        });
      }
    }

    const rawDoc = String(profile?.cpf_cnpj || "").replace(/\D/g, "");
    const identificationType = rawDoc.length > 11 ? "CNPJ" : "CPF";

    const payer: Record<string, any> = {
      email: profile?.email || userEmail || "",
    };

    if (profile?.full_name) {
      const nameParts = String(profile.full_name).trim().split(" ");
      payer.name = nameParts[0] || "";
      payer.surname = nameParts.slice(1).join(" ") || "";
    }

    if (rawDoc) {
      payer.identification = {
        type: identificationType,
        number: rawDoc,
      };
    }

    if (profile?.phone) {
      const cleanPhone = String(profile.phone).replace(/\D/g, "");
      if (cleanPhone.length >= 10) {
        payer.phone = {
          area_code: cleanPhone.substring(0, 2),
          number: cleanPhone.substring(2),
        };
      }
    }

    if (profile?.address) {
      payer.address = {
        street_name: profile.address,
        street_number: profile.address_number || "",
        zip_code: String(profile.zip_code || "").replace(/\D/g, ""),
      };
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const preferenceBody: Record<string, any> = {
      items,
      payer,
      back_urls: {
        success: `${origin}/pedido-confirmado?order_id=${order_id}`,
        failure: `${origin}/pagamento-erro?order_id=${order_id}`,
        pending: `${origin}/pagamento-pendente?order_id=${order_id}`,
      },
      auto_return: "approved",
      external_reference: order_id,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "GRUNDEMANN",
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
      },
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mercadopagoAccessToken}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!mpResponse.ok) {
      const errorBody = await mpResponse.text();
      console.error("MP API error:", mpResponse.status, errorBody);
      throw new Error(`Mercado Pago API error [${mpResponse.status}]: ${errorBody}`);
    }

    const preference = await mpResponse.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: latestPayment } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("order_id", order_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const paymentPayload = {
      order_id,
      user_id: userId,
      mp_preference_id: preference.id,
      mp_payment_id: null,
      payment_method: null,
      mp_status_detail: null,
      paid_at: null,
      amount: Number(order.total_amount),
      status: "pending",
    };

    if (latestPayment?.id) {
      await supabaseAdmin
        .from("payments")
        .update(paymentPayload)
        .eq("id", latestPayment.id);
    } else {
      await supabaseAdmin.from("payments").insert(paymentPayload);
    }

    const paymentUrl = isTestToken
      ? (preference.sandbox_init_point || preference.init_point)
      : (preference.init_point || preference.sandbox_init_point);

    return jsonResponse({
      preference_id: preference.id,
      init_point: paymentUrl,
      sandbox_init_point: preference.sandbox_init_point,
      is_test: isTestToken,
    });
  } catch (error: unknown) {
    console.error("Error creating payment:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: msg }, 500);
  }
});
