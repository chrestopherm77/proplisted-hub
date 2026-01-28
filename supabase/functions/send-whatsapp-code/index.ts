import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit: max 3 attempts per phone per minute
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 3;

// Formata telefone brasileiro para formato da API (remove 9º dígito extra)
function formatPhoneForApi(phone: string): string {
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Remove código do país se presente
  if (cleanPhone.startsWith('55') && cleanPhone.length > 11) {
    cleanPhone = cleanPhone.substring(2);
  }
  
  // Se tem 11 dígitos (DDD + 9 + 8 dígitos), remove o 9
  // Padrão: DD9XXXXXXXX -> DDXXXXXXXX
  if (cleanPhone.length === 11 && cleanPhone[2] === '9') {
    cleanPhone = cleanPhone.substring(0, 2) + cleanPhone.substring(3);
  }
  
  return cleanPhone;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    
    if (!phone) {
      return new Response(JSON.stringify({ error: 'Número de telefone é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Clean and validate phone number
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Remove country code if present for validation
    if (cleanPhone.startsWith('55') && cleanPhone.length > 11) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    // Brazilian phone: 10-11 digits (with area code)
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return new Response(JSON.stringify({ error: 'Número de telefone inválido. Verifique o DDD e número.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Format phone for API (remove 9th digit if present)
    const formattedPhone = formatPhoneForApi(cleanPhone);
    
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limiting: Check recent attempts for this phone
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
      console.log(`Rate limit exceeded for phone: ${formattedPhone} (${recentAttempts} attempts)`);
      return new Response(JSON.stringify({ 
        error: 'Muitas tentativas. Aguarde 1 minuto antes de solicitar um novo código.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Format for WhatsApp with country code
    const whatsappNumber = `55${formattedPhone}@s.whatsapp.net`;

    // Store formatted phone for consistency
    const phoneToStore = formattedPhone;

    console.log(`Sending verification code to: ${whatsappNumber}`);

    // Send via Mega API
    const megaApiToken = Deno.env.get('MEGA_API_TOKEN');
    
    if (!megaApiToken) {
      console.error('MEGA_API_TOKEN not configured');
      return new Response(JSON.stringify({ error: 'Serviço de WhatsApp não configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const messageText = `🔐 *LeadBay - Código de Verificação*\n\nSeu código é: *${code}*\n\nEste código expira em 5 minutos.`;

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

    // Save code to database (expires in 5 minutes)
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
      // Still return success since the message was sent
    }

    console.log(`Verification code saved for phone: ${phoneToStore}`);

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
