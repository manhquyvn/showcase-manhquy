-- Vòng 2 production: thông tin trưng bày mở rộng cho teams (quote/upgrades/hue),
-- trạng thái bàn giao, nhật ký audit, checklist sẵn sàng theo nhóm,
-- trang riêng cho từng em qua token, và sổ đăng ký đồng ý của phụ huynh.
-- Quy tắc an toàn trẻ em giữ nguyên: chỉ biệt danh + tên nhóm + lớp.

ALTER TABLE teams ADD COLUMN quote TEXT NOT NULL DEFAULT '';
ALTER TABLE teams ADD COLUMN upgrades TEXT NOT NULL DEFAULT '[]';
ALTER TABLE teams ADD COLUMN hue TEXT NOT NULL DEFAULT 'teal';
ALTER TABLE teams ADD COLUMN handover_status TEXT NOT NULL DEFAULT '';
ALTER TABLE teams ADD COLUMN handover_date TEXT;
ALTER TABLE teams ADD COLUMN handover_note TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  actor TEXT NOT NULL DEFAULT 'teacher',
  action TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT '',
  target_id TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL REFERENCES teams(id),
  label TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_checklist_items_team ON checklist_items(team_id);

CREATE TABLE IF NOT EXISTS child_tokens (
  token TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id),
  nickname TEXT NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bảng settings từng được tạo thủ công khi dựng hệ thống máy chủ (2026-10-29)
-- nên chưa có trong 0001; bổ sung tại đây để môi trường mới dựng được đủ bảng.
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL REFERENCES teams(id),
  nickname TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'showcase',
  status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted','withdrawn')),
  recorded_by TEXT NOT NULL DEFAULT 'teacher',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(team_id, nickname, scope)
);
