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

const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_ATTEMPTS = 3;

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.includes("@") || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.toLowerCase();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rateLimitCutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const { count: recentAttempts, error: countError } = await supabase
      .from("email_verification_codes")
      .select("*", { count: "exact", head: true })
      .eq("email", normalizedEmail)
      .gte("created_at", rateLimitCutoff);

    if (countError) {
      console.error("Error checking rate limit:", countError);
    }

    if (recentAttempts !== null && recentAttempts >= RATE_LIMIT_MAX_ATTEMPTS) {
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Aguarde 1 minuto antes de solicitar um novo código." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await supabase
      .from("email_verification_codes")
      .delete()
      .eq("email", normalizedEmail)
      .lt("created_at", rateLimitCutoff);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from("email_verification_codes")
      .insert({
        email: normalizedEmail,
        code,
        expires_at: expiresAt,
        verified: false,
      });

    if (insertError) {
      console.error("Error saving code:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar código" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "Conectae <noreply@leadbay.com.br>",
      to: [email],
      subject: "Conectae - Código de Verificação",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #18181b; font-size: 24px; font-weight: 700; margin: 0;">Conectae</h1>
            </div>
            
            <h2 style="color: #18181b; font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 16px;">
              Verificação de E-mail
            </h2>
            
            <p style="color: #71717a; font-size: 16px; line-height: 24px; text-align: center; margin-bottom: 32px;">
              Use o código abaixo para verificar seu endereço de e-mail:
            </p>
            
            <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #18181b;">
                ${code}
              </span>
            </div>
            
            <p style="color: #71717a; font-size: 14px; line-height: 20px; text-align: center; margin-bottom: 8px;">
              Este código expira em <strong>5 minutos</strong>.
            </p>
            
            <p style="color: #a1a1aa; font-size: 12px; line-height: 18px; text-align: center;">
              Se você não solicitou este código, ignore este e-mail.
            </p>
          </div>
          
          <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
            © ${new Date().getFullYear()} Conectae. Todos os direitos reservados.
          </p>
        </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: "Erro ao enviar e-mail" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email verification code sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Código enviado com sucesso" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-email-code:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
