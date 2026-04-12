import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "@supabase/supabase-js/cors";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const BodySchema = z.object({
  modality: z.string().min(1).max(200),
  uf: z.string().min(2).max(2),
  city: z.string().min(1).max(200),
  propertyValue: z.string().min(1).max(50),
  familyIncome: z.string().min(1).max(50),
  birthDate: z.string().min(1).max(20),
  useFgts: z.enum(["Sim", "Não"]),
  userName: z.string().min(1).max(200),
  userPhone: z.string().min(1).max(30),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const d = parsed.data;

    const message = `*🏦 Nova Simulação de Financiamento*

*Corretor:* ${d.userName}
*Telefone:* ${d.userPhone}

*Modalidade:* ${d.modality}
*UF do Imóvel:* ${d.uf}
*Cidade:* ${d.city}
*Valor Aprox. do Imóvel:* ${d.propertyValue}
*Renda Bruta Familiar:* ${d.familyIncome}
*Nasc. Proponente Mais Velho:* ${d.birthDate}
*Utilizar FGTS:* ${d.useFgts}`;

    const MEGA_API_TOKEN = Deno.env.get("MEGA_API_TOKEN");
    if (!MEGA_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: "MEGA_API_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const megaRes = await fetch(
      "https://api.megaapi.com.br/rest/sendMessage/megacode-Mj46Nd4U5tP/text",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MEGA_API_TOKEN}`,
        },
        body: JSON.stringify({
          messageData: {
            to: "553191914663@s.whatsapp.net",
            text: message,
          },
        }),
      }
    );

    if (!megaRes.ok) {
      const errText = await megaRes.text();
      console.error("Mega API error:", errText);
      return new Response(
        JSON.stringify({ error: "Falha ao enviar mensagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
