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

    // Use getUser for reliable auth verification
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
      unit_price: Number(item.price_at_purchase),
      currency_id: "BRL",
    }));

    // Determine the origin for back_urls
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/[^/]*$/, "") || "https://grundemann-power-hub.lovable.app";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Create Mercado Pago preference
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items,
        payer: {
          name: profile?.full_name || "",
          email: profile?.email || userData.user.email || "",
          phone: {
            number: profile?.phone || "",
          },
          address: {
            street_name: profile?.address || "",
            street_number: profile?.address_number || "",
            zip_code: (profile?.zip_code || "").replace(/\D/g, ""),
          },
        },
        back_urls: {
          success: `${origin}/checkout?payment=success&order_id=${order_id}`,
          failure: `${origin}/checkout?payment=failure&order_id=${order_id}`,
          pending: `${origin}/checkout?payment=pending&order_id=${order_id}`,
        },
        auto_return: "approved",
        external_reference: order_id,
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
        payment_methods: {
          excluded_payment_types: [],
          installments: 3,
        },
        statement_descriptor: "GRUNDEMANN",
      }),
    });

    if (!mpResponse.ok) {
      const errorBody = await mpResponse.text();
      console.error("MP API error:", errorBody);
      throw new Error(`Mercado Pago API error [${mpResponse.status}]: ${errorBody}`);
    }

    const preference = await mpResponse.json();

    // Save payment record using service role
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

    return new Response(
      JSON.stringify({
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
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
