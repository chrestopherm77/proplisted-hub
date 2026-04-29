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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { propertyId } = await req.json();
    if (!propertyId) {
      return new Response(JSON.stringify({ error: "propertyId obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prop, error: propError } = await supabase
      .from("properties")
      .select("id, reference_code, title, property_type, operation_type, city, state, neighborhood, zone, bedrooms, suites, bathrooms, parking_spots, area_useful, price_sale, price_rent, photos, user_id")
      .eq("id", propertyId)
      .single();

    if (propError || !prop) {
      return new Response(JSON.stringify({ error: "Imóvel não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "MASTER_ADMIN" });
    if (prop.user_id !== user.id && !isAdmin) {
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
      .rpc("get_groups_for_city", { p_city: prop.city || "", p_uf: prop.state || "" });
    if (groupsErr) console.error("get_groups_for_city error:", groupsErr);
    const WHATSAPP_GROUP_IDS: string[] = (groupsData as string[] | null) || [];

    if (WHATSAPP_GROUP_IDS.length === 0) {
      console.log(`Imóvel ${propertyId} - cidade "${prop.city}/${prop.state}" sem grupo mapeado — disparo ignorado`);
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_groups_for_city" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const propTypeLabels: Record<string, string> = {
      HOUSE: "Casa", APARTMENT: "Apartamento", CONDO: "Condomínio",
      STUDIO: "Studio", LOFT: "Loft", PENTHOUSE: "Cobertura",
      OFFICE: "Sala Comercial", STORE: "Loja", WAREHOUSE: "Galpão",
      BUILDING: "Prédio Comercial", FARM: "Fazenda", SITE: "Sítio",
      RANCH: "Chácara", LOT: "Lote", LAND: "Terreno", KITNET: "Kitnet/Studio",
    };
    const opLabels: Record<string, string> = { SALE: "Venda", RENT: "Aluguel", BOTH: "Venda/Aluguel" };

    const propLabel = prop.property_type ? (propTypeLabels[prop.property_type] || prop.property_type) : "Imóvel";
    const opLabel = prop.operation_type ? (opLabels[prop.operation_type] || prop.operation_type) : "";

    const fmtBRL = (n: number | null | undefined) => {
      if (!n) return null;
      return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    };

    const lines: string[] = [];
    lines.push(`*${propLabel}${opLabel ? " para " + opLabel : ""}*`);
    lines.push(`*Local:* ${[prop.neighborhood, prop.zone, prop.city, prop.state].filter(Boolean).join(" - ")}`);

    const specs: string[] = [];
    if (prop.bedrooms) specs.push(`${prop.bedrooms} quarto(s)${prop.suites ? ` (${prop.suites} suíte)` : ""}`);
    if (prop.bathrooms) specs.push(`${prop.bathrooms} banh.`);
    if (prop.parking_spots) specs.push(`${prop.parking_spots} vaga(s)`);
    if (prop.area_useful) specs.push(`${prop.area_useful}m²`);
    if (specs.length > 0) lines.push(`*Características:* ${specs.join(" • ")}`);

    if (prop.price_sale) lines.push(`*Venda:* ${fmtBRL(Number(prop.price_sale))}`);
    if (prop.price_rent) lines.push(`*Aluguel:* ${fmtBRL(Number(prop.price_rent))}/mês`);

    let groupMsg = `*🏠 Novo Imóvel no Portal!*\n\n`;
    groupMsg += lines.join("\n");
    groupMsg += `\n\nVeja fotos, detalhes e contato do anunciante:\n\n`;
    groupMsg += `👉 https://www.conectaeimob.com.br/imovel/${prop.reference_code}`;

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
          console.log(`Property [${groupId}] attempt ${attempt} for ${propertyId}: ${res.status} - ${resBody.substring(0, 200)}`);
          let parsed: { error?: boolean } = {};
          try { parsed = JSON.parse(resBody); } catch { /* non-json */ }
          if (res.ok && !parsed.error) { success = true; break; }
          if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
        } catch (err) {
          console.error(`Property [${groupId}] fetch error attempt ${attempt}:`, err);
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
