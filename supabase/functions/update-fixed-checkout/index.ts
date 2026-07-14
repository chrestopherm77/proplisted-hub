import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const isSandbox = Deno.env.get('ASAAS_SANDBOX_MODE') === 'true';
    const ASAAS_API_KEY = isSandbox ? Deno.env.get('ASAAS_SANDBOX_API_KEY') : Deno.env.get('ASAAS_API_KEY');
    const ASAAS_BASE_URL = isSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
    if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY não configurada');

    const THANK_YOU_URL = 'https://conectei.digital/lp/liveconectae/obrigado';
    const SHORT = '63rrzg54twfk3y1w';

    const headers = {
      'access_token': ASAAS_API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': 'Conectae-System',
    };

    // Lista payment links e localiza pelo shortUrl
    const listRes = await fetch(`${ASAAS_BASE_URL}/paymentLinks?limit=100`, { headers });
    const listData = await listRes.json();
    if (!listRes.ok) {
      return new Response(JSON.stringify({ step: 'list', error: listData }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const match = (listData.data || []).find((l: any) =>
      (l.url || '').includes(SHORT) || l.id === SHORT
    );
    if (!match) {
      return new Response(JSON.stringify({ error: 'Payment link não encontrado', all: listData.data?.map((l: any) => ({ id: l.id, url: l.url, name: l.name })) }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const updatePayload = {
      callback: {
        successUrl: THANK_YOU_URL,
        autoRedirect: true,
      },
    };

    const updRes = await fetch(`${ASAAS_BASE_URL}/paymentLinks/${match.id}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(updatePayload),
    });
    const updData = await updRes.json();

    return new Response(
      JSON.stringify({ success: updRes.ok, id: match.id, url: match.url, updated: updData }),
      { status: updRes.ok ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
