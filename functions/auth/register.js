export async function onRequestPost(context) {
  const DB = context.env.DB;

  try {
    const { email, password, nickname } = await context.request.json();

    if (!email || !password || !nickname) {
      return new Response(JSON.stringify({ error: "缺少字段" }), {
        status: 400,
      });
    }

    // 检查邮箱是否存在
    const exists = await DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    )
      .bind(email)
      .first();

    if (exists) {
      return new Response(JSON.stringify({ error: "邮箱已注册" }), {
        status: 409,
      });
    }

    // 密码 hash
    const passHash = await hashPassword(password);

    // 插入用户
    await DB.prepare(
      "INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)"
    )
      .bind(email, passHash, nickname)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

/**
 * 使用 Web Crypto 进行密码 hash
 */
async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

