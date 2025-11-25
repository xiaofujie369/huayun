export async function onRequestPost(context) {
  const DB = context.env.DB;
  const KV = context.env.SESSIONS;

  try {
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
      return new Response(JSON.stringify({ error: "登录已过期" }), {
        status: 401,
      });
    }

    const userId = sessionData.user_id;

    // 解析请求
    const { photo_id, content } = await context.request.json();

    if (!photo_id || !content) {
      return new Response(
        JSON.stringify({ error: "缺少字段 photo_id 或 content" }),
        { status: 400 }
      );
    }

    // 写入评论
    await DB.prepare(
      `
      INSERT INTO comments (photo_id, user_id, content)
      VALUES (?, ?, ?)
      `
    )
      .bind(photo_id, userId, content)
      .run();

    // 查询最新评论（带昵称）
    const latest = await DB.prepare(
      `
      SELECT c.id, c.content, c.created_at,
             u.nickname, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.photo_id = ?
      ORDER BY c.id DESC
      LIMIT 1
      `
    )
      .bind(photo_id)
      .first();

    return new Response(
      JSON.stringify({
        success: true,
        comment: latest,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

