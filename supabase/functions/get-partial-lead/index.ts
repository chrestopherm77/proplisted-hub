import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

function obfuscatePhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return '****';
  const ddd = digits.substring(0, 2);
  const last4 = digits.substring(digits.length - 4);
  return `(${ddd}) ****-${last4}`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();

    if (!session_id || typeof session_id !== 'string' || session_id.length > 100) {
      return new Response(JSON.stringify({ error: 'session_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase
      .from('lp_partial_leads')
      .select('form_data, current_step, step_index, name, phone, intention, completed')
      .eq('session_id', session_id)
      .eq('completed', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log('No partial lead found for session:', session_id);
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      found: true,
      form_data: data.form_data,
      current_step: data.current_step,
      step_index: data.step_index,
      name: data.name,
      phone: obfuscatePhone(data.phone),
      intention: data.intention,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-partial-lead:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
