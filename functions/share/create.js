export async function onRequestPost(context) {
  const DB = context.env.DB;
  const KV = context.env.SESSIONS;

  // ========== 验证 Session ==========
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

  // ========== 获取请求参数 ==========
  const { photo_id, album_id, password, expire_seconds } =
    await context.request.json();

  if (!photo_id && !album_id) {
    return new Response(
      JSON.stringify({ error: "必须提供 photo_id 或 album_id" }),
      { status: 400 }
    );
  }

  // ========== 生成分享 key ==========
  const shareKey = crypto.randomUUID().replace(/-/g, "");
  const requirePassword = password ? 1 : 0;
  const expireAt = expire_seconds
    ? new Date(Date.now() + expire_seconds * 1000).toISOString()
    : null;

  // ========== 写入数据库 ==========
  await DB.prepare(
    `
    INSERT INTO shares (photo_id, album_id, share_key, require_password, password, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  )
    .bind(
      photo_id || null,
      album_id || null,
      shareKey,
      requirePassword,
      password || null,
      expireAt
    )
    .run();

  // ========== 返回分享 URL ==========
  const shareUrl = `${new URL(context.request.url).origin}/share/${shareKey}`;

  return new Response(
    JSON.stringify({
      success: true,
      share_key: shareKey,
      url: shareUrl,
      expire_at: expireAt,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
