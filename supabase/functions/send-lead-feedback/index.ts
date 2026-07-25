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

async function sendListMessage(params: {
  phone: string;
  instanceKey: string;
  token: string;
  leadId: string;
  name: string | null;
  intention: Intention;
}): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const labels = LABELS[params.intention];
  const greeting = firstName(params.name);
  const text =
    `Olá ${greeting}! 👋\n\n` +
    `Faz alguns dias que recebemos seu interesse em ${labels.verb}.\n\n` +
    `Você ainda está procurando? Toque em uma das opções abaixo:`;

  const body = {
    messageData: {
      to: `${params.phone}@s.whatsapp.net`,
      title: "Conectae - Feedback",
      text,
      buttonText: "Responder",
      description: "Toque para escolher uma das opções",
      sections: [
        {
          title: "Como está sua busca?",
          rows: [
            {
              rowId: `feedback_done_${params.leadId}`,
              title: `✅ ${labels.done}`,
              description: "Vamos encerrar seu cadastro",
            },
            {
              rowId: `feedback_pending_${params.leadId}`,
              title: `⏳ ${labels.pending}`,
              description: "Continuamos te ajudando",
            },
          ],
        },
      ],
      listType: 0,
    },
  };

  const url = `https://apinocode01.megaapi.com.br/rest/sendMessage/${params.instanceKey}/listMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify(body),
    });
    const txt = await res.text();
    let data: any;
    try { data = JSON.parse(txt); } catch { data = { raw: txt.slice(0, 400) }; }
    if (res.ok && data?.error !== true) {
      const id = data?.key?.id || data?.messageData?.key?.id || data?.id || null;
      return { ok: true, messageId: id };
    }
    return { ok: false, error: data?.message || data?.error || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const instanceKey = Deno.env.get("MEGA_INSTANCE_KEY") || Deno.env.get("MEGA_API_INSTANCE_KEY") || "megacode-Mj46Nd4U5tP";
  const token = Deno.env.get("MEGA_API_TOKEN");

  if (!token) {
    return new Response(
      JSON.stringify({ error: "MEGA_API_TOKEN missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: { leadId?: string; cronSecret?: string; testPhone?: string; testName?: string; testIntention?: Intention } = {};
  try {
    if (req.method === "POST") {
      const txt = await req.text();
      if (txt) body = JSON.parse(txt);
    }
  } catch { /* empty */ }

  const isCronMode = !body.leadId;

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
    let authorized = !!internalSecret && providedInternal === internalSecret;
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

  // Build query for eligible leads
  let query = sb
    .from("leads")
    .select("id, name, phone, form_data, feedback_sent_at, feedback_response, feedback_attempts, created_at")
    .eq("is_active", true)
    .eq("whatsapp_confirmed", true)
    .eq("is_exhausted", false)
    .lt("feedback_attempts", MAX_ATTEMPTS);

  if (body.leadId) {
    query = query.eq("id", body.leadId);
  } else {
    // Eligible: never sent feedback yet (spread ativos hoje/amanhã, 1 por rodada)
    query = query.is("feedback_sent_at", null).order("created_at", { ascending: true });
  }

  const perRun = body.leadId ? 100 : 1;
  const { data: leads, error } = await query.limit(perRun);

  if (error) {
    console.error("Query error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const results: Array<{ leadId: string; ok: boolean; error?: string }> = [];

  for (const lead of leads || []) {
    const intention = getIntention(lead.form_data as Record<string, unknown> | null);
    const phone = String(lead.phone || "").replace(/\D/g, "");
    if (phone.length < 10) {
      results.push({ leadId: lead.id, ok: false, error: "invalid_phone" });
      continue;
    }

    const r = await sendListMessage({
      phone,
      instanceKey,
      token,
      leadId: lead.id,
      name: lead.name,
      intention,
    });

    await sb
      .from("leads")
      .update({
        feedback_sent_at: new Date().toISOString(),
        feedback_attempts: (lead.feedback_attempts || 0) + 1,
        feedback_response: r.ok ? null : lead.feedback_response, // reset to null on new ask if previously PENDING
        updated_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    // If we are re-asking a PENDING lead, clear PENDING so next response is fresh
    if (r.ok && lead.feedback_response === "PENDING") {
      await sb.from("leads").update({ feedback_response: null }).eq("id", lead.id);
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
