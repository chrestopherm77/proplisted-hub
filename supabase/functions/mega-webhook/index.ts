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

    // The Mega API sends different message types
    // We care about listResponseMessage (user selected from the list)
    const messageType = payload?.messageType;

    if (messageType !== "listResponseMessage") {
      // Ignore non-list-response messages
      return new Response(
        JSON.stringify({ ok: true, ignored: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the selected row ID from the list response
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
