import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user from JWT token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { cartItems, customerData, paymentMethod } = await req.json();
    console.log('=== Creating Asaas Checkout ===');
    console.log('User ID:', user.id);
    console.log('Payment Method:', paymentMethod);
    console.log('Cart items:', cartItems.length);
    console.log('Customer Data:', customerData);

    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    const ASAAS_BASE_URL = 'https://api-sandbox.asaas.com/v3';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const FRONTEND_URL = supabaseUrl.replace('supabase.co', 'lovable.app').replace('/functions/v1', '');

    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY não configurada');
    }

    const totalAmount = cartItems.reduce((sum: number, item: any) => sum + Number(item.price), 0);
    console.log('Total amount:', totalAmount);

    // Prepare checkout items
    const checkoutItems = cartItems.map((item: any) => ({
      name: item.name || `Lead - ${item.lead_id}`,
      value: Number(item.price),
      description: item.description || `Compra de lead ID: ${item.lead_id}`,
      quantity: 1
    }));

    // Prepare billing types based on payment method
    const billingTypes = paymentMethod === 'PIX' ? ['PIX'] : ['CREDIT_CARD'];

    // Create Asaas Checkout
    console.log('Creating Asaas checkout...');
    const checkoutPayload = {
      billingTypes: billingTypes,
      chargeTypes: ['DETACHED'],
      minutesToExpire: 60,
      items: checkoutItems,
      callback: {
        successUrl: `${FRONTEND_URL}/checkout-success`,
        errorUrl: `${FRONTEND_URL}/checkout-error`,
        expiredUrl: `${FRONTEND_URL}/checkout-expired`,
        cancelUrl: `${FRONTEND_URL}/checkout-error`
      },
      customerData: {
        name: customerData.name,
        cpfCnpj: customerData.cpfCnpj,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        addressNumber: customerData.addressNumber,
        complement: customerData.complement || '',
        postalCode: customerData.postalCode,
        province: customerData.province,
        city: customerData.city
      }
    };

    console.log('Checkout payload:', JSON.stringify(checkoutPayload, null, 2));

    // Clean customer data before sending to Asaas
    const cleanedCustomerData = {
      ...checkoutPayload.customerData,
      name: checkoutPayload.customerData.name.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''),
      phone: checkoutPayload.customerData.phone.replace(/\D/g, ''),
      cpfCnpj: checkoutPayload.customerData.cpfCnpj.replace(/\D/g, ''),
      postalCode: checkoutPayload.customerData.postalCode.replace(/\D/g, ''),
    };

    const finalPayload = {
      ...checkoutPayload,
      customerData: cleanedCustomerData,
    };

    console.log('Final payload to Asaas:', JSON.stringify(finalPayload, null, 2));

    const checkoutResponse = await fetch(`${ASAAS_BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'LeadMarket-System',
      },
      body: JSON.stringify(finalPayload),
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json();
      console.error('Error creating checkout:', errorData);
      throw new Error(`Erro ao criar checkout: ${JSON.stringify(errorData)}`);
    }

    const checkoutData = await checkoutResponse.json();
    console.log('Checkout created successfully!');
    console.log('Checkout ID:', checkoutData.id);
    console.log('Checkout Link:', checkoutData.link);
    console.log('Full response:', JSON.stringify(checkoutData, null, 2));

    // Save purchase records in database with PENDING status
    console.log('Saving purchase records...');
    for (const item of cartItems) {
      const { error: purchaseError } = await supabaseClient
        .from('purchases')
        .insert({
          user_id: user.id,
          lead_id: item.lead_id,
          amount: item.price,
          asaas_payment_id: checkoutData.id,
          status: 'PENDING',
        });

      if (purchaseError) {
        console.error('Error creating purchase record:', purchaseError);
      }
    }

    console.log('=== Checkout creation completed ===');

    // Return checkout link for redirect (Asaas uses 'link' not 'url')
    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: checkoutData.link || checkoutData.url,
        checkoutId: checkoutData.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('=== Error in create-payment function ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Verifique os logs para mais informações'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
