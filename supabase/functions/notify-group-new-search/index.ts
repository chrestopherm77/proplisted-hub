import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const errText = await res.text();
    let parsed: { error?: boolean } = {};
    try { parsed = JSON.parse(errText); } catch { /* non-json body */ }
    if (res.ok && !parsed.error) {
      console.log(`Mega API success (attempt ${attempt})`);
      return true;
    }
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

    const MEGA_API_TOKEN = (Deno.env.get("MEGA_API_TOKEN_MJJV") || Deno.env.get("MEGA_API_TOKEN"));
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
    message += `\nHá um parceiro aguardando por imóveis com este perfil. Clique abaixo para ver o contato e enviar oportunidades: https://www.conectaeimob.com.br/property-searches`;

    // Buscar grupos por cidade/UF (roteamento dinâmico)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: groupsData, error: groupsError } = await supabase
      .rpc("get_groups_for_city", { p_city: city, p_uf: state || "" });

    if (groupsError) {
      console.error("Error fetching groups:", groupsError);
    }
    const WHATSAPP_GROUP_IDS: string[] = (groupsData as string[] | null) || [];

    if (WHATSAPP_GROUP_IDS.length === 0) {
      console.log(`Cidade "${city}/${state}" sem grupo mapeado — disparo ignorado`);
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_groups_for_city" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-MJjV24kQIXz/text";

    console.log(`Sending group notification for new search in ${city}/${state} to ${WHATSAPP_GROUP_IDS.length} groups`);
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
