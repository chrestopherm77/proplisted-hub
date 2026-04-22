// Edge function: backfill latitude/longitude for properties via Nominatim (OSM)
// Respects 1 req/s rate limit. Admin-only (validates JWT + MASTER_ADMIN role).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate caller (must be authenticated admin)
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
    const { data: roleData } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userRes.user.id)
      .eq('role', 'MASTER_ADMIN')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Acesso restrito a administradores' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch up to 50 properties needing geocoding
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
      const query = [row.address, row.neighborhood, row.city, row.state, 'Brasil']
        .filter((p) => p && String(p).trim().length > 0)
        .join(', ');

      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'LeadBay/1.0 (contato@leadbay.com.br)',
            'Accept-Language': 'pt-BR',
          },
        });
        if (res.ok) {
          const arr = await res.json();
          if (Array.isArray(arr) && arr.length > 0) {
            const lat = parseFloat(arr[0].lat);
            const lng = parseFloat(arr[0].lon);
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              await admin
                .from('properties')
                .update({ latitude: lat, longitude: lng })
                .eq('id', row.id);
              success++;
            } else {
              failed++;
            }
          } else {
            failed++;
          }
        } else {
          failed++;
        }
      } catch (e) {
        console.warn('geocode error', row.id, e);
        failed++;
      }

      // Nominatim allows 1 req/s
      await sleep(1100);
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
