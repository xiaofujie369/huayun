-- =============================
-- 花云 Huayun D1 初始化数据库
-- =============================

-- ---------- 用户表 ----------
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT NOT NULL,
    avatar TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ---------- 图库照片表 ----------
CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    album_id INTEGER,
    url TEXT NOT NULL,
    filename TEXT,
    size INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ---------- 图集（相册） ----------
CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    cover_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ---------- 评论表 ----------
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (photo_id) REFERENCES photos(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ---------- 分享表 ----------
CREATE TABLE IF NOT EXISTS shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    photo_id INTEGER,
    album_id INTEGER,
    share_key TEXT UNIQUE NOT NULL,
    require_password INTEGER DEFAULT 0,
    password TEXT DEFAULT NULL,
    expires_at TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- ---------- KV 以外备用会话表 ----------
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    data TEXT,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
