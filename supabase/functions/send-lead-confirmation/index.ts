import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lp-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCC = digits.startsWith('55') ? digits : `55${digits}`;
  // 13 digits = 55 + DDD(2) + 9 + number(8) → remove the extra '9'
  if (withCC.length === 13 && withCC[4] === '9') {
    return withCC.slice(0, 4) + withCC.slice(5);
  }
  return withCC;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, phone, leadId } = await req.json();

    if (!name || !phone || !leadId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, phone, leadId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MEGA_API_TOKEN = Deno.env.get("MEGA_API_TOKEN");
    if (!MEGA_API_TOKEN) {
      console.error("MEGA_API_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "WhatsApp service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalized = normalizePhone(phone);
    const jid = `${normalized}@s.whatsapp.net`;

    const instanceKey = "megacode-Mj46Nd4U5tP";
    const megaUrl = `https://apinocode01.megaapi.com.br/rest/sendMessage/${instanceKey}/listMessage`;

    const firstName = name.trim().split(' ')[0];

    const megaBody = {
      messageData: {
        to: jid,
        title: "LeadBay",
        text: `Olá ${firstName}! 👋\n\nSomos da *LeadBay*, uma plataforma que conecta você com corretores especializados na sua região.\n\nConfirme abaixo que está buscando um imóvel para que um corretor qualificado entre em contato com você.`,
        buttonText: "Confirmar interesse",
        description: "LeadBay - Conectando você ao corretor ideal",
        sections: [
          {
            title: "Confirmação",
            rows: [
              {
                rowId: `confirm_${leadId}`,
                title: "Sim, estou buscando!",
                description: "Confirmo que estou buscando um imóvel e autorizo o contato de um corretor"
              }
            ]
          }
        ],
        listType: 0
      }
    };

    let lastError = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      const megaRes = await fetch(megaUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MEGA_API_TOKEN}`,
        },
        body: JSON.stringify(megaBody),
      });

      if (megaRes.ok) {
        console.log(`Confirmation list message sent to ${normalized} for lead ${leadId}`);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      lastError = await megaRes.text();
      console.error(`Mega API status: ${megaRes.status}, response: ${lastError.substring(0, 300)}`);

      if (megaRes.status >= 500 && attempt === 0) {
        console.warn("Mega API 5xx, retrying in 2s...");
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      break;
    }

    console.error("Mega API failed after retries:", lastError);
    return new Response(
      JSON.stringify({ error: "Failed to send WhatsApp confirmation" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
