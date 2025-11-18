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

    const { cartItems } = await req.json();
    console.log('=== Creating Asaas Checkout ===');
    console.log('User ID:', user.id);
    console.log('Cart items:', cartItems.length);

    // Get user profile for customer data
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Perfil do usuário não encontrado');
    }

    // Asaas SANDBOX configuration
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    const ASAAS_BASE_URL = 'https://api-sandbox.asaas.com/v3';
    
    // Get frontend URL for callbacks (replace supabase.co with lovable.app)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const FRONTEND_URL = supabaseUrl.replace('supabase.co', 'lovable.app').replace('/functions/v1', '');

    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY não configurada');
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum: number, item: any) => sum + Number(item.price), 0);
    console.log('Total amount:', totalAmount);

    // Step 1: Create or get customer in Asaas
    console.log('Creating Asaas customer...');
    const customerResponse = await fetch(`${ASAAS_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'LeadMarket-System',
      },
      body: JSON.stringify({
        name: profile.name,
        email: user.email,
        phone: profile.phone,
        cpfCnpj: profile.creci_number,
      }),
    });

    if (!customerResponse.ok) {
      const errorData = await customerResponse.json();
      console.error('Error creating customer:', errorData);
      throw new Error(`Erro ao criar cliente no Asaas: ${JSON.stringify(errorData)}`);
    }

    const customerData = await customerResponse.json();
    console.log('Customer created/retrieved:', customerData.id);

    // Step 2: Prepare checkout items
    const checkoutItems = cartItems.map((item: any) => ({
      name: `Lead - ${item.lead_id}`,
      value: Number(item.price),
      description: `Compra de lead ID: ${item.lead_id}`
    }));

    // Step 3: Create Asaas Checkout
    console.log('Creating Asaas checkout...');
    const checkoutPayload = {
      billingTypes: ['PIX', 'CREDIT_CARD'],
      chargeTypes: ['ONETIME'],
      items: checkoutItems,
      expiresIn: 60, // 60 minutes
      callback: {
        successUrl: `${FRONTEND_URL}/checkout-success`,
        errorUrl: `${FRONTEND_URL}/checkout-error`,
        expiredUrl: `${FRONTEND_URL}/checkout-expired`
      },
      customerData: {
        name: profile.name,
        cpfCnpj: profile.creci_number,
        email: user.email,
        phone: profile.phone
      }
    };

    console.log('Checkout payload:', JSON.stringify(checkoutPayload, null, 2));

    const checkoutResponse = await fetch(`${ASAAS_BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'LeadMarket-System',
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!checkoutResponse.ok) {
      const errorData = await checkoutResponse.json();
      console.error('Error creating checkout:', errorData);
      throw new Error(`Erro ao criar checkout: ${JSON.stringify(errorData)}`);
    }

    const checkoutData = await checkoutResponse.json();
    console.log('Checkout created successfully!');
    console.log('Checkout ID:', checkoutData.id);
    console.log('Checkout URL:', checkoutData.url);

    // Step 4: Save purchase records in database with PENDING status
    console.log('Saving purchase records...');
    for (const item of cartItems) {
      const { error: purchaseError } = await supabaseClient
        .from('purchases')
        .insert({
          user_id: user.id,
          lead_id: item.lead_id,
          amount: item.price,
          asaas_payment_id: checkoutData.id,
          asaas_customer_id: customerData.id,
          status: 'PENDING',
        });

      if (purchaseError) {
        console.error('Error creating purchase record:', purchaseError);
      }
    }

    console.log('=== Checkout creation completed ===');

    // Return checkout URL for redirect
    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: checkoutData.url,
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
