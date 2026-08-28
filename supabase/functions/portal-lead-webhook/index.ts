import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://conectaeimob.com.br',
  'https://www.conectaeimob.com.br',
  'https://proplisted-hub.lovable.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.lovable.app') || origin.startsWith('http://localhost')
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  try {
    const { lead_id } = await req.json();
    if (typeof lead_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(lead_id)) {
      return json({ error: 'lead_id inválido' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: lead, error } = await supabase
      .from('portal_property_leads')
      .select('id, name, phone, property_id, broker_user_id, created_at')
      .eq('id', lead_id)
      .maybeSingle();

    if (error || !lead) return json({ error: 'Lead não encontrado' }, 404);

    const webhookUrl = Deno.env.get('PORTAL_LEAD_WEBHOOK_URL');
    if (!webhookUrl) {
      await supabase.from('portal_property_leads')
        .update({ webhook_status: 'PENDING', webhook_last_error: 'PORTAL_LEAD_WEBHOOK_URL não configurada' })
        .eq('id', lead.id);
      return json({ ok: true, dispatched: false, reason: 'webhook_not_configured' });
    }

    const [{ data: property }, { data: broker }] = await Promise.all([
      supabase.from('properties')
        .select('reference_code, title, property_type, operation_type, price_sale, price_rent, city, state, neighborhood')
        .eq('id', lead.property_id).maybeSingle(),
      supabase.from('profiles').select('full_name, phone, email').eq('id', lead.broker_user_id).maybeSingle(),
    ]);

    const payload = {
      lead_id: lead.id,
      lead_name: lead.name,
      lead_phone: lead.phone,
      created_at: lead.created_at,
      property: property ?? null,
      broker: broker ? { name: (broker as any).full_name, phone: (broker as any).phone, email: (broker as any).email } : null,
    };

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Webhook retornou ${res.status}`);
      await supabase.from('portal_property_leads')
        .update({ webhook_status: 'SENT', webhook_sent_at: new Date().toISOString(), webhook_last_error: null })
        .eq('id', lead.id);
      return json({ ok: true, dispatched: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase.from('portal_property_leads')
        .update({ webhook_status: 'ERROR', webhook_last_error: msg })
        .eq('id', lead.id);
      return json({ ok: false, dispatched: false, error: msg });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('portal-lead-webhook error:', msg);
    return json({ error: msg }, 500);
  }
});
