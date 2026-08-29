import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INTENTION_PT: Record<string, string> = {
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

async function postWebhook(payload: Record<string, unknown>) {
  const url = Deno.env.get("PARTIAL_LEAD_WEBHOOK_URL");
  if (!url) return { ok: false, error: "PARTIAL_LEAD_WEBHOOK_URL missing" };
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = Deno.env.get("PARTIAL_LEAD_WEBHOOK_TOKEN");
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    const txt = await res.text();
    return res.ok
      ? { ok: true, response: txt.slice(0, 200) }
      : { ok: false, error: `HTTP ${res.status} ${txt.slice(0, 200)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function buildPayload(lead: {
  id?: string | null;
  session_id?: string | null;
  name: string | null;
  phone: string | null;
  intention: string | null;
  current_step?: string | null;
  source_lp?: string | null;
}) {
  const intention = String(lead.intention || "").toUpperCase();
  const sourceLp = lead.source_lp || "/lp";
  return {
    nome: lead.name || "",
    telefone: normalizePhone(lead.phone || ""),
    interesse: INTENTION_PT[intention] || "",
    intencao: INTENTION_PT[intention] || "",
    etapa: lead.current_step || "",
    tipo: "lead_abandonado",
    lead_id: lead.id || null,
    session_id: lead.session_id || null,
    link_retomar: lead.session_id
      ? `https://conectaeimob.com.br${sourceLp}?resume=${lead.session_id}`
      : null,
    enviado_em: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: {
    partialLeadId?: string;
    testPhone?: string;
    testName?: string;
    testIntention?: string;
    cronSecret?: string;
    limit?: number;
  } = {};
  try {
    const txt = await req.text();
    if (txt) body = JSON.parse(txt);
  } catch { /* empty */ }

  const isCronMode = !body.partialLeadId && !body.testPhone;
  const cronExpected = Deno.env.get("CRON_SECRET");
  const providedCron = req.headers.get("x-cron-secret") || body.cronSecret;
  let authorized = !!cronExpected && providedCron === cronExpected;

  if (!authorized && !isCronMode) {
    const authHeader = req.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const bearer = authHeader.replace("Bearer ", "");
      if (bearer === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
        authorized = true;
      } else {
        try {
          const sbAuth = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } },
          );
          const { data: c } = await sbAuth.auth.getClaims(bearer);
          const uid = c?.claims?.sub;
          if (uid) {
            const { data: isAdmin } = await sb.rpc("has_role", { _user_id: uid, _role: "MASTER_ADMIN" });
            authorized = !!isAdmin;
          }
        } catch { /* noop */ }
      }
    }
  }

  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!Deno.env.get("PARTIAL_LEAD_WEBHOOK_URL")) {
    return new Response(JSON.stringify({ error: "PARTIAL_LEAD_WEBHOOK_URL missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Modo teste: envia um payload avulso sem tocar no banco
  if (body.testPhone) {
    const r = await postWebhook(
      buildPayload({
        id: null,
        session_id: null,
        name: body.testName ?? null,
        phone: body.testPhone,
        intention: body.testIntention ?? "BUY",
        current_step: "contact",
      }),
    );
    return new Response(JSON.stringify({ test: true, ...r }), {
      status: r.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const select = "id, session_id, name, phone, intention, current_step, source_lp";
  let leads: Array<Record<string, string | null>> = [];

  if (body.partialLeadId) {
    const { data, error } = await sb
      .from("lp_partial_leads").select(select)
      .eq("id", body.partialLeadId).limit(1);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    leads = (data || []) as typeof leads;
  } else {
    const batch = Math.min(Math.max(Number(body.limit) || 20, 1), 50);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data, error } = await sb
      .from("lp_partial_leads").select(select)
      .eq("completed", false)
      .is("webhook_sent_at", null)
      .not("phone", "is", null)
      .not("name", "is", null)
      .lt("updated_at", tenMinutesAgo)
      .order("updated_at", { ascending: true })
      .limit(batch);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    leads = (data || []) as typeof leads;
  }

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const lead of leads) {
    const r = await postWebhook(buildPayload(lead as never));
    if (r.ok) {
      await sb.from("lp_partial_leads")
        .update({ webhook_sent_at: new Date().toISOString() })
        .eq("id", lead.id as string);
    }
    results.push({ id: lead.id as string, ok: r.ok, error: r.ok ? undefined : (r as { error?: string }).error });
    await new Promise((res) => setTimeout(res, 400));
  }

  return new Response(JSON.stringify({ processed: results.filter((r) => r.ok).length, total: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
