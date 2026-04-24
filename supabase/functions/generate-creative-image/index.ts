import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CREATIVE_COST = 10;

const FORMAT_HINTS: Record<string, string> = {
  POST: "quadrado 1:1, 1080x1080 pixels (post de feed Instagram)",
  STORIES: "vertical 9:16, 1080x1920 pixels (stories Instagram)",
  TRAFEGO: "horizontal 1.91:1, 1200x628 pixels (anúncio de tráfego pago)",
};

const MODEL_MAP: Record<string, string> = {
  "google/gemini-2.5-flash-image": "gemini-2.5-flash-image",
  "google/gemini-3.1-flash-image-preview": "gemini-3.1-flash-image-preview",
  "google/gemini-3-pro-image-preview": "gemini-3-pro-image-preview",
};

function resolveGeminiModel(input: string): string {
  if (MODEL_MAP[input]) return MODEL_MAP[input];
  return input.replace(/^google\//, "");
}

async function imageUrlToBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar imagem de referência: ${res.status}`);
  const mimeType = res.headers.get("content-type") || "image/jpeg";
  const buf = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return { data: btoa(binary), mimeType };
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = userData.user.id;

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY não configurada" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let creativeId: string | null = null;

  try {
    const body = await req.json();
    creativeId = body.creative_id;
    const logoPosition: string = body.logo_position || "bottom-right";
    if (!creativeId) throw new Error("creative_id é obrigatório");

    // Load creative
    const { data: creative, error: cErr } = await admin
      .from("creatives")
      .select("*")
      .eq("id", creativeId)
      .single();
    if (cErr || !creative) throw new Error("Criativo não encontrado");
    if (creative.user_id !== userId) throw new Error("Acesso negado");

    if (!creative.main_image_url) {
      await admin.from("creatives").update({ status: "READY" }).eq("id", creativeId);
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifica se é admin (acesso liberado, sem débito de créditos)
    const { data: isAdminData } = await admin.rpc("has_role", {
      _user_id: userId,
      _role: "MASTER_ADMIN",
    });
    const isAdmin = isAdminData === true;

    if (!isAdmin) {
      // Debit credits BEFORE invoking Gemini (atomic via RPC)
      const { data: debit, error: debitErr } = await admin.rpc("consume_credits_for_creative", {
        p_user_id: userId,
        p_creative_id: creativeId,
        p_amount: CREATIVE_COST,
      });
      if (debitErr) {
        console.error("[generate-creative-image] debit error:", debitErr);
        await admin
          .from("creatives")
          .update({ status: "FAILED", error_message: "Falha ao debitar créditos" })
          .eq("id", creativeId);
        return new Response(JSON.stringify({ error: "Falha ao debitar créditos" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (debit && (debit as any).error) {
        const msg = (debit as any).error as string;
        await admin
          .from("creatives")
          .update({ status: "FAILED", error_message: msg })
          .eq("id", creativeId);
        return new Response(JSON.stringify({ error: msg, balance: (debit as any).balance }), {
          status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as PENDING
    await admin
      .from("creatives")
      .update({ status: "PENDING", error_message: null })
      .eq("id", creativeId);

    // Load general prompt + style prompt + user brand in parallel
    const [{ data: generalRow }, { data: style }, { data: brand }] = await Promise.all([
      admin.from("creative_styles").select("prompt, ai_model").eq("slug", "__general__").maybeSingle(),
      admin.from("creative_styles").select("prompt, name, ai_model").eq("slug", creative.style_slug).maybeSingle(),
      admin.from("user_brands").select("logo_url").eq("user_id", creative.user_id).maybeSingle(),
    ]);
    const brandLogoUrl: string | null = brand?.logo_url || null;

    const generalPrompt = (generalRow?.prompt || "").trim();
    const stylePrompt =
      style?.prompt?.trim() || "Anúncio imobiliário profissional, alta qualidade, fotorrealista";
    const rawModel = style?.ai_model || generalRow?.ai_model || "google/gemini-3-pro-image-preview";
    const geminiModel = resolveGeminiModel(rawModel);
    console.log("[generate-creative-image] raw model:", rawModel, "-> gemini:", geminiModel);

    const formatHint = FORMAT_HINTS[creative.format] || FORMAT_HINTS.POST;
    const infoText = (creative.info_text || "").trim();

    const styleName = style?.name?.trim() || creative.style_slug;

    let logoRef: { data: string; mimeType: string } | null = null;
    if (brandLogoUrl) {
      try {
        logoRef = await imageUrlToBase64(brandLogoUrl);
      } catch (e) {
        console.warn("[generate-creative-image] falha ao baixar logo:", (e as Error).message);
      }
    }

    const POS_LABELS: Record<string, string> = {
      "top-left": "canto superior esquerdo",
      "top-right": "canto superior direito",
      "bottom-left": "canto inferior esquerdo",
      "bottom-right": "canto inferior direito",
    };
    const positionLabel = POS_LABELS[logoPosition] || POS_LABELS["bottom-right"];

    const imageDescription = logoRef
      ? `Foram enviadas DUAS imagens de referência:\n- IMAGEM 1: foto do imóvel (use como base visual principal do criativo).\n- IMAGEM 2: logo da imobiliária/corretor. Esta logo DEVE aparecer no criativo final, posicionada no ${positionLabel}, em tamanho discreto e legível, com boa margem da borda, sem distorcer, sem cortar e sem alterar suas cores. Trate-a como marca d'água oficial do anúncio.`
      : `Use a imagem de referência fornecida como base visual do imóvel. Sem watermarks adicionais.`;

    const promptParts = [
      generalPrompt && `[INSTRUÇÕES GERAIS]\n${generalPrompt}`,
      `[ESTILO ESCOLHIDO: ${styleName}]\n${stylePrompt}`,
      infoText && `[DESCRIÇÃO DO IMÓVEL (preenchida pelo cliente)]\n${infoText}`,
      `[FORMATO DE SAÍDA]\n${formatHint}`,
      `[IMAGENS DE REFERÊNCIA]\n${imageDescription}`,
      `Mantenha a identidade visual do estilo "${styleName}" e o formato "${creative.format}". Texto na imagem em português brasileiro, mínimo e legível.`,
    ].filter(Boolean);

    const finalPrompt = promptParts.join("\n\n");
    console.log("[generate-creative-image] prompt:", finalPrompt.slice(0, 500));
    console.log("[generate-creative-image] logo incluída:", !!logoRef, "posição:", logoPosition);

    const ref = await imageUrlToBase64(creative.main_image_url);

    const requestParts: any[] = [
      { text: finalPrompt },
      { inline_data: { mime_type: ref.mimeType, data: ref.data } },
    ];
    if (logoRef) {
      requestParts.push({ inline_data: { mime_type: logoRef.mimeType, data: logoRef.data } });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`;
    const aiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: requestParts }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
        },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Gemini API error:", aiRes.status, errText);
      let userMessage = "Falha ao gerar imagem com IA";
      if (aiRes.status === 429) userMessage = "Muitas gerações em sequência. Tente novamente em alguns segundos.";
      else if (aiRes.status === 400) userMessage = `Erro na requisição: ${errText.slice(0, 200)}`;
      else if (aiRes.status === 403) userMessage = "Chave da API Gemini inválida ou sem permissão.";

      await admin
        .from("creatives")
        .update({ status: "FAILED", error_message: userMessage })
        .eq("id", creativeId);

      return new Response(JSON.stringify({ error: userMessage }), {
        status: aiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const responseParts = aiData?.candidates?.[0]?.content?.parts || [];
    const imagePart = responseParts.find((p: any) => p?.inline_data?.data || p?.inlineData?.data);
    const inline = imagePart?.inline_data || imagePart?.inlineData;

    if (!inline?.data) {
      console.error("Gemini response had no image:", JSON.stringify(aiData).slice(0, 500));
      throw new Error("IA não retornou imagem");
    }

    const contentType = inline.mime_type || inline.mimeType || "image/png";
    const bytes = base64ToBytes(inline.data);
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const path = `${userId}/ai-${creativeId}.${ext}`;

    const { error: upErr } = await admin.storage
      .from("creatives")
      .upload(path, bytes, { contentType, upsert: true });
    if (upErr) throw new Error(`Upload falhou: ${upErr.message}`);

    const { data: pub } = admin.storage.from("creatives").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    await admin
      .from("creatives")
      .update({ main_image_url: publicUrl, status: "READY", error_message: null })
      .eq("id", creativeId);

    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("generate-creative-image error:", msg);
    if (creativeId) {
      await admin
        .from("creatives")
        .update({ status: "FAILED", error_message: msg })
        .eq("id", creativeId);
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
