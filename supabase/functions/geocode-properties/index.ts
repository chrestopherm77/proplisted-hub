// Edge function: geocode properties via Nominatim (OSM)
// Two modes:
//  - single: POST { property_id } -> geocodes one property (owner or admin)
//  - backfill: POST {} or { backfill: true } -> geocodes up to 50 properties (admin only)
// Respects 1 req/s rate limit on backfill. Uses progressive fallback.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface PropertyParts {
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
}

async function geocodeQuery(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'LeadBay/1.0 (contato@leadbay.com.br)',
        'Accept-Language': 'pt-BR',
      },
    });
    if (!res.ok) return null;
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const lat = parseFloat(arr[0].lat);
    const lng = parseFloat(arr[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch (e) {
    console.warn('[geocode] query error', query, e);
    return null;
  }
}

// Progressive fallback: tries full address, then neighborhood-level, then city-level.
async function geocodeProgressive(parts: PropertyParts): Promise<{ lat: number; lng: number } | null> {
  const variants: string[] = [];
  const join = (segs: (string | null | undefined)[]) =>
    segs.filter((p) => p && String(p).trim().length > 0).join(', ');

  // 1) Full address
  const full = join([parts.address, parts.neighborhood, parts.city, parts.state, 'Brasil']);
  if (full) variants.push(full);

  // 2) Neighborhood + city
  if (parts.neighborhood) {
    const nb = join([parts.neighborhood, parts.city, parts.state, 'Brasil']);
    if (nb && nb !== full) variants.push(nb);
  }

  // 3) City only
  const cityOnly = join([parts.city, parts.state, 'Brasil']);
  if (cityOnly && !variants.includes(cityOnly)) variants.push(cityOnly);

  for (let i = 0; i < variants.length; i++) {
    const result = await geocodeQuery(variants[i]);
    if (result) return result;
    if (i < variants.length - 1) await sleep(1100); // respect rate limit between fallbacks
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate caller (must be authenticated)
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Check admin role (used for backfill or to bypass ownership)
    const { data: roleData } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userRes.user.id)
      .eq('role', 'MASTER_ADMIN')
      .maybeSingle();
    const isAdmin = !!roleData;

    // Parse body (optional)
    let body: { property_id?: string; backfill?: boolean } = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch {
      body = {};
    }

    // ---------- SINGLE MODE ----------
    if (body.property_id) {
      const { data: prop, error: propErr } = await admin
        .from('properties')
        .select('id, user_id, address, neighborhood, city, state, latitude, longitude')
        .eq('id', body.property_id)
        .maybeSingle();

      if (propErr || !prop) {
        return new Response(JSON.stringify({ error: 'Imóvel não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Owner or admin only
      if (prop.user_id !== userRes.user.id && !isAdmin) {
        return new Response(JSON.stringify({ error: 'Sem permissão' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await geocodeProgressive({
        address: prop.address,
        neighborhood: prop.neighborhood,
        city: prop.city,
        state: prop.state,
      });

      if (!result) {
        return new Response(JSON.stringify({ success: false, message: 'Endereço não localizado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await admin
        .from('properties')
        .update({ latitude: result.lat, longitude: result.lng })
        .eq('id', prop.id);

      return new Response(
        JSON.stringify({ success: true, latitude: result.lat, longitude: result.lng }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- BACKFILL MODE (admin only) ----------
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Acesso restrito a administradores' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: rows, error } = await admin
      .from('properties')
      .select('id, address, neighborhood, city, state')
      .eq('is_active', true)
      .is('latitude', null)
      .limit(50);

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: 'Nada para geocodificar' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let success = 0;
    let failed = 0;

    for (const row of rows) {
      const result = await geocodeProgressive({
        address: row.address,
        neighborhood: row.neighborhood,
        city: row.city,
        state: row.state,
      });
      if (result) {
        await admin
          .from('properties')
          .update({ latitude: result.lat, longitude: result.lng })
          .eq('id', row.id);
        success++;
      } else {
        failed++;
      }
      await sleep(1100); // Nominatim 1 req/s
    }

    return new Response(
      JSON.stringify({
        processed: rows.length,
        success,
        failed,
        message: `Geocodificados ${success} de ${rows.length} imóveis`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[geocode-properties] error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
