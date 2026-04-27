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
  if (withCC.length === 13 && withCC[4] === '9') {
    return withCC.slice(0, 4) + withCC.slice(5);
  }
  return withCC;
}

function normalizePhoneWith9(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCC = digits.startsWith('55') ? digits : `55${digits}`;
  if (withCC.length === 13) return withCC;
  if (withCC.length === 12) {
    return withCC.slice(0, 4) + '9' + withCC.slice(4);
  }
  return withCC;
}

/** Check which phone format is actually registered on WhatsApp */
async function findWhatsAppNumber(
  phone12: string,
  phone13: string,
  instanceKey: string,
  token: string
): Promise<string | null> {
  // Try both formats in parallel
  const candidates = [phone13, phone12]; // prioritize with-9 first
  
  for (const candidate of candidates) {
    try {
      const url = `https://apinocode01.megaapi.com.br/rest/instance/isOnWhatsApp/${instanceKey}?jid=${candidate}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await res.json();
      const exists = result?.exists === true || result?.result === true || result?.isOnWhatsApp === true;
      console.log(`isOnWhatsApp ${candidate}: ${JSON.stringify(result).substring(0, 200)} → exists=${exists}`);
      if (exists) return candidate;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`isOnWhatsApp check failed for ${candidate}: ${msg}`);
    }
  }
  return null;
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
        JSON.stringify({ error: "WhatsApp service unavailable", delivery_status: "failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const phone12 = normalizePhone(phone);
    const phone13 = normalizePhoneWith9(phone);
    const instanceKey = "megacode-Mj46Nd4U5tP";
    const firstName = name.trim().split(' ')[0];

    console.log(`Processing lead ${leadId}: phone=${phone}, 12-digit=${phone12}, 13-digit=${phone13}`);

    // Step 1: Find which number format is on WhatsApp
    const verifiedNumber = await findWhatsAppNumber(phone12, phone13, instanceKey, MEGA_API_TOKEN);

    if (!verifiedNumber) {
      const errMsg = `Número não encontrado no WhatsApp (tentou ${phone12} e ${phone13})`;
      console.error(`Lead ${leadId}: ${errMsg}`);
      await updateLeadStatus(sb, leadId, "failed", errMsg, null);
      return new Response(
        JSON.stringify({ error: errMsg, delivery_status: "failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Lead ${leadId}: verified WhatsApp number is ${verifiedNumber}`);

    // Step 2: Try interactive list message
    const listResult = await trySendListMessage(verifiedNumber, firstName, leadId, instanceKey, MEGA_API_TOKEN);

    if (listResult.success) {
      console.log(`Interactive message sent to ${verifiedNumber} for lead ${leadId}. MsgId: ${listResult.messageId}`);
      await updateLeadStatus(sb, leadId, "sent_interactive", null, listResult.messageId ?? null);
      return new Response(
        JSON.stringify({ success: true, delivery_status: "sent_interactive", messageId: listResult.messageId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.warn(`Interactive failed for ${verifiedNumber}: ${listResult.error}. Trying text fallback...`);

    // Step 3: Fallback to plain text
    const textBody = `${firstName}, suas preferências foram recebidas.\n\nCentenas de profissionais em sua região serão notificados, e até 5 corretores que possuem as melhores opções para o seu perfil entrarão em contato.\n\nPrepare-se para o atendimento:\n\n1️⃣ Responda *SIM* para liberar seu perfil e ativar a busca.\n\n2️⃣ Fique atento: nos próximos dias, esses especialistas falarão diretamente com você.`;

    const textResult = await trySendTextMessage(verifiedNumber, textBody, instanceKey, MEGA_API_TOKEN);
    if (textResult.success) {
      console.log(`Fallback text sent to ${verifiedNumber} for lead ${leadId}. MsgId: ${textResult.messageId}`);
      await updateLeadStatus(sb, leadId, "sent_fallback_text", listResult.error ?? null, textResult.messageId ?? null);
      return new Response(
        JSON.stringify({ success: true, delivery_status: "sent_fallback_text", messageId: textResult.messageId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All failed
    const finalError = `Interactive: ${listResult.error} | Text: ${textResult.error}`;
    console.error(`All send attempts failed for lead ${leadId}, phone ${verifiedNumber}: ${finalError}`);
    await updateLeadStatus(sb, leadId, "failed", finalError, null);

    return new Response(
      JSON.stringify({ error: "Failed to send WhatsApp confirmation", delivery_status: "failed", detail: finalError }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message, delivery_status: "failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function trySendListMessage(
  phoneNumber: string,
  firstName: string,
  leadId: string,
  instanceKey: string,
  token: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const jid = `${phoneNumber}@s.whatsapp.net`;
  const megaUrl = `https://apinocode01.megaapi.com.br/rest/sendMessage/${instanceKey}/listMessage`;

  const megaBody = {
    messageData: {
      to: jid,
      title: "Conectae",
      text: `${firstName}, suas preferências foram recebidas.\n\nCentenas de profissionais em sua região serão notificados, e até 5 corretores que possuem as melhores opções para o seu perfil entrarão em contato.\n\nPrepare-se para o atendimento:\n\n1️⃣ Clique abaixo para liberar seu perfil e ativar a busca.\n\n2️⃣ Fique atento: nos próximos dias, esses especialistas falarão diretamente com você.`,
      buttonText: "LIBERAR MEU ACESSO",
      description: "Conectae - Conectando você ao corretor ideal",
      sections: [
        {
          title: "Confirmação",
          rows: [
            {
              rowId: `confirm_${leadId}`,
              title: "Liberar meu acesso",
              description: "Libero meu perfil e ativo a busca por corretores"
            }
          ]
        }
      ],
      listType: 0
    }
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(megaUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(megaBody),
      });

      const resText = await res.text();
      let resData: any;
      try { resData = JSON.parse(resText); } catch { resData = { raw: resText.substring(0, 500) }; }

      console.log(`List msg attempt ${attempt} to ${phoneNumber}: HTTP ${res.status}, body: ${JSON.stringify(resData).substring(0, 400)}`);

      if (res.ok && resData.error !== true && !resData.error) {
        const msgId = resData?.key?.id || resData?.messageData?.key?.id || resData?.id || resData?.messageId || null;
        return { success: true, messageId: msgId };
      }

      const errMsg = resData?.message || resData?.error || resText.substring(0, 300);
      if (res.status >= 500 && attempt === 0) {
        console.warn("Mega API 5xx on list, retrying in 2s...");
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      return { success: false, error: `HTTP ${res.status}: ${errMsg}` };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: `Fetch error: ${msg}` };
    }
  }
  return { success: false, error: "Max retries exceeded" };
}

async function trySendTextMessage(
  phoneNumber: string,
  text: string,
  instanceKey: string,
  token: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const jid = `${phoneNumber}@s.whatsapp.net`;
  const megaUrl = `https://apinocode01.megaapi.com.br/rest/sendMessage/${instanceKey}/text`;

  const megaBody = {
    messageData: {
      to: jid,
      text,
    }
  };

  try {
    const res = await fetch(megaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(megaBody),
    });

    const resText = await res.text();
    let resData: any;
    try { resData = JSON.parse(resText); } catch { resData = { raw: resText.substring(0, 500) }; }

    console.log(`Text msg to ${phoneNumber}: HTTP ${res.status}, body: ${JSON.stringify(resData).substring(0, 400)}`);

    if (res.ok && resData.error !== true && !resData.error) {
      const msgId = resData?.key?.id || resData?.messageData?.key?.id || resData?.id || resData?.messageId || null;
      return { success: true, messageId: msgId };
    }

    const errMsg = resData?.message || resData?.error || resText.substring(0, 300);
    return { success: false, error: `HTTP ${res.status}: ${errMsg}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Fetch error: ${msg}` };
  }
}

async function updateLeadStatus(
  sb: any,
  leadId: string,
  status: string,
  error: string | null,
  messageId: string | null
) {
  try {
    await sb.from("leads").update({
      confirmation_whatsapp_status: status,
      confirmation_whatsapp_error: error,
      confirmation_whatsapp_message_id: messageId,
      confirmation_whatsapp_sent_at: new Date().toISOString(),
    }).eq("id", leadId);
  } catch (e) {
    console.error(`Failed to update lead ${leadId} status:`, e);
  }
}
