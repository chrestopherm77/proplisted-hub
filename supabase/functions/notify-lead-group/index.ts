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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const internalSecret = req.headers.get("x-internal-secret") || "";
    const expectedInternal = Deno.env.get("INTERNAL_FUNCTION_SECRET") || "";
    const isInternalCall = expectedInternal.length > 0 && internalSecret === expectedInternal;

    if (!isInternalCall) {
      const authHeader = req.headers.get("Authorization") || "";
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
    const flowRaw = fd[flowKey];
    // form_data[flowKey] pode ser objeto único OU array (quando o lead foi mesclado com múltiplas preferências)
    const flow = (Array.isArray(flowRaw) ? flowRaw[0] : flowRaw) as Record<string, unknown> | undefined;

    // PT-BR translation maps
    const propLabels: Record<string, string> = {
      RESIDENTIAL: "Residencial", COMMERCIAL: "Comercial", MIXED: "Misto",
      RURAL: "Rural", LAND: "Terreno",
      HOUSE: "Casa", APARTMENT: "Apartamento", KITNET: "Kitnet/Studio",
      EVALUATING: "Avaliando opções",
      COMMERCIAL_BUILDING: "Prédio comercial", WAREHOUSE: "Galpão",
      OFFICE: "Sala comercial", STORE: "Loja",
      MULTIPLE: "Aceito mais de uma opção",
    };
    const subTypeLabels: Record<string, string> = {
      HOUSE: "Casa", APARTMENT: "Apartamento", CONDO: "Condomínio",
      STUDIO: "Studio", LOFT: "Loft", PENTHOUSE: "Cobertura",
      OFFICE: "Sala Comercial", STORE: "Loja", WAREHOUSE: "Galpão",
      BUILDING: "Prédio Comercial", FARM: "Fazenda", SITE: "Sítio",
      RANCH: "Chácara", LOT: "Lote", LAND: "Terreno", KITNET: "Kitnet/Studio",
      EVALUATING: "Avaliando opções",
      COMMERCIAL_BUILDING: "Prédio comercial",
      MULTIPLE: "Aceito mais de uma opção",
    };
    const purposeLabels: Record<string, string> = {
      HOUSING: "Moradia", INVESTMENT: "Investimento",
      COMMERCIAL: "Uso Comercial", TEMPORARY: "Temporário",
      OWN_USE: "Uso Próprio", RENT_OUT: "Para alugar",
    };

    const lines: string[] = [];

    const city = flow?.city as string | undefined;
    const uf = flow?.uf as string | undefined;
    if (city) lines.push(uf ? `${city} - ${uf}` : city);

    const propType = flow?.propertyType as string | undefined;
    const subTypeRaw = (flow?.residentialType || flow?.commercialType || flow?.mixedType || flow?.ruralType) as string | undefined;
    const subType = subTypeRaw ? (subTypeLabels[subTypeRaw] || subTypeRaw) : undefined;
    if (propType) lines.push(subType ? `${propLabels[propType] || propType} - ${subType}` : (propLabels[propType] || propType));

    const bedrooms = flow?.bedrooms as string | undefined;
    if (bedrooms) lines.push(`${bedrooms} quarto(s)`);

    const purpose = flow?.purpose as string | undefined;
    if (purpose) lines.push(purposeLabels[purpose] || purpose);

    const value = (flow?.expectedValue || flow?.budgetMax || flow?.maxRent || flow?.budget) as string | undefined;
    if (value) {
      const cleanValue = String(value).replace(/^R\$\s*/i, "").trim();
      if (cleanValue) lines.push(`R$ ${cleanValue}`);
    }

    const details = lines.join("\n");

    let groupMsg = `*🚀 Novo lead na sua região!*\n\n`;
    groupMsg += `*Interesse:* ${intentionLabel} um imóvel\n\n`;
    if (details) groupMsg += `${details}\n\n`;
    groupMsg += `Seja rápido! Leads recentes têm maior taxa de conversão.\n\n`;
    groupMsg += `Clique abaixo para entrar em contato agora:\n\n`;
    groupMsg += `👉 https://www.conectaeimob.com.br/leads`;

    // Roteamento por cidade
    const { data: groupsData, error: groupsErr } = await supabase
      .rpc("get_groups_for_city", { p_city: city || "", p_uf: uf || "" });
    if (groupsErr) console.error("get_groups_for_city error:", groupsErr);
    const WHATSAPP_GROUP_IDS: string[] = (groupsData as string[] | null) || [];

    if (WHATSAPP_GROUP_IDS.length === 0) {
      console.log(`Cidade "${city}/${uf}" sem grupo mapeado — disparo ignorado para lead ${leadId}`);
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_groups_for_city" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text";

    const results: Array<{ groupId: string; success: boolean; details: string }> = [];

    for (const groupId of WHATSAPP_GROUP_IDS) {
      const megaBody = { messageData: { to: groupId, text: groupMsg } };
      let lastDetails = "";
      let success = false;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(megaUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${MEGA_API_TOKEN}` },
            body: JSON.stringify(megaBody),
          });
          const resBody = await res.text();
          console.log(`Mega API [${groupId}] attempt ${attempt}: ${res.status} - ${resBody.substring(0, 300)}`);
          lastDetails = resBody.substring(0, 300);

          let parsed: { error?: boolean } = {};
          try { parsed = JSON.parse(resBody); } catch { /* non-json body */ }

          if (res.ok && !parsed.error) {
            success = true;
            break;
          }
          if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
        } catch (fetchErr) {
          console.error(`Mega API [${groupId}] fetch error attempt ${attempt}:`, fetchErr);
          lastDetails = String(fetchErr);
          if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
        }
      }

      results.push({ groupId, success, details: lastDetails });
      // delay between groups to avoid rate limit
      await new Promise((r) => setTimeout(r, 700));
    }

    const anySuccess = results.some((r) => r.success);
    const failedGroups = results.filter((r) => !r.success);

    // Alerta ADM se qualquer grupo falhou (mesmo com sucesso parcial)
    if (failedGroups.length > 0) {
      try {
        await supabase.from("admin_alerts").insert({
          type: "LEAD_DISPATCH_FAILED",
          severity: anySuccess ? "WARNING" : "CRITICAL",
          message: anySuccess
            ? `Disparo parcial: ${failedGroups.length}/${results.length} grupo(s) falharam para o lead em ${city || "?"}/${uf || "?"}`
            : `Disparo TOTALMENTE FALHOU para o lead em ${city || "?"}/${uf || "?"} (MegaAPI instável)`,
          payload: {
            lead_id: leadId,
            city, uf,
            total_groups: results.length,
            failed_count: failedGroups.length,
            failed_groups: failedGroups.map((f) => ({ groupId: f.groupId, details: f.details.substring(0, 200) })),
          },
        });

        // E-mail para todos os admins via Resend
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (RESEND_API_KEY) {
          const { data: admins } = await supabase
            .from("user_roles")
            .select("user_id, profiles:profiles!inner(email, name)")
            .eq("role", "MASTER_ADMIN");
          const emails = (admins || [])
            .map((a: any) => a?.profiles?.email)
            .filter((e: any) => typeof e === "string" && e.includes("@"));
          if (emails.length > 0) {
            const html = `
              <h2>⚠️ Falha no disparo de lead nos grupos WhatsApp</h2>
              <p><b>Lead:</b> ${leadId}</p>
              <p><b>Cidade:</b> ${city || "?"} / ${uf || "?"}</p>
              <p><b>Grupos com falha:</b> ${failedGroups.length} de ${results.length}</p>
              <p><b>Status geral:</b> ${anySuccess ? "Parcial (alguns grupos receberam)" : "TOTAL — nenhum grupo recebeu"}</p>
              <pre style="background:#f4f4f4;padding:12px;font-size:12px;overflow:auto">${JSON.stringify(failedGroups, null, 2)}</pre>
              <p>Verifique a saúde da MegaAPI ou se os grupos ainda existem.</p>
            `;
            for (const to of emails) {
              try {
                await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
                  body: JSON.stringify({
                    from: "Conectaeimob <alertas@conectaeimob.com.br>",
                    to,
                    subject: `⚠️ Falha disparo lead ${city || ""}/${uf || ""}`,
                    html,
                  }),
                });
                await new Promise((r) => setTimeout(r, 650)); // Resend rate limit
              } catch (mailErr) {
                console.error("Falha ao enviar e-mail admin:", mailErr);
              }
            }
          }
        }
      } catch (alertErr) {
        console.error("Falha ao registrar alerta admin:", alertErr);
      }
    }

    if (!anySuccess) {
      return new Response(JSON.stringify({
        error: "Falha ao enviar para todos os grupos após 3 tentativas. A API do WhatsApp pode estar instável.",
        results,
      }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
