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
    return new Response(JSON.stringify({ error: "登录失效" }), {
      status: 401,
    });
  }

  const { searchParams } = new URL(context.request.url);
  const photoId = searchParams.get("id");

  if (!photoId) {
    return new Response(JSON.stringify({ error: "缺少 id 参数" }), {
      status: 400,
    });
  }

  // 获取图片详情
  const photo = await DB.prepare(
    `
      SELECT id, user_id, url, filename, size, created_at 
      FROM photos WHERE id = ?
    `
  )
    .bind(photoId)
    .first();

  if (!photo) {
    return new Response(JSON.stringify({ error: "图片不存在" }), {
      status: 404,
    });
  }

  // 查询评论（附带用户昵称 & 头像）
  const comments = await DB.prepare(
    `
    SELECT c.id, c.content, c.created_at,
           u.nickname, u.avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.photo_id = ?
    ORDER BY c.id DESC
    `
  )
    .bind(photoId)
    .all();

  return new Response(
    JSON.stringify({
      success: true,
      photo,
      comments: comments.results || [],
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
