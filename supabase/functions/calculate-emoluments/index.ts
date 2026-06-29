import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface RespondPayload {
  ok: boolean;
  data?: unknown;
  error?: string;
  upstreamStatus?: number;
  upstreamBody?: unknown;
  sentPayload?: Record<string, string>;
}

function respond(payload: RespondPayload, httpStatus = 200) {
  return new Response(JSON.stringify(payload), {
    status: httpStatus,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("CALCULADORA_API_TOKEN");
    if (!token) {
      return respond({
        ok: false,
        error: "Token da Calculadora não configurado no servidor.",
      });
    }

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return respond({
        ok: false,
        error: "Parâmetros inválidos.",
        upstreamBody: parsed.error.flatten(),
      });
    }

    const { codigo_municipio, consulta_id, valor_imovel, valor_financiamento, desconto } =
      parsed.data;

    const formData = new FormData();
    formData.append("codigo_municipio", String(codigo_municipio));
    formData.append("consulta_id", String(consulta_id));
    formData.append("valor_imovel", valor_imovel.toFixed(2));
    if (valor_financiamento !== undefined && valor_financiamento > 0) {
      formData.append("valor_financiamento", valor_financiamento.toFixed(2));
    }
    if (desconto) {
      formData.append("desconto", desconto);
    }

    const sentPayload: Record<string, string> = {};
    formData.forEach((v, k) => {
      sentPayload[k] = String(v);
    });
    console.log("[calculate-emoluments] Enviando para API:", sentPayload);

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

    console.log(
      "[calculate-emoluments] Resposta API status:",
      apiRes.status,
      "body:",
      data
    );

    if (!apiRes.ok) {
      let friendly = "A Calculadora externa não conseguiu processar a requisição.";

      // Tenta extrair errorMessage do body upstream (formato padrão da API)
      const upstreamMsg =
        data && typeof data === "object" && data !== null
          ? (data as Record<string, unknown>).errorMessage
          : undefined;

      if (apiRes.status === 400) {
        friendly =
          typeof upstreamMsg === "string" && upstreamMsg.trim().length > 0
            ? upstreamMsg
            : "Parâmetros rejeitados pela Calculadora externa. Verifique município, valor e desconto selecionado.";
      } else if (apiRes.status === 500) {
        friendly =
          "A Calculadora externa retornou erro interno. Geralmente isso ocorre quando o município escolhido ainda não tem tabela de emolumentos cadastrada — tente outro município ou tipo de consulta.";
      } else if (apiRes.status === 401 || apiRes.status === 403) {
        friendly = "Token de acesso à Calculadora inválido ou expirado.";
      } else if (apiRes.status === 422) {
        friendly =
          typeof upstreamMsg === "string" && upstreamMsg.trim().length > 0
            ? upstreamMsg
            : "Parâmetros rejeitados pela Calculadora externa. Confira valor e tipo de consulta.";
      } else if (apiRes.status === 404) {
        friendly = "Município não encontrado na base da Calculadora.";
      }

      return respond({
        ok: false,
        error: friendly,
        upstreamStatus: apiRes.status,
        upstreamBody: data,
        sentPayload,
      });
    }

    return respond({
      ok: true,
      data,
      upstreamStatus: apiRes.status,
      sentPayload,
    });
  } catch (err) {
    console.error("[calculate-emoluments] erro inesperado:", err);
    return respond({
      ok: false,
      error: (err as Error).message ?? "Erro desconhecido no servidor.",
    });
  }
});
