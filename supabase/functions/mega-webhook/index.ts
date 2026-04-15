import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Webhook from Mega API - accepts any origin (external service callback)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Mega webhook received:", JSON.stringify(payload).substring(0, 500));

    const messageType = payload?.messageType;

    if (messageType !== "listResponseMessage") {
      return new Response(
        JSON.stringify({ ok: true, ignored: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const selectedRowId =
      payload?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      payload?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      payload?.singleSelectReply?.selectedRowId ||
      null;

    console.log("Selected row ID:", selectedRowId);

    if (!selectedRowId || !selectedRowId.startsWith("confirm_")) {
      return new Response(
        JSON.stringify({ ok: true, ignored: true, reason: "Not a confirmation response" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const leadId = selectedRowId.replace("confirm_", "");

    if (!leadId || leadId.length < 10) {
      console.error("Invalid leadId extracted:", leadId);
      return new Response(
        JSON.stringify({ error: "Invalid lead ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Activate the lead
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        is_active: true,
        whatsapp_confirmed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    if (updateError) {
      console.error("Error activating lead:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Lead ${leadId} confirmed via WhatsApp and activated`);

    // Notify professionals about the new lead (fire-and-forget)
    try {
      const { data: lead } = await supabase
        .from("leads")
        .select("id, description, form_data")
        .eq("id", leadId)
        .single();

      if (lead && lead.form_data) {
        const formData = lead.form_data as Record<string, unknown>;
        const intention = formData.intention as string | undefined;
        const city =
          (formData.sell as Record<string, unknown>)?.city ||
          (formData.buy as Record<string, unknown>)?.city ||
          (formData.build as Record<string, unknown>)?.city ||
          (formData.rent as Record<string, unknown>)?.city;
        const uf =
          (formData.sell as Record<string, unknown>)?.uf ||
          (formData.buy as Record<string, unknown>)?.uf ||
          (formData.build as Record<string, unknown>)?.uf ||
          (formData.rent as Record<string, unknown>)?.uf;

        if (city) {
          const notifyUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-new-lead`;
          await fetch(notifyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              leadId,
              city,
              uf,
              intention,
              description: lead.description,
              formData,
            }),
          });
          console.log(`Notify-new-lead sent for lead ${leadId}`);
        }
      }
    } catch (notifyErr) {
      console.error("Failed to send notify-new-lead (non-blocking):", notifyErr);
    }

    return new Response(
      JSON.stringify({ ok: true, leadId, activated: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
