export async function onRequestPost(context) {
  const DB = context.env.DB;

  try {
    const { share_key, password } = await context.request.json();

    if (!share_key || !password) {
      return new Response(
        JSON.stringify({ error: "缺少参数 share_key 或 password" }),
        { status: 400 }
      );
    }

    // 获取分享记录
    const share = await DB.prepare(`
      SELECT * FROM shares WHERE share_key = ?
    `)
      .bind(share_key)
      .first();

    if (!share) {
      return new Response(
        JSON.stringify({ error: "分享不存在" }),
        { status: 404 }
      );
    }

    // 是否需要密码
    if (share.require_password !== 1) {
      return new Response(
        JSON.stringify({ error: "此分享无需密码" }),
        { status: 400 }
      );
    }

    // 密码是否正确
    if (share.password !== password) {
      return new Response(
        JSON.stringify({ error: "密码错误" }),
        { status: 401 }
      );
    }

    // 判断是否过期
    if (share.expires_at) {
      const now = Date.now();
      const expires = new Date(share.expires_at).getTime();
      if (now > expires) {
        return new Response(
          JSON.stringify({ error: "分享已过期" }),
          { status: 410 }
        );
      }
    }

    // ========== 分享单张照片 ==========
    if (share.photo_id) {
      const photo = await DB.prepare(`
        SELECT id, user_id, url, filename, size, created_at
        FROM photos WHERE id = ?
      `)
        .bind(share.photo_id)
        .first();

      const comments = await DB.prepare(`
        SELECT c.id, c.content, c.created_at, 
               u.nickname, u.avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.photo_id = ?
        ORDER BY c.id DESC
      `)
        .bind(share.photo_id)
        .all();

      return new Response(
        JSON.stringify({
          success: true,
          type: "photo",
          share_key,
          photo,
          comments: comments.results,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ========== 分享整个相册 ==========
    if (share.album_id) {
      const album = await DB.prepare(`
        SELECT id, user_id, title, cover_url, created_at
        FROM albums WHERE id = ?
      `)
        .bind(share.album_id)
        .first();

      const photos = await DB.prepare(`
        SELECT id, url, filename, size, created_at
        FROM photos WHERE album_id = ?
      `)
        .bind(share.album_id)
        .all();

      return new Response(
        JSON.stringify({
          success: true,
          type: "album",
          share_key,
          album,
          photos: photos.results,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "未识别的分享类型" }),
      { status: 500 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
