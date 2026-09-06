import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INTENTION_MAP: Record<string, string> = {
  comprar: "BUY",
  compra: "BUY",
  buy: "BUY",
  alugar: "RENT",
  aluguel: "RENT",
  rent: "RENT",
  vender: "SELL",
  venda: "SELL",
  sell: "SELL",
  construir: "BUILD",
  build: "BUILD",
};

const INTENTION_PT: Record<string, string> = {
  BUY: "Comprar",
  RENT: "Alugar",
  SELL: "Vender",
  BUILD: "Construir",
};

function normalizePhone(raw: string): string {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  if (d.length === 11 && d[2] === "9") d = d.slice(0, 2) + d.slice(3);
  if (d.length !== 10) return "";
  return "55" + d;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const expected = Deno.env.get("BRONZE_LEAD_INBOUND_SECRET");
  const expectedAlt = Deno.env.get("BRONZE_LEAD_TEST_SECRET");
  if (!expected && !expectedAlt) return json({ error: "BRONZE_LEAD_INBOUND_SECRET missing" }, 500);

  let body: Record<string, unknown> = {};
  try {
    const txt = await req.text();
    if (txt) body = JSON.parse(txt);
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const provided = req.headers.get("x-webhook-secret") ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "") ||
    String(body.secret ?? "");
  if (!(provided && (provided === expected || provided === expectedAlt))) return json({ error: "Unauthorized" }, 401);

  const name = String(body.nome ?? body.name ?? "").trim();
  const phone = normalizePhone(String(body.telefone ?? body.phone ?? ""));
  const rawIntention = String(body.interesse ?? body.intencao ?? body.intention ?? "").trim();
  const intention = INTENTION_MAP[rawIntention.toLowerCase()] ?? rawIntention.toUpperCase();

  if (name.length < 2) return json({ error: "Nome inválido" }, 400);
  if (!phone) return json({ error: "Telefone inválido" }, 400);
  if (!INTENTION_PT[intention]) return json({ error: "Interesse inválido (comprar, alugar, vender ou construir)" }, 400);

  const answers = (body.respostas ?? body.answers ?? {}) as Record<string, unknown>;
  const sessionId = body.session_id ? String(body.session_id) : null;
  const partialLeadId = body.partial_lead_id ? String(body.partial_lead_id) : null;

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Enriquece com o registro parcial, quando existir
  let partial: Record<string, unknown> | null = null;
  if (partialLeadId || sessionId) {
    const q = sb.from("lp_partial_leads").select("id, session_id, form_data, intention, name, phone").limit(1);
    const { data } = partialLeadId
      ? await q.eq("id", partialLeadId)
      : await q.eq("session_id", sessionId!);
    partial = (data && data[0]) || null;
  }

  // Evita duplicidade: mesmo telefone com lead ativo
  const { data: existing } = await sb
    .from("leads")
    .select("id")
    .eq("phone", phone)
    .eq("is_active", true)
    .limit(1);
  if (existing && existing.length > 0) {
    return json({ success: true, duplicate: true, lead_id: existing[0].id, message: "Já existe lead ativo com este telefone" });
  }

  const description = `Deseja ${INTENTION_PT[intention].toLowerCase()}`;

  const formData = {
    ...(partial?.form_data as Record<string, unknown> ?? {}),
    ...answers,
    origem: "RECUPERACAO_FORMULARIO",
    intention,
  };

  const { data: inserted, error } = await sb
    .from("leads")
    .insert({
      name,
      phone,
      description,
      price: 35,
      max_purchases: 3,
      is_active: true,
      whatsapp_confirmed: true,
      tier: "BRONZE",
      source_partial_lead_id: (partial?.id as string) ?? partialLeadId,
      form_data: formData,
    })
    .select("id")
    .single();

  if (error) return json({ error: error.message }, 500);

  if (partial?.id) {
    await sb.from("lp_partial_leads").update({ completed: true }).eq("id", partial.id as string);
  }

  // Disparo automático (fire-and-forget): alertas individuais, match de imóveis e grupos
  const leadId = inserted.id as string;
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const INTERNAL = Deno.env.get("INTERNAL_FUNCTION_SECRET") || SERVICE_KEY;

  const callFn = async (fn: string, payload: unknown) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_KEY}`,
          "x-internal-secret": INTERNAL,
        },
        body: JSON.stringify(payload),
      });
      console.log(`${fn} → HTTP ${res.status}`);
    } catch (e) {
      console.error(`${fn} falhou (não bloqueante):`, e);
    }
  };

  const flowRaw = formData[intention.toLowerCase()];
  const flow = (Array.isArray(flowRaw) ? flowRaw[0] : flowRaw) as Record<string, unknown> | undefined;
  const city = (flow?.city ?? formData.city) as string | undefined;
  const uf = (flow?.uf ?? formData.uf) as string | undefined;

  if (city) {
    await callFn("notify-new-lead", {
      leadId, city, uf, intention, description, formData,
    });
    if (intention === "BUY" || intention === "RENT") {
      await callFn("notify-property-match", { leadId, city, uf, intention, formData });
    }
  }
  await callFn("notify-lead-group", { leadId });

  return json({ success: true, lead_id: leadId, tier: "BRONZE", price: 35 });
});
