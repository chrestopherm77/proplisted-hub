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

    // Clean phone number (remove non-digits and country code if present)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('55') && cleanPhone.length > 11) {
      cleanPhone = cleanPhone.substring(2);
    }

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
