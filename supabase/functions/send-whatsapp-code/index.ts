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

const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_ATTEMPTS = 3;

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
    const { phone } = await req.json();

    if (!phone || typeof phone !== 'string' || phone.length > 20) {
      return new Response(JSON.stringify({ error: 'Número de telefone é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('55') && cleanPhone.length > 11) {
      cleanPhone = cleanPhone.substring(2);
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return new Response(JSON.stringify({ error: 'Número de telefone inválido. Verifique o DDD e número.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const formattedPhone = formatPhoneForApi(cleanPhone);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const rateLimitCutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const { count: recentAttempts, error: countError } = await supabase
      .from('whatsapp_verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', formattedPhone)
      .gte('created_at', rateLimitCutoff);

    if (countError) {
      console.error('Error checking rate limit:', countError);
    }

    if (recentAttempts !== null && recentAttempts >= RATE_LIMIT_MAX_ATTEMPTS) {
      return new Response(JSON.stringify({
        error: 'Muitas tentativas. Aguarde 1 minuto antes de solicitar um novo código.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const whatsappNumber = `55${formattedPhone}@s.whatsapp.net`;
    const phoneToStore = formattedPhone;

    console.log(`Sending verification code to WhatsApp`);

    const megaApiToken = Deno.env.get('MEGA_API_TOKEN');
    if (!megaApiToken) {
      console.error('MEGA_API_TOKEN not configured');
      return new Response(JSON.stringify({ error: 'Serviço de WhatsApp não configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const messageText = `🔐 *Conectae - Código de Verificação*\n\nSeu código é: *${code}*\n\nEste código expira em 5 minutos.`;

    const megaResponse = await fetch(
      'https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${megaApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageData: {
            to: whatsappNumber,
            text: messageText
          }
        })
      }
    );

    if (!megaResponse.ok) {
      const errorData = await megaResponse.text();
      console.error('Mega API error:', errorData);
      return new Response(JSON.stringify({
        error: 'Não foi possível enviar o código. Verifique se o número está correto e tem WhatsApp ativo.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('WhatsApp message sent successfully');

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: dbError } = await supabase
      .from('whatsapp_verification_codes')
      .insert({
        phone: phoneToStore,
        code,
        expires_at: expiresAt
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-whatsapp-code:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
