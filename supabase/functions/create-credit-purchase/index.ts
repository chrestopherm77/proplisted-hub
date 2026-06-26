import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { packageId, paymentMethod, customerData } = await req.json();

    if (!packageId) throw new Error('packageId é obrigatório');
    if (!customerData?.name || !customerData?.cpfCnpj || !customerData?.email) {
      throw new Error('Dados do cliente incompletos');
    }

    // Fetch package
    const { data: pkg, error: pkgError } = await supabaseClient
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (pkgError || !pkg) throw new Error('Pacote não encontrado ou inativo');

    // Verifica se é assinante de plano pago — se não for, dobra preço e créditos
    const { data: isSubscriberData } = await supabaseClient.rpc('has_active_paid_plan', { _user_id: user.id });
    const { data: isAdminData } = await supabaseClient.rpc('has_role', { _user_id: user.id, _role: 'MASTER_ADMIN' });
    const isSubscriber = Boolean(isSubscriberData) || Boolean(isAdminData);

    const effectivePrice = isSubscriber ? Number(pkg.price) : Number(pkg.price) * 2;
    const effectiveCredits = isSubscriber ? pkg.credits : pkg.credits * 2;
    const effectiveName = isSubscriber ? pkg.name : `${pkg.name} (sem assinatura)`;

    const isSandbox = Deno.env.get('ASAAS_SANDBOX_MODE') === 'true';
    const ASAAS_API_KEY = isSandbox ? Deno.env.get('ASAAS_SANDBOX_API_KEY') : Deno.env.get('ASAAS_API_KEY');
    const ASAAS_BASE_URL = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const FRONTEND_URL = 'https://conectaeimob.com.br';

    if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY não configurada');

    const orderId = `credits_${crypto.randomUUID()}`;

    const checkoutPayload = {
      billingTypes: paymentMethod === 'PIX' ? ['PIX'] : ['CREDIT_CARD'],
      chargeTypes: ['DETACHED'],
      minutesToExpire: 60,
      externalReference: orderId,
      items: [{
        name: effectiveName,
        value: effectivePrice,
        description: `${effectiveCredits} créditos Conectae`,
        quantity: 1,
      }],
      callback: {
        successUrl: `${FRONTEND_URL}/checkout-success?type=credits&orderId=${orderId}`,
        errorUrl: `${FRONTEND_URL}/checkout-error`,
        expiredUrl: `${FRONTEND_URL}/checkout-expired`,
        cancelUrl: `${FRONTEND_URL}/checkout-error`,
      },
      webhookUrl: `${supabaseUrl}/functions/v1/asaas-webhook`,
      customerData: {
        name: customerData.name.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''),
        email: customerData.email,
        cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
        phone: (customerData.phone || '').replace(/\D/g, ''),
        address: customerData.address || '',
        addressNumber: customerData.addressNumber || '',
        complement: customerData.complement || '',
        postalCode: (customerData.postalCode || '').replace(/\D/g, ''),
        province: customerData.province || '',
        city: customerData.city || '',
      },
    };

    const checkoutResponse = await fetch(`${ASAAS_BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'Conectae-System',
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text();
      console.error('Asaas checkout failed:', checkoutResponse.status, errorData);
      throw new Error('Falha ao criar checkout');
    }

    const checkoutData = await checkoutResponse.json();
    console.log('Credit checkout created:', checkoutData.id);

    // Create credit_purchase record
    await supabaseClient.from('credit_purchases').insert({
      user_id: user.id,
      package_id: pkg.id,
      credits: effectiveCredits,
      amount: effectivePrice,
      asaas_payment_id: orderId,
      asaas_checkout_id: checkoutData.id,
      status: 'PENDING',
      payment_method: paymentMethod === 'PIX' ? 'PIX' : 'CREDIT_CARD',
    });

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: checkoutData.link || checkoutData.url,
        checkoutId: checkoutData.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in create-credit-purchase:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
