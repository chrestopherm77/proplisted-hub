import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** 55 + DDD + 8 dígitos (padrão do projeto) */
function normalizePhone(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  const withCC = digits.startsWith("55") ? digits : `55${digits}`;
  if (withCC.length === 13 && withCC[4] === "9") {
    return withCC.slice(0, 4) + withCC.slice(5);
  }
  return withCC;
}

const INTENTION_LABELS: Record<string, string> = {
  BUY: "Comprar",
  SELL: "Vender",
  RENT: "Alugar",
  BUILD: "Construir",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Auth: internal secret, admin secret ou JWT de admin
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  const adminSecret = Deno.env.get("ADMIN_DISPATCH_SECRET");
  const providedInternal = req.headers.get("x-internal-secret");
  const providedAdmin = req.headers.get("x-admin-secret");
  let authorized =
    (!!internalSecret && providedInternal === internalSecret) ||
    (!!adminSecret && providedAdmin === adminSecret);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (!authorized) {
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      try {
        const sbAuth = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } },
        );
        const { data: c } = await sbAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
        const uid = c?.claims?.sub;
        if (uid) {
          const { data: isAdmin } = await sb.rpc("has_role", { _user_id: uid, _role: "MASTER_ADMIN" });
          authorized = !!isAdmin;
        }
      } catch { /* noop */ }
    }
  }
  if (!authorized) return json({ error: "unauthorized" }, 401);

  const webhookUrl = Deno.env.get("LEAD_AUTH_WEBHOOK_URL");
  if (!webhookUrl) return json({ error: "LEAD_AUTH_WEBHOOK_URL não configurado" }, 500);

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  let name = String(payload.name || payload.nome || "").trim();
  let phone = String(payload.phone || payload.telefone || "").trim();
  let intentionRaw = String(payload.intention || payload.interesse || "").trim().toUpperCase();
  const leadId = payload.leadId ? String(payload.leadId) : null;

  // Completa dados a partir do lead, quando informado
  if (leadId) {
    const { data: lead } = await sb
      .from("leads")
      .select("id, name, phone, form_data")
      .eq("id", leadId)
      .maybeSingle();
    if (lead) {
      if (!name) name = String(lead.name || "").trim();
      if (!phone) phone = String(lead.phone || "").trim();
      if (!intentionRaw) {
        const fd = (lead.form_data || {}) as Record<string, unknown>;
        intentionRaw = String(fd.intention || "").toUpperCase();
      }
    }
  }

  if (!name || !phone) return json({ error: "nome e telefone são obrigatórios" }, 400);

  const interesse = INTENTION_LABELS[intentionRaw] || (intentionRaw ? intentionRaw : "Comprar");

  const body = {
    nome: name,
    telefone: normalizePhone(phone),
    interesse,
    lead_id: leadId,
    evento: "AUTORIZACAO_BUSCA",
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const outToken = Deno.env.get("LEAD_AUTH_WEBHOOK_TOKEN");
  if (outToken) headers["x-webhook-token"] = outToken;

  try {
    const res = await fetch(webhookUrl, { method: "POST", headers, body: JSON.stringify(body) });
    const text = await res.text();
    console.log(`send-lead-authorization → HTTP ${res.status} ${text.substring(0, 300)}`);

    if (leadId) {
      await sb.from("leads").update({
        confirmation_whatsapp_status: res.ok ? "webhook_sent" : "webhook_failed",
        confirmation_whatsapp_error: res.ok ? null : `HTTP ${res.status}: ${text.substring(0, 300)}`,
        confirmation_whatsapp_sent_at: new Date().toISOString(),
      }).eq("id", leadId);
    }

    return json({ ok: res.ok, status: res.status, sent: body, response: text.substring(0, 500) }, res.ok ? 200 : 502);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-lead-authorization error:", msg);
    return json({ error: msg }, 500);
  }
});
