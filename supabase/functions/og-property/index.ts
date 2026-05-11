// Edge function que serve uma página HTML com Open Graph meta tags
// para um imóvel específico e redireciona o usuário (não-bot) para a
// URL final no portal do corretor. O Facebook/WhatsApp/Telegram leem
// as meta tags daqui (eles não executam JS).
//
// Uso:
//   /functions/v1/og-property?p=<property_id>&portal=<portal_slug_ou_dominio>
//
// Configuração: público (verify_jwt = false).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatBRL(v: number | null | undefined): string {
  if (!v) return "Consulte";
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(Number(v));
  } catch {
    return `R$ ${v}`;
  }
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get("p");
    const portalRef = url.searchParams.get("portal") || "";

    if (!propertyId) {
      return new Response("Missing property id", { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: property } = await supabase
      .from("properties")
      .select(
        "id, property_type, operation_type, price_sale, price_rent, bedrooms, bathrooms, parking_spots, area_total, neighborhood, city, state, photos, additional_info, reference_code, title",
      )
      .eq("id", propertyId)
      .maybeSingle();

    if (!property) {
      return new Response("Imóvel não encontrado", {
        status: 404,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    // Resolve portal (por slug ou custom_domain)
    let portalSlug = "";
    let portalDomain = "";
    if (portalRef) {
      const { data: portal } = await supabase
        .from("broker_portals")
        .select("slug, custom_domain")
        .or(`slug.eq.${portalRef},custom_domain.eq.${portalRef.toLowerCase()}`)
        .maybeSingle();
      if (portal) {
        portalSlug = portal.slug;
        portalDomain = portal.custom_domain || "";
      }
    }

    // Monta URL final que o usuário vai ver
    const finalUrl = portalDomain
      ? `https://${portalDomain}/?imovel=${propertyId}`
      : portalSlug
      ? `https://proplisted-hub.lovable.app/portal/${portalSlug}?imovel=${propertyId}`
      : `https://proplisted-hub.lovable.app/imovel/${propertyId}`;

    const price = property.price_sale ?? property.price_rent;
    const operation = property.operation_type === "RENT"
      ? "Aluguel"
      : property.operation_type === "SALE"
      ? "Venda"
      : "";
    const ptype = property.property_type ?? "Imóvel";
    const location = [property.neighborhood, property.city, property.state]
      .filter(Boolean)
      .join(", ");

    const title = `${ptype} ${operation ? `para ${operation}` : ""} - ${formatBRL(price)}${location ? ` - ${location}` : ""}`.trim();

    const descParts: string[] = [];
    if (property.bedrooms) descParts.push(`${property.bedrooms} quartos`);
    if (property.bathrooms) descParts.push(`${property.bathrooms} banheiros`);
    if (property.parking_spots) descParts.push(`${property.parking_spots} vagas`);
    if (property.area_total) descParts.push(`${property.area_total} m²`);
    const descBase = descParts.join(" · ");
    const descRich = property.additional_info?.toString().slice(0, 200) || property.title || "";
    const description = [descBase, descRich].filter(Boolean).join(" — ") || "Confira este imóvel.";

    const photos: string[] = Array.isArray(property.photos) ? property.photos : [];
    const image = photos[0] || "https://proplisted-hub.lovable.app/placeholder.svg";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${escapeHtml(finalUrl)}">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">

<link rel="canonical" href="${escapeHtml(finalUrl)}">
<meta http-equiv="refresh" content="0; url=${escapeHtml(finalUrl)}">
<script>window.location.replace(${JSON.stringify(finalUrl)});</script>
<style>body{font-family:system-ui,sans-serif;text-align:center;padding:40px;color:#333}</style>
</head>
<body>
<p>Redirecionando para o imóvel...</p>
<p><a href="${escapeHtml(finalUrl)}">Clique aqui se não for redirecionado.</a></p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  } catch (e) {
    return new Response(`Erro: ${e instanceof Error ? e.message : String(e)}`, {
      status: 500,
    });
  }
});
