import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Normaliza telefone brasileiro para comparação: DDD + 8 dígitos finais */
function phoneKey(raw: string): string {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 10) d = d.slice(2);
  if (d.length < 10) return d;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  return ddd + rest.slice(-8);
}

function parseStatus(raw: string): "KEEP" | "DEACTIVATE" | null {
  const s = String(raw || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim();
  if (!s) return null;
  if (s.includes("manter") || s.includes("ativo") || s === "keep" || s === "active" || s.includes("ainda")) {
    if (s.includes("desativ") || s.includes("inativ")) return "DEACTIVATE";
    return "KEEP";
  }
  if (s.includes("desativ") || s.includes("inativ") || s === "deactivate" || s === "inactive" || s.includes("nao")) {
    return "DEACTIVATE";
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const expected = Deno.env.get("LEAD_FEEDBACK_INBOUND_SECRET");
  const url = new URL(req.url);
  const provided = req.headers.get("x-webhook-token") || url.searchParams.get("token");
  if (!expected || provided !== expected) return json({ error: "unauthorized" }, 401);

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const pick = (...keys: string[]) => {
    for (const k of Object.keys(payload)) {
      if (keys.includes(k.toLowerCase().trim())) {
        const v = payload[k];
        if (v !== null && v !== undefined && String(v).trim() !== "") return String(v).trim();
      }
    }
    return "";
  };

  const nome = pick("nome", "name");
  const telefone = pick("telefone", "phone", "whatsapp");
  const statusRaw = pick("status", "acao", "ação", "action");

  if (!telefone) return json({ error: "telefone_obrigatorio" }, 400);
  const status = parseStatus(statusRaw);
  if (!status) return json({ error: "status_invalido", received: statusRaw }, 400);

  const key = phoneKey(telefone);
  if (key.length < 10) return json({ error: "telefone_invalido" }, 400);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const last8 = key.slice(-8);
  const { data: candidates, error } = await sb
    .from("leads")
    .select("id, name, phone, is_active")
    .ilike("phone", `%${last8}%`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return json({ error: error.message }, 500);

  const matches = (candidates || []).filter((l) => phoneKey(l.phone || "") === key);
  if (matches.length === 0) {
    console.log(`lead-feedback-callback: lead não encontrado telefone=${last8}`);
    return json({ ok: false, matched: 0, message: "lead não encontrado" }, 404);
  }

  const nowIso = new Date().toISOString();
  const ids = matches.map((m) => m.id);

  const { error: updErr } = await sb
    .from("leads")
    .update({
      is_active: status === "KEEP",
      feedback_response: status === "KEEP" ? "STILL_SEARCHING" : "NOT_SEARCHING",
      feedback_responded_at: nowIso,
      updated_at: nowIso,
    })
    .in("id", ids);

  if (updErr) return json({ error: updErr.message }, 500);

  console.log(`lead-feedback-callback: ${status} aplicado em ${ids.length} lead(s) nome=${nome} tel=${last8}`);

  return json({
    ok: true,
    status,
    matched: ids.length,
    lead_ids: ids,
    is_active: status === "KEEP",
  });
});
