-- สร้าง database
CREATE DATABASE IF NOT EXISTS shark_coder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shark_coder;

-- สร้างตาราง users
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้างตาราง session_tokens
CREATE TABLE IF NOT EXISTS session_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token(255)),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้างตาราง landing_content
CREATE TABLE IF NOT EXISTS landing_content (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  hero_title TEXT NOT NULL DEFAULT 'SharkCoder — The Future City Builder',
  hero_subtitle TEXT NOT NULL DEFAULT 'Premium metaverse experience for ambitious citizens.',
  progress INT NOT NULL DEFAULT 12,
  devlog JSON DEFAULT NULL,
  announcements JSON DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36),
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default landing content
INSERT INTO landing_content (id, hero_title, hero_subtitle, devlog, announcements)
VALUES (1, 
  'SharkCoder — The Future City Builder', 
  'Premium metaverse experience for ambitious citizens.',
  JSON_ARRAY('Season Zero prototype online'),
  JSON_ARRAY('⚡ Launch Week | Devstream 7PM GMT+7')
)
ON DUPLICATE KEY UPDATE 
  hero_title = COALESCE(hero_title, VALUES(hero_title)),
  hero_subtitle = COALESCE(hero_subtitle, VALUES(hero_subtitle));

-- สร้างตาราง branding_assets
CREATE TABLE IF NOT EXISTS branding_assets (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('logo','background')),
  file_name TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  uploaded_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_asset_type (asset_type),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้างตาราง music_tracks
CREATE TABLE IF NOT EXISTS music_tracks (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title TEXT NOT NULL,
  artist TEXT,
  file_name TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  duration_seconds INT DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  uploaded_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้างตาราง admin_logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  admin_id CHAR(36),
  action TEXT NOT NULL,
  payload JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้างตาราง oauth_accounts
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url TEXT,
  discriminator VARCHAR(10),
  provider_data JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_provider_account (provider, provider_account_id),
  UNIQUE KEY unique_user_provider (user_id, provider),
  INDEX idx_user_id (user_id),
  INDEX idx_provider (provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- เสร็จสิ้น
SELECT 'Database setup completed successfully!' as message;
