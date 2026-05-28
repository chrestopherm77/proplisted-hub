import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://conectaeimob.com.br',
  'https://www.conectaeimob.com.br',
  'https://proplisted-hub.lovable.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-lp-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // CORS restriction limits which domains can call this endpoint
    // Input validation below prevents garbage data

    const {
      submissionId,
      name,
      phone,
      email,
      intention,
      formDataJson,
      description,
      defaultPrice,
    } = await req.json();

    // Input validation
    if (!name || !phone || !intention || !submissionId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 200) {
      return new Response(
        JSON.stringify({ error: "Invalid name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof phone !== 'string' || phone.replace(/\D/g, '').length < 10 || phone.length > 20) {
      return new Response(
        JSON.stringify({ error: "Invalid phone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validIntentions = ['SELL', 'BUY', 'BUILD', 'RENT'];
    if (!validIntentions.includes(intention)) {
      return new Response(
        JSON.stringify({ error: "Invalid intention" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof description !== 'string' || description.length > 10000) {
      return new Response(
        JSON.stringify({ error: "Invalid description" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Insert lead_submission (always, as historical record)
    const { error: submissionError } = await supabase
      .from("lead_submissions")
      .insert([{
        id: submissionId,
        name: name.trim(),
        phone,
        email: email || null,
        intention,
        form_data: formDataJson,
      }]);

    if (submissionError) {
      console.error("Submission insert error:", submissionError);
      return new Response(
        JSON.stringify({ error: submissionError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Normalize phone for comparison
    const normalizedPhone = phone.replace(/\D/g, "");

    // 3. Search for existing active lead with same phone
    const { data: existingLeads, error: searchError } = await supabase
      .from("leads")
      .select("id, description, form_data, phone")
      .eq("is_active", true);

    if (searchError) {
      console.error("Lead search error:", searchError);
      return new Response(
        JSON.stringify({ error: searchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find match by normalized phone
    const existingLead = (existingLeads || []).find(
      (l) => l.phone?.replace(/\D/g, "") === normalizedPhone
    );

    let leadId: string;

    if (existingLead) {
      // 4a. MERGE: count existing preferences
      const existingDesc = existingLead.description || "";
      const prefMatches = existingDesc.match(/Preferência \d+:/g);
      const currentPrefCount = prefMatches ? prefMatches.length : 0;

      let updatedDescription: string;
      if (currentPrefCount === 0) {
        updatedDescription = `Preferência 1:\n${existingDesc}\n\nPreferência 2:\n${description}`;
      } else {
        const newPrefNumber = currentPrefCount + 1;
        updatedDescription = `${existingDesc}\n\nPreferência ${newPrefNumber}:\n${description}`;
      }

      // Merge form_data
      const existingFormData =
        typeof existingLead.form_data === "object" && existingLead.form_data
          ? existingLead.form_data
          : {};
      const mergedFormData = { ...existingFormData as Record<string, unknown> };

      const flowKey = intention.toLowerCase();
      if (formDataJson[flowKey]) {
        if (mergedFormData[flowKey]) {
          const existing = mergedFormData[flowKey];
          if (Array.isArray(existing)) {
            (existing as unknown[]).push(formDataJson[flowKey]);
          } else {
            mergedFormData[flowKey] = [existing, formDataJson[flowKey]];
          }
        } else {
          mergedFormData[flowKey] = formDataJson[flowKey];
        }
      }
      if (mergedFormData.intention) {
        const existingIntention = mergedFormData.intention;
        if (Array.isArray(existingIntention)) {
          if (!existingIntention.includes(intention)) {
            (existingIntention as string[]).push(intention);
          }
        } else if (existingIntention !== intention) {
          mergedFormData.intention = [existingIntention, intention];
        }
      } else {
        mergedFormData.intention = intention;
      }

      const { error: updateError } = await supabase
        .from("leads")
        .update({
          description: updatedDescription,
          form_data: mergedFormData,
          name: name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingLead.id);

      if (updateError) {
        console.error("Lead update error:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      leadId = existingLead.id;
      console.log(`Merged lead ${leadId} — added new preference`);
    } else {
      // 4b. CREATE new lead
      leadId = crypto.randomUUID();
      const prefixedDescription = `Preferência 1:\n${description}`;

      const { error: leadError } = await supabase
        .from("leads")
        .insert([{
          id: leadId,
          name: name.trim(),
          phone,
          description: prefixedDescription,
          price: defaultPrice || 70,
          form_data: { ...formDataJson, intention },
          lead_submission_id: submissionId,
          is_active: false,
          whatsapp_confirmed: false,
          max_purchases: 5,
          purchase_count: 0,
        }]);

      if (leadError) {
        console.error("Lead insert error:", leadError);
        return new Response(
          JSON.stringify({ error: leadError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Created new lead ${leadId} (inactive, awaiting WhatsApp confirmation)`);

      // Send WhatsApp confirmation message (fire-and-forget)
      try {
        const confirmUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-lead-confirmation`;
        await fetch(confirmUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ name: name.trim(), phone, leadId }),
        });
        console.log(`WhatsApp confirmation request sent for lead ${leadId}`);
      } catch (confirmErr) {
        console.error("Failed to send WhatsApp confirmation (non-blocking):", confirmErr);
      }
    }

    return new Response(
      JSON.stringify({ leadId, merged: !!existingLead }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
