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

    // Fetch plan
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();
    if (planError || !plan) throw new Error('Plano não encontrado ou inativo');

    // Check existing active subscription
    const { data: existing } = await supabaseClient
      .from('user_subscriptions')
      .select('id, plan_id, status, asaas_subscription_id')
      .eq('user_id', user.id)
      .in('status', ['ACTIVE', 'PENDING', 'OVERDUE'])
      .maybeSingle();

    if (existing && existing.plan_id === planId) {
      throw new Error('Você já possui este plano ativo');
    }

    // === FREE PLAN: ativa direto ===
    if (Number(plan.price) === 0) {
      // Cancela qualquer assinatura ativa anterior
      if (existing) {
        await supabaseClient
          .from('user_subscriptions')
          .update({ status: 'CANCELED', canceled_at: new Date().toISOString() })
          .eq('id', existing.id);
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

      // Credita os créditos do plano
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

    // === PAID PLAN: vai para Asaas ===
    if (!customerData?.name || !customerData?.cpfCnpj || !customerData?.email) {
      throw new Error('Dados do cliente incompletos (nome, CPF/CNPJ, e-mail)');
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
      headers: { 'access_token': ASAAS_API_KEY, 'User-Agent': 'LeadBay-System' },
    });
    if (findResp.ok) {
      const found = await findResp.json();
      if (found?.data?.[0]?.id) customerId = found.data[0].id;
    }

    if (!customerId) {
      const createResp = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json', 'User-Agent': 'LeadBay-System' },
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

    // 2. Criar subscription
    const externalRef = `sub_${crypto.randomUUID()}`;
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1); // amanhã
    const nextDueStr = nextDueDate.toISOString().slice(0, 10);

    const billingType = paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX';

    const subPayload: any = {
      customer: customerId,
      billingType: 'UNDEFINED', // permite o cliente escolher na fatura
      value: Number(plan.price),
      nextDueDate: nextDueStr,
      cycle: 'MONTHLY',
      description: `Assinatura ${plan.name} - LeadBay`,
      externalReference: externalRef,
    };

    const subResp = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json', 'User-Agent': 'LeadBay-System' },
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
        headers: { 'access_token': ASAAS_API_KEY, 'User-Agent': 'LeadBay-System' },
      });
      if (paymentsResp.ok) {
        const paymentsData = await paymentsResp.json();
        const first = paymentsData?.data?.[0];
        invoiceUrl = first?.invoiceUrl || null;
      }
    } catch (e) {
      console.error('Erro ao buscar invoice:', e);
    }

    // 4. Salvar no banco. Se já existia uma anterior PENDING/OVERDUE, marca como CANCELED
    if (existing) {
      await supabaseClient
        .from('user_subscriptions')
        .update({ status: 'CANCELED', canceled_at: new Date().toISOString() })
        .eq('id', existing.id);
    }

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
