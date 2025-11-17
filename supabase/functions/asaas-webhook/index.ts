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

    const webhookData = await req.json();
    console.log('Webhook received:', webhookData.event);

    // Store webhook event
    const { error: webhookError } = await supabaseClient
      .from('asaas_webhook_events')
      .insert({
        event_type: webhookData.event,
        asaas_event_id: webhookData.id,
        payment_id: webhookData.payment?.id,
        payload: webhookData,
        processed: false,
      });

    if (webhookError) {
      console.error('Error storing webhook:', webhookError);
    }

    // Handle payment confirmation
    if (webhookData.event === 'PAYMENT_RECEIVED' || webhookData.event === 'PAYMENT_CONFIRMED') {
      const paymentId = webhookData.payment.id;
      console.log('Processing payment confirmation:', paymentId);

      // Check if already processed
      const { data: existingEvent } = await supabaseClient
        .from('asaas_webhook_events')
        .select('processed')
        .eq('asaas_event_id', webhookData.id)
        .eq('processed', true)
        .single();

      if (existingEvent) {
        console.log('Event already processed');
        return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update purchases to PAID
      const { data: purchases, error: fetchError } = await supabaseClient
        .from('purchases')
        .select('*')
        .eq('asaas_payment_id', paymentId);

      if (fetchError) {
        console.error('Error fetching purchases:', fetchError);
        throw fetchError;
      }

      for (const purchase of purchases || []) {
        // Update purchase status
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

        // Increment lead purchase count
        const { data: lead } = await supabaseClient
          .from('leads')
          .select('purchase_count, max_purchases')
          .eq('id', purchase.lead_id)
          .single();

        if (lead) {
          const newCount = (lead.purchase_count || 0) + 1;
          const isActive = newCount < (lead.max_purchases || 3);

          await supabaseClient
            .from('leads')
            .update({
              purchase_count: newCount,
              is_active: isActive,
            })
            .eq('id', purchase.lead_id);
        }

        // Clear cart item
        await supabaseClient
          .from('shopping_cart')
          .delete()
          .eq('user_id', purchase.user_id)
          .eq('lead_id', purchase.lead_id);
      }

      // Mark webhook as processed
      await supabaseClient
        .from('asaas_webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('asaas_event_id', webhookData.id);

      console.log('Payment processed successfully');
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in webhook handler:', error);
    
    // Try to log the error
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseClient
        .from('asaas_webhook_events')
        .update({
          processed: true,
          error_message: error.message,
          processed_at: new Date().toISOString(),
        })
        .eq('processed', false)
        .order('received_at', { ascending: false })
        .limit(1);
    } catch (logError) {
      console.error('Error logging webhook error:', logError);
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
