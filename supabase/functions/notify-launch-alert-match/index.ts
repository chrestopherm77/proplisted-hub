import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BodySchema = z.object({
  launchId: z.string().uuid(),
  state: z.string().max(10).optional().nullable(),
  city: z.string().min(1).max(200),
  zone: z.string().max(50).optional().nullable(),
  property_type: z.string().max(50).optional().nullable(),
  status: z.string().max(50).optional().nullable(),
  price_from: z.string().max(50).optional().nullable(),
  price_max: z.string().max(50).optional().nullable(),
  name: z.string().min(1).max(300),
  creatorUserId: z.string().uuid(),
});

async function sendMegaMessage(megaUrl: string, token: string, body: unknown, attempt: number): Promise<boolean> {
  try {
    const res = await fetch(megaUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) return true;
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
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = parsed.data;
    console.log(`Processing launch alert match for "${data.name}" in ${data.city}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const MEGA_API_TOKEN = Deno.env.get("MEGA_API_TOKEN");

    if (!MEGA_API_TOKEN) {
      return new Response(JSON.stringify({ error: "MEGA_API_TOKEN not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: alerts, error: alertsErr } = await supabase
      .from("launch_alerts")
      .select("*")
      .eq("is_active", true);

    if (alertsErr) {
      console.error("Error fetching launch_alerts:", alertsErr);
      return new Response(JSON.stringify({ error: "DB error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!alerts || alerts.length === 0) {
      console.log("No active launch alerts");
      return new Response(JSON.stringify({ success: true, matched: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${alerts.length} active launch alert(s)`);

    const parseNum = (v: string | null | undefined): number => {
      if (!v) return 0;
      const d = v.replace(/\D/g, '');
      return d ? parseInt(d, 10) : 0;
    };

    const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text";
    let matched = 0;

    for (const alert of alerts) {
      if (alert.user_id === data.creatorUserId) continue;

      const f = alert.filters as Record<string, string>;
      if (!f) continue;

      // Match filters
      if (f.state && data.state && f.state !== data.state) continue;
      if (f.city && data.city && f.city !== data.city) continue;
      if (f.zone && data.zone && f.zone !== data.zone) continue;
      if (f.property_type && data.property_type && f.property_type !== data.property_type) continue;
      if (f.status && data.status && f.status !== data.status) continue;

      // Price range
      if (f.priceMin) {
        const alertMin = parseNum(f.priceMin);
        const launchMax = parseNum(data.price_max) || parseNum(data.price_from);
        if (alertMin > 0 && launchMax > 0 && launchMax < alertMin) continue;
      }
      if (f.priceMax) {
        const alertMax = parseNum(f.priceMax);
        const launchMin = parseNum(data.price_from);
        if (alertMax > 0 && launchMin > 0 && launchMin > alertMax) continue;
      }

      // Match! Get user phone
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, name")
        .eq("id", alert.user_id)
        .single();

      if (!profile?.phone) continue;

      const clean = profile.phone.replace(/\D/g, '');
      const fullPhone = clean.startsWith('55') ? clean : `55${clean}`;

      const message = `*🔔 Novo Lançamento Compatível com seu Alerta!*\n\nOlá${profile.name ? `, ${profile.name}` : ''}! O empreendimento *${data.name}* em *${data.city}${data.state ? `/${data.state}` : ''}* foi publicado e se encaixa nos seus filtros salvos.\n\nAcesse o LeadByA para conferir os detalhes!`;

      const megaBody = {
        messageData: {
          to: `${fullPhone}@s.whatsapp.net`,
          text: message,
        },
      };

      const sent = await sendMegaMessage(megaUrl, MEGA_API_TOKEN, megaBody, 1);
      if (sent) {
        matched++;
        console.log(`Alert ${alert.id}: WhatsApp sent to ${fullPhone}`);
      }
    }

    console.log(`Done. Matched: ${matched}`);
    return new Response(JSON.stringify({ success: true, matched }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
