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

/** DDD + 8 dígitos finais, para comparação */
function phoneKey(raw: string): string {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 10) d = d.slice(2);
  if (d.length < 10) return d;
  return d.slice(0, 2) + d.slice(2).slice(-8);
}

function parseAuthorized(raw: string): boolean | null {
  const s = String(raw || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim();
  if (!s) return null;
  if (["true", "1", "sim", "s", "yes", "autorizado", "autorizou", "liberado", "confirmado", "aceito"].includes(s)) return true;
  if (["false", "0", "nao", "n", "no", "negado", "recusado", "nao autorizado", "nao autorizou"].includes(s)) return false;
  if (s.startsWith("nao")) return false;
  if (s.includes("autoriz") || s.includes("liber") || s.includes("confirm")) return true;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const expected = Deno.env.get("LEAD_AUTH_INBOUND_SECRET");
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
  const leadIdIn = pick("lead_id", "leadid");
  const autorizadoRaw = pick("autorizado", "autorizou", "authorized", "status", "resposta", "resultado");

  const autorizado = parseAuthorized(autorizadoRaw);
  if (autorizado === null) return json({ error: "campo_autorizado_invalido", received: autorizadoRaw }, 400);
  if (!telefone && !leadIdIn) return json({ error: "telefone_ou_lead_id_obrigatorio" }, 400);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Localiza o lead
  let lead: { id: string; form_data: Record<string, unknown> | null; description?: string | null } | null = null;

  if (leadIdIn) {
    const { data } = await sb.from("leads").select("id, form_data, description").eq("id", leadIdIn).maybeSingle();
    lead = data as typeof lead;
  }

  if (!lead && telefone) {
    const key = phoneKey(telefone);
    const last8 = key.slice(-8);
    const dashed = `${last8.slice(0, 4)}-${last8.slice(4)}`;
    const { data: candidates } = await sb
      .from("leads")
      .select("id, phone, form_data, description, whatsapp_confirmed, created_at")
      .or(`phone.ilike.%${last8}%,phone.ilike.%${dashed}%`)
      .order("created_at", { ascending: false })
      .limit(50);
    const matches = (candidates || []).filter((l: any) => phoneKey(l.phone || "") === key);
    // Prioriza o lead ainda não confirmado mais recente
    lead = (matches.find((m: any) => !m.whatsapp_confirmed) || matches[0] || null) as typeof lead;
  }

  if (!lead) {
    console.log(`lead-authorization-callback: lead não encontrado (tel=${telefone}, id=${leadIdIn})`);
    return json({ ok: false, message: "lead não encontrado" }, 404);
  }

  if (!autorizado) {
    console.log(`lead-authorization-callback: lead ${lead.id} NÃO autorizado — permanece inativo`);
    await sb.from("leads").update({
      confirmation_whatsapp_status: "not_authorized",
      updated_at: new Date().toISOString(),
    }).eq("id", lead.id);
    return json({ ok: true, lead_id: lead.id, autorizado: false, is_active: false });
  }

  const leadId = lead.id;
  const nowIso = new Date().toISOString();

  const { error: updErr } = await sb.from("leads").update({
    is_active: true,
    whatsapp_confirmed: true,
    confirmation_whatsapp_status: "authorized",
    updated_at: nowIso,
  }).eq("id", leadId);

  if (updErr) return json({ error: updErr.message }, 500);

  console.log(`lead-authorization-callback: lead ${leadId} autorizado e ativado (nome=${nome})`);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const INTERNAL = Deno.env.get("INTERNAL_FUNCTION_SECRET") || "";

  const fd = (lead.form_data || {}) as Record<string, unknown>;
  const intentionRaw = String(fd.intention || "");
  const flowRaw = fd[intentionRaw.toLowerCase()];
  const flow = (Array.isArray(flowRaw) ? flowRaw[0] : flowRaw) as Record<string, unknown> | undefined;
  const city = flow?.city as string | undefined;
  const uf = flow?.uf as string | undefined;

  const callFn = async (fn: string, body: unknown) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_KEY}`,
          "x-internal-secret": INTERNAL,
        },
        body: JSON.stringify(body),
      });
      console.log(`${fn} → HTTP ${res.status}`);
    } catch (e) {
      console.error(`${fn} falhou (não bloqueante):`, e);
    }
  };

  // Alertas individuais
  if (city) {
    await callFn("notify-new-lead", {
      leadId, city, uf, intention: intentionRaw, description: lead.description, formData: fd,
    });
  }
  // Match com imóveis cadastrados
  if (city && (intentionRaw === "BUY" || intentionRaw === "RENT")) {
    await callFn("notify-property-match", { leadId, city, uf, intention: intentionRaw, formData: fd });
  }
  // Disparo nos grupos de WhatsApp
  await callFn("notify-lead-group", { leadId });

  return json({ ok: true, lead_id: leadId, autorizado: true, is_active: true });
});
