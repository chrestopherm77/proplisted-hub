import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const withCC = digits.startsWith('55') ? digits : `55${digits}`;

    let formatted: string;
    // 13 dígitos = 55 + DDD(2) + 9 + número(8) → remover o '9' extra
    if (withCC.length === 13 && withCC[4] === '9') {
      formatted = withCC.slice(0, 4) + withCC.slice(5);
    } else if (withCC.length === 12) {
      formatted = withCC;
    } else if (digits.length === 10) {
      formatted = `55${digits}`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Número de telefone inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const MEGA_API_TOKEN = Deno.env.get('MEGA_API_TOKEN');
    const MJJV_TOKEN = Deno.env.get('MEGA_API_TOKEN_MJJV');
    if (!MEGA_API_TOKEN && !MJJV_TOKEN) {
      console.error('Nenhum token MegaAPI configurado');
      return new Response(
        JSON.stringify({ error: 'Serviço de verificação indisponível' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const instances: Array<{ key: string; token: string }> = [];
    if (MJJV_TOKEN) instances.push({ key: 'megacode-MJjV24kQIXz', token: MJJV_TOKEN });
    if (MEGA_API_TOKEN) instances.push({ key: 'megacode-Mj46Nd4U5tP', token: MEGA_API_TOKEN });

    for (const inst of instances) {
      const url = `https://apinocode01.megaapi.com.br/rest/instance/isOnWhatsApp/${inst.key}?jid=${formatted}`;
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${inst.token}` },
        });
        const result = await response.json();
        console.log(`isOnWhatsApp[${inst.key}] ${formatted}: ${JSON.stringify(result).substring(0, 300)}`);

        // Instância desconectada / token inválido → tenta a próxima
        if (result?.error === true || response.status >= 400) continue;

        const exists = result?.exists === true || result?.result === true || result?.isOnWhatsApp === true;
        return new Response(
          JSON.stringify({ exists }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.error(`isOnWhatsApp fetch error [${inst.key}]:`, e);
      }
    }

    // Nenhuma instância disponível → não bloquear o usuário
    console.warn('Nenhuma instância MegaAPI disponível — liberando verificação (fail-open)');
    return new Response(
      JSON.stringify({ exists: true, unverified: true }),
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
