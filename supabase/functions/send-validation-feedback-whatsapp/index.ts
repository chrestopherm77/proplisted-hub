import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SEND_DELAY_MS = 700;
const PORTAL_URL = "https://www.conectaeimob.com.br";

function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  let d = String(raw).replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (d.length === 11) d = d.slice(0, 2) + d.slice(3); // remove o 9
  if (d.length !== 10) return "";
  return `55${d}`;
}

function firstName(full: string | null | undefined): string {
  if (!full) return "olá";
  return full.trim().split(/\s+/)[0];
}

function buildMessage(params: {
  name: string | null;
  properties: number;
  searches: number;
}): string {
  const greeting = firstName(params.name);
  const lines: string[] = [];
  lines.push(`Olá ${greeting}! 👋`);
  lines.push("");
  lines.push(`Faz mais de 30 dias que você não atualiza alguns dos seus anúncios na *Conectaê Imob*.`);
  lines.push("");

  if (params.properties > 0 && params.searches > 0) {
    lines.push(`Você tem *${params.properties} imóvel(is)* no Portal e *${params.searches} interesse(s)* em Venda em Parceria pendentes de confirmação.`);
  } else if (params.properties > 0) {
    lines.push(`Você tem *${params.properties} imóvel(is)* no Portal pendente(s) de confirmação.`);
  } else if (params.searches > 0) {
    lines.push(`Você tem *${params.searches} interesse(s)* em Venda em Parceria pendente(s) de confirmação.`);
  } else {
    lines.push(`Você tem anúncios pendentes de confirmação.`);
  }

  lines.push("");
  lines.push(`Precisamos saber: eles *ainda estão válidos* ou *já foram vendidos*?`);
  lines.push("");
  lines.push(`👉 Acesse e confirme agora:`);
  lines.push(PORTAL_URL);
  lines.push("");
  lines.push(`_Anúncios não confirmados podem ser desativados automaticamente._`);
  return lines.join("\n");
}

async function sendText(params: {
  phone: string;
  text: string;
  token: string;
  instanceKey: string;
}): Promise<{ ok: boolean; error?: string }> {
  const url = `https://apinocode01.megaapi.com.br/rest/sendMessage/${params.instanceKey}/text`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify({
        messageData: { to: `${params.phone}@s.whatsapp.net`, text: params.text },
      }),
    });
    const txt = await res.text();
    let data: any;
    try { data = JSON.parse(txt); } catch { data = { raw: txt.slice(0, 400) }; }
    if (res.ok && data?.error !== true) return { ok: true };
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

  const instanceKey = Deno.env.get("MEGA_INSTANCE_KEY") || "megacode-Mj46Nd4U5tP";
  const token = Deno.env.get("MEGA_API_TOKEN");
  if (!token) {
    return new Response(JSON.stringify({ error: "MEGA_API_TOKEN missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: {
    cronSecret?: string;
    testPhone?: string;
    testName?: string;
    userId?: string;
  } = {};
  try {
    if (req.method === "POST") {
      const txt = await req.text();
      if (txt) body = JSON.parse(txt);
    }
  } catch { /* ignore */ }

  // --- Test mode: send a single message to a phone ---
  if (body.testPhone) {
    const expected = Deno.env.get("CRON_SECRET");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const provided = req.headers.get("x-cron-secret") || body.cronSecret;
    const auth = req.headers.get("authorization") || "";
    const isService = serviceKey && auth === `Bearer ${serviceKey}`;
    if (!isService && expected && provided !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const phone = normalizePhone(body.testPhone);
    if (!phone) {
      return new Response(JSON.stringify({ error: "invalid_phone" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const text = buildMessage({ name: body.testName || null, properties: 2, searches: 1 });
    const r = await sendText({ phone, text, token, instanceKey });
    return new Response(JSON.stringify({ ok: r.ok, error: r.error, phone, preview: text }), {
      status: r.ok ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Cron mode: notify every broker with pending validations ---
  const expected = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret") || body.cronSecret;
  if (expected && provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [propsRes, searchesRes] = await Promise.all([
    sb.from("properties")
      .select("user_id")
      .eq("is_active", true)
      .or(`last_validated_at.is.null,last_validated_at.lt.${cutoff}`),
    sb.from("property_searches")
      .select("user_id")
      .eq("is_active", true)
      .or(`last_validated_at.is.null,last_validated_at.lt.${cutoff}`),
  ]);

  const counts = new Map<string, { p: number; s: number }>();
  for (const r of propsRes.data || []) {
    const c = counts.get(r.user_id) || { p: 0, s: 0 };
    c.p++;
    counts.set(r.user_id, c);
  }
  for (const r of searchesRes.data || []) {
    const c = counts.get(r.user_id) || { p: 0, s: 0 };
    c.s++;
    counts.set(r.user_id, c);
  }

  const userIds = body.userId ? [body.userId] : Array.from(counts.keys());
  if (userIds.length === 0) {
    return new Response(JSON.stringify({ processed: 0, results: [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: profiles } = await sb
    .from("profiles")
    .select("id, name, phone")
    .in("id", userIds);

  const results: any[] = [];
  for (const p of profiles || []) {
    const c = counts.get(p.id) || { p: 0, s: 0 };
    if (c.p === 0 && c.s === 0) continue;
    const phone = normalizePhone(p.phone);
    if (!phone) {
      results.push({ userId: p.id, ok: false, error: "invalid_phone" });
      continue;
    }
    const text = buildMessage({ name: p.name, properties: c.p, searches: c.s });
    const r = await sendText({ phone, text, token, instanceKey });
    results.push({ userId: p.id, ok: r.ok, error: r.error });
    await new Promise((res) => setTimeout(res, SEND_DELAY_MS));
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
