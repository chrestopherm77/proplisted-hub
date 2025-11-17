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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { paymentMethod, cartItems } = await req.json();
    console.log('Creating payment for user:', user.id, 'Method:', paymentMethod);

    // Get user profile for Asaas customer creation
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum: number, item: any) => sum + Number(item.price), 0);

    // Create or get Asaas customer
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    const asaasBaseUrl = 'https://sandbox.asaas.com/api/v3';

    // Create customer in Asaas
    const customerResponse = await fetch(`${asaasBaseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey!,
      },
      body: JSON.stringify({
        name: profile.name,
        email: user.email,
        phone: profile.phone,
        cpfCnpj: profile.creci_number,
      }),
    });

    const customerData = await customerResponse.json();
    console.log('Asaas customer created:', customerData.id);

    // Create payment in Asaas
    const paymentResponse = await fetch(`${asaasBaseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey!,
      },
      body: JSON.stringify({
        customer: customerData.id,
        billingType: paymentMethod === 'PIX' ? 'PIX' : 'CREDIT_CARD',
        value: totalAmount,
        dueDate: new Date().toISOString().split('T')[0],
        description: `Compra de ${cartItems.length} lead(s) - LeadMarket`,
      }),
    });

    const paymentData = await paymentResponse.json();
    console.log('Asaas payment created:', paymentData.id);

    // Create purchase records in database
    for (const item of cartItems) {
      const { error: purchaseError } = await supabaseClient
        .from('purchases')
        .insert({
          user_id: user.id,
          lead_id: item.lead_id,
          amount: item.price,
          asaas_payment_id: paymentData.id,
          asaas_customer_id: customerData.id,
          status: 'PENDING',
        });

      if (purchaseError) {
        console.error('Error creating purchase record:', purchaseError);
      }
    }

    // Get PIX QR Code if payment method is PIX
    let pixQrCode = null;
    let pixPayload = null;

    if (paymentMethod === 'PIX') {
      const qrCodeResponse = await fetch(
        `${asaasBaseUrl}/payments/${paymentData.id}/pixQrCode`,
        {
          headers: {
            'access_token': asaasApiKey!,
          },
        }
      );

      const qrCodeData = await qrCodeResponse.json();
      pixQrCode = qrCodeData.encodedImage;
      pixPayload = qrCodeData.payload;
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentData.id,
        pixQrCode,
        pixPayload,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in create-payment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
