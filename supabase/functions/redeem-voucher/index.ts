import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { voucherCode, leadId } = await req.json();

    if (!voucherCode || !leadId) {
      return new Response(
        JSON.stringify({ error: "Código do voucher e lead são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Find voucher
    const { data: voucher, error: vErr } = await admin
      .from("vouchers")
      .select("*")
      .eq("code", voucherCode.trim().toUpperCase())
      .single();

    if (vErr || !voucher) {
      return new Response(
        JSON.stringify({ error: "Esse voucher não existe" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!voucher.is_active) {
      return new Response(
        JSON.stringify({ error: "Este voucher não está mais ativo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check total redemptions < max_uses
    const { count: totalRedemptions } = await admin
      .from("voucher_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("voucher_id", voucher.id);

    if ((totalRedemptions ?? 0) >= voucher.max_uses) {
      return new Response(
        JSON.stringify({ error: "Este voucher já atingiu o limite de usos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check if user already used ANY voucher
    const { data: previousRedemption } = await admin
      .from("voucher_redemptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (previousRedemption) {
      return new Response(
        JSON.stringify({ error: "Você já utilizou um voucher anteriormente" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Check lead is active and available
    const { data: lead, error: leadErr } = await admin
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead) {
      return new Response(
        JSON.stringify({ error: "Lead não encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lead.is_active) {
      return new Response(
        JSON.stringify({ error: "Este lead não está mais disponível" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (lead.purchase_count >= lead.max_purchases) {
      return new Response(
        JSON.stringify({ error: "Este lead já atingiu o limite de vendas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Check if user already purchased this lead
    const { data: existingPurchase } = await admin
      .from("purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("lead_id", leadId)
      .eq("status", "PAID")
      .maybeSingle();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ error: "Você já possui este lead" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Create purchase with amount 0
    const { error: purchaseErr } = await admin.from("purchases").insert({
      user_id: userId,
      lead_id: leadId,
      amount: 0,
      status: "PAID",
      payment_confirmed_at: new Date().toISOString(),
    });

    if (purchaseErr) {
      console.error("Error creating purchase:", purchaseErr);
      return new Response(
        JSON.stringify({ error: "Erro ao processar o voucher" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Create voucher redemption
    await admin.from("voucher_redemptions").insert({
      voucher_id: voucher.id,
      user_id: userId,
      lead_id: leadId,
    });

    // 8. Increment purchase_count
    await admin
      .from("leads")
      .update({ purchase_count: (lead.purchase_count || 0) + 1 })
      .eq("id", leadId);

    // 9. Remove from cart
    await admin
      .from("shopping_cart")
      .delete()
      .eq("user_id", userId)
      .eq("lead_id", leadId);

    return new Response(
      JSON.stringify({ success: true, message: "Voucher resgatado com sucesso!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Redeem voucher error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
