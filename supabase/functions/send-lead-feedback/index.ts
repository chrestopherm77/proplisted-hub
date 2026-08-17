import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_ATTEMPTS = 2;
const SEND_DELAY_MS = 700;

type Intention = "BUY" | "RENT" | "SELL" | "BUILD";

const LABELS: Record<Intention, { verb: string; done: string; pending: string }> = {
  BUY:   { verb: "comprar um imóvel",   done: "Não estou procurando mais", pending: "Estou procurando" },
  RENT:  { verb: "alugar um imóvel",    done: "Não estou procurando mais", pending: "Estou procurando" },
  SELL:  { verb: "vender um imóvel",    done: "Não estou procurando mais", pending: "Estou procurando" },
  BUILD: { verb: "iniciar uma obra",    done: "Não estou procurando mais", pending: "Estou procurando" },
};

function firstName(full: string | null | undefined): string {
  if (!full) return "olá";
  return full.trim().split(/\s+/)[0];
}

function getIntention(formData: Record<string, unknown> | null | undefined): Intention {
  const i = String(formData?.intention || "").toUpperCase();
  if (i === "BUY" || i === "RENT" || i === "SELL" || i === "BUILD") return i;
  return "BUY";
}

const INTEREST_PT: Record<Intention, string> = {
  BUY: "comprar",
  RENT: "alugar",
  SELL: "vender",
  BUILD: "construir",
};

/** Normaliza telefone: 55 + DDD + 8 dígitos */
function normalizePhone(raw: string): string {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("55")) d = d.slice(2);
  if (d.length >= 10) {
    const ddd = d.slice(0, 2);
    d = ddd + d.slice(2).slice(-8);
  }
  return "55" + d;
}

async function logEvent(e: {
  direction: "OUT" | "IN";
  name: string | null;
  phone: string;
  intention?: string | null;
  status?: string | null;
  ok: boolean;
  detail?: string | null;
  leadId?: string | null;
}) {
  try {
    const sbLog = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await sbLog.from("lead_feedback_events").insert({
      direction: e.direction,
      name: e.name,
      phone: e.phone,
      intention: e.intention ?? null,
      status: e.status ?? null,
      ok: e.ok,
      detail: e.detail ?? null,
      lead_id: e.leadId ?? null,
    });
  } catch (_err) { /* logging não pode quebrar o disparo */ }
}

