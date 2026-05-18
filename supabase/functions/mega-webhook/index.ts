import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Webhook from Mega API - accepts any origin (external service callback)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Mega webhook received:", JSON.stringify(payload).substring(0, 500));

    const messageType = payload?.messageType;

    if (messageType !== "listResponseMessage") {
      return new Response(
        JSON.stringify({ ok: true, ignored: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const selectedRowId =
      payload?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      payload?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      payload?.singleSelectReply?.selectedRowId ||
      null;

    console.log("Selected row ID:", selectedRowId);

    if (!selectedRowId || !selectedRowId.startsWith("confirm_")) {
      return new Response(
        JSON.stringify({ ok: true, ignored: true, reason: "Not a confirmation response" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const leadId = selectedRowId.replace("confirm_", "");

    if (!leadId || leadId.length < 10) {
      console.error("Invalid leadId extracted:", leadId);
      return new Response(
        JSON.stringify({ error: "Invalid lead ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Activate the lead
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        is_active: true,
        whatsapp_confirmed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (updateError) {
      console.error("Error activating lead:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Lead ${leadId} confirmed via WhatsApp and activated`);

    // Notify professionals about the new lead (fire-and-forget)
    try {
      const { data: lead } = await supabase
        .from("leads")
        .select("id, description, form_data")
        .eq("id", leadId)
        .single();

      if (lead && lead.form_data) {
        const formData = lead.form_data as Record<string, unknown>;
        const intention = formData.intention as string | undefined;
        const city =
          (formData.sell as Record<string, unknown>)?.city ||
          (formData.buy as Record<string, unknown>)?.city ||
          (formData.build as Record<string, unknown>)?.city ||
          (formData.rent as Record<string, unknown>)?.city;
        const uf =
          (formData.sell as Record<string, unknown>)?.uf ||
          (formData.buy as Record<string, unknown>)?.uf ||
          (formData.build as Record<string, unknown>)?.uf ||
          (formData.rent as Record<string, unknown>)?.uf;

        if (city) {
          const notifyUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-new-lead`;
          await fetch(notifyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              leadId,
              city,
              uf,
              intention,
              description: lead.description,
              formData,
            }),
          });
          console.log(`Notify-new-lead sent for lead ${leadId}`);
        }
      }
    } catch (notifyErr) {
      console.error("Failed to send notify-new-lead (non-blocking):", notifyErr);
    }

    // Notify property owners whose listings match the lead (fire-and-forget)
    try {
      const { data: leadForMatch } = await supabase
        .from("leads")
        .select("form_data")
        .eq("id", leadId)
        .single();

      if (leadForMatch?.form_data) {
        const fd = leadForMatch.form_data as Record<string, unknown>;
        const intentionRaw = (fd.intention as string) || "";
        const flowKey = intentionRaw.toLowerCase();
        const flowRaw = fd[flowKey];
        const flow = (Array.isArray(flowRaw) ? flowRaw[0] : flowRaw) as Record<string, unknown> | undefined;
        const matchCity = flow?.city as string | undefined;
        const matchUf = flow?.uf as string | undefined;

        if (matchCity && (intentionRaw === "BUY" || intentionRaw === "RENT")) {
          const matchUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-property-match`;
          await fetch(matchUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              leadId,
              city: matchCity,
              uf: matchUf,
              intention: intentionRaw,
              formData: fd,
            }),
          });
          console.log(`notify-property-match sent for lead ${leadId}`);
        }
      }
    } catch (matchErr) {
      console.error("Failed to send notify-property-match (non-blocking):", matchErr);
    }

    // Send group WhatsApp notification (fire-and-forget)
    try {
      const { data: leadForGroup } = await supabase
        .from("leads")
        .select("form_data")
        .eq("id", leadId)
        .single();

      if (leadForGroup?.form_data) {
        const fd = leadForGroup.form_data as Record<string, unknown>;
        const intentionRaw = (fd.intention as string) || "";
        const intentionMap: Record<string, string> = {
          BUY: "Comprar", SELL: "Vender", RENT: "Alugar", BUILD: "Construir",
        };
        const intentionLabel = intentionMap[intentionRaw] || intentionRaw;

        const flowKey = intentionRaw === "BUY" ? "buy" : intentionRaw === "SELL" ? "sell" : intentionRaw === "RENT" ? "rent" : intentionRaw === "BUILD" ? "build" : null;
        const flowRawGroup = flowKey ? fd[flowKey.toLowerCase()] : null;
        const flow = (Array.isArray(flowRawGroup) ? flowRawGroup[0] : flowRawGroup) as Record<string, unknown> | undefined | null;

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

        // City / UF
        const city = flow?.city as string | undefined;
        const uf = flow?.uf as string | undefined;
        if (city) lines.push(uf ? `${city} - ${uf}` : city);

        // Property type / subtype
        const propType = flow?.propertyType as string | undefined;
        const subTypeRaw = (flow?.residentialType || flow?.commercialType || flow?.mixedType || flow?.ruralType) as string | undefined;
        const subType = subTypeRaw ? (subTypeLabels[subTypeRaw] || subTypeRaw) : undefined;
        if (propType) lines.push(subType ? `${propLabels[propType] || propType} - ${subType}` : (propLabels[propType] || propType));

        // Bedrooms
        const bedrooms = flow?.bedrooms as string | undefined;
        if (bedrooms) lines.push(`${bedrooms} quarto(s)`);

        // Purpose
        const purpose = flow?.purpose as string | undefined;
        if (purpose) lines.push(purposeLabels[purpose] || purpose);

        // Value
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

        const MEGA_API_TOKEN = Deno.env.get("MEGA_API_TOKEN");
        // Roteamento por cidade
        const { data: groupsData, error: groupsErr } = await supabase
          .rpc("get_groups_for_city", { p_city: (flow?.city as string) || "", p_uf: (flow?.uf as string) || "" });
        if (groupsErr) console.error(`[lead ${leadId}] get_groups_for_city error:`, groupsErr);
        const WHATSAPP_GROUP_IDS: string[] = (groupsData as string[] | null) || [];

        if (MEGA_API_TOKEN && WHATSAPP_GROUP_IDS.length > 0) {
          const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text";

          for (const groupId of WHATSAPP_GROUP_IDS) {
            const megaBody = { messageData: { to: groupId, text: groupMsg } };
            let groupSent = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                const groupRes = await fetch(megaUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${MEGA_API_TOKEN}` },
                  body: JSON.stringify(megaBody),
                });
                const groupBody = await groupRes.text();
                console.log(`Group [${groupId}] attempt ${attempt} for lead ${leadId}: ${groupRes.status} - ${groupBody.substring(0, 300)}`);

                let parsed: { error?: boolean } = {};
                try { parsed = JSON.parse(groupBody); } catch { /* non-json */ }

                if (groupRes.ok && !parsed.error) {
                  groupSent = true;
                  console.log(`Group [${groupId}] notification sent for lead ${leadId}`);
                  break;
                }
                if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
              } catch (fetchErr) {
                console.error(`Group [${groupId}] fetch error attempt ${attempt}:`, fetchErr);
                if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
              }
            }
            if (!groupSent) {
              console.error(`Group [${groupId}] notification FAILED for lead ${leadId} after 3 attempts`);
            }
            // delay between groups
            await new Promise((r) => setTimeout(r, 700));
          }
        } else if (WHATSAPP_GROUP_IDS.length === 0) {
          console.log(`[lead ${leadId}] Cidade "${flow?.city}/${flow?.uf}" sem grupo mapeado — disparo ignorado`);
        }
      }
    } catch (groupErr) {
      console.error("Failed to send group notification (non-blocking):", groupErr);
    }

    // Match lead_alerts and send WhatsApp notifications (fire-and-forget)
    try {
      const { data: leadForAlerts } = await supabase
        .from("leads")
        .select("form_data")
        .eq("id", leadId)
        .single();

      if (leadForAlerts?.form_data) {
        const fd = leadForAlerts.form_data as Record<string, unknown>;
        const intentionRaw = (fd.intention as string) || "";
        const flowKey = intentionRaw.toLowerCase();
        const flowRawAlert = fd[flowKey];
        const flow = (Array.isArray(flowRawAlert) ? flowRawAlert[0] : flowRawAlert) as Record<string, unknown> | undefined;
        const leadCity = (flow?.city as string || "").trim();
        const leadUF = (flow?.uf as string || "").trim().toUpperCase();

        if (leadCity && leadUF) {
          const { data: matchingAlerts } = await supabase
            .from("lead_alerts")
            .select("id, user_id, filters")
            .eq("is_active", true);

          if (matchingAlerts && matchingAlerts.length > 0) {
            const matched = matchingAlerts.filter((alert) => {
              const f = alert.filters as Record<string, string>;
              if (f.state?.toUpperCase() !== leadUF) return false;
              if (f.city?.trim().toLowerCase() !== leadCity.toLowerCase()) return false;
              if (f.objective && f.objective !== intentionRaw) return false;
              return true;
            });

            if (matched.length > 0) {
              const userIds = [...new Set(matched.map((a) => a.user_id))];
              const { data: profiles } = await supabase
                .from("profiles")
                .select("id, phone, name")
                .in("id", userIds);

              const MEGA_API_TOKEN = Deno.env.get("MEGA_API_TOKEN");
              if (MEGA_API_TOKEN && profiles) {
                const intentionMap: Record<string, string> = {
                  BUY: "Comprar", SELL: "Vender", RENT: "Alugar", BUILD: "Construir",
                };
                const intentionLabel = intentionMap[intentionRaw] || intentionRaw;

                for (const profile of profiles) {
                  if (!profile.phone) continue;
                  const phone = profile.phone.replace(/\D/g, "");
                  if (phone.length < 10) continue;

                  const msg = `Olá ${profile.name?.split(" ")[0] || ""}! 🚀\n\n` +
                    `Um novo lead de *${intentionLabel}* em *${leadCity} - ${leadUF}* acabou de ser cadastrado e combina com seu alerta!\n\n` +
                    `Acesse agora para garantir antes de outros:\n👉 https://www.conectaeimob.com.br/leads\n\n` +
                    `Seja rápido! 💨`;

                  const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text";
                  await fetch(megaUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${MEGA_API_TOKEN}` },
                    body: JSON.stringify({ messageData: { to: `${phone}@s.whatsapp.net`, text: msg } }),
                  });
                  // 600ms delay between messages
                  await new Promise((r) => setTimeout(r, 600));
                }
                console.log(`Sent alert notifications to ${profiles.length} users for lead ${leadId}`);
              }
            }
          }
        }
      }
    } catch (alertErr) {
      console.error("Failed to process lead alerts (non-blocking):", alertErr);
    }

    return new Response(
      JSON.stringify({ ok: true, leadId, activated: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
