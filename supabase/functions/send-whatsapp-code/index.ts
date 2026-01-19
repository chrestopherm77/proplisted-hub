import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const { phone } = await req.json();
    
    if (!phone) {
      return new Response(JSON.stringify({ error: 'Número de telefone é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Clean and validate phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Brazilian phone: 10-11 digits (with area code), or 12-13 digits (with country code 55)
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      return new Response(JSON.stringify({ error: 'Número de telefone inválido. Verifique o DDD e número.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Format for WhatsApp (ensure 55 country code prefix)
    let whatsappNumber: string;
    if (cleanPhone.startsWith('55')) {
      whatsappNumber = `${cleanPhone}@s.whatsapp.net`;
    } else {
      whatsappNumber = `55${cleanPhone}@s.whatsapp.net`;
    }

    // Store phone without country code for consistency
    const phoneToStore = cleanPhone.startsWith('55') ? cleanPhone.substring(2) : cleanPhone;

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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