async function sendWebhook(params: {

  leadId: string;
  name: string | null;
  phone: string;
  intention: Intention;
}): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const url = Deno.env.get("LEAD_FEEDBACK_WEBHOOK_URL");
  if (!url) return { ok: false, error: "LEAD_FEEDBACK_WEBHOOK_URL missing" };

  const payload = {
    nome: params.name || "",
    telefone: normalizePhone(params.phone),
    interesse: INTEREST_PT[params.intention],
    intencao: INTEREST_PT[params.intention],
    lead_id: params.leadId,
    enviado_em: new Date().toISOString(),
  };

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const outToken = Deno.env.get("LEAD_FEEDBACK_WEBHOOK_TOKEN");
    if (outToken) headers["Authorization"] = `Bearer ${outToken}`;

    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    const txt = await res.text();
    const result = res.ok
      ? { ok: true, messageId: txt.slice(0, 120) }
      : { ok: false, error: `HTTP ${res.status} ${txt.slice(0, 200)}` };
    await logEvent({
      direction: "OUT",
      name: params.name,
      phone: payload.telefone,
      intention: INTEREST_PT[params.intention],
      ok: result.ok,
      detail: result.ok ? "Webhook recebeu o disparo" : String((result as { error?: string }).error || ""),
      leadId: params.leadId !== "test" ? params.leadId : null,
    });
    return result;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEvent({
      direction: "OUT",
      name: params.name,
      phone: payload.telefone,
      intention: INTEREST_PT[params.intention],
      ok: false,
      detail: msg,
      leadId: params.leadId !== "test" ? params.leadId : null,
    });
    return { ok: false, error: msg };
  }
}



Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (!Deno.env.get("LEAD_FEEDBACK_WEBHOOK_URL")) {
    return new Response(
      JSON.stringify({ error: "LEAD_FEEDBACK_WEBHOOK_URL missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }


  let body: { leadId?: string; cronSecret?: string; testPhone?: string; testName?: string; testIntention?: Intention; limit?: number } = {};
  try {
    if (req.method === "POST") {
      const txt = await req.text();
      if (txt) body = JSON.parse(txt);
    }
  } catch { /* empty */ }

  const isCronMode = !body.leadId && !body.testPhone;

  // Cron mode requires CRON_SECRET. Single-lead mode requires INTERNAL_FUNCTION_SECRET or admin JWT.
  if (isCronMode) {
    const expected = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret") || body.cronSecret;
    if (!expected || provided !== expected) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } else {
    const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    const providedInternal = req.headers.get("x-internal-secret");
    const cronExpected = Deno.env.get("CRON_SECRET");
    const providedCron = req.headers.get("x-cron-secret") || body.cronSecret;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const testSecret = Deno.env.get("LEAD_FEEDBACK_TEST_SECRET");
    const providedTest = req.headers.get("x-test-secret");
    const bearer = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    let authorized = (!!internalSecret && providedInternal === internalSecret)
      || (!!cronExpected && providedCron === cronExpected)
      || (!!testSecret && providedTest === testSecret)
      || (!!serviceKey && bearer === serviceKey);

    if (!authorized) {
      const authHeader = req.headers.get("Authorization") || "";
      if (authHeader.startsWith("Bearer ")) {
        try {
          const sbAuth = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } }
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
    if (!authorized) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  // Test mode: envia a mensagem de feedback para um número avulso, sem tocar no banco
  if (body.testPhone) {
    const phone = String(body.testPhone).replace(/\D/g, "");
    if (phone.length < 10) {
      return new Response(
        JSON.stringify({ error: "invalid_phone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const r = await sendWebhook({
      phone,
      leadId: "test",
      name: body.testName ?? null,
      intention: body.testIntention ?? "BUY",
    });

    return new Response(
      JSON.stringify({ test: true, phone, ...r }),
      { status: r.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }



  // ---- Seleção dos leads ----
  type LeadRow = {
    id: string; name: string | null; phone: string | null;
    form_data: Record<string, unknown> | null;
    feedback_sent_at: string | null; feedback_response: string | null;
    feedback_attempts: number | null; created_at: string;
  };

  const leadSelect = "id, name, phone, form_data, feedback_sent_at, feedback_response, feedback_attempts, created_at";
  let leads: LeadRow[] = [];
  const queueByLead = new Map<string, string>();

  if (body.leadId) {
    const { data, error } = await sb
      .from("leads").select(leadSelect)
      .eq("is_active", true).eq("whatsapp_confirmed", true).eq("is_exhausted", false)
      .lt("feedback_attempts", MAX_ATTEMPTS)
      .eq("id", body.leadId).limit(1);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    leads = (data || []) as LeadRow[];
  } else {
    // Modo fila: processa apenas itens agendados e vencidos
    const batch = Math.min(Math.max(Number(body.limit) || 5, 1), 20);
    const { data: due, error: dueErr } = await sb
      .from("lead_feedback_queue")
      .select("id, lead_id")
      .eq("status", "PENDING")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(batch);
    if (dueErr) {
      return new Response(JSON.stringify({ error: dueErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    for (const q of due || []) queueByLead.set(q.lead_id, q.id);

    if (queueByLead.size > 0) {
      const ids = [...queueByLead.keys()];
      const { data, error } = await sb
        .from("leads").select(leadSelect)
        .in("id", ids)
        .eq("is_active", true).eq("whatsapp_confirmed", true).eq("is_exhausted", false)
        .lt("feedback_attempts", MAX_ATTEMPTS);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      leads = (data || []) as LeadRow[];
      const eligible = new Set(leads.map((l) => l.id));
      const skipped = ids.filter((id) => !eligible.has(id));
      if (skipped.length > 0) {
        await sb.from("lead_feedback_queue")
          .update({ status: "SKIPPED", error: "lead inelegível (inativo/esgotado/já respondido)" })
          .in("lead_id", skipped).eq("status", "PENDING");
      }
    }
  }

  const results: Array<{ leadId: string; ok: boolean; error?: string }> = [];

  for (const lead of leads || []) {
    const intention = getIntention(lead.form_data as Record<string, unknown> | null);
    const phone = String(lead.phone || "").replace(/\D/g, "");
    const queueId = queueByLead.get(lead.id);

    if (phone.length < 10) {
      results.push({ leadId: lead.id, ok: false, error: "invalid_phone" });
      if (queueId) {
        await sb.from("lead_feedback_queue").update({ status: "FAILED", error: "invalid_phone", attempts: 1 }).eq("id", queueId);
      }
      continue;
    }

    const r = await sendWebhook({
      phone,
      leadId: lead.id,
      name: lead.name,
      intention,
    });


    if (r.ok) {
      await sb
        .from("leads")
        .update({
          feedback_sent_at: new Date().toISOString(),
          feedback_attempts: (lead.feedback_attempts || 0) + 1,
          feedback_response: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);
    }

    if (queueId) {
      await sb.from("lead_feedback_queue").update({
        status: r.ok ? "SENT" : "FAILED",
        sent_at: r.ok ? new Date().toISOString() : null,
        error: r.ok ? null : (r.error ?? "erro desconhecido"),
        attempts: 1,
      }).eq("id", queueId);
    }

    results.push({ leadId: lead.id, ok: r.ok, error: r.error });
    console.log(`feedback lead=${lead.id} ok=${r.ok} ${r.error ?? ""}`);

    await new Promise((res) => setTimeout(res, SEND_DELAY_MS));
  }


  // Deactivate leads that exhausted feedback attempts without response
  let deactivated = 0;
  if (isCronMode) {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: stale, error: staleErr } = await sb
      .from("leads")
      .select("id")
      .eq("is_active", true)
      .gte("feedback_attempts", MAX_ATTEMPTS)
      .lte("feedback_sent_at", cutoff)
      .or("feedback_response.is.null,feedback_response.eq.PENDING")
      .limit(200);

    if (!staleErr && stale && stale.length > 0) {
      const ids = stale.map((l: { id: string }) => l.id);
      const { error: updErr } = await sb
        .from("leads")
        .update({
          is_active: false,
          feedback_response: "NO_RESPONSE",
          updated_at: new Date().toISOString(),
        })
        .in("id", ids);
      if (!updErr) deactivated = ids.length;
      console.log(`feedback deactivated ${deactivated} leads`);
    }
  }

  return new Response(
    JSON.stringify({ processed: results.length, deactivated, results }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
