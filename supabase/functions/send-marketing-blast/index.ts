import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const ALLOWED_ORIGINS = [
  'https://conectaeimob.com.br',
  'https://www.conectaeimob.com.br',
  'https://proplisted-hub.lovable.app',
  'https://id-preview--cb8760c6-0b3f-47ef-bdaa-d125c325b434.lovable.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function bodyToHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => `<p style="color:#3f3f46;font-size:15px;line-height:24px;margin:0 0 16px;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

const CONECTAE_LOGO_URL = 'https://hmcpfedcvkurttyolurv.supabase.co/storage/v1/object/public/landing-pages/email-assets/conectae-logo.png';

const buildHtml = (subject: string, body: string, imageUrl?: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#f4f4f5;padding:40px 20px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.08);">
    <div style="padding:24px 32px;border-bottom:1px solid #e4e4e7;text-align:center;">
      <h1 style="color:#18181b;font-size:22px;font-weight:700;margin:0;">Conectae</h1>
    </div>
    ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="" style="display:block;width:100%;height:auto;"/>` : ''}
    <div style="padding:32px;">
      ${bodyToHtml(body)}
      <p style="color:#71717a;font-size:13px;margin:24px 0 0;">Equipe Conectae</p>
    </div>
    <div style="padding:24px 32px 32px;border-top:1px solid #e4e4e7;text-align:center;background:#fafafa;">
      <img src="${CONECTAE_LOGO_URL}" alt="Conectae" style="height:48px;width:auto;display:inline-block;"/>
    </div>
  </div>
  <p style="color:#a1a1aa;font-size:12px;text-align:center;margin-top:24px;">© ${new Date().getFullYear()} Conectae. Todos os direitos reservados.</p>
</body></html>`;

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userId = claimsData.claims.sub as string;
    const { data: roleData } = await userClient
      .from("user_roles").select("role")
      .eq("user_id", userId).eq("role", "MASTER_ADMIN").maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();
    const subject: string = (body.subject || '').toString().trim();
    const bodyText: string = (body.bodyText || '').toString();
    const imageUrl: string | undefined = body.imageUrl ? String(body.imageUrl) : undefined;
    const recipientsInput: any[] = Array.isArray(body.recipients) ? body.recipients : [];
    let delaySeconds: number = Number(body.delaySeconds ?? 17);
    if (!Number.isFinite(delaySeconds)) delaySeconds = 17;
    delaySeconds = Math.min(20, Math.max(15, Math.round(delaySeconds)));

    if (!subject || subject.length > 200) {
      return new Response(JSON.stringify({ error: "Assunto inválido" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!bodyText || bodyText.length > 20000) {
      return new Response(JSON.stringify({ error: "Mensagem inválida" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seen = new Set<string>();
    const recipients = recipientsInput
      .map((r: any) => ({ email: String(r?.email || '').trim().toLowerCase(), name: r?.name ? String(r.name) : undefined }))
      .filter((r) => emailRegex.test(r.email))
      .filter((r) => { if (seen.has(r.email)) return false; seen.add(r.email); return true; });

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum destinatário válido" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (recipients.length > 200) {
      return new Response(JSON.stringify({ error: "Máximo de 200 destinatários por disparo" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const html = buildHtml(subject, bodyText, imageUrl);

    let sent = 0, failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      try {
        const resp = await resend.emails.send({
          from: "Conectae <noreply@conectaeimob.com.br>",
          to: [r.email],
          subject,
          html,
        });
        if ((resp as any).error) {
          failed++;
          errors.push(`${r.email}: ${(resp as any).error.message}`);
        } else {
          sent++;
        }
      } catch (e: any) {
        failed++;
        errors.push(`${r.email}: ${e.message}`);
      }
      if (i < recipients.length - 1) {
        await delay(delaySeconds * 1000);
      }
    }

    const report = { total: recipients.length, sent, failed, errors: errors.slice(0, 30), delaySeconds };
    console.log("Marketing blast complete:", report);
    return new Response(JSON.stringify(report), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-marketing-blast error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
    });
  }
};

serve(handler);
