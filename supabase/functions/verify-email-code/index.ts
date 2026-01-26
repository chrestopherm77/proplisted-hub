import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyCodeRequest = await req.json();

    // Validate inputs
    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email e código são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the verification code
    const { data: verificationRecord, error: selectError } = await supabase
      .from("email_verification_codes")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("code", code)
      .eq("verified", false)
      .maybeSingle();

    if (selectError) {
      console.error("Error fetching code:", selectError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar código" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!verificationRecord) {
      return new Response(
        JSON.stringify({ error: "Código inválido", valid: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if code has expired
    const expiresAt = new Date(verificationRecord.expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: "Código expirado", valid: false, expired: true }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark code as verified
    const { error: updateError } = await supabase
      .from("email_verification_codes")
      .update({ verified: true })
      .eq("id", verificationRecord.id);

    if (updateError) {
      console.error("Error updating code:", updateError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar código" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email verified successfully:", email);

    return new Response(
      JSON.stringify({ valid: true, message: "E-mail verificado com sucesso" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-email-code:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
