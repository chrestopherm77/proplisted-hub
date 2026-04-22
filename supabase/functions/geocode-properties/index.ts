// Edge function: geocode properties via Nominatim (OSM)
// Modes:
//  - single: POST { property_id } -> geocodes one property (owner or admin via JWT)
//  - backfill: POST {} or { backfill: true } -> drains pending_geocodes queue
//      Auth: admin JWT OR x-cron-secret header matching CRON_SECRET
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
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

// Progressive fallback: full → neighborhood+city → city+UF.
// Returns the result + which variant succeeded for logging.
async function geocodeProgressive(
  parts: PropertyParts,
  refLabel = '',
): Promise<{ lat: number; lng: number; matchedVariant: string } | null> {
  const variants: string[] = [];
  const join = (segs: (string | null | undefined)[]) =>
    segs.filter((p) => p && String(p).trim().length > 0).join(', ');

  const full = join([parts.address, parts.neighborhood, parts.city, parts.state, 'Brasil']);
  if (full) variants.push(full);

  if (parts.neighborhood) {
    const nb = join([parts.neighborhood, parts.city, parts.state, 'Brasil']);
    if (nb && nb !== full) variants.push(nb);
  }

  const cityOnly = join([parts.city, parts.state, 'Brasil']);
  if (cityOnly && !variants.includes(cityOnly)) variants.push(cityOnly);

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const result = await geocodeQuery(variant);
    if (result) {
      console.log(`[geocode] ${refLabel} matched on variant ${i + 1}/${variants.length}: "${variant}" → (${result.lat}, ${result.lng})`);
      return { ...result, matchedVariant: variant };
    } else {
      console.log(`[geocode] ${refLabel} miss on variant ${i + 1}/${variants.length}: "${variant}"`);
    }
    if (i < variants.length - 1) await sleep(1100);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cronSecret = Deno.env.get('CRON_SECRET') ?? '';

    // Parse body first
    let body: { property_id?: string; backfill?: boolean } = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch {
      body = {};
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Cron auth path: x-cron-secret header
    const incomingSecret = req.headers.get('x-cron-secret') ?? '';
    const isCron = !!cronSecret && incomingSecret === cronSecret;

    let userId: string | null = null;
    let isAdmin = false;

    if (!isCron) {
      // JWT auth path
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
      userId = userRes.user.id;
      const { data: roleData } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'MASTER_ADMIN')
        .maybeSingle();
      isAdmin = !!roleData;
    }

    // ---------- SINGLE MODE ----------
    if (body.property_id) {
      const { data: prop, error: propErr } = await admin
        .from('properties')
        .select('id, reference_code, user_id, address, neighborhood, city, state')
        .eq('id', body.property_id)
        .maybeSingle();

      if (propErr || !prop) {
        return new Response(JSON.stringify({ error: 'Imóvel não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Owner, admin or cron only
      if (!isCron && prop.user_id !== userId && !isAdmin) {
        return new Response(JSON.stringify({ error: 'Sem permissão' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await geocodeProgressive(
        {
          address: prop.address,
          neighborhood: prop.neighborhood,
          city: prop.city,
          state: prop.state,
        },
        `property ${prop.reference_code}`,
      );

      if (!result) {
        // Mark queue with error so cron can retry later
        await admin
          .from('pending_geocodes')
          .upsert(
            { property_id: prop.id, last_error: 'Endereço não localizado em nenhuma variante' },
            { onConflict: 'property_id' },
          );
        return new Response(JSON.stringify({ success: false, message: 'Endereço não localizado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await admin
        .from('properties')
        .update({ latitude: result.lat, longitude: result.lng })
        .eq('id', prop.id);

      // Trigger removes from queue when latitude becomes non-null

      return new Response(
        JSON.stringify({
          success: true,
          latitude: result.lat,
          longitude: result.lng,
          matched: result.matchedVariant,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ---------- BACKFILL MODE ----------
    // admin or cron required
    if (!isCron && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Acesso restrito a administradores' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Drain queue: up to 30 with attempts < 5
    const { data: queue, error: qErr } = await admin
      .from('pending_geocodes')
      .select('id, property_id, attempts')
      .lt('attempts', 5)
      .order('attempts', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(30);

    if (qErr) throw qErr;
    if (!queue || queue.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: 'Fila vazia' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch properties for queued ids
    const propIds = queue.map((q) => q.property_id);
    const { data: props, error: pErr } = await admin
      .from('properties')
      .select('id, reference_code, address, neighborhood, city, state')
      .in('id', propIds);
    if (pErr) throw pErr;

    const propMap = new Map((props ?? []).map((p) => [p.id, p]));

    let success = 0;
    let failed = 0;

    for (const item of queue) {
      const prop = propMap.get(item.property_id);
      if (!prop) {
        // Property gone — clear queue row
        await admin.from('pending_geocodes').delete().eq('id', item.id);
        continue;
      }

      const result = await geocodeProgressive(
        {
          address: prop.address,
          neighborhood: prop.neighborhood,
          city: prop.city,
          state: prop.state,
        },
        `property ${prop.reference_code}`,
      );

      if (result) {
        await admin
          .from('properties')
          .update({ latitude: result.lat, longitude: result.lng })
          .eq('id', prop.id);
        // Trigger removes queue row automatically
        success++;
      } else {
        await admin
          .from('pending_geocodes')
          .update({
            attempts: (item.attempts ?? 0) + 1,
            last_error: 'Nenhuma variante (endereço/bairro/cidade) encontrada no Nominatim',
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);
        failed++;
      }
      await sleep(1100); // Nominatim 1 req/s
    }

    return new Response(
      JSON.stringify({
        processed: queue.length,
        success,
        failed,
        message: `Geocodificados ${success} de ${queue.length} imóveis`,
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
