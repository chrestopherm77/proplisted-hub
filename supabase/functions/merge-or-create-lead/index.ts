import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    if (!name || !phone || !intention || !submissionId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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
        // Existing lead has no preference prefix — wrap it as Preferência 1
        updatedDescription = `Preferência 1:\n${existingDesc}\n\nPreferência 2:\n${description}`;
      } else {
        const newPrefNumber = currentPrefCount + 1;
        updatedDescription = `${existingDesc}\n\nPreferência ${newPrefNumber}:\n${description}`;
      }

      // Merge form_data: add the new flow key to existing object
      const existingFormData =
        typeof existingLead.form_data === "object" && existingLead.form_data
          ? existingLead.form_data
          : {};
      const mergedFormData = { ...existingFormData as Record<string, unknown> };

      // Add new flow data (buy, sell, build, rent)
      const flowKey = intention.toLowerCase();
      if (formDataJson[flowKey]) {
        // If same flow already exists, convert to array or append
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
      // Keep intention as array of all intentions
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
      // 4b. CREATE new lead with "Preferência 1:" prefix
      leadId = crypto.randomUUID();
      const prefixedDescription = `Preferência 1:\n${description}`;

      const { error: leadError } = await supabase
        .from("leads")
        .insert([{
          id: leadId,
          name: name.trim(),
          phone,
          description: prefixedDescription,
          price: defaultPrice || 27,
          form_data: { ...formDataJson, intention },
          lead_submission_id: submissionId,
          is_active: true,
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

      console.log(`Created new lead ${leadId}`);
    }

    return new Response(
      JSON.stringify({ leadId, merged: !!existingLead }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

