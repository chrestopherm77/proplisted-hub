import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate JWT and check admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "MASTER_ADMIN" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { leadId } = await req.json();
    if (!leadId) {
      return new Response(JSON.stringify({ error: "leadId obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, description, form_data")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: "Lead não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MEGA_API_TOKEN = Deno.env.get("MEGA_API_TOKEN");
    if (!MEGA_API_TOKEN) {
      return new Response(JSON.stringify({ error: "MEGA_API_TOKEN não configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build message from form_data (same format as mega-webhook)
    const fd = (lead.form_data || {}) as Record<string, unknown>;
    const intentionRaw = (fd.intention as string) || "";
    const intentionMap: Record<string, string> = {
      BUY: "Comprar", SELL: "Vender", RENT: "Alugar", BUILD: "Construir",
    };
    const intentionLabel = intentionMap[intentionRaw] || intentionRaw;

    const flowKey = intentionRaw.toLowerCase();
    const flow = fd[flowKey] as Record<string, unknown> | undefined;

    const lines: string[] = [];

    const city = flow?.city as string | undefined;
    const uf = flow?.uf as string | undefined;
    if (city) lines.push(uf ? `${city} - ${uf}` : city);

    const propType = flow?.propertyType as string | undefined;
    const propLabels: Record<string, string> = {
      RESIDENTIAL: "Residencial", COMMERCIAL: "Comercial", MIXED: "Misto", RURAL: "Rural", LAND: "Terreno",
    };
    const subType = (flow?.residentialType || flow?.commercialType || flow?.mixedType || flow?.ruralType) as string | undefined;
    if (propType) lines.push(subType ? `${propLabels[propType] || propType} - ${subType}` : (propLabels[propType] || propType));

    const bedrooms = flow?.bedrooms as string | undefined;
    if (bedrooms) lines.push(`${bedrooms} quarto(s)`);

    const purpose = flow?.purpose as string | undefined;
    const purposeLabels: Record<string, string> = {
      HOUSING: "Moradia", INVESTMENT: "Investimento", COMMERCIAL: "Comercial", TEMPORARY: "Temporário",
    };
    if (purpose) lines.push(purposeLabels[purpose] || purpose);

    const value = (flow?.expectedValue || flow?.budgetMax || flow?.maxRent || flow?.budget) as string | undefined;
    if (value) lines.push(`R$ ${value}`);

    const details = lines.join("\n");

    let groupMsg = `*🚀 Novo lead na sua região!*\n\n`;
    groupMsg += `*Interesse:* ${intentionLabel} um imóvel\n\n`;
    if (details) groupMsg += `${details}\n\n`;
    groupMsg += `Seja rápido! Leads recentes têm maior taxa de conversão.\n\n`;
    groupMsg += `Clique abaixo para entrar em contato agora:\n\n`;
    groupMsg += `👉 https://www.leadbay.com.br/leads`;

    const GROUP_ID = "120363410244397205@g.us";
    const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text";

    const res = await fetch(megaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${MEGA_API_TOKEN}` },
      body: JSON.stringify({ messageData: { to: GROUP_ID, text: groupMsg } }),
    });

    const resBody = await res.text();
    console.log(`Mega API response: ${res.status} - ${resBody.substring(0, 300)}`);

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Falha ao enviar para o grupo", details: resBody.substring(0, 200) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
