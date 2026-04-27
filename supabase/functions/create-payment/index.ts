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

    const { cartItems, customerData, paymentMethod, couponCode, partnerId } = await req.json();
    console.log('=== Creating Asaas Checkout ===');

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error('Carrinho vazio ou inválido');
    }

    const leadIds = cartItems.map((item: any) => item.lead_id).filter(Boolean);
    if (leadIds.length === 0) {
      throw new Error('Nenhum lead válido no carrinho');
    }

    const { data: dbLeads, error: leadsError } = await supabaseClient
      .from('leads')
      .select('id, price, is_active, name, description, purchase_count, max_purchases')
      .in('id', leadIds);

    if (leadsError || !dbLeads || dbLeads.length === 0) {
      throw new Error('Erro ao validar leads');
    }

    const leadMap = new Map(dbLeads.map((lead: any) => [lead.id, lead]));
    const validatedItems = [];

    for (const cartItem of cartItems) {
      const dbLead = leadMap.get(cartItem.lead_id);
      if (!dbLead) throw new Error(`Lead ${cartItem.lead_id} não encontrado`);
      if (!dbLead.is_active) throw new Error('Lead não está mais disponível para compra');
      if (dbLead.purchase_count >= dbLead.max_purchases) throw new Error('Lead já atingiu o limite máximo de vendas');

      validatedItems.push({
        lead_id: dbLead.id,
        price: Number(dbLead.price),
        name: dbLead.name,
        description: dbLead.description,
      });
    }

    let totalAmount = validatedItems.reduce((sum: number, item: any) => sum + item.price, 0);
    let discountPercent = 0;
    let couponId: string | null = null;

    if (couponCode) {
      const { data: coupon, error: cErr } = await supabaseClient
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .single();

      if (cErr || !coupon) throw new Error('Cupom inválido');
      if (!coupon.is_active) throw new Error('Cupom não está mais ativo');

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        throw new Error('Cupom expirado');
      }

      const { count: totalUsages } = await supabaseClient
        .from('coupon_usages')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id);

      if ((totalUsages ?? 0) >= coupon.max_uses) throw new Error('Cupom atingiu o limite de usos');

      const { count: userUsages } = await supabaseClient
        .from('coupon_usages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('coupon_id', coupon.id);

      const maxPerUser = coupon.max_uses_per_user ?? 1;
      if ((userUsages ?? 0) >= maxPerUser) throw new Error('Você já atingiu o limite de usos deste cupom');

      discountPercent = coupon.discount_percent;
      couponId = coupon.id;
      const discountAmount = totalAmount * (discountPercent / 100);
      totalAmount = Math.round((totalAmount - discountAmount) * 100) / 100;
    }

    const isSandbox = Deno.env.get('ASAAS_SANDBOX_MODE') === 'true';
    const ASAAS_API_KEY = isSandbox ? Deno.env.get('ASAAS_SANDBOX_API_KEY') : Deno.env.get('ASAAS_API_KEY');
    const ASAAS_BASE_URL = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const FRONTEND_URL = 'https://conectaeimob.com.br';

    if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY não configurada');
    if (!customerData || !customerData.name || !customerData.cpfCnpj || !customerData.email) {
      throw new Error('Dados do cliente incompletos');
    }

    const orderId = crypto.randomUUID();

    const checkoutItems = validatedItems.map((item: any) => {
      const itemPrice = discountPercent > 0
        ? Math.round((item.price * (1 - discountPercent / 100)) * 100) / 100
        : item.price;
      return {
        name: item.name || `Lead - ${item.lead_id}`,
        value: itemPrice,
        description: item.description || `Compra de lead ID: ${item.lead_id}`,
        quantity: 1,
      };
    });

    const billingTypes = paymentMethod === 'PIX' ? ['PIX'] : ['CREDIT_CARD'];
    const webhookUrl = `${supabaseUrl}/functions/v1/asaas-webhook`;

    const cleanedCustomerData = {
      name: customerData.name.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''),
      email: customerData.email,
      cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''),
      phone: customerData.phone.replace(/\D/g, ''),
      address: customerData.address,
      addressNumber: customerData.addressNumber,
      complement: customerData.complement || '',
      postalCode: customerData.postalCode.replace(/\D/g, ''),
      province: customerData.province,
      city: customerData.city,
    };

    const finalPayload = {
      billingTypes,
      chargeTypes: ['DETACHED'],
      minutesToExpire: 60,
      externalReference: orderId,
      items: checkoutItems,
      callback: {
        successUrl: `${FRONTEND_URL}/checkout-success`,
        errorUrl: `${FRONTEND_URL}/checkout-error`,
        expiredUrl: `${FRONTEND_URL}/checkout-expired`,
        cancelUrl: `${FRONTEND_URL}/checkout-error`,
      },
      webhookUrl,
      customerData: cleanedCustomerData,
    };

    const checkoutResponse = await fetch(`${ASAAS_BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'Conectae-System',
      },
      body: JSON.stringify(finalPayload),
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.text();
      console.error('Asaas checkout failed:', checkoutResponse.status, errorData);
      throw new Error('Falha ao criar checkout. Por favor, verifique seus dados e tente novamente.');
    }

    const checkoutData = await checkoutResponse.json();
    console.log('Checkout created:', checkoutData.id);

    for (const item of validatedItems) {
      const itemAmount = discountPercent > 0
        ? Math.round((item.price * (1 - discountPercent / 100)) * 100) / 100
        : item.price;

      await supabaseClient.from('purchases').insert({
        user_id: user.id,
        lead_id: item.lead_id,
        amount: itemAmount,
        asaas_payment_id: orderId,
        asaas_checkout_id: checkoutData.id,
        status: 'PENDING',
        payment_method: paymentMethod === 'PIX' ? 'PIX' : 'CREDIT_CARD',
        coupon_code: couponCode || null,
        partner_id: partnerId || null,
      });
    }

    if (couponId) {
      await supabaseClient.from('coupon_usages').insert({
        coupon_id: couponId,
        user_id: user.id,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: checkoutData.link || checkoutData.url,
        checkoutId: checkoutData.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in create-payment:', error.message);
    return new Response(
      JSON.stringify({ error: error.message, details: 'Verifique os logs para mais informações' }),
      { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
