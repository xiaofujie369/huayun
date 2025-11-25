export async function onRequestPost(context) {
  const DB = context.env.DB;
  const KV = context.env.SESSIONS;
  const BUCKET = context.env.HUAYUN_BUCKET;

  const contentType = context.request.headers.get("Content-Type") || "";
  if (!contentType.includes("form-data")) {
    return new Response(
      JSON.stringify({ error: "Content-Type 必须为 multipart/form-data" }),
      { status: 400 }
    );
  }

  // 验证 Session
  const auth = context.request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "未登录" }), { status: 401 });
  }
  const sessionId = auth.replace("Bearer ", "");
  const sessionData = await KV.get(`session:${sessionId}`, { type: "json" });
  if (!sessionData) {
    return new Response(JSON.stringify({ error: "登录已过期" }), { status: 401 });
  }

  const form = await context.request.formData();
  const files = form.getAll("file");

  if (!files || files.length === 0) {
    return new Response(JSON.stringify({ error: "没有文件上传" }), {
      status: 400,
    });
  }

  let uploaded = [];

  for (const file of files) {
    const filename = `${crypto.randomUUID()}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    const fileSize = fileBuffer.byteLength;

    let finalBuffer = fileBuffer;
    let finalName = filename;

    // 超过 10MB → 压缩处理
    if (fileSize > 10 * 1024 * 1024) {
      const compressed = await compressImage(file);
      finalBuffer = compressed.arrayBuffer;
      finalName = `c-${filename}`;
    }

    // 上传到 R2
    await BUCKET.put(finalName, finalBuffer, {
      httpMetadata: { contentType: file.type },
    });

    const url = `https://pub-${context.env.HUAYUN_BUCKET.id}.r2.dev/${finalName}`;

    // 写入数据库
    await DB.prepare(
      `INSERT INTO photos (user_id, url, filename, size) VALUES (?, ?, ?, ?)`
    )
      .bind(sessionData.user_id, url, finalName, fileSize)
      .run();

    uploaded.push({
      url,
      filename: finalName,
      size: fileSize,
    });
  }

  return new Response(JSON.stringify({ success: true, photos: uploaded }), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * 超过 10MB 的图片自动压缩
 * 使用 Cloudflare Images API（无损压缩）
 */
async function compressImage(file) {
  const image = await file.arrayBuffer();

  const resized = await context.env.IMAGE.resize(image, {
    width: 3840, // 4K
    quality: 85,
    format: "jpeg",
  });

  return {
    arrayBuffer: resized,
  };
}
