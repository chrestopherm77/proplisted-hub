import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BodySchema = z.object({
  state: z.string().optional(),
  city: z.string().min(1),
  operationType: z.string().min(1),
  propertyType: z.string().min(1),
  zone: z.string().optional(),
  neighborhood: z.string().optional(),
  valueMax: z.string().optional(),
});

const typeLabels: Record<string, string> = {
  CASA: 'Casa', APARTAMENTO: 'Apartamento', SALA_COMERCIAL: 'Sala Comercial',
  LOTE: 'Lote', RURAL: 'Rural', PREDIO_COMERCIAL: 'Prédio Comercial',
};

const opLabels: Record<string, string> = {
  VENDA: 'Venda', COMPRA: 'Compra', ALUGUEL: 'Aluguel',
};

async function sendMegaMessage(megaUrl: string, token: string, body: unknown, attempt: number): Promise<boolean> {
  try {
    const res = await fetch(megaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      console.log(`Mega API success (attempt ${attempt})`);
      return true;
    }
    const errText = await res.text();
    console.error(`Mega API error (attempt ${attempt}): ${res.status} - ${errText.substring(0, 300)}`);
    if (res.status >= 500 && attempt < 2) {
      await new Promise(r => setTimeout(r, 2000));
      return sendMegaMessage(megaUrl, token, body, attempt + 1);
    }
    return false;
  } catch (err) {
    console.error(`Mega API fetch error (attempt ${attempt}):`, err);
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 2000));
      return sendMegaMessage(megaUrl, token, body, attempt + 1);
    }
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { state, city, operationType, propertyType, zone, neighborhood, valueMax } = parsed.data;

    const MEGA_API_TOKEN = Deno.env.get("MEGA_API_TOKEN");
    if (!MEGA_API_TOKEN) {
      console.error("MEGA_API_TOKEN not configured");
      return new Response(JSON.stringify({ error: "MEGA_API_TOKEN not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeName = typeLabels[propertyType] ?? propertyType;
    const opName = opLabels[operationType] ?? operationType;

    let message = `*Nova Procura Cadastrada! 🚀*\n\n`;
    message += `*Estado:* ${state || 'Não informado'}\n`;
    message += `*Cidade:* ${city}\n`;
    message += `*Operação:* ${opName}\n`;
    message += `*Tipo:* ${typeName}\n`;
    message += `*Zona:* ${zone || 'Não informado'}\n`;
    message += `*Bairro/Condomínio:* ${neighborhood || 'Não informado'}\n`;
    message += `*Valor Máximo:* ${valueMax ? `R$ ${valueMax}` : 'Não informado'}\n`;
    message += `\nHá um parceiro aguardando por imóveis com este perfil. Clique abaixo para ver o contato e enviar oportunidades: https://www.leadbay.com.br/property-searches`;

    const WHATSAPP_GROUP_IDS = [
      "120363407964054463@g.us",
      "120363426047592689@g.us",
    ];
    const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text";

    console.log(`Sending group notification for new search in ${city} to ${WHATSAPP_GROUP_IDS.length} groups`);
    const results: Record<string, boolean> = {};
    for (const groupId of WHATSAPP_GROUP_IDS) {
      const megaBody = { messageData: { to: groupId, text: message } };
      const ok = await sendMegaMessage(megaUrl, MEGA_API_TOKEN, megaBody, 1);
      results[groupId] = ok;
      console.log(`Group ${groupId}: ${ok ? "OK" : "FAIL"}`);
      // small delay between groups
      await new Promise((r) => setTimeout(r, 600));
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
