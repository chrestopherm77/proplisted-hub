import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret, x-test-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BATCH_SIZE = 3; // lead_1, lead_2, lead_3 por webhook

const intentionMap: Record<string, string> = {
  BUY: "Comprar", SELL: "Vender", RENT: "Alugar", BUILD: "Construir",
};

const propLabels: Record<string, string> = {
  RESIDENTIAL: "Residencial", COMMERCIAL: "Comercial", MIXED: "Misto",
  RURAL: "Rural", LAND: "Terreno", HOUSE: "Casa", APARTMENT: "Apartamento",
  KITNET: "Kitnet/Studio", EVALUATING: "Avaliando opções",
  COMMERCIAL_BUILDING: "Prédio comercial", WAREHOUSE: "Galpão",
  OFFICE: "Sala comercial", STORE: "Loja", MULTIPLE: "Mais de uma opção",
};

type Lead = {
  id: string;
  created_at: string;
  form_data: Record<string, unknown> | null;
};

function leadMarketplaceId(id: string) {
  return `#${id.replace(/-/g, "").slice(0, 5).toUpperCase()}`;
}

function normalizePhone(raw: string) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("55")) d = d.slice(2);
  if (d.length === 11 && d[2] === "9") d = d.slice(0, 2) + d.slice(3);
  return "55" + d;
}

function buildLeadText(lead: Lead) {
  const fd = (lead.form_data || {}) as Record<string, unknown>;
  const intentionRaw = String(fd.intention || "");
  const interesse = intentionMap[intentionRaw] || intentionRaw || "Não informado";

  const flowRaw = fd[intentionRaw.toLowerCase()];
  const flow = (Array.isArray(flowRaw) ? flowRaw[0] : flowRaw) as Record<string, unknown> | undefined;

  const city = (flow?.city as string) || "";
  const uf = (flow?.uf as string) || "";
  const zone = (flow?.zone as string) || "";
  const neighborhood = (flow?.neighborhood as string) || "";
  const regiaoParts = [city && uf ? `${city} - ${uf}` : city || uf, zone, neighborhood].filter(Boolean);
  const regiao = regiaoParts.join(" / ") || "Não informado";

  const valueRaw = (flow?.expectedValue || flow?.budgetMax || flow?.maxRent || flow?.budget) as string | undefined;
  const valor = valueRaw ? `R$ ${String(valueRaw).replace(/^R\$\s*/i, "").trim()}` : "Não informado";

  const propTypeRaw = flow?.propertyType as string | undefined;
  const tipo = propTypeRaw ? (propLabels[propTypeRaw] || propTypeRaw) : "";

  return [
    `Lead ${leadMarketplaceId(lead.id)}`,
    `Interesse: ${interesse}${tipo ? ` (${tipo})` : ""}`,
    `Valor: ${valor}`,
    `Região: ${regiao}`,
  ].join(" - ");

}

type LeadFields = {
  id: string;
  texto: string;
  interesse: string;
  valor: string;
  regiao: string;
};

