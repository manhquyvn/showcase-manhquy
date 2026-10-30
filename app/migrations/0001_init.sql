-- Hệ thống showcase trên Cloudflare D1 (ngưỡng free).
-- Nguyên tắc an toàn: chỉ lưu tên nhóm + biệt danh học sinh, không dữ liệu cá nhân của trẻ.

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  field TEXT NOT NULL,
  classes TEXT NOT NULL,
  members TEXT NOT NULL,          -- JSON array biệt danh
  summary TEXT NOT NULL DEFAULT '',
  status_text TEXT NOT NULL DEFAULT '',
  next_step TEXT NOT NULL DEFAULT '',
  updated_note TEXT NOT NULL DEFAULT '',
  progress_done INTEGER NOT NULL DEFAULT 0,
  milestones TEXT NOT NULL DEFAULT '[]',  -- JSON array mã mốc đã đạt
  demo_url TEXT NOT NULL DEFAULT '#',
  repo_url TEXT NOT NULL DEFAULT '#',
  sample INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL REFERENCES teams(id),
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);

-- Feed cập nhật tiến độ: chỉ hiện công khai khi status = 'approved' (giáo viên duyệt).
CREATE TABLE IF NOT EXISTS updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL REFERENCES teams(id),
  milestone TEXT,
  text TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','hidden')),
  pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  approved_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_updates_team_status ON updates(team_id, status, created_at DESC);

-- Bình luận động viên của phụ huynh: chờ giáo viên duyệt mới hiện.
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL REFERENCES teams(id),
  author_name TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','hidden')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Đăng ký nhận thông báo theo nhóm (chỉ tồn tại phía máy chủ, không công khai).
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  team_id TEXT NOT NULL REFERENCES teams(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(email, team_id)
);
