import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://leadbay.com.br',
  'https://www.leadbay.com.br',
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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('🔍 Checking credit status for user:', user.id);

    // Find the most recent PENDING credit purchase for this user
    const { data: pendingPurchase, error: purchaseError } = await supabaseClient
      .from('credit_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (purchaseError || !pendingPurchase) {
      // Check if there's a recently confirmed one instead
      const { data: recentPaid } = await supabaseClient
        .from('credit_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'PAID')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recentPaid) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('credit_balance')
          .eq('id', user.id)
          .single();

        return new Response(
          JSON.stringify({ status: 'PAID', balance: profile?.credit_balance ?? 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ status: 'NOT_FOUND', message: 'Nenhuma compra pendente encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📦 Found pending purchase:', pendingPurchase.id, 'checkout:', pendingPurchase.asaas_checkout_id);

    // Query Asaas API to check the checkout/payment status
    const isSandbox = Deno.env.get('ASAAS_SANDBOX_MODE') === 'true';
    const ASAAS_API_KEY = isSandbox ? Deno.env.get('ASAAS_SANDBOX_API_KEY') : Deno.env.get('ASAAS_API_KEY');
    const ASAAS_BASE_URL = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';

    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY not configured');
    }

    // Check payments associated with this checkout
    const paymentsResponse = await fetch(
      `${ASAAS_BASE_URL}/payments?externalReference=${pendingPurchase.asaas_payment_id}`,
      {
        headers: {
          'access_token': ASAAS_API_KEY,
          'User-Agent': 'LeadBay-CreditCheck',
        },
      }
    );

    if (!paymentsResponse.ok) {
      console.error('Asaas API error:', paymentsResponse.status);
      return new Response(
        JSON.stringify({ status: 'PENDING', message: 'Não foi possível verificar o status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentsData = await paymentsResponse.json();
    console.log('Asaas payments response:', JSON.stringify(paymentsData));

    const confirmedPayment = paymentsData.data?.find(
      (p: any) => p.status === 'RECEIVED' || p.status === 'CONFIRMED' || p.status === 'RECEIVED_IN_CASH'
    );

    if (confirmedPayment) {
      console.log('✅ Payment confirmed in Asaas! Updating credit purchase...');

      // Atomically mark purchase as PAID — if it was already PAID, skip crediting (idempotency)
      const { data: updatedRows, error: purchaseUpdateError } = await supabaseClient
        .from('credit_purchases')
        .update({ status: 'PAID', confirmed_at: new Date().toISOString() })
        .eq('id', pendingPurchase.id)
        .eq('status', 'PENDING')
        .select('id');

      if (purchaseUpdateError) {
        console.error('Failed to update credit purchase:', purchaseUpdateError);
      }

      // Only credit if the row actually transitioned from PENDING -> PAID
      if (updatedRows && updatedRows.length > 0) {
        const { data: balanceResult, error: rpcError } = await supabaseClient.rpc('add_credits_atomic', {
          p_user_id: user.id,
          p_amount: pendingPurchase.credits,
          p_type: 'CREDIT_PURCHASE',
          p_lead_id: null,
        });

        if (rpcError || (balanceResult as any)?.error) {
          console.error('Failed to credit user atomically:', rpcError ?? (balanceResult as any)?.error);
        }

        const newBalance = (balanceResult as any)?.new_balance ?? 0;
        console.log(`✅ Credited ${pendingPurchase.credits} to user. New balance: ${newBalance}`);

        return new Response(
          JSON.stringify({ status: 'PAID', balance: newBalance, credits: pendingPurchase.credits }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Already credited by webhook — just return current balance
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('credit_balance')
        .eq('id', user.id)
        .single();

      return new Response(
        JSON.stringify({ status: 'PAID', balance: profile?.credit_balance ?? 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('⏳ Payment still pending in Asaas');
    return new Response(
      JSON.stringify({ status: 'PENDING', message: 'Pagamento ainda em processamento' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-credit-status:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