function buildLeadFields(lead: Lead): LeadFields {
  const texto = buildLeadText(lead);
  const id = leadMarketplaceId(lead.id);
  const interesseMatch = texto.match(/Interesse: (.+?) - Valor:/);
  const valorMatch = texto.match(/Valor: (.+?) - Região:/);
  const regiaoMatch = texto.match(/Região: (.+)$/);
  return {
    id,
    texto,
    interesse: interesseMatch ? interesseMatch[1].trim() : "",
    valor: valorMatch ? valorMatch[1].trim() : "",
    regiao: regiaoMatch ? regiaoMatch[1].trim() : "",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { cronSecret?: string; dryRun?: boolean; hours?: number; maxLeads?: number; webhookUrl?: string; testBroker?: { nome?: string; telefone?: string } } = {};
  try {
    if (req.method === "POST") {
      const txt = await req.text();
      if (txt) body = JSON.parse(txt);
    }
  } catch { /* empty */ }

  // Auth: CRON_SECRET, segredo administrativo ou JWT de admin
  const dailyCronSecret = Deno.env.get("DAILY_LEADS_CRON_SECRET");
  const cronSecret = Deno.env.get("CRON_SECRET");
  const adminSecret = Deno.env.get("LEAD_FEEDBACK_ADMIN_SECRET");
  const providedCron = req.headers.get("x-cron-secret") || body.cronSecret;
  const providedTest = req.headers.get("x-test-secret");
  let authorized = (!!dailyCronSecret && providedCron === dailyCronSecret)
    || (!!cronSecret && providedCron === cronSecret)
    || (!!adminSecret && providedTest === adminSecret);

  if (!authorized) {
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      try {
        const { data: c } = await sb.auth.getClaims(authHeader.replace("Bearer ", ""));
        const uid = c?.claims?.sub;
        if (uid) {
          const { data: isAdmin } = await sb.rpc("has_role", { _user_id: uid, _role: "MASTER_ADMIN" });
          authorized = !!isAdmin;
        }
      } catch { /* noop */ }
    }
  }

  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const webhookUrl = body.webhookUrl || Deno.env.get("DAILY_LEADS_WEBHOOK_URL") || "";
  const dryRun = body.dryRun === true || !webhookUrl;

  // Leads criados nas últimas N horas (padrão 24h = resumo do dia)
  const hours = Math.min(Math.max(Number(body.hours) || 24, 1), 8760);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await sb
    .from("leads")
    .select("id, created_at, form_data")
    .eq("is_active", true)
    .eq("whatsapp_confirmed", true)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let leads = (data || []) as Lead[];
  const maxLeads = Number(body.maxLeads) || 0;
  if (maxLeads > 0) leads = leads.slice(0, maxLeads);
  if (leads.length === 0) {
    return new Response(JSON.stringify({ sent: 0, leads: 0, message: "Nenhum lead novo hoje" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const batches: Lead[][] = [];
  for (let i = 0; i < leads.length; i += BATCH_SIZE) batches.push(leads.slice(i, i + BATCH_SIZE));

  // Destinatários: cada corretor recebe o resumo com seu nome e telefone
  type Broker = { nome: string; telefone: string };
  let brokers: Broker[] = [];
  if (body.testBroker?.telefone) {
    brokers = [{ nome: body.testBroker.nome || "Corretor", telefone: normalizePhone(body.testBroker.telefone) }];
  } else {
    const { data: profs } = await sb
      .from("profiles")
      .select("name, phone")
      .eq("is_active", true);
    const seen = new Set<string>();
    for (const p of (profs || []) as Array<{ name: string; phone: string }>) {
      const tel = normalizePhone(p.phone || "");
      if (tel.length < 12 || seen.has(tel)) continue;
      seen.add(tel);
      brokers.push({ nome: p.name || "Corretor", telefone: tel });
    }
  }

  const results: Array<{ batch: number; corretor: string; ok: boolean; status?: number; detail?: string; payload: Record<string, unknown> }> = [];

  for (const broker of brokers) {
    for (let i = 0; i < batches.length; i++) {
      const payload: Record<string, unknown> = {
        nome: broker.nome,
        telefone: broker.telefone,
        enviado_em: new Date().toISOString(),
        total_leads: batches[i].length,
      };
      batches[i].forEach((lead, idx) => {
        const fields = buildLeadFields(lead);
        const n = idx + 1;
        payload[`lead_${n}`] = fields.texto;
        payload[`lead_${n}_id`] = fields.id;
        payload[`lead_${n}_interesse`] = fields.interesse;
        payload[`lead_${n}_valor`] = fields.valor;
        payload[`lead_${n}_regiao`] = fields.regiao;
      });
      // garante os 3 campos sempre presentes
      for (let k = batches[i].length; k < BATCH_SIZE; k++) {
        const n = k + 1;
        payload[`lead_${n}`] = "";
        payload[`lead_${n}_id`] = "";
        payload[`lead_${n}_interesse`] = "";
        payload[`lead_${n}_valor`] = "";
        payload[`lead_${n}_regiao`] = "";
      }

      if (dryRun) {
        results.push({ batch: i + 1, corretor: broker.telefone, ok: true, detail: "dry-run (webhook não configurado)", payload });
        continue;
      }

      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const txt = await res.text();
        results.push({ batch: i + 1, corretor: broker.telefone, ok: res.ok, status: res.status, detail: txt.slice(0, 200), payload });
      } catch (e) {
        results.push({ batch: i + 1, corretor: broker.telefone, ok: false, detail: e instanceof Error ? e.message : String(e), payload });
      }

      await new Promise((r) => setTimeout(r, 700));
    }
  }


  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    await sb.from("admin_alerts").insert({
      type: "DAILY_LEADS_WEBHOOK_FAILED",
      severity: "WARNING",
      message: `Resumo diário de leads: ${failed.length}/${results.length} envio(s) falharam`,
      payload: { failed },
    });
  }

  return new Response(
    JSON.stringify({ dryRun, leads: leads.length, batches: results.length, results }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
