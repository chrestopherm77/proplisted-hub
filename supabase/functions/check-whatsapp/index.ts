import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  'https://leadbay.com.br',
  'https://www.leadbay.com.br',
  'https://proplisted-hub.lovable.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== 'string' || phone.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Telefone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const digits = phone.replace(/\D/g, '');

    let formatted: string;
    if (digits.length === 11) {
      const ddd = digits.substring(0, 2);
      const number = digits.substring(3);
      formatted = `55${ddd}${number}`;
    } else if (digits.length === 10) {
      formatted = `55${digits}`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Número de telefone inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const MEGA_API_TOKEN = Deno.env.get('MEGA_API_TOKEN');
    if (!MEGA_API_TOKEN) {
      console.error('MEGA_API_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Serviço de verificação indisponível' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const instanceKey = 'megacode-Mj46Nd4U5tP';
    const url = `https://apinocode01.megaapi.com.br/rest/instance/isOnWhatsApp/${instanceKey}?jid=${formatted}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MEGA_API_TOKEN}`,
      },
    });

    const result = await response.json();

    const exists = result?.exists === true || result?.result === true || result?.isOnWhatsApp === true;

    return new Response(
      JSON.stringify({ exists }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking WhatsApp:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao verificar WhatsApp' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
