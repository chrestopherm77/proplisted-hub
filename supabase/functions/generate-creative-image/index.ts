import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FORMAT_HINTS: Record<string, string> = {
  POST: "quadrado 1:1, 1080x1080 pixels (post de feed Instagram)",
  STORIES: "vertical 9:16, 1080x1920 pixels (stories Instagram)",
  TRAFEGO: "horizontal 1.91:1, 1200x628 pixels (anúncio de tráfego pago)",
};

async function imageUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar imagem de referência: ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const buf = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  const b64 = btoa(binary);
  return `data:${contentType};base64,${b64}`;
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; contentType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Formato base64 inválido na resposta da IA");
  const contentType = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, contentType };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let creativeId: string | null = null;

  try {
    const body = await req.json();
    creativeId = body.creative_id;
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
      // Nothing to generate
      await admin.from("creatives").update({ status: "READY" }).eq("id", creativeId);
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as PENDING
    await admin
      .from("creatives")
      .update({ status: "PENDING", error_message: null })
      .eq("id", creativeId);

    // Load general prompt + style prompt in parallel
    const [{ data: generalRow }, { data: style }] = await Promise.all([
      admin.from("creative_styles").select("prompt").eq("slug", "__general__").maybeSingle(),
      admin.from("creative_styles").select("prompt, name").eq("slug", creative.style_slug).maybeSingle(),
    ]);

    const generalPrompt = (generalRow?.prompt || "").trim();
    const stylePrompt =
      style?.prompt?.trim() || "Anúncio imobiliário profissional, alta qualidade, fotorrealista";
    const formatHint = FORMAT_HINTS[creative.format] || FORMAT_HINTS.POST;
    const infoText = (creative.info_text || "").trim();

    const promptParts = [
      generalPrompt && `[INSTRUÇÕES GERAIS]\n${generalPrompt}`,
      `[ESTILO ESCOLHIDO]\n${stylePrompt}`,
      `[IMÓVEL]\n${infoText}`,
      `[FORMATO]\n${formatHint}`,
      `Use a imagem de referência fornecida como base do imóvel. Mantenha a identidade visual do estilo. Texto na imagem em português, mínimo e legível. Sem watermarks.`,
    ].filter(Boolean);

    const finalPrompt = promptParts.join("\n\n");

    // Convert reference image to data URL
    const refDataUrl = await imageUrlToDataUrl(creative.main_image_url);

    // Call Lovable AI Gateway
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: finalPrompt },
              { type: "image_url", image_url: { url: refDataUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);
      let userMessage = "Falha ao gerar imagem com IA";
      if (aiRes.status === 429) userMessage = "Muitas gerações em sequência. Tente novamente em alguns segundos.";
      else if (aiRes.status === 402) userMessage = "Créditos de IA esgotados. Adicione créditos em Workspace → Usage.";

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
    const generatedDataUrl = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!generatedDataUrl) {
      throw new Error("IA não retornou imagem");
    }

    const { bytes, contentType } = dataUrlToBytes(generatedDataUrl);
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
