import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();

    // Validate email
    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use the redirectUrl from frontend or fall back to default
    const baseUrl = redirectUrl || "https://leadbay.com.br";
    const resetRedirectUrl = `${baseUrl}/profile`;

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate password reset link using Supabase Auth
    const { data, error: resetError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: resetRedirectUrl,
      },
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      // For security, we always return success even if email doesn't exist
      return new Response(
        JSON.stringify({ success: true, message: "Se o e-mail existir, você receberá instruções de recuperação" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetLink = data?.properties?.action_link;

    if (!resetLink) {
      console.log("No reset link generated - email may not exist");
      // For security, we always return success
      return new Response(
        JSON.stringify({ success: true, message: "Se o e-mail existir, você receberá instruções de recuperação" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email via Resend
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
      // Still return success for security
      return new Response(
        JSON.stringify({ success: true, message: "Se o e-mail existir, você receberá instruções de recuperação" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Password reset email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Se o e-mail existir, você receberá instruções de recuperação" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset:", error);
    // For security, always return success
    return new Response(
      JSON.stringify({ success: true, message: "Se o e-mail existir, você receberá instruções de recuperação" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
