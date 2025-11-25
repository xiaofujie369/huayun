export async function onRequestPost(context) {
  const DB = context.env.DB;
  const KV = context.env.SESSIONS;

  try {
    const { email, password } = await context.request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "缺少字段" }), {
        status: 400,
      });
    }

    // 查找用户
    const user = await DB.prepare(
      "SELECT id, password_hash, nickname, avatar FROM users WHERE email = ?"
    )
      .bind(email)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: "账号不存在" }), {
        status: 404,
      });
    }

    // 核对密码
    const passwordHash = await hashPassword(password);

    if (passwordHash !== user.password_hash) {
      return new Response(JSON.stringify({ error: "密码错误" }), {
        status: 401,
      });
    }

    // 创建 Session
    const sessionId = crypto.randomUUID();
    const sessionData = {
      user_id: user.id,
      nickname: user.nickname,
      avatar: user.avatar || null,
      login_at: Date.now(),
    };

    // 存入 KV（有效期 7 天）
    await KV.put(`session:${sessionId}`, JSON.stringify(sessionData), {
      expirationTtl: 60 * 60 * 24 * 7,
    });

    return new Response(
      JSON.stringify({
        success: true,
        token: sessionId,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

/**
 * SHA-256 密码 hash
 */
async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

