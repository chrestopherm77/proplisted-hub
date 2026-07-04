// TEMPORARY - REMOVE AFTER USE
// Reveals MEGA_WEBHOOK_SECRET once so the user can paste it into MegaAPI panel.
Deno.serve(() => {
  const secret = Deno.env.get("MEGA_WEBHOOK_SECRET") ?? "";
  const url = `https://hmcpfedcvkurttyolurv.supabase.co/functions/v1/mega-webhook?secret=${encodeURIComponent(secret)}`;
  return new Response(
    `MEGA_WEBHOOK_SECRET = ${secret}\n\nCole esta URL no painel da MegaAPI:\n${url}\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
});
