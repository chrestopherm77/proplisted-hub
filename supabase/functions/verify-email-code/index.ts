import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email e código são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const expiresAt = new Date(verificationRecord.expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: "Código expirado", valid: false, expired: true }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

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

    console.log("Email verified successfully");

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
