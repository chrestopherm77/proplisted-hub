import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Reporta erros de integração com a MegaAPI:
//  - registra em mega_api_alerts
//  - envia email aos admins (debounce de 30 min por source)
//
// Body: { source: string, message: string, alert_type?: string, details?: any }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Internal-only endpoint: require INTERNAL_FUNCTION_SECRET OR service-role bearer
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  const providedInternal = req.headers.get("x-internal-secret");
  const authHeader = req.headers.get("Authorization") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const isInternal = !!internalSecret && providedInternal === internalSecret;
  const isServiceRole = !!serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`;
  if (!isInternal && !isServiceRole) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const source = String(body?.source || "unknown").substring(0, 100);
    const alert_type = String(body?.alert_type || "send_error").substring(0, 50);
    const message = String(body?.message || "Erro na MegaAPI").substring(0, 500);
    const details = body?.details ?? {};

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Debounce: só cria/notifica se não há alerta não resolvido recente (30 min) p/ este source+type
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("mega_api_alerts")
      .select("id, email_sent_at")
      .eq("source", source)
      .eq("alert_type", alert_type)
      .is("resolved_at", null)
      .gte("created_at", cutoff)
      .limit(1);

    const hasRecent = Array.isArray(recent) && recent.length > 0;

    // Sempre insere o registro (para histórico/modal)
    const { data: inserted, error: insErr } = await supabase
      .from("mega_api_alerts")
      .insert({ source, alert_type, message, details })
      .select("id")
      .single();

    if (insErr) {
      console.error("[report-mega-error] insert failed:", insErr);
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se já houve notificação recente, não dispara novo email (debounce)
    if (hasRecent) {
      return new Response(JSON.stringify({ ok: true, debounced: true, id: inserted.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca admins
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id, profiles:profiles!inner(email, name)")
      .eq("role", "MASTER_ADMIN");

    const emails = (admins || [])
      .map((r: any) => r?.profiles?.email)
      .filter((e: any): e is string => typeof e === "string" && e.includes("@"));

    if (emails.length === 0) {
      return new Response(JSON.stringify({ ok: true, no_admins: true, id: inserted.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY missing");
      return new Response(JSON.stringify({ ok: true, no_email: true, id: inserted.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const detailsStr = (() => {
      try { return JSON.stringify(details, null, 2).substring(0, 2000); } catch { return ""; }
    })();

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;">
        <div style="background:#fee2e2;border:1px solid #ef4444;border-radius:8px;padding:16px;margin-bottom:16px;">
          <h2 style="margin:0;color:#991b1b;font-size:18px;">⚠️ Alerta: MegaAPI com erro</h2>
        </div>
        <p style="color:#18181b;font-size:15px;"><strong>Origem:</strong> ${source}</p>
        <p style="color:#18181b;font-size:15px;"><strong>Tipo:</strong> ${alert_type}</p>
        <p style="color:#18181b;font-size:15px;"><strong>Mensagem:</strong> ${message}</p>
        ${detailsStr ? `<pre style="background:#f4f4f5;padding:12px;border-radius:6px;font-size:12px;overflow:auto;">${detailsStr.replace(/</g, "&lt;")}</pre>` : ""}
        <p style="color:#71717a;font-size:13px;margin-top:24px;">
          A MegaAPI pode estar fora do ar ou com a sessão restrita. Verifique o painel da MegaAPI e o WhatsApp conectado.
        </p>
        <p style="color:#71717a;font-size:12px;margin-top:8px;">
          Você está recebendo este email porque é administrador da Conectae.
        </p>
      </div>
    `;

    try {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Conectae Alertas <noreply@conectaeimob.com.br>",
          to: emails,
          subject: `🚨 MegaAPI com erro (${source})`,
          html,
        }),
      });
      if (!resp.ok) {
        console.error("Resend error:", await resp.text());
      } else {
        await supabase
          .from("mega_api_alerts")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("id", inserted.id);
      }
    } catch (e) {
      console.error("Resend exception:", e);
    }

    return new Response(JSON.stringify({ ok: true, id: inserted.id, notified: emails.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[report-mega-error] error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
