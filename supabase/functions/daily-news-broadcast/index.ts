const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth: accept CRON_SECRET or SUPABASE_ANON_KEY
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const cronSecret = Deno.env.get("CRON_SECRET");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const isAuthorized =
      (cronSecret && token === cronSecret) ||
      (anonKey && token === anonKey);
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MEGA_API_TOKEN = Deno.env.get("MEGA_API_TOKEN");
    if (!MEGA_API_TOKEN) {
      return new Response(JSON.stringify({ error: "MEGA_API_TOKEN não configurado" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message =
      `☀️ *Bom dia, time Leadbay!*\n\n` +
      `📰 *Giro do Mercado Imobiliário*\n\n` +
      `Confira as notícias que estão movimentando o mercado imobiliário hoje e saia na frente da concorrência:\n\n` +
      `✅ Tendências de preços\n` +
      `✅ Novidades em financiamento\n` +
      `✅ Lançamentos e oportunidades\n` +
      `✅ Mudanças regulatórias\n\n` +
      `Informação é a base de toda boa negociação. 💼\n\n` +
      `👉 Acesse agora: https://www.leadbay.com.br/giro-do-mercado\n\n` +
      `Bons negócios! 🚀`;

    const WHATSAPP_GROUP_IDS = [
      "120363407964054463@g.us",
      "120363426047592689@g.us",
      "120363410244397205@g.us",
    ];
    const megaUrl = "https://apinocode01.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text";

    const results: Array<{ groupId: string; success: boolean; details: string }> = [];

    for (const groupId of WHATSAPP_GROUP_IDS) {
      const megaBody = { messageData: { to: groupId, text: message } };
      let lastDetails = "";
      let success = false;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(megaUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${MEGA_API_TOKEN}` },
            body: JSON.stringify(megaBody),
          });
          const resBody = await res.text();
          console.log(`Daily news [${groupId}] attempt ${attempt}: ${res.status} - ${resBody.substring(0, 300)}`);
          lastDetails = resBody.substring(0, 300);

          let parsed: { error?: boolean } = {};
          try { parsed = JSON.parse(resBody); } catch { /* non-json */ }

          if (res.ok && !parsed.error) {
            success = true;
            break;
          }
          if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
        } catch (fetchErr) {
          console.error(`Daily news [${groupId}] fetch error attempt ${attempt}:`, fetchErr);
          lastDetails = String(fetchErr);
          if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
        }
      }

      results.push({ groupId, success, details: lastDetails });
      await new Promise((r) => setTimeout(r, 700));
    }

    const anySuccess = results.some((r) => r.success);
    return new Response(JSON.stringify({ success: anySuccess, results }), {
      status: anySuccess ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
