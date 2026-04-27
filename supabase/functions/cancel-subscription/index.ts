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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { subscriptionId } = await req.json();
    if (!subscriptionId) throw new Error('subscriptionId é obrigatório');

    const { data: sub, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single();
    if (subError || !sub) throw new Error('Assinatura não encontrada');

    if (sub.status === 'CANCELED') {
      return new Response(JSON.stringify({ success: true, alreadyCanceled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Cancela no Asaas se for assinatura paga
    if (sub.asaas_subscription_id) {
      const isSandbox = Deno.env.get('ASAAS_SANDBOX_MODE') === 'true';
      const ASAAS_API_KEY = isSandbox ? Deno.env.get('ASAAS_SANDBOX_API_KEY') : Deno.env.get('ASAAS_API_KEY');
      const ASAAS_BASE_URL = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';

      if (ASAAS_API_KEY) {
        const delResp = await fetch(`${ASAAS_BASE_URL}/subscriptions/${sub.asaas_subscription_id}`, {
          method: 'DELETE',
          headers: { 'access_token': ASAAS_API_KEY, 'User-Agent': 'Conectae-System' },
        });
        if (!delResp.ok) {
          const t = await delResp.text();
          console.error('Asaas cancel failed:', t);
          // Não bloqueia: marcamos como cancelado localmente mesmo assim
        } else {
          console.log('Asaas subscription canceled:', sub.asaas_subscription_id);
        }
      }
    }

    await supabaseClient
      .from('user_subscriptions')
      .update({ status: 'CANCELED', canceled_at: new Date().toISOString() })
      .eq('id', subscriptionId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error in cancel-subscription:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
