import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BodySchema = z.object({
  searchId: z.string().uuid(),
  state: z.string().max(10).optional(),
  city: z.string().min(1).max(200),
  property_type: z.string().min(1).max(50),
  operation_type: z.string().min(1).max(50),
  value_min: z.string().max(50).optional(),
  value_max: z.string().max(50).optional(),
  creatorUserId: z.string().uuid(),
});

/**
 * Normaliza telefone brasileiro para formato WhatsApp (12 dígitos):
 * 55 + DDD(2) + número(8)
 * Remove o nono dígito quando presente.
 */
function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCC = digits.startsWith('55') ? digits : `55${digits}`;
  // 13 dígitos = 55 + DDD(2) + 9 + número(8) → remover o '9' extra
  if (withCC.length === 13 && withCC[4] === '9') {
    return withCC.slice(0, 4) + withCC.slice(5);
  }
  return withCC;
}

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
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      console.error("Validation error:", JSON.stringify(parsed.error.flatten().fieldErrors));
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = parsed.data;
    console.log(`Processing alert match for search ${data.searchId}: ${data.property_type} ${data.operation_type} in ${data.city}/${data.state}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: alerts, error: alertsErr } = await supabase
      .from("property_search_alerts")
      .select("*")
      .eq("is_active", true);

    if (alertsErr) {
      console.error("Error fetching alerts:", alertsErr);
      return new Response(JSON.stringify({ success: false, error: "DB error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!alerts || alerts.length === 0) {
      console.log("No active alerts found");
      return new Response(JSON.stringify({ success: true, matched: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${alerts.length} active alert(s)`);

    const MEGA_API_TOKEN = Deno.env.get("MEGA_API_TOKEN");
    if (!MEGA_API_TOKEN) {
      console.error("MEGA_API_TOKEN not configured");
      return new Response(JSON.stringify({ error: "MEGA_API_TOKEN not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parseNum = (v: string | null | undefined): number => {
      if (!v) return 0;
      const d = v.replace(/\D/g, '');
      return d ? parseInt(d, 10) : 0;
    };

    const typeLabels: Record<string, string> = {
      CASA: 'Casa', APARTAMENTO: 'Apartamento', SALA_COMERCIAL: 'Sala Comercial',
      LOTE: 'Lote', RURAL: 'Rural', PREDIO_COMERCIAL: 'Prédio Comercial',
    };

    let matched = 0;
    const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text";

    for (const alert of alerts) {
      if (alert.user_id === data.creatorUserId) continue;

      const f = alert.filters as Record<string, string>;
      if (!f) continue;

      if (f.state && data.state && f.state !== data.state) continue;
      if (f.city && f.city !== data.city) continue;
      if (f.property_type && f.property_type !== data.property_type) continue;
      if (f.operation_type && f.operation_type !== data.operation_type) continue;

      if (f.priceMin) {
        const alertMin = parseNum(f.priceMin);
        const searchMax = parseNum(data.value_max);
        if (alertMin > 0 && searchMax > 0 && searchMax < alertMin) continue;
      }
      if (f.priceMax) {
        const alertMax = parseNum(f.priceMax);
        const searchMin = parseNum(data.value_min);
        if (alertMax > 0 && searchMin > 0 && searchMin > alertMax) continue;
      }

      // Match! Get user phone
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, name")
        .eq("id", alert.user_id)
        .single();

      if (!profile?.phone) {
        console.log(`Alert ${alert.id}: user has no phone`);
        continue;
      }

      const fullPhone = normalizeWhatsAppPhone(profile.phone);
      const typeName = typeLabels[data.property_type] ?? data.property_type;

      console.log(`Alert ${alert.id}: MATCH! phone ${profile.phone} -> ${fullPhone}`);

      const message = `*🔔 Novo Imóvel Compatível com seu Alerta!*\n\nOlá${profile.name ? `, ${profile.name}` : ''}! Uma nova procura de *${typeName}* em *${data.city}${data.state ? `/${data.state}` : ''}* foi publicada e se encaixa nos seus filtros salvos.\n\nAcesse o Mural de Demandas para enviar sua oferta!`;

      const megaBody = {
        messageData: {
          to: `${fullPhone}@s.whatsapp.net`,
          text: message,
        },
      };

      const sent = await sendMegaMessage(megaUrl, MEGA_API_TOKEN, megaBody, 1);
      if (sent) {
        matched++;
        console.log(`Alert ${alert.id}: WhatsApp sent successfully to ${fullPhone}`);
      } else {
        console.error(`Alert ${alert.id}: WhatsApp send FAILED to ${fullPhone}`);
      }
    }

    console.log(`Done. Matched and notified: ${matched}`);
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
