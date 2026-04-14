import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BodySchema = z.object({
  searchId: z.string().uuid(),
  offerUserName: z.string().min(1).max(300),
  offerLink: z.string().max(2000).optional(),
});

async function sendMegaMessage(megaUrl: string, token: string, body: unknown, attempt: number): Promise<boolean> {
  try {
    console.log(`Mega API attempt ${attempt}...`);
    const res = await fetch(megaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      console.log(`Mega API success on attempt ${attempt}`);
      return true;
    }

    const errText = await res.text();
    console.error(`Mega API error (attempt ${attempt}): ${res.status} - ${errText.substring(0, 300)}`);

    // Retry on 5xx errors
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

    const { searchId, offerUserName, offerLink } = parsed.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: search, error: searchErr } = await supabase
      .from("property_searches")
      .select("user_id, property_type, city, title")
      .eq("id", searchId)
      .single();

    if (searchErr || !search) {
      return new Response(JSON.stringify({ error: "Procura não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, name")
      .eq("id", search.user_id)
      .single();

    if (!profile?.phone) {
      return new Response(JSON.stringify({ error: "Telefone do proprietário não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeLabels: Record<string, string> = {
      CASA: 'Casa', APARTAMENTO: 'Apartamento', SALA_COMERCIAL: 'Sala Comercial',
      LOTE: 'Lote', RURAL: 'Rural', PREDIO_COMERCIAL: 'Prédio Comercial',
    };

    const typeName = typeLabels[search.property_type] ?? search.property_type;
    let message = `*🏠 Nova Oferta Recebida!*\n\nOlá${profile.name ? `, ${profile.name}` : ''}! O corretor *${offerUserName}* enviou uma oferta na sua procura de *${typeName}* em *${search.city}*.`;

    if (offerLink) {
      message += `\n\n🔗 Link do anúncio: ${offerLink}`;
    }

    message += `\n\nAcesse o Mural de Demandas para ver mais detalhes.`;

    const MEGA_API_TOKEN = Deno.env.get("MEGA_API_TOKEN");
    if (!MEGA_API_TOKEN) {
      console.error("MEGA_API_TOKEN not configured");
      return new Response(JSON.stringify({ error: "MEGA_API_TOKEN not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clean = profile.phone.replace(/\D/g, '');
    const fullPhone = clean.startsWith('55') ? clean : `55${clean}`;

    const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text";
    const megaBody = {
      messageData: {
        to: `${fullPhone}@s.whatsapp.net`,
        text: message,
      },
    };

    const sent = await sendMegaMessage(megaUrl, MEGA_API_TOKEN, megaBody, 1);

    return new Response(JSON.stringify({ success: true, whatsapp_sent: sent }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
