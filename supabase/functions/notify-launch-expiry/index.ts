import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendMegaMessage(megaUrl: string, token: string, body: unknown, attempt: number): Promise<boolean> {
  try {
    const res = await fetch(megaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      console.log(`Mega API success (attempt ${attempt})`);
      return true;
    }
    const errText = await res.text();
    console.error(`Mega API error (attempt ${attempt}): ${res.status} - ${errText.substring(0, 300)}`);
    if (res.status >= 500 && attempt < 2) {
      await new Promise(r => setTimeout(r, 2000));
      return sendMegaMessage(megaUrl, token, body, attempt + 1);
    }
    return false;
  } catch (err) {
    console.error(`Mega API fetch error (attempt ${attempt}):`, err);
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 2000));
      return sendMegaMessage(megaUrl, token, body, attempt + 1);
    }
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const MEGA_API_TOKEN = Deno.env.get("MEGA_API_TOKEN");

    if (!MEGA_API_TOKEN) {
      console.error("MEGA_API_TOKEN not configured");
      return new Response(JSON.stringify({ error: "MEGA_API_TOKEN not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find launches expiring in exactly 2 days
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const targetDate = twoDaysFromNow.toISOString().split('T')[0];

    console.log(`Checking for launches expiring on ${targetDate}`);

    const { data: launches, error } = await supabase
      .from("launches")
      .select("id, name, coordinator_name, coordinator_phone, table_expires_at")
      .eq("is_active", true)
      .eq("table_expires_at", targetDate);

    if (error) {
      console.error("DB error:", error);
      return new Response(JSON.stringify({ error: "DB error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!launches || launches.length === 0) {
      console.log("No launches expiring in 2 days");
      return new Response(JSON.stringify({ success: true, notified: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${launches.length} launch(es) expiring in 2 days`);

    const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text";
    let notified = 0;

    for (const launch of launches) {
      if (!launch.coordinator_phone) {
        console.log(`Launch ${launch.id}: no coordinator phone, skipping`);
        continue;
      }

      const clean = launch.coordinator_phone.replace(/\D/g, '');
      const fullPhone = clean.startsWith('55') ? clean : `55${clean}`;

      const formattedDate = `${targetDate.split('-')[2]}/${targetDate.split('-')[1]}/${targetDate.split('-')[0]}`;

      const message = `*⚠️ Validade da Tabela se Aproximando!*\n\nOlá${launch.coordinator_name ? `, ${launch.coordinator_name}` : ''}! A tabela de valores do empreendimento *${launch.name}* vence em 2 dias (${formattedDate}).\n\nAcesse o LeadByA para atualizar os valores e a data de validade.`;

      const megaBody = {
        messageData: {
          to: `${fullPhone}@s.whatsapp.net`,
          text: message,
        },
      };

      const sent = await sendMegaMessage(megaUrl, MEGA_API_TOKEN, megaBody, 1);
      if (sent) {
        notified++;
        console.log(`Launch ${launch.id}: notification sent`);
      }
    }

    console.log(`Done. Notified: ${notified}`);
    return new Response(JSON.stringify({ success: true, notified }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
