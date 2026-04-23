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

  const clientIPEarly = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  if (incomingToken !== ASAAS_WEBHOOK_SECRET) {
    console.error('❌ Invalid webhook token received');
    console.error('Token validation failed - check ASAAS_WEBHOOK_SECRET configuration');
    console.error('Request IP:', clientIPEarly);
    // Note: Never log actual secret or token values
      
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

      // Check if we have multiple unauthorized attempts in last 10 min → raise admin alert
      try {
        const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { count } = await supabaseClient
          .from('asaas_webhook_events')
          .select('id', { count: 'exact', head: true })
          .eq('event_type', 'UNAUTHORIZED_ATTEMPT')
          .gte('received_at', tenMinAgo);

        if ((count ?? 0) >= 3) {
          // Avoid spamming: only alert if no unread alert of same type in last hour
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          const { data: existingAlert } = await supabaseClient
            .from('admin_alerts')
            .select('id')
            .eq('type', 'ASAAS_WEBHOOK_UNAUTHORIZED')
            .is('read_at', null)
            .gte('created_at', oneHourAgo)
            .limit(1)
            .maybeSingle();

          if (!existingAlert) {
            await supabaseClient.from('admin_alerts').insert({
              type: 'ASAAS_WEBHOOK_UNAUTHORIZED',
              severity: 'CRITICAL',
              message: `Webhook do Asaas está sendo bloqueado por token inválido (${count} tentativas em 10 min). Pagamentos não estão sendo confirmados automaticamente. Verifique o token configurado no painel do Asaas.`,
              payload: { count, last_attempt_ip: clientIPEarly },
            });
          }
        }
      } catch (alertErr) {
        console.error('Failed to evaluate admin alert:', alertErr);
      }

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

    // Determine type by externalReference prefix or by presence of subscription
    const isCreditPurchase = externalReference?.startsWith('credits_');
    const isSubscription = externalReference?.startsWith('sub_') || !!payload.payment?.subscription;

    // Process checkout events
    if (event === 'CHECKOUT_CREATED') {
      console.log('Checkout created event received');
    }

    if (event === 'CHECKOUT_PAID' || event === 'CHECKOUT_CONFIRMED') {
      console.log('Checkout payment confirmed!');
      if (isCreditPurchase) {
        await processCreditPaymentConfirmation(supabaseClient, externalReference, checkoutSession, eventId);
      } else {
        await processPaymentConfirmation(supabaseClient, checkoutId, eventId, externalReference, checkoutSession);
      }
    }

    if (event === 'CHECKOUT_EXPIRED') {
      console.log('Checkout expired');
      if (isCreditPurchase) {
        await updateCreditPurchaseStatus(supabaseClient, externalReference, checkoutSession, 'EXPIRED');
      } else {
        await updatePurchaseStatus(supabaseClient, checkoutId, 'EXPIRED', externalReference, checkoutSession);
      }
    }

    // Handle direct payment events
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      console.log('Direct payment confirmed!');
      if (isSubscription) {
        await processSubscriptionPayment(supabaseClient, payload, eventId);
      } else if (isCreditPurchase) {
        await processCreditPaymentConfirmation(supabaseClient, externalReference, checkoutSession, eventId);
      } else {
        await processPaymentConfirmation(supabaseClient, paymentId, eventId, externalReference, checkoutSession);
      }
    }

    if (event === 'PAYMENT_OVERDUE') {
      console.log('Payment overdue');
      if (isSubscription) {
        await updateSubscriptionStatus(supabaseClient, payload, 'OVERDUE');
      } else if (isCreditPurchase) {
        await updateCreditPurchaseStatus(supabaseClient, externalReference, checkoutSession, 'OVERDUE');
      } else {
        await updatePurchaseStatus(supabaseClient, paymentId, 'OVERDUE', externalReference, checkoutSession);
      }
    }

    if (event === 'SUBSCRIPTION_DELETED' || event === 'SUBSCRIPTION_CANCELED') {
      console.log('Subscription deleted/canceled');
      await markSubscriptionCanceled(supabaseClient, payload);
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
      const isSandbox = Deno.env.get('ASAAS_SANDBOX_MODE') === 'true';
      const ASAAS_API_KEY = isSandbox ? Deno.env.get('ASAAS_SANDBOX_API_KEY') : Deno.env.get('ASAAS_API_KEY');
      const ASAAS_BASE_URL = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
      
      const paymentResponse = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
        headers: {
          'access_token': ASAAS_API_KEY || '',
          'User-Agent': 'LeadBay-Webhook',
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
    // Check if purchase is already PAID to prevent double processing
    if (purchase.status === 'PAID') {
      console.log('⏭️ Purchase already PAID, skipping:', purchase.id);
      continue;
    }
    
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

    // Atomically increment purchase count (prevents race conditions)
    const { data: incrementResult, error: incrementError } = await supabaseClient
      .rpc('increment_purchase_count', { p_lead_id: purchase.lead_id });

    if (incrementError) {
      console.error(`Error incrementing purchase count for lead ${purchase.lead_id}:`, incrementError);
    } else if (incrementResult && incrementResult.length > 0) {
      console.log(`Lead ${purchase.lead_id}: count ${incrementResult[0].new_count}, active: ${incrementResult[0].is_now_active}`);
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

// Process credit purchase payment confirmation
async function processCreditPaymentConfirmation(
  supabaseClient: any,
  externalReference: string,
  checkoutSession: string | null,
  eventId: string
) {
  console.log('Processing CREDIT payment confirmation for:', externalReference);

  // Find credit purchase
  let creditPurchase = null;

  const { data: byRef } = await supabaseClient
    .from('credit_purchases')
    .select('*')
    .eq('asaas_payment_id', externalReference)
    .single();

  creditPurchase = byRef;

  if (!creditPurchase && checkoutSession) {
    const { data: bySession } = await supabaseClient
      .from('credit_purchases')
      .select('*')
      .eq('asaas_checkout_id', checkoutSession)
      .single();
    creditPurchase = bySession;
  }

  if (!creditPurchase) {
    console.log('⚠️ No credit purchase found for:', externalReference);
    return;
  }

  if (creditPurchase.status === 'PAID') {
    console.log('⏭️ Credit purchase already PAID, skipping');
    return;
  }

  // Update credit purchase status
  await supabaseClient
    .from('credit_purchases')
    .update({ status: 'PAID', confirmed_at: new Date().toISOString() })
    .eq('id', creditPurchase.id);

  // Add credits to user profile
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('credit_balance')
    .eq('id', creditPurchase.user_id)
    .single();

  const newBalance = (profile?.credit_balance || 0) + creditPurchase.credits;

  await supabaseClient
    .from('profiles')
    .update({ credit_balance: newBalance })
    .eq('id', creditPurchase.user_id);

  // Record transaction
  await supabaseClient
    .from('credit_transactions')
    .insert({
      user_id: creditPurchase.user_id,
      credits_used: -creditPurchase.credits, // negative = credits added
      type: 'CREDIT_PURCHASE',
    });

  // Mark webhook event as processed
  await supabaseClient
    .from('asaas_webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('asaas_event_id', eventId);

  console.log(`✅ Credited ${creditPurchase.credits} credits to user ${creditPurchase.user_id}. New balance: ${newBalance}`);
}

// Update credit purchase status (for expired/overdue)
async function updateCreditPurchaseStatus(
  supabaseClient: any,
  externalReference: string,
  checkoutSession: string | null,
  status: string
) {
  console.log(`Updating credit purchase status to ${status} for:`, externalReference);

  if (externalReference) {
    await supabaseClient
      .from('credit_purchases')
      .update({ status })
      .eq('asaas_payment_id', externalReference);
  } else if (checkoutSession) {
    await supabaseClient
      .from('credit_purchases')
      .update({ status })
      .eq('asaas_checkout_id', checkoutSession);
  }

  console.log('✅ Credit purchase status updated to', status);
}

// =========================================================
// SUBSCRIPTION HANDLERS
// =========================================================

async function processSubscriptionPayment(supabaseClient: any, payload: any, eventId: string) {
  const payment = payload.payment;
  const asaasSubscriptionId = payment?.subscription;
  const asaasPaymentId = payment?.id;
  const externalReference = payment?.externalReference;

  console.log('Processing subscription payment:', { asaasSubscriptionId, asaasPaymentId, externalReference });

  if (!asaasSubscriptionId && !externalReference) {
    console.warn('⚠️ Subscription payment without subscription id or externalReference');
    return;
  }

  // Idempotency: skip if this asaas_payment_id already saved as PAID
  if (asaasPaymentId) {
    const { data: existing } = await supabaseClient
      .from('subscription_payments')
      .select('id, status')
      .eq('asaas_payment_id', asaasPaymentId)
      .maybeSingle();
    if (existing && (existing.status === 'PAID' || existing.status === 'CONFIRMED')) {
      console.log('⏭️ Subscription payment already processed:', asaasPaymentId);
      await supabaseClient
        .from('asaas_webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('asaas_event_id', eventId);
      return;
    }
  }

  // Locate user_subscription
  let sub: any = null;
  if (asaasSubscriptionId) {
    const { data } = await supabaseClient
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('asaas_subscription_id', asaasSubscriptionId)
      .maybeSingle();
    sub = data;
  }

  if (!sub) {
    console.warn('⚠️ user_subscription not found for', asaasSubscriptionId);
    return;
  }

  // Insert subscription_payment (unique by asaas_payment_id)
  const { error: payInsertError } = await supabaseClient
    .from('subscription_payments')
    .insert({
      subscription_id: sub.id,
      user_id: sub.user_id,
      asaas_payment_id: asaasPaymentId,
      amount: Number(payment.value ?? sub.plan.price),
      status: 'PAID',
      paid_at: payment.paymentDate ? new Date(payment.paymentDate).toISOString() : new Date().toISOString(),
      due_date: payment.dueDate ?? null,
      payment_method: payment.billingType ?? null,
      invoice_url: payment.invoiceUrl ?? null,
    });

  if (payInsertError && !String(payInsertError.message ?? '').includes('duplicate')) {
    console.error('Error inserting subscription_payment:', payInsertError);
  }

  // Update user_subscription period and status
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabaseClient
    .from('user_subscriptions')
    .update({
      status: 'ACTIVE',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      next_due_date: payment.nextDueDate ?? null,
      invoice_url: payment.invoiceUrl ?? sub.invoice_url,
    })
    .eq('id', sub.id);

  // === Expirar outras assinaturas ativas do mesmo usuário (troca de plano confirmada) ===
  const { data: otherActive } = await supabaseClient
    .from('user_subscriptions')
    .select('id, plan_id, asaas_subscription_id')
    .eq('user_id', sub.user_id)
    .in('status', ['ACTIVE', 'PENDING', 'OVERDUE'])
    .neq('id', sub.id);

  if (otherActive && otherActive.length > 0) {
    console.log(`🔄 Expirando ${otherActive.length} assinatura(s) anterior(es) do user ${sub.user_id}`);
    for (const other of otherActive) {
      await supabaseClient
        .from('user_subscriptions')
        .update({ status: 'EXPIRED', canceled_at: new Date().toISOString() })
        .eq('id', other.id);

      // Tenta cancelar no Asaas se tinha id remoto
      if (other.asaas_subscription_id) {
        try {
          const isSandbox = Deno.env.get('ASAAS_SANDBOX_MODE') === 'true';
          const ASAAS_API_KEY = isSandbox ? Deno.env.get('ASAAS_SANDBOX_API_KEY') : Deno.env.get('ASAAS_API_KEY');
          const ASAAS_BASE_URL = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
          await fetch(`${ASAAS_BASE_URL}/subscriptions/${other.asaas_subscription_id}`, {
            method: 'DELETE',
            headers: { 'access_token': ASAAS_API_KEY || '', 'User-Agent': 'LeadBay-Webhook' },
          });
        } catch (e) {
          console.error('Falha ao cancelar assinatura antiga no Asaas:', e);
        }
      }
    }
  }

  // Credit monthly credits to user
  const monthly = sub.plan?.monthly_credits ?? 0;
  if (monthly > 0) {
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credit_balance')
      .eq('id', sub.user_id)
      .single();
    const newBalance = (profile?.credit_balance ?? 0) + monthly;
    await supabaseClient
      .from('profiles')
      .update({ credit_balance: newBalance })
      .eq('id', sub.user_id);

    await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: sub.user_id,
        credits_used: -monthly, // negative = credits added (matches existing convention)
        type: 'SUBSCRIPTION_RENEWAL',
      });

    console.log(`✅ Credited ${monthly} subscription credits to user ${sub.user_id}. New balance: ${newBalance}`);
  }

  await supabaseClient
    .from('asaas_webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('asaas_event_id', eventId);

  console.log('✅ Subscription payment processed');
}

async function updateSubscriptionStatus(supabaseClient: any, payload: any, status: string) {
  const asaasSubscriptionId = payload.payment?.subscription;
  if (!asaasSubscriptionId) return;
  await supabaseClient
    .from('user_subscriptions')
    .update({ status })
    .eq('asaas_subscription_id', asaasSubscriptionId);
  console.log(`✅ Subscription marked ${status}:`, asaasSubscriptionId);
}

async function markSubscriptionCanceled(supabaseClient: any, payload: any) {
  const asaasSubscriptionId = payload.subscription?.id || payload.payment?.subscription;
  if (!asaasSubscriptionId) return;
  await supabaseClient
    .from('user_subscriptions')
    .update({ status: 'CANCELED', canceled_at: new Date().toISOString() })
    .eq('asaas_subscription_id', asaasSubscriptionId);
  console.log('✅ Subscription canceled:', asaasSubscriptionId);
}