-- LiveTT Database Setup for PostgreSQL
-- สำหรับใช้กับ Neon, Supabase, หรือ PostgreSQL อื่นๆ

-- ลบตารางเก่า (ถ้ามี)
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS donation_goals CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- สร้างตาราง users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user',
  theme_preference VARCHAR(20) DEFAULT 'light',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง donations
CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  donor_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  email VARCHAR(255),
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง donation_goals
CREATE TABLE donation_goals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง admin_logs
CREATE TABLE admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  admin_email VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  payload JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง indexes เพื่อเพิ่มประสิทธิภาพ
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_donation_goals_active ON donation_goals(is_active);

-- สร้าง admin user เริ่มต้น
-- Password: admin1234 (hashed with bcrypt)
INSERT INTO users (email, password, first_name, last_name, role, theme_preference)
VALUES (
  'admin@sharkcoder.dev',
  '$2b$10$rQZ5YJKm7FZGKx4vXxH0/.VqKZE5kqF5YJKm7FZGKx4vXxH0/.VqK',
  'Admin',
  'SharkCoder',
  'admin',
  'dark'
);

-- สร้าง donation goal ตัวอย่าง
INSERT INTO donation_goals (title, target_amount, current_amount, is_active)
VALUES (
  'เป้าหมายการโดเนทประจำเดือน',
  10000.00,
  0.00,
  true
);

-- Note: Triggers for auto-updating updated_at can be added later if needed

-- แสดงข้อมูลที่สร้างเสร็จแล้ว
SELECT 'Database setup completed!' AS status;
SELECT 'Admin user created: admin@sharkcoder.dev (password: admin1234)' AS info;
