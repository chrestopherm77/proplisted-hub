import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { planId, paymentMethod, customerData } = await req.json();
    if (!planId) throw new Error('planId é obrigatório');

    // Fetch desired plan
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();
    if (planError || !plan) throw new Error('Plano não encontrado ou inativo');

    const isFreePlan = Number(plan.price) === 0;

    // Fetch ALL relevant subscriptions of user (ordered, newest first)
    const { data: allSubs } = await supabaseClient
      .from('user_subscriptions')
      .select('id, plan_id, status, asaas_subscription_id, current_period_end, created_at, plan:subscription_plans!user_subscriptions_plan_id_fkey(price, name)')
      .eq('user_id', user.id)
      .in('status', ['ACTIVE', 'PENDING', 'OVERDUE'])
      .order('created_at', { ascending: false });

    const activeSub = (allSubs ?? []).find((s: any) => s.status === 'ACTIVE' || s.status === 'OVERDUE') as any;
    const pendingSub = (allSubs ?? []).find((s: any) => s.status === 'PENDING') as any;
    const activeIsPaid = activeSub && Number(activeSub.plan?.price ?? 0) > 0;
    const pendingIsPaid = pendingSub && Number(pendingSub.plan?.price ?? 0) > 0;

    // ============ GUARDAS ANTI-FRAUDE ============

    // Guarda 1: bloquear ativação de mesmo plano grátis se já está ativo
    if (isFreePlan && activeSub && activeSub.plan_id === planId) {
      return new Response(
        JSON.stringify({
          error: `Você já está no plano ${plan.name}. Não é possível reativar o mesmo plano.`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Guarda 2: bloquear ativação de plano grátis se há PENDING pago aguardando
    if (isFreePlan && pendingSub && pendingIsPaid) {
      return new Response(
        JSON.stringify({
          error: 'Você tem uma assinatura aguardando pagamento. Conclua ou cancele para trocar de plano.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Guarda 3: bloquear reativação de grátis recente (últimos 30 dias) — anti-clique-infinito
    if (isFreePlan) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: recentSameFree } = await supabaseClient
        .from('user_subscriptions')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(1)
        .maybeSingle();
      if (recentSameFree) {
        return new Response(
          JSON.stringify({
            error: 'Você já ativou este plano nos últimos 30 dias. Aguarde o término do ciclo para reativar.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Guarda 4: se já tem ACTIVE pago e pediu o mesmo plano → bloquear
    if (activeSub && activeSub.plan_id === planId) {
      return new Response(
        JSON.stringify({ error: 'Você já está neste plano.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============ FREE PLAN: ativar (com guarda de duplicidade) ============
    if (isFreePlan) {
      // Cancela todas ACTIVE/PENDING/OVERDUE anteriores do user (ex.: estava em pago e desistiu)
      if (allSubs && allSubs.length > 0) {
        for (const old of allSubs) {
          await supabaseClient
            .from('user_subscriptions')
            .update({ status: 'CANCELED', canceled_at: new Date().toISOString() })
            .eq('id', (old as any).id);

          // Se a anterior tinha asaas_subscription_id (era paga), tenta cancelar no Asaas
          const oldAny = old as any;
          if (oldAny.asaas_subscription_id) {
            try {
              const isSandbox = Deno.env.get('ASAAS_SANDBOX_MODE') === 'true';
              const ASAAS_API_KEY = isSandbox ? Deno.env.get('ASAAS_SANDBOX_API_KEY') : Deno.env.get('ASAAS_API_KEY');
              const ASAAS_BASE_URL = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
              await fetch(`${ASAAS_BASE_URL}/subscriptions/${oldAny.asaas_subscription_id}`, {
                method: 'DELETE',
                headers: { 'access_token': ASAAS_API_KEY || '', 'User-Agent': 'Conectae-System' },
              });
            } catch (e) {
              console.error('Falha ao cancelar Asaas subscription:', e);
            }
          }
        }
      }

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { data: newSub, error: subError } = await supabaseClient
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          status: 'ACTIVE',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          payment_method: 'FREE',
        })
        .select()
        .single();
      if (subError) throw subError;

      // Credita os créditos (apenas para essa nova ativação)
      if (plan.monthly_credits > 0) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('credit_balance')
          .eq('id', user.id)
          .single();
        const newBalance = (profile?.credit_balance ?? 0) + plan.monthly_credits;
        await supabaseClient
          .from('profiles')
          .update({ credit_balance: newBalance })
          .eq('id', user.id);

        await supabaseClient.from('credit_transactions').insert({
          user_id: user.id,
          credits_used: plan.monthly_credits,
          type: 'SUBSCRIPTION_RENEWAL',
        });
      }

      return new Response(
        JSON.stringify({ success: true, subscriptionId: newSub.id, free: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============ PAID PLAN ============
    if (!customerData?.name || !customerData?.cpfCnpj || !customerData?.email) {
      throw new Error('Dados do cliente incompletos (nome, CPF/CNPJ, e-mail)');
    }

    // Se há PENDING pago anterior (de outro plano), cancela ele para criar novo
    if (pendingSub && pendingSub.plan_id !== planId) {
      const pAny = pendingSub as any;
      if (pAny.asaas_subscription_id) {
        try {
          const isSandbox = Deno.env.get('ASAAS_SANDBOX_MODE') === 'true';
          const ASAAS_API_KEY = isSandbox ? Deno.env.get('ASAAS_SANDBOX_API_KEY') : Deno.env.get('ASAAS_API_KEY');
          const ASAAS_BASE_URL = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
          await fetch(`${ASAAS_BASE_URL}/subscriptions/${pAny.asaas_subscription_id}`, {
            method: 'DELETE',
            headers: { 'access_token': ASAAS_API_KEY || '', 'User-Agent': 'Conectae-System' },
          });
        } catch (e) {
          console.error('Falha ao cancelar PENDING anterior no Asaas:', e);
        }
      }
      await supabaseClient
        .from('user_subscriptions')
        .update({ status: 'CANCELED', canceled_at: new Date().toISOString() })
        .eq('id', pAny.id);
    }

    const isSandbox = Deno.env.get('ASAAS_SANDBOX_MODE') === 'true';
    const ASAAS_API_KEY = isSandbox ? Deno.env.get('ASAAS_SANDBOX_API_KEY') : Deno.env.get('ASAAS_API_KEY');
    const ASAAS_BASE_URL = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
    if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY não configurada');

    const cleanCpfCnpj = customerData.cpfCnpj.replace(/\D/g, '');
    const cleanPhone = (customerData.phone || '').replace(/\D/g, '');

    // 1. Criar/buscar customer
    let customerId: string | null = null;
    const findResp = await fetch(`${ASAAS_BASE_URL}/customers?cpfCnpj=${cleanCpfCnpj}`, {
      headers: { 'access_token': ASAAS_API_KEY, 'User-Agent': 'Conectae-System' },
    });
    if (findResp.ok) {
      const found = await findResp.json();
      if (found?.data?.[0]?.id) customerId = found.data[0].id;
    }

    if (!customerId) {
      const createResp = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json', 'User-Agent': 'Conectae-System' },
        body: JSON.stringify({
          name: customerData.name.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''),
          email: customerData.email,
          cpfCnpj: cleanCpfCnpj,
          phone: cleanPhone,
        }),
      });
      if (!createResp.ok) {
        const t = await createResp.text();
        console.error('Asaas customer create failed:', t);
        throw new Error('Falha ao criar cliente no Asaas');
      }
      const created = await createResp.json();
      customerId = created.id;
    }

    // 2. Definir nextDueDate baseado em troca agendada
    // Se já tem ACTIVE pago, agenda nova cobrança para o vencimento atual (não cobra duas vezes)
    const externalRef = `sub_${crypto.randomUUID()}`;
    const nextDueDate = new Date();
    if (activeIsPaid && activeSub.current_period_end) {
      const periodEnd = new Date(activeSub.current_period_end);
      if (periodEnd > nextDueDate) {
        nextDueDate.setTime(periodEnd.getTime());
      } else {
        nextDueDate.setDate(nextDueDate.getDate() + 1);
      }
    } else {
      nextDueDate.setDate(nextDueDate.getDate() + 1);
    }
    const nextDueStr = nextDueDate.toISOString().slice(0, 10);

    const billingType = paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX';

    // Mapeia ciclo do plano para o cycle do Asaas
    const planCycle = (plan as any).billing_cycle || 'MONTHLY';
    const asaasCycle =
      planCycle === 'YEARLY' ? 'YEARLY' :
      planCycle === 'QUARTERLY' ? 'QUARTERLY' :
      'MONTHLY';

    const subPayload: any = {
      customer: customerId,
      billingType,
      value: Number(plan.price),
      nextDueDate: nextDueStr,
      cycle: asaasCycle,
      description: `Assinatura ${plan.name} - Conectae`,
      externalReference: externalRef,
    };

    const subResp = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json', 'User-Agent': 'Conectae-System' },
      body: JSON.stringify(subPayload),
    });

    if (!subResp.ok) {
      const t = await subResp.text();
      console.error('Asaas subscription create failed:', t);
      throw new Error('Falha ao criar assinatura no Asaas');
    }

    const subData = await subResp.json();
    console.log('Asaas subscription created:', subData.id);

    // 3. Buscar primeira fatura
    let invoiceUrl: string | null = null;
    try {
      const paymentsResp = await fetch(`${ASAAS_BASE_URL}/subscriptions/${subData.id}/payments`, {
        headers: { 'access_token': ASAAS_API_KEY, 'User-Agent': 'Conectae-System' },
      });
      if (paymentsResp.ok) {
        const paymentsData = await paymentsResp.json();
        const first = paymentsData?.data?.[0];
        invoiceUrl = first?.invoiceUrl || null;
      }
    } catch (e) {
      console.error('Erro ao buscar invoice:', e);
    }

    // 4. NÃO cancelar a ACTIVE atual — webhook fará isso ao confirmar pagamento
    // Apenas insere a nova como PENDING
    const { data: newSub, error: subInsertError } = await supabaseClient
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        asaas_subscription_id: subData.id,
        asaas_customer_id: customerId,
        status: 'PENDING',
        next_due_date: nextDueStr,
        payment_method: billingType,
        invoice_url: invoiceUrl,
        billing_cycle: planCycle,
      })
      .select()
      .single();
    if (subInsertError) throw subInsertError;

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: newSub.id,
        asaasSubscriptionId: subData.id,
        invoiceUrl,
        scheduledChange: !!activeIsPaid,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in create-subscription:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
