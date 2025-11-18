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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    
    console.log('=== Asaas Webhook Received ===');
    console.log('Event type:', webhookData.event);
    console.log('Event ID:', webhookData.id);
    console.log('Payment ID:', webhookData.payment?.id);
    console.log('Checkout ID:', webhookData.checkout?.id);

    // Store webhook event for audit
    const { error: webhookError } = await supabaseClient
      .from('asaas_webhook_events')
      .insert({
        event_type: webhookData.event,
        asaas_event_id: webhookData.id,
        payment_id: webhookData.payment?.id || webhookData.checkout?.id,
        payload: webhookData,
        processed: false,
      });

    if (webhookError) {
      console.error('Error storing webhook event:', webhookError);
    }

    // Process different event types
    const eventType = webhookData.event;
    let paymentId = null;

    // Handle checkout events
    if (eventType === 'CHECKOUT_CREATED') {
      console.log('Checkout created event received');
      paymentId = webhookData.checkout?.id;
    }

    if (eventType === 'CHECKOUT_PAID' || eventType === 'CHECKOUT_CONFIRMED') {
      console.log('Checkout payment confirmed!');
      paymentId = webhookData.checkout?.id;
      await processPaymentConfirmation(supabaseClient, paymentId, webhookData.id);
    }

    if (eventType === 'CHECKOUT_EXPIRED') {
      console.log('Checkout expired');
      paymentId = webhookData.checkout?.id;
      await updatePurchaseStatus(supabaseClient, paymentId, 'EXPIRED');
    }

    // Handle direct payment events (fallback)
    if (eventType === 'PAYMENT_RECEIVED' || eventType === 'PAYMENT_CONFIRMED') {
      console.log('Direct payment confirmed!');
      paymentId = webhookData.payment?.id;
      await processPaymentConfirmation(supabaseClient, paymentId, webhookData.id);
    }

    if (eventType === 'PAYMENT_OVERDUE') {
      console.log('Payment overdue');
      paymentId = webhookData.payment?.id;
      await updatePurchaseStatus(supabaseClient, paymentId, 'OVERDUE');
    }

    console.log('=== Webhook processed successfully ===');

    return new Response(
      JSON.stringify({ success: true, event: eventType }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('=== Error in webhook function ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    // Try to update webhook event with error
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const webhookData = await req.json();
      
      await supabaseClient
        .from('asaas_webhook_events')
        .update({ 
          error_message: error.message,
          processed: false 
        })
        .eq('asaas_event_id', webhookData.id);
    } catch (updateError) {
      console.error('Error updating webhook event:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Process payment confirmation
async function processPaymentConfirmation(supabaseClient: any, paymentId: string, eventId: string) {
  console.log('Processing payment confirmation for:', paymentId);

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

  // Get all purchases for this payment
  const { data: purchases, error: fetchError } = await supabaseClient
    .from('purchases')
    .select('*')
    .eq('asaas_payment_id', paymentId);

  if (fetchError) {
    console.error('Error fetching purchases:', fetchError);
    throw fetchError;
  }

  if (!purchases || purchases.length === 0) {
    console.log('No purchases found for payment:', paymentId);
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

    console.log('Purchase processed successfully:', purchase.id);
  }

  // Mark webhook event as processed
  await supabaseClient
    .from('asaas_webhook_events')
    .update({ 
      processed: true, 
      processed_at: new Date().toISOString() 
    })
    .eq('asaas_event_id', eventId);

  console.log('Payment confirmation processing completed');
}

// Update purchase status
async function updatePurchaseStatus(supabaseClient: any, paymentId: string, status: string) {
  console.log(`Updating purchases to ${status} for payment:`, paymentId);

  const { error } = await supabaseClient
    .from('purchases')
    .update({ status })
    .eq('asaas_payment_id', paymentId);

  if (error) {
    console.error('Error updating purchase status:', error);
    throw error;
  }

  console.log('Purchase status updated successfully');
}
