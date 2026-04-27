import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://conectaeimob.com.br',
  'https://www.conectaeimob.com.br',
  'https://proplisted-hub.lovable.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const callerId = claimsData.claims.sub;

    const { data: roleData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "MASTER_ADMIN")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    let body: { user_id?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: corsHeaders });
    }

    const targetUserId = body.user_id?.trim();
    if (!targetUserId || !/^[0-9a-f-]{36}$/i.test(targetUserId)) {
      return new Response(JSON.stringify({ error: "user_id inválido" }), { status: 400, headers: corsHeaders });
    }

    if (targetUserId === callerId) {
      return new Response(JSON.stringify({ error: "Você não pode excluir sua própria conta" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Limpeza de dados que referenciam o user_id (sem cascade no banco).
    // A ordem importa para evitar quebra de FKs lógicos.
    const cleanups: { table: string; col: string }[] = [
      { table: 'lead_crm_status', col: 'user_id' },
      { table: 'creatives', col: 'user_id' },
      { table: 'property_affiliates', col: 'affiliate_user_id' },
      { table: 'property_views', col: 'affiliate_id' },
      { table: 'properties', col: 'user_id' },
      { table: 'launches', col: 'user_id' },
      { table: 'lead_alerts', col: 'user_id' },
      { table: 'launch_alerts', col: 'user_id' },
      { table: 'property_search_alerts', col: 'user_id' },
      { table: 'property_search_offers', col: 'user_id' },
      { table: 'property_searches', col: 'user_id' },
      { table: 'launch_permissions', col: 'user_id' },
      { table: 'credit_transactions', col: 'user_id' },
      { table: 'credit_purchases', col: 'user_id' },
      { table: 'purchases', col: 'user_id' },
      { table: 'user_subscriptions', col: 'user_id' },
      { table: 'user_roles', col: 'user_id' },
      { table: 'login_history', col: 'user_id' },
      { table: 'coupon_usages', col: 'user_id' },
      { table: 'voucher_redemptions', col: 'user_id' },
      { table: 'news_likes', col: 'user_id' },
      { table: 'news_comments', col: 'user_id' },
      { table: 'news_posts', col: 'user_id' },
      { table: 'shopping_cart', col: 'user_id' },
      { table: 'support_messages', col: 'sender_id' },
      { table: 'support_tickets', col: 'user_id' },
      { table: 'user_brands', col: 'user_id' },
    ];

    const errors: string[] = [];
    for (const c of cleanups) {
      const { error } = await adminClient.from(c.table).delete().eq(c.col, targetUserId);
      // Tabelas inexistentes são ignoradas; outros erros são apenas registrados.
      if (error && !/relation .* does not exist/i.test(error.message)) {
        errors.push(`${c.table}: ${error.message}`);
      }
    }

    // Limpa quem foi indicado por este usuário (mantém os perfis, só desvincula)
    await adminClient.from('profiles').update({ referred_by: null }).eq('referred_by', targetUserId);

    // Remove o profile (libera o telefone para o trigger check_phone_limit)
    const { error: profileErr } = await adminClient.from('profiles').delete().eq('id', targetUserId);
    if (profileErr) errors.push(`profiles: ${profileErr.message}`);

    // Remove o usuário do auth (libera o e-mail)
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (deleteErr) {
      return new Response(JSON.stringify({ error: deleteErr.message, cleanup_errors: errors }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, cleanup_errors: errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
