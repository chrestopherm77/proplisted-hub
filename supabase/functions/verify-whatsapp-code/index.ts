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

function formatPhoneForApi(phone: string): string {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('55') && cleanPhone.length > 11) {
    cleanPhone = cleanPhone.substring(2);
  }
  if (cleanPhone.length === 11 && cleanPhone[2] === '9') {
    cleanPhone = cleanPhone.substring(0, 2) + cleanPhone.substring(3);
  }
  return cleanPhone;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'Telefone e código são obrigatórios'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const cleanPhone = formatPhoneForApi(phone);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase
      .from('whatsapp_verification_codes')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({
        valid: false,
        error: 'Código inválido ou expirado. Solicite um novo código.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { error: updateError } = await supabase
      .from('whatsapp_verification_codes')
      .update({ verified: true })
      .eq('id', data.id);

    if (updateError) {
      console.error('Error updating verification status:', updateError);
    }

    console.log('WhatsApp code verified successfully');

    return new Response(JSON.stringify({ valid: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in verify-whatsapp-code:', error);
    return new Response(JSON.stringify({
      valid: false,
      error: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
