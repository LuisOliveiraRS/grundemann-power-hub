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
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
    }

    const isTestToken = MERCADOPAGO_ACCESS_TOKEN.startsWith("TEST-") || MERCADOPAGO_ACCESS_TOKEN.startsWith("APP_USR-");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const { order_id } = await req.json();
    if (!order_id) {
      throw new Error("order_id is required");
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("user_id", userId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Fetch order items
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order_id);

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Build MP preference items
    const items = (orderItems || []).map((item: any) => ({
      title: item.product_name.substring(0, 256),
      quantity: item.quantity,
      unit_price: Math.max(0.01, Math.round(Number(item.price_at_purchase) * 100) / 100),
      currency_id: "BRL",
    }));

    // Add shipping as item if needed
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

    // Extract CPF/CNPJ - remove non-numeric chars
    const rawDoc = (profile?.cpf_cnpj || "").replace(/\D/g, "");
    const identificationType = rawDoc.length > 11 ? "CNPJ" : "CPF";

    // Build payer object with identification (required for PIX/boleto)
    const payer: any = {
      email: profile?.email || userData.user.email || "",
    };

    if (profile?.full_name) {
      const nameParts = profile.full_name.trim().split(" ");
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
      const cleanPhone = (profile.phone || "").replace(/\D/g, "");
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
        zip_code: (profile.zip_code || "").replace(/\D/g, ""),
      };
    }

    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/[^/]*$/, "") || "https://grundemann-power-hub.lovable.app";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Create Mercado Pago preference with all payment methods enabled
    const preferenceBody: any = {
      items,
      payer,
      back_urls: {
        success: `${origin}/checkout?payment=success&order_id=${order_id}`,
        failure: `${origin}/checkout?payment=failure&order_id=${order_id}`,
        pending: `${origin}/checkout?payment=pending&order_id=${order_id}`,
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

    console.log("Creating MP preference with items:", JSON.stringify(items));
    console.log("Payer:", JSON.stringify(payer));
    console.log("Is test token:", isTestToken);

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!mpResponse.ok) {
      const errorBody = await mpResponse.text();
      console.error("MP API error:", mpResponse.status, errorBody);
      throw new Error(`Mercado Pago API error [${mpResponse.status}]: ${errorBody}`);
    }

    const preference = await mpResponse.json();
    console.log("MP preference created:", preference.id);
    console.log("init_point:", preference.init_point);
    console.log("sandbox_init_point:", preference.sandbox_init_point);

    // Save payment record
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabaseAdmin.from("payments").insert({
      order_id: order_id,
      user_id: userId,
      mp_preference_id: preference.id,
      amount: order.total_amount,
      status: "pending",
    });

    // Use sandbox_init_point for test tokens, init_point for production
    const paymentUrl = isTestToken
      ? (preference.sandbox_init_point || preference.init_point)
      : (preference.init_point || preference.sandbox_init_point);

    return new Response(
      JSON.stringify({
        preference_id: preference.id,
        init_point: paymentUrl,
        sandbox_init_point: preference.sandbox_init_point,
        is_test: isTestToken,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error creating payment:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
