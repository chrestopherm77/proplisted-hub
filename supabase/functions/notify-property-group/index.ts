// Disparo de novos imóveis em grupos do WhatsApp DESATIVADO a pedido do cliente.
// Esta função foi neutralizada propositalmente — qualquer chamada retorna 200 sem
// enviar nada. Mantida no projeto apenas para não quebrar callers legados.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("notify-property-group: chamada ignorada (disparo desativado)");

  return new Response(
    JSON.stringify({ success: true, skipped: true, reason: "property_group_dispatch_disabled" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
