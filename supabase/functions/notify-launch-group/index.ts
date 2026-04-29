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

    // Validate JWT (any authenticated user can trigger after creating a launch)
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { launchId } = await req.json();
    if (!launchId) {
      return new Response(JSON.stringify({ error: "launchId obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: launch, error: launchError } = await supabase
      .from("launches")
      .select("id, name, city, state, neighborhood, zone, property_type, price_from, price_max, size_m2_min, size_m2_max, banner_url, logo_url, status, user_id")
      .eq("id", launchId)
      .single();

    if (launchError || !launch) {
      return new Response(JSON.stringify({ error: "Lançamento não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apenas o dono do lançamento ou admin podem disparar
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "MASTER_ADMIN" });
    if (launch.user_id !== user.id && !isAdmin) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MEGA_API_TOKEN = Deno.env.get("MEGA_API_TOKEN");
    if (!MEGA_API_TOKEN) {
      return new Response(JSON.stringify({ error: "MEGA_API_TOKEN não configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Roteamento por cidade
    const { data: groupsData, error: groupsErr } = await supabase
      .rpc("get_groups_for_city", { p_city: launch.city || "", p_uf: launch.state || "" });
    if (groupsErr) console.error("get_groups_for_city error:", groupsErr);
    const WHATSAPP_GROUP_IDS: string[] = (groupsData as string[] | null) || [];

    if (WHATSAPP_GROUP_IDS.length === 0) {
      console.log(`Lançamento ${launchId} - cidade "${launch.city}/${launch.state}" sem grupo mapeado — disparo ignorado`);
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_groups_for_city" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propTypeLabels: Record<string, string> = {
      RESIDENTIAL: "Residencial", COMMERCIAL: "Comercial", MIXED: "Misto",
      APARTMENT: "Apartamento", HOUSE: "Casa", LOT: "Lote", LAND: "Terreno",
    };
    const propLabel = launch.property_type ? (propTypeLabels[launch.property_type] || launch.property_type) : null;

    const lines: string[] = [];
    lines.push(`*${launch.name}*`);
    if (propLabel) lines.push(`*Tipo:* ${propLabel}`);
    lines.push(`*Local:* ${[launch.neighborhood, launch.zone, launch.city, launch.state].filter(Boolean).join(" - ")}`);
    if (launch.size_m2_min || launch.size_m2_max) {
      const sz = [launch.size_m2_min, launch.size_m2_max].filter(Boolean).join(" a ");
      lines.push(`*Área:* ${sz} m²`);
    }
    if (launch.price_from) lines.push(`*A partir de:* R$ ${String(launch.price_from).replace(/^R\$\s*/i, "")}`);
    if (launch.status) lines.push(`*Status:* ${launch.status}`);

    let groupMsg = `*🏗️ Novo Lançamento na sua região!*\n\n`;
    groupMsg += lines.join("\n");
    groupMsg += `\n\nConfira detalhes, tabela e book completo no sistema:\n\n`;
    groupMsg += `👉 https://www.conectaeimob.com.br/launches`;

    const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text";
    const results: Array<{ groupId: string; success: boolean }> = [];

    for (const groupId of WHATSAPP_GROUP_IDS) {
      const megaBody = { messageData: { to: groupId, text: groupMsg } };
      let success = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(megaUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${MEGA_API_TOKEN}` },
            body: JSON.stringify(megaBody),
          });
          const resBody = await res.text();
          console.log(`Launch [${groupId}] attempt ${attempt} for ${launchId}: ${res.status} - ${resBody.substring(0, 200)}`);
          let parsed: { error?: boolean } = {};
          try { parsed = JSON.parse(resBody); } catch { /* non-json */ }
          if (res.ok && !parsed.error) { success = true; break; }
          if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
        } catch (err) {
          console.error(`Launch [${groupId}] fetch error attempt ${attempt}:`, err);
          if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
        }
      }
      results.push({ groupId, success });
      await new Promise((r) => setTimeout(r, 700));
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
