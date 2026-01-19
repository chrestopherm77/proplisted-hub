import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Format phone using same logic as send function
    const cleanPhone = formatPhoneForApi(phone);

    console.log(`Verifying code for phone: ${cleanPhone}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find valid, unexpired, unverified code
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
      console.log('Code verification failed:', error?.message || 'No matching code found');
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Código inválido ou expirado. Solicite um novo código.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Mark code as verified
    const { error: updateError } = await supabase
      .from('whatsapp_verification_codes')
      .update({ verified: true })
      .eq('id', data.id);

    if (updateError) {
      console.error('Error updating verification status:', updateError);
    }

    console.log(`Code verified successfully for phone: ${cleanPhone}`);

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
