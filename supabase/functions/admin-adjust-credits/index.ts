import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const ALLOWED_ORIGINS = [
  'https://leadbay.com.br',
  'https://www.leadbay.com.br',
  'https://proplisted-hub.lovable.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.lovable.app')
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

const BodySchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number().int().positive().max(1000000),
  operation: z.enum(['ADD', 'REMOVE']),
  reason: z.string().max(500).optional(),
});

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminId = claimsData.claims.sub;

    const { data: roleData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", adminId)
      .eq("role", "MASTER_ADMIN")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { user_id, amount, operation, reason } = parsed.data;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, credit_balance, name")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentBalance = profile.credit_balance ?? 0;
    const delta = operation === 'ADD' ? amount : -amount;
    const newBalance = currentBalance + delta;

    if (newBalance < 0) {
      return new Response(
        JSON.stringify({ error: "Saldo ficaria negativo", current: currentBalance, requested: amount }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ credit_balance: newBalance })
      .eq("id", user_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Falha ao atualizar saldo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await adminClient.from("credit_transactions").insert({
      user_id,
      credits_used: amount,
      type: operation === 'ADD' ? 'ADMIN_ADD' : 'ADMIN_REMOVE',
      lead_id: null,
    });

    console.log(`[admin-adjust-credits] admin=${adminId} user=${user_id} op=${operation} amount=${amount} new_balance=${newBalance} reason=${reason ?? '-'}`);

    return new Response(
      JSON.stringify({ success: true, new_balance: newBalance, previous_balance: currentBalance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error('[admin-adjust-credits] error:', error);
    return new Response(JSON.stringify({ error: error.message ?? 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
