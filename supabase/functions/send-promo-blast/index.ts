import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const ALLOWED_ORIGINS = [
  'https://leadbay.com.br',
  'https://www.leadbay.com.br',
  'https://proplisted-hub.lovable.app',
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

const buildHtml = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #18181b; font-size: 24px; font-weight: 700; margin: 0;">Conectae</h1>
    </div>

    <p style="color: #18181b; font-size: 16px; line-height: 26px; margin-bottom: 8px;">
      Olá Corretor!
    </p>

    <p style="color: #3f3f46; font-size: 15px; line-height: 24px; margin-bottom: 24px;">
      Estamos fazendo uma <strong>liquidação de estoque</strong> e liberamos um lote de leads qualificados de Ribeirão Preto e região com condição promocional exclusiva.
    </p>

    <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <p style="font-size: 14px; color: #92400e; margin: 0 0 8px 0; font-weight: 600;">💰 OFERTA ESPECIAL</p>
      <p style="font-size: 28px; font-weight: 800; color: #18181b; margin: 0;">Leads a partir de R$5,00</p>
      <p style="font-size: 13px; color: #78716c; margin: 8px 0 0 0; text-decoration: line-through;">Valor normal R$27,00</p>
    </div>

    <p style="color: #71717a; font-size: 14px; line-height: 22px; text-align: center; margin-bottom: 28px;">
      ⏰ <strong>Validade:</strong> Até 31/03/26 ou enquanto durar o estoque
    </p>

    <div style="text-align: center; margin-bottom: 32px;">
      <a href="https://www.leadbay.com.br" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 40px; border-radius: 8px;">
        Ver leads disponíveis
      </a>
    </div>

    <p style="color: #71717a; font-size: 14px; line-height: 22px; margin-bottom: 4px;">
      Abraço,
    </p>
    <p style="color: #18181b; font-size: 14px; font-weight: 600; margin: 0;">
      Equipe comercial Conectae
    </p>
  </div>

  <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
    © ${new Date().getFullYear()} Conectae. Todos os direitos reservados.
  </p>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
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
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Check admin role
    const { data: roleData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "MASTER_ADMIN")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("is_active", true)
      .not("email", "is", null);

    if (error) {
      console.error("Error fetching profiles:", error);
      return new Response(JSON.stringify({ error: "Erro ao buscar perfis" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const validProfiles = (profiles || []).filter((p: any) => p.email && p.email.includes("@"));
    console.log(`Found ${validProfiles.length} active profiles with email`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const profile of validProfiles) {
      try {
        const emailResponse = await resend.emails.send({
          from: "Conectae <noreply@leadbay.com.br>",
          to: [profile.email],
          subject: "🔥 Liquidação de Leads - A partir de R$5,00!",
          html: buildHtml(profile.name || "Corretor"),
        });

        if (emailResponse.error) {
          failed++;
          errors.push(`${profile.email}: ${emailResponse.error.message}`);
        } else {
          sent++;
        }
      } catch (e: any) {
        failed++;
        errors.push(`${profile.email}: ${e.message}`);
      }

      await delay(600);
    }

    const report = {
      total: validProfiles.length,
      sent,
      failed,
      errors: errors.slice(0, 20),
    };

    console.log("Blast complete:", report);

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-promo-blast:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
