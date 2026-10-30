-- Vòng 2 (theo research hệ thống chuyên nghiệp): thêm visibility + edition ngay khi nối D1
-- để khỏi đập lại mô hình dữ liệu sau này, cộng approved_by/approved_at cho nhật ký duyệt.
ALTER TABLE updates ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE updates ADD COLUMN edition TEXT NOT NULL DEFAULT 'khoa-1';
ALTER TABLE updates ADD COLUMN approved_by TEXT;
ALTER TABLE comments ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public';
ALTER TABLE comments ADD COLUMN edition TEXT NOT NULL DEFAULT 'khoa-1';
ALTER TABLE comments ADD COLUMN approved_at TEXT;
ALTER TABLE comments ADD COLUMN approved_by TEXT;
ALTER TABLE teams ADD COLUMN edition TEXT NOT NULL DEFAULT 'khoa-1';
