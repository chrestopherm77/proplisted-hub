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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all active alerts
    const { data: alerts, error: alertsErr } = await supabase
      .from("property_search_alerts")
      .select("*")
      .eq("is_active", true);

    if (alertsErr || !alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ success: true, matched: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    for (const alert of alerts) {
      // Don't notify the creator of their own search
      if (alert.user_id === data.creatorUserId) continue;

      const f = alert.filters as Record<string, string>;
      if (!f) continue;

      // Match filters
      if (f.state && data.state && f.state !== data.state) continue;
      if (f.city && f.city !== data.city) continue;
      if (f.property_type && f.property_type !== data.property_type) continue;
      if (f.operation_type && f.operation_type !== data.operation_type) continue;

      // Price range check
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

      if (!profile?.phone) continue;

      const clean = profile.phone.replace(/\D/g, '');
      const fullPhone = clean.startsWith('55') ? clean : `55${clean}`;
      const typeName = typeLabels[data.property_type] ?? data.property_type;

      const message = `*🔔 Novo Imóvel Compatível com seu Alerta!*\n\nOlá${profile.name ? `, ${profile.name}` : ''}! Uma nova procura de *${typeName}* em *${data.city}${data.state ? `/${data.state}` : ''}* foi publicada e se encaixa nos seus filtros salvos.\n\nAcesse o Mural de Demandas para enviar sua oferta!`;

      const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text";
      try {
        await fetch(megaUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MEGA_API_TOKEN}`,
          },
          body: JSON.stringify({
            messageData: {
              to: `${fullPhone}@s.whatsapp.net`,
              text: message,
            },
          }),
        });
        matched++;
      } catch (e) {
        console.error(`Failed to notify ${alert.user_id}:`, e);
      }
    }

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
