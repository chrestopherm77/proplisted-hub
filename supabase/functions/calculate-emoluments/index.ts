import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z
  .object({
    codigo_municipio: z.number().int().positive(),
    consulta_id: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    valor_imovel: z.number().positive(),
    valor_financiamento: z.number().nonnegative().optional(),
    desconto: z.string().trim().max(50).optional(),
  })
  .refine(
    (d) =>
      d.valor_financiamento === undefined ||
      d.valor_financiamento <= d.valor_imovel,
    {
      message: "valor_financiamento deve ser <= valor_imovel",
      path: ["valor_financiamento"],
    }
  );

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("CALCULADORA_API_TOKEN");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token da Calculadora não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Parâmetros inválidos", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { codigo_municipio, consulta_id, valor_imovel, valor_financiamento, desconto } =
      parsed.data;

    const formData = new FormData();
    formData.append("codigo_municipio", String(codigo_municipio));
    formData.append("consulta_id", String(consulta_id));
    formData.append("valor_imovel", valor_imovel.toFixed(2));
    if (valor_financiamento !== undefined) {
      formData.append("valor_financiamento", valor_financiamento.toFixed(2));
    }
    if (desconto) {
      formData.append("desconto", desconto);
    }

    const apiRes = await fetch(
      "https://calculadora.registrodeimoveis.org.br/api/calculate",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const text = await apiRes.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!apiRes.ok) {
      console.error("Erro Calculadora API", apiRes.status, data);
      return new Response(
        JSON.stringify({ error: "Erro na API da Calculadora", status: apiRes.status, data }),
        { status: apiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("calculate-emoluments error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
