import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INSTANCES: Record<string, string> = {
  "megacode-Mj46Nd4U5tP": "MEGA_API_TOKEN",
  "megacode-MJjV24kQIXz": "MEGA_API_TOKEN_MJJV",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "MASTER_ADMIN" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const out: Record<string, unknown> = {};
    for (const [instance, secretName] of Object.entries(INSTANCES)) {
      const apiToken = Deno.env.get(secretName);
      if (!apiToken) { out[instance] = { error: `${secretName} não configurado` }; continue; }
      try {
        const res = await fetch(`https://apinocode01.megaapi.com.br/rest/instance/${instance}`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        });
        const body = await res.text();
        out[instance] = { httpStatus: res.status, body: body.substring(0, 500) };
      } catch (e) {
        out[instance] = { fetchError: String(e) };
      }
    }

    return new Response(JSON.stringify(out), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
