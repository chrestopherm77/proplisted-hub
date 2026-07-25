import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cron: roda 1x/dia. Para cada user_subscription ACTIVE paga vencida (current_period_end < now)
// sem renovação confirmada, marca como EXPIRED e ativa Conexão (free fallback).
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: cron secret
    const cronSecret = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
    if (cronSecret !== Deno.env.get('CRON_SECRET')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const nowIso = new Date().toISOString();

    // Busca planos pagos vencidos
    const { data: expired } = await supabase
      .from('user_subscriptions')
      .select('id, user_id, plan:subscription_plans!user_subscriptions_plan_id_fkey(price)')
      .eq('status', 'ACTIVE')
      .lt('current_period_end', nowIso);

    let expiredCount = 0;
    let downgradedCount = 0;

    // Busca o plano Conexão (fallback)
    const { data: conexaoPlan } = await supabase
      .from('subscription_plans')
      .select('id, monthly_credits')
      .eq('slug', 'conexao')
      .maybeSingle();

    for (const sub of (expired ?? [])) {
      const subAny = sub as any;
      const isPaid = Number(subAny.plan?.price ?? 0) > 0;
      if (!isPaid) continue;

      // Marca como EXPIRED
      await supabase
        .from('user_subscriptions')
        .update({ status: 'EXPIRED', canceled_at: nowIso })
        .eq('id', subAny.id);
      expiredCount++;

      // Cria Conexão automaticamente (sem dar créditos extras)
      if (conexaoPlan) {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        await supabase.from('user_subscriptions').insert({
          user_id: subAny.user_id,
          plan_id: conexaoPlan.id,
          status: 'ACTIVE',
          current_period_start: nowIso,
          current_period_end: periodEnd.toISOString(),
          payment_method: 'FREE',
        });
        downgradedCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, expired: expiredCount, downgraded: downgradedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in expire-plans-cron:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
