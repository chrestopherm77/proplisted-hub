import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INTENTION_MAP: Record<string, string> = {
  SELL: 'venda',
  BUY: 'compra',
  BUILD: 'construção',
  RENT: 'aluguel',
};

function formatPhoneForApi(phone: string): string {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('55') && cleanPhone.length > 11) {
    cleanPhone = cleanPhone.substring(2);
  }
  if (cleanPhone.length === 11 && cleanPhone[2] === '9') {
    cleanPhone = cleanPhone.substring(0, 2) + cleanPhone.substring(3);
  }
  return cleanPhone;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch incomplete leads older than 10 minutes, not yet recovered, with phone
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: leads, error: fetchError } = await supabase
      .from('lp_partial_leads')
      .select('*')
      .eq('completed', false)
      .is('recovery_sent_at', null)
      .not('phone', 'is', null)
      .not('name', 'is', null)
      .lt('updated_at', tenMinutesAgo)
      .limit(50);

    if (fetchError) {
      console.error('Error fetching partial leads:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch leads' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!leads || leads.length === 0) {
      console.log('No abandoned leads to recover');
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const megaApiToken = Deno.env.get('MEGA_API_TOKEN');
    if (!megaApiToken) {
      console.error('MEGA_API_TOKEN not configured');
      return new Response(JSON.stringify({ error: 'WhatsApp service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;

    for (const lead of leads) {
      try {
        const nome = (lead.name || '').split(' ')[0]; // First name only
        const objetivo = INTENTION_MAP[lead.intention || ''] || 'imóveis';
        const sourceLp = lead.source_lp || '/lp';
        const link = `https://leadbay.com.br${sourceLp}?resume=${lead.session_id}`;

        const messageText = `Olá ${nome}! Tudo bem? 😊\n\nVimos que você não finalizou o cadastro na LeadBay em relação a sua busca por *${objetivo}*.\n\nVou enviar nosso link de cadastro novamente para encontrarmos a melhor solução para você:\n\n👉 ${link}`;

        const formattedPhone = formatPhoneForApi(lead.phone);
        const whatsappNumber = `55${formattedPhone}@s.whatsapp.net`;

        const megaResponse = await fetch(
          'https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${megaApiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messageData: {
                to: whatsappNumber,
                text: messageText,
              },
            }),
          }
        );

        if (!megaResponse.ok) {
          const errorText = await megaResponse.text();
          console.error(`Failed to send recovery to ${lead.session_id}:`, errorText);
          continue;
        }

        // Mark as recovered
        const { error: updateError } = await supabase
          .from('lp_partial_leads')
          .update({ recovery_sent_at: new Date().toISOString() })
          .eq('id', lead.id);

        if (updateError) {
          console.error(`Failed to mark recovery for ${lead.session_id}:`, updateError);
        } else {
          processed++;
          console.log(`Recovery sent to ${lead.session_id} (${nome})`);
        }
      } catch (err) {
        console.error(`Error processing lead ${lead.session_id}:`, err);
      }
    }

    console.log(`Recovery complete: ${processed}/${leads.length} processed`);

    return new Response(JSON.stringify({ processed, total: leads.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in recovery-abandoned-lead:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
