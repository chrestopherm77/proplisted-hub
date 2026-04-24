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

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up user by email via profiles table (has email column synced from auth)
    const { data: profileRow, error: profileLookupError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", email.toLowerCase())
      .maybeSingle();

    if (profileLookupError || !profileRow) {
      // For security, always return success
      return new Response(
        JSON.stringify({ success: true, message: "Se o e-mail existir, você receberá instruções de recuperação" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate custom token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        email: email.toLowerCase(),
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error saving token:", insertError);
      return new Response(
        JSON.stringify({ success: true, message: "Se o e-mail existir, você receberá instruções de recuperação" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetLink = `https://www.leadbay.com.br/reset-password?token=${token}`;

    const emailResponse = await resend.emails.send({
      from: "LeadBay <noreply@leadbay.com.br>",
      to: [email],
      subject: "LeadBay - Recuperação de Senha",
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
              <h1 style="color: #18181b; font-size: 24px; font-weight: 700; margin: 0;">LeadBay</h1>
            </div>
            
            <h2 style="color: #18181b; font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 16px;">
              Recuperação de Senha
            </h2>
            
            <p style="color: #71717a; font-size: 16px; line-height: 24px; text-align: center; margin-bottom: 32px;">
              Você solicitou a recuperação de sua senha. Clique no botão abaixo para definir uma nova senha:
            </p>
            
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${resetLink}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                Redefinir Senha
              </a>
            </div>
            
            <p style="color: #71717a; font-size: 14px; line-height: 20px; text-align: center; margin-bottom: 8px;">
              Este link expira em <strong>1 hora</strong>.
            </p>
            
            <p style="color: #a1a1aa; font-size: 12px; line-height: 18px; text-align: center; margin-bottom: 16px;">
              Se você não solicitou a recuperação de senha, ignore este e-mail. Sua conta permanecerá segura.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
            
            <p style="color: #a1a1aa; font-size: 12px; line-height: 18px; text-align: center;">
              Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
            </p>
            <p style="color: #71717a; font-size: 11px; line-height: 16px; text-align: center; word-break: break-all;">
              ${resetLink}
            </p>
          </div>
          
          <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
            © ${new Date().getFullYear()} LeadBay. Todos os direitos reservados.
          </p>
        </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
    } else {
      console.log("Password reset email sent successfully");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Se o e-mail existir, você receberá instruções de recuperação" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset:", error);
    return new Response(
      JSON.stringify({ success: true, message: "Se o e-mail existir, você receberá instruções de recuperação" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
