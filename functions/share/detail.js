export async function onRequestGet(context) {
  const DB = context.env.DB;

  try {
    const { searchParams } = new URL(context.request.url);
    const shareKey = searchParams.get("key");

    if (!shareKey) {
      return new Response(
        JSON.stringify({ error: "缺少参数 key" }),
        { status: 400 }
      );
    }

    // 查找分享记录
    const share = await DB.prepare(`
      SELECT * FROM shares WHERE share_key = ?
    `)
      .bind(shareKey)
      .first();

    if (!share) {
      return new Response(
        JSON.stringify({ error: "分享不存在或已删除" }),
        { status: 404 }
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

    // 如果需要密码，则先要求前端验证
    if (share.require_password === 1) {
      return new Response(
        JSON.stringify({
          success: true,
          need_password: true,
          share_key: shareKey,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 分享单张照片
    if (share.photo_id) {
      const photo = await DB.prepare(`
        SELECT id, user_id, url, filename, size, created_at 
        FROM photos WHERE id = ?
      `)
        .bind(share.photo_id)
        .first();

      if (!photo) {
        return new Response(
          JSON.stringify({ error: "照片不存在" }),
          { status: 404 }
        );
      }

      // 评论
      const comments = await DB.prepare(`
        SELECT c.id, c.content, c.created_at, u.nickname, u.avatar
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
          photo,
          comments: comments.results,
          share_key: shareKey,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 分享整个相册（未来扩展）
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
          album,
          photos: photos.results,
          share_key: shareKey,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "分享记录异常" }),
      { status: 500 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
