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

    // Página de obrigado oficial do evento
    const THANK_YOU_URL = 'https://conectei.digital/lp/liveconectae/obrigado';

    // Payment Link (permanente, sem expiração)
    const payload = {
      name: 'Evento Conectae',
      description: 'Evento Conectae',
      billingType: 'UNDEFINED', // permite PIX, boleto e cartão
      chargeType: 'DETACHED',
      value: 9.90,
      dueDateLimitDays: 3,
      notificationEnabled: true,
      endDate: null, // sem data de expiração
      callback: {
        successUrl: THANK_YOU_URL,
        autoRedirect: true,
      },
    };

    const res = await fetch(`${ASAAS_BASE_URL}/paymentLinks`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'Conectae-System',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Asaas error:', data);
      return new Response(JSON.stringify({ error: data }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(
      JSON.stringify({ success: true, paymentLinkUrl: data.url, paymentLinkId: data.id, raw: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
