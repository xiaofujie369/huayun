export async function onRequestGet(context) {
  const DB = context.env.DB;
  const KV = context.env.SESSIONS;

  // 验证 Session
  const auth = context.request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "未登录" }), {
      status: 401,
    });
  }

  const sessionId = auth.replace("Bearer ", "");
  const sessionData = await KV.get(`session:${sessionId}`, { type: "json" });

  if (!sessionData) {
    return new Response(JSON.stringify({ error: "会话已过期" }), {
      status: 401,
    });
  }

  const userId = sessionData.user_id;

  // 分页参数
  const { searchParams } = new URL(context.request.url);
  let page = parseInt(searchParams.get("page") || "1");
  let limit = parseInt(searchParams.get("limit") || "20");

  if (page < 1) page = 1;
  if (limit < 1) limit = 20;

  const offset = (page - 1) * limit;

  // 获取总数
  const totalResult = await DB.prepare(
    "SELECT COUNT(*) AS total FROM photos WHERE user_id = ?"
  )
    .bind(userId)
    .first();

  const total = totalResult.total;
  const totalPages = Math.ceil(total / limit);

  // 获取数据
  const photos = await DB.prepare(
    "SELECT id, url, filename, size, created_at FROM photos WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?"
  )
    .bind(userId, limit, offset)
    .all();

  return new Response(
    JSON.stringify({
      page,
      limit,
      total,
      totalPages,
      photos: photos.results,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

