import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Webhook Request Received ===');
    
    // SECURITY LAYER 1: Verify webhook secret token
    const ASAAS_WEBHOOK_SECRET = Deno.env.get('ASAAS_WEBHOOK_SECRET');
    const incomingToken = req.headers.get('asaas-access-token');
    
    if (!ASAAS_WEBHOOK_SECRET) {
      console.error('❌ ASAAS_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (incomingToken !== ASAAS_WEBHOOK_SECRET) {
      console.error('❌ Invalid webhook token received');
      console.error('Expected:', ASAAS_WEBHOOK_SECRET);
      console.error('Received:', incomingToken);
      
      // Log unauthorized attempt
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseClient
        .from('asaas_webhook_events')
        .insert({
          event_type: 'UNAUTHORIZED_ATTEMPT',
          payload: { 
            headers: Object.fromEntries(req.headers.entries()),
            timestamp: new Date().toISOString() 
          },
          processed: false,
          error_message: 'Unauthorized webhook attempt - invalid access token',
        });
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Webhook token verified successfully');

    // SECURITY LAYER 2: Optional IP validation
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    console.log('Request from IP:', clientIP);
    
    // Initialize Supabase client for webhook processing
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    const event = payload.event;
    const checkoutId = payload.checkout?.id;
    const paymentId = payload.payment?.id;
    const eventId = payload.id;
    const externalReference = payload.payment?.externalReference || payload.checkout?.externalReference;
    const checkoutSession = payload.payment?.checkoutSession; // Extract checkout session ID
    
    console.log('=== Asaas Webhook Received ===');
    console.log('Event type:', event);
    console.log('Event ID:', eventId);
    console.log('Checkout ID:', checkoutId);
    console.log('Payment ID:', paymentId);
    console.log('Checkout Session:', checkoutSession);
    console.log('External Reference (Order ID):', externalReference);

    // Store webhook event for audit
    const { error: webhookError } = await supabaseClient
      .from('asaas_webhook_events')
      .insert({
        event_type: event,
        asaas_event_id: eventId,
        payment_id: paymentId || checkoutId,
        payload: payload,
        processed: false,
      });

    if (webhookError) {
      console.error('Error storing webhook event:', webhookError);
    }

    // Process checkout events
    if (event === 'CHECKOUT_CREATED') {
      console.log('Checkout created event received');
    }

    if (event === 'CHECKOUT_PAID' || event === 'CHECKOUT_CONFIRMED') {
      console.log('Checkout payment confirmed!');
      await processPaymentConfirmation(supabaseClient, checkoutId, eventId, externalReference, checkoutSession);
    }

    if (event === 'CHECKOUT_EXPIRED') {
      console.log('Checkout expired');
      await updatePurchaseStatus(supabaseClient, checkoutId, 'EXPIRED', externalReference, checkoutSession);
    }

    // Handle direct payment events
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      console.log('Direct payment confirmed!');
      await processPaymentConfirmation(supabaseClient, paymentId, eventId, externalReference, checkoutSession);
    }

    if (event === 'PAYMENT_OVERDUE') {
      console.log('Payment overdue');
      await updatePurchaseStatus(supabaseClient, paymentId, 'OVERDUE', externalReference, checkoutSession);
    }

    console.log('=== Webhook processed successfully ===');

    return new Response(
      JSON.stringify({ 
        success: true,
        event: event,
        processed: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('=== Webhook Processing Error ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    // Try to log error to database
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseClient
        .from('asaas_webhook_events')
        .insert({
          event_type: 'ERROR',
          payload: { error: error.message, stack: error.stack },
          processed: false,
          error_message: error.message,
        });
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Webhook processing failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Process payment confirmation
async function processPaymentConfirmation(
  supabaseClient: any, 
  paymentId: string, 
  eventId: string,
  externalReference: string | null = null,
  checkoutSession: string | null = null
) {
  console.log('Processing payment confirmation for:', paymentId);
  console.log('External Reference (Order ID):', externalReference);

  // Check if already processed
  const { data: existingEvent } = await supabaseClient
    .from('asaas_webhook_events')
    .select('processed')
    .eq('asaas_event_id', eventId)
    .eq('processed', true)
    .single();

  if (existingEvent) {
    console.log('Event already processed, skipping...');
    return;
  }

  // Try to find purchases by external reference (order ID) first
  let purchases = null;
  let fetchError = null;

  if (externalReference) {
    console.log('Searching purchases by order ID:', externalReference);
    const result = await supabaseClient
      .from('purchases')
      .select('*')
      .eq('asaas_payment_id', externalReference);
    
    purchases = result.data;
    fetchError = result.error;

    if (purchases && purchases.length > 0) {
      console.log(`✅ Found ${purchases.length} purchases by order ID`);
    }
  }

  // Try by checkout session ID if not found by external reference
  if (!purchases || purchases.length === 0) {
    if (checkoutSession) {
      console.log('Searching purchases by checkout session ID:', checkoutSession);
      const result = await supabaseClient
        .from('purchases')
        .select('*')
        .eq('asaas_checkout_id', checkoutSession);
      
      purchases = result.data;
      fetchError = result.error;

      if (purchases && purchases.length > 0) {
        console.log(`✅ Found ${purchases.length} purchases by checkout session ID`);
      }
    }
  }

  // Fallback: try payment ID if no external reference or not found
  if (!purchases || purchases.length === 0) {
    console.log('Trying to find purchases by payment ID:', paymentId);
    const result = await supabaseClient
      .from('purchases')
      .select('*')
      .eq('asaas_payment_id', paymentId);
    
    purchases = result.data;
    fetchError = result.error;

    if (purchases && purchases.length > 0) {
      console.log(`✅ Found ${purchases.length} purchases by payment ID`);
    }
  }

  // Last resort: fetch payment from Asaas API to get checkout info
  if (!purchases || purchases.length === 0) {
    console.log('💡 Attempting to fetch payment details from Asaas API...');
    try {
      const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
      const ASAAS_BASE_URL = 'https://api-sandbox.asaas.com/v3';
      
      const paymentResponse = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
        headers: {
          'access_token': ASAAS_API_KEY || '',
          'User-Agent': 'LeadMarket-Webhook',
        },
      });

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        console.log('📦 Payment data from API:', JSON.stringify(paymentData, null, 2));
        
        // Try to find by external reference from API
        if (paymentData.externalReference) {
          console.log('Found externalReference in API response:', paymentData.externalReference);
          const result = await supabaseClient
            .from('purchases')
            .select('*')
            .eq('asaas_payment_id', paymentData.externalReference);
          
          purchases = result.data;
          if (purchases && purchases.length > 0) {
            console.log(`✅ Found ${purchases.length} purchases by API externalReference`);
          }
        }
      }
    } catch (apiError: any) {
      console.error('Error fetching payment from Asaas API:', apiError.message);
    }
  }

  if (fetchError) {
    console.error('Error fetching purchases:', fetchError);
    throw fetchError;
  }

  if (!purchases || purchases.length === 0) {
    console.log('⚠️ No purchases found for payment:', paymentId);
    console.log('Order ID was:', externalReference);
    return;
  }

  console.log('Found', purchases.length, 'purchases to process');

  // Process each purchase
  for (const purchase of purchases) {
    console.log('Processing purchase:', purchase.id);

    // Update purchase status to PAID
    const { error: updateError } = await supabaseClient
      .from('purchases')
      .update({
        status: 'PAID',
        payment_confirmed_at: new Date().toISOString(),
      })
      .eq('id', purchase.id);

    if (updateError) {
      console.error('Error updating purchase:', updateError);
      continue;
    }

    // Get lead information
    const { data: lead } = await supabaseClient
      .from('leads')
      .select('purchase_count, max_purchases')
      .eq('id', purchase.lead_id)
      .single();

    if (lead) {
      const newCount = (lead.purchase_count || 0) + 1;
      const isActive = newCount < (lead.max_purchases || 3);

      console.log(`Updating lead ${purchase.lead_id}: count ${newCount}, active: ${isActive}`);

      // Update lead purchase count and active status
      await supabaseClient
        .from('leads')
        .update({
          purchase_count: newCount,
          is_active: isActive,
        })
        .eq('id', purchase.lead_id);
    }

    // Clear shopping cart item
    await supabaseClient
      .from('shopping_cart')
      .delete()
      .eq('user_id', purchase.user_id)
      .eq('lead_id', purchase.lead_id);

    console.log('✅ Purchase processed successfully:', purchase.id);
  }

  // Mark webhook event as processed
  await supabaseClient
    .from('asaas_webhook_events')
    .update({ 
      processed: true, 
      processed_at: new Date().toISOString() 
    })
    .eq('asaas_event_id', eventId);

  console.log('✅ Payment confirmation processing completed');
}

// Update purchase status (for expired/overdue payments)
async function updatePurchaseStatus(
  supabaseClient: any, 
  paymentId: string, 
  status: string,
  externalReference: string | null = null,
  checkoutSession: string | null = null
) {
  console.log(`Updating purchase status to ${status} for payment:`, paymentId);
  console.log('External Reference (Order ID):', externalReference);

  // Try external reference first
  if (externalReference) {
    const { error } = await supabaseClient
      .from('purchases')
      .update({ status })
      .eq('asaas_payment_id', externalReference);

    if (error) {
      console.error('Error updating purchase status by order ID:', error);
    } else {
      console.log('✅ Updated purchases by order ID');
      return;
    }
  }

  // Try by checkout session ID
  if (checkoutSession) {
    const { error } = await supabaseClient
      .from('purchases')
      .update({ status })
      .eq('asaas_checkout_id', checkoutSession);

    if (error) {
      console.error('Error updating purchase status by checkout session:', error);
    } else {
      console.log('✅ Updated purchases by checkout session ID');
      return;
    }
  }

  // Fallback to payment ID
  const { error } = await supabaseClient
    .from('purchases')
    .update({ status })
    .eq('asaas_payment_id', paymentId);

  if (error) {
    console.error('Error updating purchase status by payment ID:', error);
  } else {
    console.log('✅ Updated purchases by payment ID');
  }
}