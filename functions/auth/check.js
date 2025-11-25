export async function onRequestGet(context) {
  const KV = context.env.SESSIONS;

  const auth = context.request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ logged_in: false }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    });
  }

  const sessionId = auth.replace("Bearer ", "");

  // 读取 KV session
  const sessionData = await KV.get(`session:${sessionId}`, { type: "json" });

  if (!sessionData) {
    return new Response(JSON.stringify({ logged_in: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      logged_in: true,
      user: sessionData,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
