import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  leadId: z.string().uuid(),
  city: z.string().min(1).max(200),
  uf: z.string().max(10).optional(),
  intention: z.string().min(1).max(20),
  formData: z.record(z.unknown()),
});

/**
 * Normaliza telefone brasileiro para formato WhatsApp (12 dígitos):
 * 55 + DDD(2) + número(8). Remove o nono dígito quando presente.
 */
function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCC = digits.startsWith('55') ? digits : `55${digits}`;
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

function parseMoney(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim();
  if (!s) return 0;
  const d = s.replace(/\D/g, '');
  if (!d) return 0;
  // Lead form salva valores mascarados em centavos (ex: "R$ 350.000,00" -> 35000000).
  // Detectamos pelo prefixo "R$" ou pela presença de separador decimal.
  const isMaskedCents = /R\$/i.test(s) || /[.,]\d{2}\b/.test(s);
  const n = parseInt(d, 10);
  return isMaskedCents ? Math.round(n / 100) : n;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
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

    const { leadId, city, intention, formData } = parsed.data;
    const intentionUpper = intention.toUpperCase();

    // Só processa BUY e RENT (matches diretos com publicação)
    if (intentionUpper !== "BUY" && intentionUpper !== "RENT") {
      console.log(`Lead ${leadId} intention=${intentionUpper}, skipping property match`);
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "intention" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const flowKey = intentionUpper.toLowerCase();
    const flow = (formData[flowKey] as Record<string, unknown>) || {};

    let budgetMin = 0;
    let budgetMax = 0;
    let budgetLabel = "";

    if (intentionUpper === "BUY") {
      budgetMin = parseMoney(flow.budgetMin);
      budgetMax = parseMoney(flow.budgetMax);
      if (budgetMin && budgetMax) budgetLabel = `${fmtMoney(budgetMin)} a ${fmtMoney(budgetMax)}`;
      else if (budgetMax) budgetLabel = `até ${fmtMoney(budgetMax)}`;
      else if (budgetMin) budgetLabel = `a partir de ${fmtMoney(budgetMin)}`;
    } else {
      budgetMax = parseMoney(flow.maxRent);
      if (budgetMax) budgetLabel = `até ${fmtMoney(budgetMax)}/mês`;
    }

    console.log(`Match check for lead ${leadId}: city="${city}", intention=${intentionUpper}, min=${budgetMin}, max=${budgetMax}`);

    // Busca imóveis ativos na mesma cidade (case-insensitive)
    const { data: properties, error: propErr } = await supabase
      .from("properties")
      .select("id, user_id, reference_code, title, property_type, operation_type, city, price_sale, price_rent, created_at")
      .eq("is_active", true)
      .ilike("city", city.trim());

    if (propErr) {
      console.error("Error fetching properties:", propErr);
      return new Response(JSON.stringify({ error: "DB error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!properties || properties.length === 0) {
      console.log(`No active properties in ${city}`);
      return new Response(JSON.stringify({ success: true, matched: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filtra por operation_type + faixa de preço
    const matches = properties.filter((p) => {
      const op = p.operation_type;
      if (intentionUpper === "BUY") {
        if (op !== "SALE" && op !== "BOTH") return false;
        const price = Number(p.price_sale) || 0;
        if (!price) return false;
        if (budgetMin && price < budgetMin) return false;
        if (budgetMax && price > budgetMax) return false;
        return true;
      } else {
        // RENT
        if (op !== "RENT" && op !== "BOTH") return false;
        const price = Number(p.price_rent) || 0;
        if (!price) return false;
        if (budgetMax && price > budgetMax) return false;
        return true;
      }
    });

    console.log(`Found ${matches.length} matching properties out of ${properties.length} in ${city}`);

    if (matches.length === 0) {
      return new Response(JSON.stringify({ success: true, matched: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduplica por user_id (mantém o mais recente)
    const sorted = [...matches].sort((a, b) =>
      String(b.created_at || "").localeCompare(String(a.created_at || ""))
    );
    const byUser = new Map<string, typeof sorted[number]>();
    for (const p of sorted) {
      if (!byUser.has(p.user_id)) byUser.set(p.user_id, p);
    }

    const userIds = [...byUser.keys()];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, phone, name")
      .in("id", userIds);

    const MEGA_API_TOKEN = Deno.env.get("MEGA_API_TOKEN");
    if (!MEGA_API_TOKEN) {
      console.error("MEGA_API_TOKEN not configured");
      return new Response(JSON.stringify({ error: "MEGA_API_TOKEN not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text";
    const actionLabel = intentionUpper === "BUY" ? "COMPRAR" : "ALUGAR";
    let sent = 0;

    for (const profile of profiles || []) {
      if (!profile.phone) continue;
      const property = byUser.get(profile.id);
      if (!property) continue;

      const fullPhone = normalizeWhatsAppPhone(profile.phone);
      if (fullPhone.length < 12) continue;

      const firstName = profile.name?.split(" ")[0] || "";
      const propTitle = property.title || property.property_type;

      const message =
        `🎯 *Novo lead com perfil pro seu imóvel!*\n\n` +
        `Olá${firstName ? `, ${firstName}` : ""}!\n\n` +
        `Imóvel: *${propTitle}* (Ref: ${property.reference_code})\n` +
        `Cidade: ${property.city}\n\n` +
        `Acabou de chegar um lead em *${city}* interessado em *${actionLabel}*` +
        `${budgetLabel ? ` na faixa de *${budgetLabel}*` : ""}.\n\n` +
        `Acesse o Marketplace pra ver os detalhes:\n` +
        `👉 https://www.conectaeimob.com.br/leads`;

      const ok = await sendMegaMessage(
        megaUrl,
        MEGA_API_TOKEN,
        { messageData: { to: `${fullPhone}@s.whatsapp.net`, text: message } },
        1,
      );
      if (ok) {
        sent++;
        console.log(`Property match WhatsApp sent to user ${profile.id} (${fullPhone}) for property ${property.reference_code}`);
      } else {
        console.error(`Property match WhatsApp FAILED to user ${profile.id} (${fullPhone})`);
      }
      // 600ms delay between messages
      await new Promise(r => setTimeout(r, 600));
    }

    return new Response(JSON.stringify({ success: true, matched: matches.length, sent }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-property-match error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
