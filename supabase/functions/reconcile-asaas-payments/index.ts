import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  };
}

interface ReconcileResult {
  type: 'credit_purchase' | 'lead_purchase';
  id: string;
  external_reference: string | null;
  asaas_status: string | null;
  action: 'CONFIRMED' | 'EXPIRED' | 'STILL_PENDING' | 'NOT_FOUND' | 'ERROR';
  message?: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Auth: either CRON_SECRET (scheduled) or admin JWT (manual)
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization');
    let isAuthorized = false;
    let manualPaymentId: string | undefined;
    let manualType: 'credit_purchase' | 'lead_purchase' | undefined;

    if (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret) {
      isAuthorized = true;
    } else if (authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: claims } = await userClient.auth.getClaims(token);
      if (claims?.claims?.sub) {
        const { data: roleData } = await userClient
          .from('user_roles')
          .select('role')
          .eq('user_id', claims.claims.sub)
          .eq('role', 'MASTER_ADMIN')
          .maybeSingle();
        if (roleData) {
          isAuthorized = true;
          if (req.method === 'POST') {
            try {
              const body = await req.json();
              manualPaymentId = body?.purchase_id;
              manualType = body?.type;
            } catch {}
          }
        }
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isSandbox = Deno.env.get('ASAAS_SANDBOX_MODE') === 'true';
    const ASAAS_API_KEY = isSandbox ? Deno.env.get('ASAAS_SANDBOX_API_KEY') : Deno.env.get('ASAAS_API_KEY');
    const ASAAS_BASE_URL = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';

    if (!ASAAS_API_KEY) {
      return new Response(JSON.stringify({ error: 'Asaas API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: ReconcileResult[] = [];
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min

    // ===== Credit purchases =====
    let creditQuery = adminClient
      .from('credit_purchases')
      .select('id, user_id, credits, asaas_payment_id, asaas_checkout_id, status, created_at')
      .eq('status', 'PENDING');

    if (manualPaymentId && manualType === 'credit_purchase') {
      creditQuery = creditQuery.eq('id', manualPaymentId);
    } else {
      creditQuery = creditQuery.lt('created_at', cutoff);
    }

    const { data: creditPurchases } = await creditQuery;

    for (const cp of creditPurchases ?? []) {
      const ext = cp.asaas_payment_id;
      if (!ext) {
        results.push({ type: 'credit_purchase', id: cp.id, external_reference: null, asaas_status: null, action: 'NOT_FOUND', message: 'sem external_reference' });
        continue;
      }

      try {
        // Asaas API: search by externalReference
        const url = `${ASAAS_BASE_URL}/payments?externalReference=${encodeURIComponent(ext)}&limit=10`;
        const resp = await fetch(url, {
          headers: { 'access_token': ASAAS_API_KEY, 'User-Agent': 'Conectae-Reconcile' },
        });
        if (!resp.ok) {
          results.push({ type: 'credit_purchase', id: cp.id, external_reference: ext, asaas_status: null, action: 'ERROR', message: `HTTP ${resp.status}` });
          continue;
        }
        const json = await resp.json();
        const payments: any[] = json?.data ?? [];
        const paid = payments.find((p) => ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(p.status));
        const expired = payments.find((p) => ['REFUNDED', 'CANCELLED', 'EXPIRED', 'OVERDUE'].includes(p.status));

        if (paid) {
          // Atomically transition PENDING -> PAID; only credit if we win the race
          const { data: updatedRows } = await adminClient
            .from('credit_purchases')
            .update({ status: 'PAID', confirmed_at: new Date().toISOString() })
            .eq('id', cp.id)
            .eq('status', 'PENDING')
            .select('id');

          if (updatedRows && updatedRows.length > 0) {
            const { data: balanceResult } = await adminClient.rpc('add_credits_atomic', {
              p_user_id: cp.user_id,
              p_amount: cp.credits,
              p_type: 'CREDIT_PURCHASE_RECONCILED',
              p_lead_id: null,
            });
            const newBalance = (balanceResult as any)?.new_balance ?? null;
            results.push({ type: 'credit_purchase', id: cp.id, external_reference: ext, asaas_status: paid.status, action: 'CONFIRMED', message: `creditados ${cp.credits} créditos${newBalance !== null ? ` (saldo: ${newBalance})` : ''}` });
          } else {
            results.push({ type: 'credit_purchase', id: cp.id, external_reference: ext, asaas_status: paid.status, action: 'CONFIRMED', message: 'Já creditado anteriormente' });
          }
        } else if (expired && payments.length > 0) {
          await adminClient.from('credit_purchases').update({ status: 'EXPIRED' }).eq('id', cp.id);
          results.push({ type: 'credit_purchase', id: cp.id, external_reference: ext, asaas_status: expired.status, action: 'EXPIRED' });
        } else {
          results.push({ type: 'credit_purchase', id: cp.id, external_reference: ext, asaas_status: payments[0]?.status ?? null, action: 'STILL_PENDING' });
        }
      } catch (err: any) {
        results.push({ type: 'credit_purchase', id: cp.id, external_reference: ext, asaas_status: null, action: 'ERROR', message: err.message });
      }
    }

    // ===== Lead purchases =====
    let purchaseQuery = adminClient
      .from('purchases')
      .select('id, user_id, lead_id, asaas_payment_id, asaas_checkout_id, status, purchased_at')
      .eq('status', 'PENDING');

    if (manualPaymentId && manualType === 'lead_purchase') {
      purchaseQuery = purchaseQuery.eq('id', manualPaymentId);
    } else {
      purchaseQuery = purchaseQuery.lt('purchased_at', cutoff);
    }

    const { data: leadPurchases } = await purchaseQuery;

    for (const p of leadPurchases ?? []) {
      const ext = p.asaas_payment_id;
      if (!ext) {
        results.push({ type: 'lead_purchase', id: p.id, external_reference: null, asaas_status: null, action: 'NOT_FOUND', message: 'sem external_reference' });
        continue;
      }
      try {
        const url = `${ASAAS_BASE_URL}/payments?externalReference=${encodeURIComponent(ext)}&limit=10`;
        const resp = await fetch(url, {
          headers: { 'access_token': ASAAS_API_KEY, 'User-Agent': 'Conectae-Reconcile' },
        });
        if (!resp.ok) {
          results.push({ type: 'lead_purchase', id: p.id, external_reference: ext, asaas_status: null, action: 'ERROR', message: `HTTP ${resp.status}` });
          continue;
        }
        const json = await resp.json();
        const payments: any[] = json?.data ?? [];
        const paid = payments.find((x) => ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(x.status));
        const expired = payments.find((x) => ['REFUNDED', 'CANCELLED', 'EXPIRED', 'OVERDUE'].includes(x.status));

        if (paid) {
          await adminClient.from('purchases').update({ status: 'PAID', payment_confirmed_at: new Date().toISOString() }).eq('id', p.id);
          await adminClient.rpc('increment_purchase_count', { p_lead_id: p.lead_id });
          await adminClient.from('shopping_cart').delete().eq('user_id', p.user_id).eq('lead_id', p.lead_id);
          results.push({ type: 'lead_purchase', id: p.id, external_reference: ext, asaas_status: paid.status, action: 'CONFIRMED' });
        } else if (expired && payments.length > 0) {
          await adminClient.from('purchases').update({ status: 'EXPIRED' }).eq('id', p.id);
          results.push({ type: 'lead_purchase', id: p.id, external_reference: ext, asaas_status: expired.status, action: 'EXPIRED' });
        } else {
          results.push({ type: 'lead_purchase', id: p.id, external_reference: ext, asaas_status: payments[0]?.status ?? null, action: 'STILL_PENDING' });
        }
      } catch (err: any) {
        results.push({ type: 'lead_purchase', id: p.id, external_reference: ext, asaas_status: null, action: 'ERROR', message: err.message });
      }
    }

    const summary = {
      total: results.length,
      confirmed: results.filter((r) => r.action === 'CONFIRMED').length,
      expired: results.filter((r) => r.action === 'EXPIRED').length,
      still_pending: results.filter((r) => r.action === 'STILL_PENDING').length,
      errors: results.filter((r) => r.action === 'ERROR').length,
    };

    console.log('[reconcile-asaas-payments]', JSON.stringify(summary));

    return new Response(JSON.stringify({ success: true, summary, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[reconcile-asaas-payments] error:', error);
    return new Response(JSON.stringify({ error: error.message ?? 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
