// Temporary helper to trigger send-lead-confirmation using INTERNAL_FUNCTION_SECRET
Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const secret = Deno.env.get("INTERNAL_FUNCTION_SECRET")!;
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-lead-confirmation`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": secret,
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify(body),
    });
    const txt = await res.text();
    return new Response(JSON.stringify({ status: res.status, body: txt }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
