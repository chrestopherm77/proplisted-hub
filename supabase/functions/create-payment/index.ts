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
    console.log('Cart items count:', cartItems?.length || 0);

    // Validate cartItems exists and is an array
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error('Carrinho vazio ou inválido');
    }

    // Extract lead_ids from cart items
    const leadIds = cartItems.map((item: any) => item.lead_id).filter(Boolean);
    
    if (leadIds.length === 0) {
      throw new Error('Nenhum lead válido no carrinho');
    }

    // CRITICAL SECURITY FIX: Fetch actual lead prices from database
    console.log('Fetching leads from database for price validation...');
    const { data: dbLeads, error: leadsError } = await supabaseClient
      .from('leads')
      .select('id, price, is_active, name, description, purchase_count, max_purchases')
      .in('id', leadIds);

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      throw new Error('Erro ao validar leads');
    }

    if (!dbLeads || dbLeads.length === 0) {
      throw new Error('Nenhum lead encontrado no banco de dados');
    }

    // Create a map of lead_id -> lead data from database
    const leadMap = new Map(dbLeads.map((lead: any) => [lead.id, lead]));

    // Validate each cart item against database
    const validatedItems = [];
    for (const cartItem of cartItems) {
      const dbLead = leadMap.get(cartItem.lead_id);
      
      if (!dbLead) {
        console.error(`Lead ${cartItem.lead_id} not found in database`);
        throw new Error(`Lead ${cartItem.lead_id} não encontrado`);
      }

      // Check if lead is active
      if (!dbLead.is_active) {
        console.error(`Lead ${cartItem.lead_id} is not active`);
        throw new Error(`Lead não está mais disponível para compra`);
      }

      // Check if lead has reached max purchases
      if (dbLead.purchase_count >= dbLead.max_purchases) {
        console.error(`Lead ${cartItem.lead_id} has reached max purchases`);
        throw new Error(`Lead já atingiu o limite máximo de vendas`);
      }

      // Use the ACTUAL price from database, not from client
      validatedItems.push({
        lead_id: dbLead.id,
        price: Number(dbLead.price), // Always use database price
        name: dbLead.name,
        description: dbLead.description,
      });
    }

    console.log('Validated items count:', validatedItems.length);

    // Calculate total from DATABASE prices (not client-provided)
    const totalAmount = validatedItems.reduce((sum: number, item: any) => sum + item.price, 0);
    console.log('Total amount (from database):', totalAmount);

    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    const ASAAS_BASE_URL = 'https://api.asaas.com/v3';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // Frontend URL onde o usuário deve ser redirecionado após o pagamento
    const FRONTEND_URL = 'https://proplisted-hub.lovable.app';

    if (!ASAAS_API_KEY) {
      throw new Error('ASAAS_API_KEY não configurada');
    }

    // Validate customer data
    if (!customerData || !customerData.name || !customerData.cpfCnpj || !customerData.email) {
      throw new Error('Dados do cliente incompletos');
    }

    // Generate unique order ID to track this purchase
    const orderId = crypto.randomUUID();
    console.log('Order ID:', orderId);

    // Prepare checkout items using validated database data
    const checkoutItems = validatedItems.map((item: any) => ({
      name: item.name || `Lead - ${item.lead_id}`,
      value: item.price,
      description: item.description || `Compra de lead ID: ${item.lead_id}`,
      quantity: 1
    }));

    // Prepare billing types based on payment method
    const billingTypes = paymentMethod === 'PIX' ? ['PIX'] : ['CREDIT_CARD'];

    // Create Asaas Checkout with webhook URL
    console.log('Creating Asaas checkout...');
    const webhookUrl = `${supabaseUrl}/functions/v1/asaas-webhook`;
    
    const checkoutPayload = {
      billingTypes: billingTypes,
      chargeTypes: ['DETACHED'],
      minutesToExpire: 60,
      externalReference: orderId, // Link order ID to Asaas
      items: checkoutItems,
      callback: {
        successUrl: `${FRONTEND_URL}/checkout-success`,
        errorUrl: `${FRONTEND_URL}/checkout-error`,
        expiredUrl: `${FRONTEND_URL}/checkout-expired`,
        cancelUrl: `${FRONTEND_URL}/checkout-error`
      },
      webhookUrl: webhookUrl,
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

    console.log('Sending checkout request to Asaas...');

    const checkoutResponse = await fetch(`${ASAAS_BASE_URL}/checkouts`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'LeadBay-System',
      },
      body: JSON.stringify(finalPayload),
    });

    if (!checkoutResponse.ok) {
      // Log error details server-side only (don't expose to client)
      const errorData = await checkoutResponse.text();
      console.error('Asaas checkout creation failed - Status:', checkoutResponse.status);
      console.error('Asaas error (server-side only):', errorData);
      // Sanitized error message to avoid exposing customer PII
      throw new Error('Falha ao criar checkout. Por favor, verifique seus dados e tente novamente.');
    }

    const checkoutData = await checkoutResponse.json();
    console.log('Checkout created successfully!');
    console.log('Checkout ID:', checkoutData.id);

    // Save purchase records in database with PENDING status, order ID and checkout ID
    // Use validated items with DATABASE prices
    console.log('Saving purchase records with order ID:', orderId);
    for (const item of validatedItems) {
      const { error: purchaseError } = await supabaseClient
        .from('purchases')
        .insert({
          user_id: user.id,
          lead_id: item.lead_id,
          amount: item.price, // Use database-validated price
          asaas_payment_id: orderId, // Use order ID for webhook matching
          asaas_checkout_id: checkoutData.id, // Save checkout ID for payment matching
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
