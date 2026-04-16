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

function normalizePhoneWith9(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCC = digits.startsWith('55') ? digits : `55${digits}`;
  // If already 13 digits, keep as is
  if (withCC.length === 13) return withCC;
  // If 12 digits, add the 9 back
  if (withCC.length === 12) {
    return withCC.slice(0, 4) + '9' + withCC.slice(4);
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
        JSON.stringify({ error: "WhatsApp service unavailable", delivery_status: "failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Init supabase for status tracking
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const normalized = normalizePhone(phone);
    const normalizedWith9 = normalizePhoneWith9(phone);
    const instanceKey = "megacode-Mj46Nd4U5tP";
    const firstName = name.trim().split(' ')[0];

    const textBody = `${firstName}, suas preferências foram recebidas.\n\nCentenas de profissionais em sua região serão notificados, e até 5 corretores que possuem as melhores opções para o seu perfil entrarão em contato.\n\nPrepare-se para o atendimento:\n\n1️⃣ Responda *SIM* para liberar seu perfil e ativar a busca.\n\n2️⃣ Fique atento: nos próximos dias, esses especialistas falarão diretamente com você.`;

    // Try sending interactive list message
    const listResult = await trySendListMessage(normalized, firstName, leadId, instanceKey, MEGA_API_TOKEN);
    
    if (listResult.success) {
      console.log(`Interactive message sent to ${normalized} for lead ${leadId}. MsgId: ${listResult.messageId}`);
      await updateLeadStatus(sb, leadId, "sent_interactive", null, listResult.messageId);
      return new Response(
        JSON.stringify({ success: true, delivery_status: "sent_interactive", messageId: listResult.messageId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.warn(`Interactive message failed for ${normalized}: ${listResult.error}. Trying with 9-digit format...`);

    // Retry interactive with 9-digit number if different
    if (normalizedWith9 !== normalized) {
      const listResult2 = await trySendListMessage(normalizedWith9, firstName, leadId, instanceKey, MEGA_API_TOKEN);
      if (listResult2.success) {
        console.log(`Interactive message sent to ${normalizedWith9} (with 9) for lead ${leadId}. MsgId: ${listResult2.messageId}`);
        await updateLeadStatus(sb, leadId, "sent_interactive", null, listResult2.messageId);
        return new Response(
          JSON.stringify({ success: true, delivery_status: "sent_interactive", messageId: listResult2.messageId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.warn(`Interactive with 9-digit also failed for ${normalizedWith9}: ${listResult2.error}. Trying text fallback...`);
    }

    // Fallback: send plain text message
    const textResult = await trySendTextMessage(normalized, textBody, instanceKey, MEGA_API_TOKEN);
    if (textResult.success) {
      console.log(`Fallback text message sent to ${normalized} for lead ${leadId}. MsgId: ${textResult.messageId}`);
      await updateLeadStatus(sb, leadId, "sent_fallback_text", listResult.error, textResult.messageId);
      return new Response(
        JSON.stringify({ success: true, delivery_status: "sent_fallback_text", messageId: textResult.messageId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try text fallback with 9-digit
    if (normalizedWith9 !== normalized) {
      const textResult2 = await trySendTextMessage(normalizedWith9, textBody, instanceKey, MEGA_API_TOKEN);
      if (textResult2.success) {
        console.log(`Fallback text sent to ${normalizedWith9} (with 9) for lead ${leadId}. MsgId: ${textResult2.messageId}`);
        await updateLeadStatus(sb, leadId, "sent_fallback_text", listResult.error, textResult2.messageId);
        return new Response(
          JSON.stringify({ success: true, delivery_status: "sent_fallback_text", messageId: textResult2.messageId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // All attempts failed
    const finalError = `Interactive: ${listResult.error} | Text: ${textResult.error}`;
    console.error(`All send attempts failed for lead ${leadId}, phone ${normalized}: ${finalError}`);
    await updateLeadStatus(sb, leadId, "failed", finalError, null);

    return new Response(
      JSON.stringify({ error: "Failed to send WhatsApp confirmation", delivery_status: "failed", detail: finalError }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message, delivery_status: "failed" }),
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
      title: "LeadBay",
      text: `${firstName}, suas preferências foram recebidas.\n\nCentenas de profissionais em sua região serão notificados, e até 5 corretores que possuem as melhores opções para o seu perfil entrarão em contato.\n\nPrepare-se para o atendimento:\n\n1️⃣ Clique abaixo para liberar seu perfil e ativar a busca.\n\n2️⃣ Fique atento: nos próximos dias, esses especialistas falarão diretamente com você.`,
      buttonText: "LIBERAR MEU ACESSO",
      description: "LeadBay - Conectando você ao corretor ideal",
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
        const msgId = resData?.key?.id || resData?.id || resData?.messageId || null;
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
      return { success: false, error: `Fetch error: ${e.message}` };
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
      const msgId = resData?.key?.id || resData?.id || resData?.messageId || null;
      return { success: true, messageId: msgId };
    }

    const errMsg = resData?.message || resData?.error || resText.substring(0, 300);
    return { success: false, error: `HTTP ${res.status}: ${errMsg}` };
  } catch (e) {
    return { success: false, error: `Fetch error: ${e.message}` };
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
