/**
 * SharkCoder — Web Platform Specification (Backend)
 * Version 1.0 — Premium Edition
 */

require("dotenv").config()
const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const axios = require("axios")
const { Pool } = require("pg")
const { TikTokLiveConnection } = require("tiktok-live-connector")

// =============================================================================
// Environment & Constants
// =============================================================================
const {
  PORT = 8080,
  DB_USER = "postgres",
  DB_HOST = "localhost",
  DB_PASSWORD = "postgres",
  DB_PORT = 5432,
  DB_NAME = "shark_coder",
  JWT_SECRET = "shark-coder-access",
  JWT_REFRESH_SECRET = "shark-coder-refresh",
  ALLOWED_ORIGINS = "",
  ADMIN_EMAIL = "admin@sharkcoder.dev",
  ADMIN_PASSWORD = "admin1234",
  FRONTEND_URL = "http://localhost:3000",
  DISCORD_CLIENT_ID = "",
  DISCORD_CLIENT_SECRET = "",
  DISCORD_REDIRECT_URI = "",
} = process.env

const FRONTEND_ORIGIN = (FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "")
const DISCORD_REDIRECT = (DISCORD_REDIRECT_URI || "").trim() || "http://localhost:8080/api/auth/discord/callback"

const app = express()
app.set("trust proxy", 1)

const allowedOrigins = ALLOWED_ORIGINS.split(",")
  .map((o) => o.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true)
      // Allow localhost for development
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true)
      }
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error("CORS not allowed"), false)
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))


// =============================================================================
// Database
// =============================================================================
const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port: Number(DB_PORT),
})

async function runMigrations() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)
  await pool.query(`CREATE EXTENSION IF NOT EXISTS citext;`)
    await pool.query(`
    DO $$
    DECLARE
      incompatible BOOLEAN := false;
    BEGIN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'id'
          AND data_type <> 'uuid'
      )
      INTO incompatible;

      IF incompatible THEN
        RAISE NOTICE 'Dropping legacy shark_coder tables with incompatible id column';
        EXECUTE 'DROP TABLE IF EXISTS session_tokens CASCADE';
        EXECUTE 'DROP TABLE IF EXISTS admin_logs CASCADE';
        EXECUTE 'DROP TABLE IF EXISTS branding_assets CASCADE';
        EXECUTE 'DROP TABLE IF EXISTS music_tracks CASCADE';
        EXECUTE 'DROP TABLE IF EXISTS landing_content CASCADE';
        EXECUTE 'DROP TABLE IF EXISTS users CASCADE';
      END IF;
    END $$;
  `)

    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email CITEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_banned BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    );
  `)

    await pool.query(`
    CREATE TABLE IF NOT EXISTS session_tokens (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
    
    await pool.query(`
    CREATE TABLE IF NOT EXISTS landing_content (
      id SMALLINT PRIMARY KEY DEFAULT 1,
      hero_title TEXT NOT NULL DEFAULT 'SharkCoder — The Future City Builder',
      hero_subtitle TEXT NOT NULL DEFAULT 'Premium metaverse experience for ambitious citizens.',
      progress INTEGER NOT NULL DEFAULT 12,
      devlog TEXT[] DEFAULT ARRAY['Season Zero prototype online'],
      announcements TEXT[] DEFAULT ARRAY['⚡ Launch Week | Devstream 7PM GMT+7'],
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      updated_by UUID REFERENCES users(id)
    );
  `)
    await pool.query(`
    ALTER TABLE landing_content
      ALTER COLUMN hero_title SET DEFAULT 'SharkCoder — The Future City Builder',
      ALTER COLUMN hero_subtitle SET DEFAULT 'Premium metaverse experience for ambitious citizens.';
  `)
    await pool.query(`
    UPDATE landing_content
    SET hero_title = COALESCE(hero_title, 'SharkCoder — The Future City Builder'),
        hero_subtitle = COALESCE(hero_subtitle, 'Premium metaverse experience for ambitious citizens.');
  `)
    await pool.query(`
    INSERT INTO landing_content (id, hero_title, hero_subtitle)
    VALUES (1, 'SharkCoder — The Future City Builder', 'Premium metaverse experience for ambitious citizens.')
    ON CONFLICT (id) DO UPDATE
      SET hero_title = COALESCE(landing_content.hero_title, EXCLUDED.hero_title),
          hero_subtitle = COALESCE(landing_content.hero_subtitle, EXCLUDED.hero_subtitle);
  `)

    await pool.query(`
    CREATE TABLE IF NOT EXISTS branding_assets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      asset_type TEXT NOT NULL CHECK (asset_type IN ('logo','background')),
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT false,
      uploaded_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS music_tracks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      artist TEXT,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
      duration_seconds INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT false,
      uploaded_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      admin_id UUID REFERENCES users(id),
      action TEXT NOT NULL,
      payload JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // Check if oauth_accounts table exists
  const tableExists = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'oauth_accounts'
    );
  `)
  
  if (!tableExists.rows[0].exists) {
    // Create table with all columns
    await pool.query(`
      CREATE TABLE oauth_accounts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        username TEXT,
        display_name TEXT,
        avatar_url TEXT,
        discriminator TEXT,
        provider_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (provider, provider_account_id),
        UNIQUE (user_id, provider)
      );
    `)
  } else {
    // Table exists, check and add missing columns
    const columnsToAdd = [
      { name: 'username', type: 'TEXT' },
      { name: 'display_name', type: 'TEXT' },
      { name: 'avatar_url', type: 'TEXT' },
      { name: 'discriminator', type: 'TEXT' },
      { name: 'provider_data', type: 'JSONB DEFAULT \'{}\'::jsonb' },
      { name: 'updated_at', type: 'TIMESTAMPTZ DEFAULT NOW()' }
    ]
    
    for (const col of columnsToAdd) {
      const colExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'oauth_accounts' 
          AND column_name = $1
        );
      `, [col.name])
      
      if (!colExists.rows[0].exists) {
        await pool.query(`ALTER TABLE oauth_accounts ADD COLUMN ${col.name} ${col.type};`)
        console.log(`[Migration] Added column oauth_accounts.${col.name}`)
      }
    }
  }
}

async function bootstrapAdmin() {
  const { rows } = await pool.query(`SELECT id FROM users WHERE email = $1`, [ADMIN_EMAIL.toLowerCase()])
  if (rows.length > 0) {
    return rows[0]
  }
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12)
  const {
    rows: [user],
  } = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'admin') RETURNING id, email, role`,
    [ADMIN_EMAIL.toLowerCase(), hash],
  )
  await logAdminAction(user.id, "bootstrap_admin", { email: user.email })
  return user
}

// =============================================================================
// Helpers
// =============================================================================
function safeFileName(originalName) {
  const ext = path.extname(originalName)
  const base = crypto.randomUUID()
  return `${base}${ext.toLowerCase()}`
}

function buildPublicUrl(type, fileName) {
  if (!fileName) return null
  return `/media/${type}/${fileName}`
}

function issueTokens(user) {
  const payload = { sub: user.id, role: user.role }
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" })
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "30d" })
  return { accessToken, refreshToken }
}

const oauthStateStore = new Map()
function createOAuthState(provider) {
  const state = crypto.randomBytes(24).toString("hex")
  oauthStateStore.set(state, { provider, createdAt: Date.now() })
  return state
}

function consumeOAuthState(state, provider) {
  const entry = oauthStateStore.get(state)
  if (!entry) return false
  oauthStateStore.delete(state)
  const expired = Date.now() - entry.createdAt > 5 * 60 * 1000
  if (expired) {
    return false
  }
  return entry.provider === provider
}

function buildFrontendRedirect(path, params) {
  const url = new URL(path, FRONTEND_ORIGIN)
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  })
  return url.toString()
}

const robloxCache = new Map()
const ROBLOX_CACHE_TTL = 60_000

function formatThaiDate(date) {
  try {
    return new Intl.DateTimeFormat("th-TH", {
      dateStyle: "long",
      timeStyle: "short",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }).format(date)
  } catch {
    return date.toISOString()
  }
}

async function fetchRobloxProfile(username) {
  const normalized = username.trim()
  if (!normalized) {
    const err = new Error("Missing username")
    err.status = 400
    throw err
  }

  const cacheKey = normalized.toLowerCase()
  const cached = robloxCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.payload
  }

  try {
    const usernameRes = await axios.post("https://users.roblox.com/v1/usernames/users", {
      usernames: [normalized],
    })
    const userData = usernameRes.data?.data?.[0]
    if (!userData) {
      const err = new Error("Roblox user not found")
      err.status = 404
      throw err
    }
    const userId = userData.id

    const [
      profileRes,
      presenceRes,
      friendsRes,
      followersRes,
      followingRes,
      avatarRes,
    ] = await Promise.all([
      axios.get(`https://users.roblox.com/v1/users/${userId}`),
      axios.post("https://presence.roblox.com/v1/presence/users", {
        userIds: [userId],
      }),
      axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
      axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
      axios.get(`https://friends.roblox.com/v1/users/${userId}/followings/count`),
      axios.get(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`,
      ),
    ])

    const profile = profileRes.data || {}
    const presence = presenceRes.data?.userPresences?.[0] || {}
    const statusMap = {
      0: "🔴 ออฟไลน์",
      1: "🟢 ออนไลน์",
      2: "🎮 เล่นเกมอยู่",
    }

    const createdDate = profile.created ? new Date(profile.created) : null
    const ageDays = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / 86_400_000) : null

    const payload = {
      userId,
      username: profile.name || normalized,
      displayName: profile.displayName || profile.name || normalized,
      createdAt: createdDate ? formatThaiDate(createdDate) : "ไม่ทราบ",
      ageDays,
      description: profile.description?.trim() || "( ไม่มีคำอธิบาย )",
      statusText: statusMap[presence.userPresenceType] || "❓ ไม่ทราบสถานะ",
      stats: {
        friends: friendsRes.data?.count ?? 0,
        followers: followersRes.data?.count ?? 0,
        following: followingRes.data?.count ?? 0,
      },
      avatarUrl: avatarRes.data?.data?.[0]?.imageUrl || null,
      profileUrl: `https://www.roblox.com/users/${userId}/profile`,
      lastSynced: formatThaiDate(new Date()),
    }

    robloxCache.set(cacheKey, {
      payload,
      expires: Date.now() + ROBLOX_CACHE_TTL,
    })
    return payload
  } catch (error) {
    if (error.status) {
      throw error
    }
    if (error.response?.status === 400 || error.response?.status === 404) {
      const err = new Error("Roblox user not found")
      err.status = 404
      throw err
    }
    console.error("[Roblox] Failed to fetch profile:", error?.response?.data || error.message)
    const err = new Error("Roblox API unavailable")
    err.status = 502
    throw err
  }
}

async function persistRefreshToken(userId, token) {
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
  await pool.query(`INSERT INTO session_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)`, [
    userId,
    token,
    expires,
  ])
}

async function revokeRefreshToken(token) {
  await pool.query(`DELETE FROM session_tokens WHERE token = $1`, [token])
}

async function validateRefreshToken(token) {
  const { rows } = await pool.query(`SELECT * FROM session_tokens WHERE token = $1`, [token])
  if (rows.length === 0) return null
  if (new Date(rows[0].expires_at).getTime() < Date.now()) {
    await revokeRefreshToken(token)
    return null
  }
  return rows[0]
}

async function logAdminAction(adminId, action, payload = {}) {
  await pool.query(`INSERT INTO admin_logs (admin_id, action, payload) VALUES ($1,$2,$3)`, [
    adminId,
    action,
    payload,
  ])
}

async function getLandingPayload() {
  const landingPromise = pool.query(`SELECT * FROM landing_content WHERE id = 1 LIMIT 1`)
  const logoPromise = pool.query(
    `SELECT file_name, mime_type FROM branding_assets WHERE asset_type = 'logo' AND is_active = true ORDER BY created_at DESC LIMIT 1`,
  )
  const backgroundPromise = pool.query(
    `SELECT file_name, mime_type FROM branding_assets WHERE asset_type = 'background' AND is_active = true ORDER BY created_at DESC LIMIT 1`,
  )
  const musicPromise = pool.query(
    `SELECT id, title, artist, file_name, mime_type FROM music_tracks WHERE is_active = true ORDER BY created_at DESC LIMIT 1`,
  )

  const [landingRes, logoRes, bgRes, musicRes] = await Promise.all([
    landingPromise,
    logoPromise,
    backgroundPromise,
    musicPromise,
  ])

  const landing = landingRes.rows[0]
      return {
    heroTitle: landing?.hero_title ?? "SharkCoder — Under Construction",
    heroSubtitle: landing?.hero_subtitle ?? "Premium Roblox RPG platform",
    progress: landing?.progress ?? 5,
    devlog: landing?.devlog ?? [],
    announcements: landing?.announcements ?? [],
    logoUrl: buildPublicUrl("branding", logoRes.rows[0]?.file_name),
    backgroundUrl: buildPublicUrl("branding", bgRes.rows[0]?.file_name),
    music: musicRes.rows[0]
      ? {
          id: musicRes.rows[0].id,
          title: musicRes.rows[0].title,
          artist: musicRes.rows[0].artist,
          streamUrl: buildPublicUrl("music", musicRes.rows[0].file_name),
          mimeType: musicRes.rows[0].mime_type,
        }
      : null,
  }
}

function authMiddleware(requireAdmin = false) {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const token = authHeader.replace("Bearer ", "")
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.user = decoded
      if (requireAdmin && decoded.role !== "admin") {
        return res.status(403).json({ message: "Admin only" })
      }
      next()
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" })
    }
  }
}


// =============================================================================
// Upload handling
// =============================================================================
const assetUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files allowed"))
    }
    cb(null, true)
  },
  limits: { fileSize: 5 * 1024 * 1024 },
})

const musicUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_, file, cb) => {
    if (!["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"].includes(file.mimetype)) {
      return cb(new Error("Unsupported audio mime type"))
    }
    cb(null, true)
  },
  limits: { fileSize: 20 * 1024 * 1024 },
})

// =============================================================================
// Routes
// =============================================================================
app.get("/health", async (_, res) => {
  try {
    await pool.query("SELECT 1")
    res.json({ status: "ok", time: Date.now() })
    } catch (error) {
    res.status(500).json({ status: "error", message: error.message })
  }
})

app.get("/api/landing", async (_, res) => {
  try {
    const payload = await getLandingPayload()
    res.json(payload)
    } catch (error) {
    res.status(500).json({ message: "Failed to load landing data" })
  }
})

app.get("/api/music/current", async (_, res) => {
  try {
    const payload = await getLandingPayload()
    res.json(payload.music)
    } catch (error) {
    res.status(500).json({ message: "Failed to load music" })
  }
})

app.get("/api/roblox/profile", async (req, res) => {
  const username = (req.query.username || "").trim()
  if (!username) {
    return res.status(400).json({ message: "กรุณาระบุชื่อ Roblox" })
  }
  try {
    const payload = await fetchRobloxProfile(username)
    res.json(payload)
  } catch (error) {
    const status = error.status || 500
    res.status(status).json({
      message:
        status === 404
          ? "ไม่พบผู้ใช้ Roblox คนนี้"
          : status === 502
            ? "Roblox API ไม่ตอบสนอง กรุณาลองใหม่"
            : "ไม่สามารถดึงข้อมูล Roblox ได้",
    })
  }
})

// Auth
app.post("/api/auth/register", async (req, res) => {
  const { email, password, confirmPassword } = req.body
  if (!email || !password || password !== confirmPassword) {
    return res.status(400).json({ message: "Invalid payload" })
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password too weak" })
  }
  try {
    const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()])
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" })
    }
    const hash = await bcrypt.hash(password, 12)
    const {
      rows: [user],
    } = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id, email, role, created_at`,
      [email.toLowerCase(), hash],
    )
    const tokens = issueTokens(user)
    await persistRefreshToken(user.id, tokens.refreshToken)
    res.status(201).json({ user, ...tokens })
    } catch (error) {
    res.status(500).json({ message: "Registration failed" })
  }
})

app.post("/api/auth/login", async (req, res) => {

  const { email, password } = req.body
    if (!email || !password) {
    return res.status(400).json({ message: "Missing credentials" })
  }
  try {
    const {
      rows: [user],
    } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()])
    if (!user || user.is_banned) {
      return res.status(401).json({ message: "Invalid credentials" })
    }
    const match = await bcrypt.compare(password, user.password_hash)
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" })
    }
    await pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id])
    const tokens = issueTokens(user)
    await persistRefreshToken(user.id, tokens.refreshToken)
    res.json({
      user: { id: user.id, email: user.email, role: user.role },
      ...tokens,
    })
  } catch (error) {
    res.status(500).json({ message: "Login failed" })
  }
})

app.post("/api/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(400).json({ message: "Missing refresh token" })
  }
  try {
    const stored = await validateRefreshToken(refreshToken)
    if (!stored) {
      return res.status(401).json({ message: "Invalid session" })
    }
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET)
    const tokens = issueTokens({ id: decoded.sub, role: decoded.role })
    await persistRefreshToken(decoded.sub, tokens.refreshToken)
    res.json(tokens)
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" })
  }
})

app.post("/api/auth/logout", async (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) {
    await revokeRefreshToken(refreshToken)
  }
  res.json({ success: true })
})

function redirectOAuthError(res, code, provider = "discord", extra = {}) {
  const url = buildFrontendRedirect("/login", {
    success: "false",
    error: code,
    provider,
    ...extra,
  })
  return res.redirect(url)
}

app.get("/api/auth/discord", (req, res) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    return res
      .status(500)
      .json({ message: "Discord OAuth not configured. Set DISCORD_CLIENT_ID/SECRET in env." })
  }
  const state = createOAuthState("discord")
  const params = new URLSearchParams({
    response_type: "code",
    client_id: DISCORD_CLIENT_ID,
    scope: "identify email",
    redirect_uri: DISCORD_REDIRECT,
    state,
    prompt: "consent",
  })
  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`)
})

app.get("/api/auth/discord/callback", async (req, res) => {
  const { code, state, error } = req.query
  if (error) {
    return redirectOAuthError(res, String(error))
  }
  if (!code || !state) {
    return redirectOAuthError(res, "discord_state_mismatch")
  }
  if (!consumeOAuthState(state, "discord")) {
    return redirectOAuthError(res, "discord_state_mismatch")
  }
  try {
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_REDIRECT,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    )
    const accessToken = tokenResponse.data.access_token
    if (!accessToken) {
      return redirectOAuthError(res, "discord_auth_failed")
    }
    const discordUserResponse = await axios.get("https://discord.com/api/users/@me", {
        headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const profile = discordUserResponse.data
    if (!profile?.email) {
      return redirectOAuthError(res, "discord_email_required")
    }
    const email = profile.email.toLowerCase()
    const discordId = profile.id

    const existingAccount = await pool.query(
      `SELECT id, email, role, is_banned FROM users WHERE email = $1 LIMIT 1`,
      [email],
    )

    let user
    if (existingAccount.rows.length === 0) {
      const randomPassword = crypto.randomBytes(12).toString("hex")
      const hash = await bcrypt.hash(randomPassword, 12)
      const created = await pool.query(
        `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'user') RETURNING id, email, role, is_banned`,
        [email, hash],
      )
      user = created.rows[0]
    } else {
      user = existingAccount.rows[0]
    }

    if (user.is_banned) {
      return redirectOAuthError(res, "discord_account_banned")
    }

    // Extract Discord profile data
    const discordUsername = profile.username || null
    const discordDisplayName = profile.global_name || profile.username || null
    // Discord avatar URL: if user has no custom avatar, use default avatar
    let discordAvatar = null
    if (profile.avatar) {
      // User has custom avatar
      discordAvatar = `https://cdn.discordapp.com/avatars/${discordId}/${profile.avatar}.${profile.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`
    } else if (discordId) {
      // Use Discord default avatar based on user ID
      const defaultAvatarIndex = parseInt(discordId) % 5
      discordAvatar = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`
    }
    const discordDiscriminator = profile.discriminator && profile.discriminator !== '0' ? profile.discriminator : null
    
    console.log('[Discord OAuth] Profile data:', {
      discordId,
      username: discordUsername,
      displayName: discordDisplayName,
      hasAvatar: !!profile.avatar,
      avatarUrl: discordAvatar
    })
    
    await pool.query(
      `
      INSERT INTO oauth_accounts (user_id, provider, provider_account_id, username, display_name, avatar_url, discriminator, provider_data, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (provider, provider_account_id)
      DO UPDATE SET 
        user_id = EXCLUDED.user_id,
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url,
        discriminator = EXCLUDED.discriminator,
        provider_data = EXCLUDED.provider_data,
        updated_at = NOW()
    `,
      [
        user.id, 
        "discord", 
        discordId,
        discordUsername,
        discordDisplayName,
        discordAvatar,
        discordDiscriminator,
        JSON.stringify(profile)
      ],
    )

    await pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id])

    const tokens = issueTokens(user)
    await persistRefreshToken(user.id, tokens.refreshToken)

    const successUrl = buildFrontendRedirect("/login", {
      success: "true",
      provider: "discord",
      token: tokens.accessToken,
        user_id: user.id, 
    })
    res.redirect(successUrl)
  } catch (err) {
    console.error("[Discord OAuth] Failed:", err?.response?.data || err.message)
    return redirectOAuthError(res, "discord_auth_failed")
  }
})

async function respondCurrentUser(userId, res) {
    const { 
    rows: [user],
  } = await pool.query(`SELECT id, email, role, created_at, last_login_at FROM users WHERE id = $1`, [userId])
  
  if (!user) {
    return res.status(404).json({ message: "User not found" })
  }
  
  // Get Discord OAuth account data
  const { rows: discordAccounts } = await pool.query(
    `SELECT username, display_name, avatar_url, discriminator, provider_data, created_at 
     FROM oauth_accounts 
     WHERE user_id = $1 AND provider = 'discord' 
     LIMIT 1`,
    [userId]
  )
  
  const discord = discordAccounts.length > 0 ? {
    username: discordAccounts[0].username,
    displayName: discordAccounts[0].display_name,
    avatarUrl: discordAccounts[0].avatar_url,
    discriminator: discordAccounts[0].discriminator,
    providerData: discordAccounts[0].provider_data,
    linkedAt: discordAccounts[0].created_at ? new Date(discordAccounts[0].created_at).toISOString() : null
  } : null
  
  res.json({
    ...user,
    discord
  })
}

app.get("/api/me", authMiddleware(), async (req, res) => {
  try {
    await respondCurrentUser(req.user.sub, res)
  } catch (error) {
    res.status(500).json({ message: "Failed to load profile" })
  }
})

// Legacy compatibility endpoints (existing frontend expects /api/auth/*)
app.get("/api/auth/me", authMiddleware(), async (req, res) => {
  try {
    await respondCurrentUser(req.user.sub, res)
  } catch (error) {
    res.status(500).json({ message: "Failed to load profile" })
  }
})

// =============================================================================
// Admin endpoints
// =============================================================================
app.get("/api/admin/users", authMiddleware(true), async (_, res) => {
  try {
    const { rows } = await pool.query(`SELECT id, email, role, is_banned, created_at, last_login_at FROM users ORDER BY created_at DESC`)
    res.json(rows)
  } catch (error) {
    res.status(500).json({ message: "Failed to load users" })
  }
})

app.patch("/api/admin/users/:id/role", authMiddleware(true), async (req, res) => {
  const { id } = req.params
  const { role } = req.body
  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" })
  }
  try {
    await pool.query(`UPDATE users SET role = $1 WHERE id = $2`, [role, id])
    await logAdminAction(req.user.sub, "update_user_role", { target: id, role })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: "Failed to update role" })
  }
})

app.patch("/api/admin/users/:id/ban", authMiddleware(true), async (req, res) => {
  const { id } = req.params
  const { isBanned } = req.body
  try {
    await pool.query(`UPDATE users SET is_banned = $1 WHERE id = $2`, [Boolean(isBanned), id])
    await logAdminAction(req.user.sub, "toggle_ban", { target: id, isBanned: Boolean(isBanned) })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle ban" })
  }
})

app.post("/api/admin/users/:id/ban", authMiddleware(true), async (req, res) => {
  const { id } = req.params
  const { reason } = req.body
  try {
    await pool.query(
      `UPDATE users SET is_banned = true, ban_reason = $1, banned_at = NOW() WHERE id = $2`,
      [reason || null, id]
    )
    await logAdminAction(req.user.sub, "ban_user", { target: id, reason: reason || null })
    const { rows: [user] } = await pool.query(`SELECT id, email, role, is_banned, ban_reason, banned_at FROM users WHERE id = $1`, [id])
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Failed to ban user" })
  }
})

app.post("/api/admin/users/:id/unban", authMiddleware(true), async (req, res) => {
  const { id } = req.params
  try {
    await pool.query(
      `UPDATE users SET is_banned = false, ban_reason = NULL, banned_at = NULL WHERE id = $1`,
      [id]
    )
    await logAdminAction(req.user.sub, "unban_user", { target: id })
    const { rows: [user] } = await pool.query(`SELECT id, email, role, is_banned, ban_reason, banned_at FROM users WHERE id = $1`, [id])
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Failed to unban user" })
  }
})

app.delete("/api/admin/users/:id", authMiddleware(true), async (req, res) => {
  const { id } = req.params
  try {
    await pool.query(`DELETE FROM users WHERE id = $1`, [id])
    await logAdminAction(req.user.sub, "delete_user", { target: id })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" })
  }
})

app.post("/api/admin/users/:id/reset-password", authMiddleware(true), async (req, res) => {
  const { id } = req.params
  const newPassword = crypto.randomBytes(6).toString("base64url")
  try {
    const hash = await bcrypt.hash(newPassword, 12)
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, id])
    await logAdminAction(req.user.sub, "reset_password", { target: id })
    res.json({ success: true, temporaryPassword: newPassword })
  } catch (error) {
    res.status(500).json({ message: "Failed to reset password" })
  }
})

app.put("/api/admin/landing", authMiddleware(true), async (req, res) => {
  const { heroTitle, heroSubtitle, progress, devlog = [], announcements = [] } = req.body
  try {
    await pool.query(
      `
      UPDATE landing_content
      SET hero_title = $1,
          hero_subtitle = $2,
          progress = $3,
          devlog = $4,
          announcements = $5,
          updated_at = NOW(),
          updated_by = $6
      WHERE id = 1
    `,
      [heroTitle, heroSubtitle, progress, devlog, announcements, req.user.sub],
    )
    await logAdminAction(req.user.sub, "update_landing_content", { heroTitle, progress })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: "Failed to update landing" })
  }
})

app.post("/api/admin/assets/:type", authMiddleware(true), assetUpload.single("file"), async (req, res) => {
  const { type } = req.params
  if (!["logo", "background"].includes(type)) {
    return res.status(400).json({ message: "Invalid asset type" })
  }
    if (!req.file) {
    return res.status(400).json({ message: "File missing" })
  }
  try {
    const fileName = safeFileName(req.file.originalname)
    await pool.query(`UPDATE branding_assets SET is_active = false WHERE asset_type = $1`, [type])
    await pool.query(
      `
      INSERT INTO branding_assets (asset_type, file_name, mime_type, file_size, is_active, uploaded_by)
      VALUES ($1,$2,$3,$4,true,$5)
    `,
      [type, fileName, req.file.mimetype, req.file.size, req.user.sub],
    )
    await logAdminAction(req.user.sub, "upload_asset", { type, file: fileName })
    res.json({ success: true, url: buildPublicUrl("branding", fileName) })
  } catch (error) {
    res.status(500).json({ message: "Failed to upload asset" })
  }
})

app.post("/api/admin/music", authMiddleware(true), musicUpload.single("file"), async (req, res) => {
  const { title, artist } = req.body
  if (!req.file || !title) {
    return res.status(400).json({ message: "Invalid payload" })
  }
  try {
    const fileName = safeFileName(req.file.originalname)
    await pool.query(`UPDATE music_tracks SET is_active = false`)
    const {
      rows: [track],
    } = await pool.query(
      `
      INSERT INTO music_tracks (title, artist, file_name, mime_type, file_size, is_active, uploaded_by)
      VALUES ($1,$2,$3,$4,$5,true,$6)
      RETURNING id, title
    `,
      [title, artist || null, fileName, req.file.mimetype, req.file.size, req.user.sub],
    )
    await logAdminAction(req.user.sub, "upload_music", { title: track.title })
    res.json({ success: true, trackId: track.id, streamUrl: buildPublicUrl("music", fileName) })
  } catch (error) {
    res.status(500).json({ message: "Failed to upload music" })
  }
})

app.post("/api/admin/music/:id/activate", authMiddleware(true), async (req, res) => {
  const { id } = req.params
  try {
    await pool.query(`UPDATE music_tracks SET is_active = false`)
    await pool.query(`UPDATE music_tracks SET is_active = true WHERE id = $1`, [id])
    await logAdminAction(req.user.sub, "activate_music", { trackId: id })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: "Failed to activate music" })
  }
})

app.get("/api/admin/logs", authMiddleware(true), async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  try {
    const { rows } = await pool.query(
      `
      SELECT l.id, l.action, l.payload, l.created_at, u.email AS admin_email
      FROM admin_logs l
      LEFT JOIN users u ON u.id = l.admin_id
      ORDER BY l.created_at DESC
      LIMIT $1
    `,
      [limit],
    )
    res.json(rows)
  } catch (error) {
    res.status(500).json({ message: "Failed to load logs" })
  }
})

// =============================================================================
// TikTok Live API - Real Data Only (WebSocket)
// =============================================================================
// Store for active live connections
const tiktokLiveConnections = new Map()

// Store recent events from WebSocket
const tiktokLiveEvents = new Map()

/**
 * Get TikTok Live room info from username
 */
async function getTikTokLiveRoomId(username) {
  try {
    // First, get user info to check if live
    const userResponse = await axios.get(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      validateStatus: () => true,
    })

    // Extract live room ID from page
    const html = userResponse.data
    const roomIdMatch = html.match(/"roomId":"([^"]+)"/)
    if (roomIdMatch && roomIdMatch[1]) {
      return roomIdMatch[1]
    }

    // Alternative: Try to find in script tags
    const scriptMatch = html.match(/window\.__UNIVERSAL_DATA_FOR_REHYDRATION__=({.+?});/)
    if (scriptMatch) {
      try {
        const data = JSON.parse(scriptMatch[1])
        const liveRoomId = data?.defaultScope?.webapp?.user?.liveRoom?.roomId
        if (liveRoomId) return liveRoomId
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    return null
  } catch (error) {
    console.error(`Error getting live room ID for ${username}:`, error.message)
    return null
  }
}

/**
 * Connect to TikTok Live WebSocket and collect events in real-time
 */
function connectTikTokLiveWebSocket(username, roomId) {
  const cleanUsername = username.replace(/^@/, "")
  
  // Close existing connection if any
  if (tiktokLiveConnections.has(cleanUsername)) {
    const existingConn = tiktokLiveConnections.get(cleanUsername)
    if (existingConn.connection) {
      try {
        existingConn.connection.disconnect()
      } catch (e) {
        // Ignore disconnect errors
      }
    }
    tiktokLiveConnections.delete(cleanUsername)
  }
  
  // Initialize events storage with tracking sets for duplicates
  if (!tiktokLiveEvents.has(cleanUsername)) {
    tiktokLiveEvents.set(cleanUsername, {
      gifts: [],
      comments: [],
      likes: [],
      shares: [],
      // Track unique IDs to prevent duplicates
      seenGiftIds: new Set(),
      seenCommentIds: new Set(),
      seenLikeIds: new Set(),
      seenShareIds: new Set(),
      lastUpdate: Date.now(),
    })
  }
  
  try {
    console.log(`[TikTok WebSocket] Connecting to @${cleanUsername} (roomId: ${roomId || 'will be auto-detected'})`)
    
    // TikTokLiveConnection - use roomId directly instead of fetching
    const tiktokLiveConnection = new TikTokLiveConnection(cleanUsername, {
      enableExtendedGiftInfo: true,
      processInitialData: false,
      fetchRoomIdOnConnect: false, // Don't fetch, we already have roomId
      connectWithUniqueId: false, // Use roomId directly
      disableEulerFallbacks: true, // Disable Euler fallbacks since we have roomId
    })
    
    // Set roomId directly if we have it
    if (roomId) {
      tiktokLiveConnection.webClient.roomId = roomId
    }
    
    // Store connection
    tiktokLiveConnections.set(cleanUsername, {
      connection: tiktokLiveConnection,
      roomId: roomId,
      connectedAt: Date.now(),
    })
    
    const events = tiktokLiveEvents.get(cleanUsername)
    
    // Gift event
    tiktokLiveConnection.on("gift", (data) => {
      const user = data.user || {}
      const userId = user.userId?.toString() || user.uniqueId || "unknown"
      const giftId = data.giftId?.toString() || data.id?.toString() || "unknown"
      const timestamp = data.timestamp?.toString() || Date.now().toString()
      
      // Create unique ID for this gift event
      const uniqueId = `${userId}_${giftId}_${timestamp}`
      
      // Skip if we've already seen this gift
      if (events.seenGiftIds && events.seenGiftIds.has(uniqueId)) {
        return
      }
      
      // Mark as seen
      if (!events.seenGiftIds) events.seenGiftIds = new Set()
      events.seenGiftIds.add(uniqueId)
      
      // Limit seen IDs to prevent memory issues
      if (events.seenGiftIds.size > 1000) {
        const ids = Array.from(events.seenGiftIds)
        events.seenGiftIds = new Set(ids.slice(-500))
      }
      
      const giftInfo = {
        username: user.nickname || user.displayName || user.uniqueId || userId,
        gift: data.gift?.name || data.giftName || "Gift",
        count: data.repeatCount || data.repeatEnd || data.count || 1,
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      }
      
      events.gifts.unshift(giftInfo)
      // No limit - keep all
      events.lastUpdate = Date.now()
      console.log(`[TikTok WebSocket] Gift received: ${giftInfo.username} - ${giftInfo.gift} x${giftInfo.count}`)
    })
    
    // Comment/chat event
    tiktokLiveConnection.on("chat", (data) => {
      const user = data.user || {}
      const userId = user.userId?.toString() || user.uniqueId || "unknown"
      const commentText = (data.text || data.comment || "").trim()
      const msgId = data.msgId?.toString() || data.id?.toString()
      const timestamp = data.timestamp?.toString() || Date.now().toString()
      
      // Create unique ID for this comment (use msgId if available, otherwise user + text + timestamp)
      const uniqueId = msgId || `${userId}_${commentText.substring(0, 50)}_${timestamp}`
      
      // Skip if we've already seen this comment
      if (events.seenCommentIds && events.seenCommentIds.has(uniqueId)) {
        return
      }
      
      // Mark as seen
      if (!events.seenCommentIds) events.seenCommentIds = new Set()
      events.seenCommentIds.add(uniqueId)
      
      // Limit seen IDs to prevent memory issues
      if (events.seenCommentIds.size > 1000) {
        const ids = Array.from(events.seenCommentIds)
        events.seenCommentIds = new Set(ids.slice(-500))
      }
      
      const commentInfo = {
        username: user.nickname || user.displayName || user.uniqueId || userId,
        comment: commentText,
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      }
      
      events.comments.unshift(commentInfo)
      // No limit - keep all
      events.lastUpdate = Date.now()
      console.log(`[TikTok WebSocket] Comment received: ${commentInfo.username} - ${commentInfo.comment}`)
    })
    
    // Like event
    tiktokLiveConnection.on("like", (data) => {
      const user = data.user || {}
      const userId = user.userId?.toString() || user.uniqueId || "unknown"
      const timestamp = data.timestamp?.toString() || Math.floor(Date.now() / 1000).toString()
      
      // Create unique ID: one like per user per second (avoid duplicates from same user)
      const uniqueId = `${userId}_${timestamp}`
      
      // Skip if we've already seen this like from this user in this second
      if (events.seenLikeIds && events.seenLikeIds.has(uniqueId)) {
        return
      }
      
      // Mark as seen
      if (!events.seenLikeIds) events.seenLikeIds = new Set()
      events.seenLikeIds.add(uniqueId)
      
      // Limit seen IDs to prevent memory issues
      if (events.seenLikeIds.size > 1000) {
        const ids = Array.from(events.seenLikeIds)
        events.seenLikeIds = new Set(ids.slice(-500))
      }
      
      const likeInfo = {
        username: user.nickname || user.displayName || user.uniqueId || userId,
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      }
      
      events.likes.unshift(likeInfo)
      // No limit - keep all
      events.lastUpdate = Date.now()
      console.log(`[TikTok WebSocket] Like received: ${likeInfo.username}`)
    })
    
    // Helper function to add share event (prevent duplicates)
    const addShareEvent = (user) => {
      const userId = user.userId?.toString() || user.uniqueId || "unknown"
      const timestamp = Math.floor(Date.now() / 1000).toString()
      
      // Create unique ID: one share per user per second (avoid duplicates)
      const uniqueId = `${userId}_${timestamp}`
      
      // Skip if we've already seen this share from this user in this second
      if (events.seenShareIds && events.seenShareIds.has(uniqueId)) {
        return
      }
      
      // Mark as seen
      if (!events.seenShareIds) events.seenShareIds = new Set()
      events.seenShareIds.add(uniqueId)
      
      // Limit seen IDs to prevent memory issues
      if (events.seenShareIds.size > 1000) {
        const ids = Array.from(events.seenShareIds)
        events.seenShareIds = new Set(ids.slice(-500))
      }
      
      const shareInfo = {
        username: user.nickname || user.displayName || user.uniqueId || userId,
        time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      }
      
      events.shares.unshift(shareInfo)
      // No limit - keep all
      events.lastUpdate = Date.now()
      console.log(`[TikTok WebSocket] Share received: ${shareInfo.username}`)
    }
    
    // Share event (from social event)
    tiktokLiveConnection.on("share", (data) => {
      const user = data.user || {}
      addShareEvent(user)
    })
    
    // Social event (may include share)
    tiktokLiveConnection.on("social", (data) => {
      // Check if it's a share action (action 3 = share)
      if (data.action === 3 || data.type === 3) {
        const user = data.user || {}
        addShareEvent(user)
      }
    })
    
    // Connection events
    tiktokLiveConnection.on("connected", (state) => {
      console.log(`[TikTok WebSocket] Connected to ${cleanUsername}'s live stream (roomId: ${state.roomId || 'N/A'})`)
    })
    
    tiktokLiveConnection.on("disconnected", (info) => {
      console.log(`[TikTok WebSocket] Disconnected from ${cleanUsername}'s live stream`, info)
    })
    
    tiktokLiveConnection.on("streamEnd", (data) => {
      console.log(`[TikTok WebSocket] Stream ended for ${cleanUsername}`)
      tiktokLiveConnections.delete(cleanUsername)
    })
    
    tiktokLiveConnection.on("error", (err) => {
      console.error(`[TikTok WebSocket] Error for ${cleanUsername}:`, err.message || err)
    })
    
    // Connect with roomId if we have it
    if (roomId) {
      tiktokLiveConnection.connect(roomId).catch(err => {
        console.error(`[TikTok WebSocket] Connection failed for ${cleanUsername}:`, err.message || err)
        tiktokLiveConnections.delete(cleanUsername)
      })
    } else {
      // Fallback: let it fetch roomId (may fail if blocked)
      tiktokLiveConnection.connect().catch(err => {
        console.error(`[TikTok WebSocket] Connection failed for ${cleanUsername}:`, err.message || err)
        tiktokLiveConnections.delete(cleanUsername)
      })
    }
    
    return true
  } catch (error) {
    console.error(`[TikTok WebSocket] Error setting up connection for ${cleanUsername}:`, error.message || error)
    return false
  }
}

/**
 * Fetch real TikTok Live data using unofficial TikTok API endpoints
 * This function scrapes/uses TikTok's internal APIs to get live stream data
 */
async function fetchTikTokLiveData(username) {
  try {
    const cleanUsername = username.replace(/^@/, "")
    
    // Initialize events storage if not exists
    if (!tiktokLiveEvents.has(cleanUsername)) {
      tiktokLiveEvents.set(cleanUsername, {
        roomId: null,
        gifts: [],
        comments: [],
        likes: [],
        shares: [],
        // Track unique IDs to prevent duplicates
        seenGiftIds: new Set(),
        seenCommentIds: new Set(),
        seenLikeIds: new Set(),
        seenShareIds: new Set(),
        lastUpdate: Date.now(),
      })
    }

    const events = tiktokLiveEvents.get(cleanUsername)
    
    // Step 1: Get user page to find live room ID
    let roomId = events.roomId
    console.log(`[TikTok Live] Checking for room ID for ${cleanUsername}, cached: ${roomId || 'none'}`)
    
    if (!roomId) {
      try {
        console.log(`[TikTok Live] Fetching user page: https://www.tiktok.com/@${cleanUsername}`)
        const userPageResponse = await axios.get(`https://www.tiktok.com/@${cleanUsername}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'th-TH,th;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          validateStatus: () => true,
          timeout: 15000,
          maxRedirects: 5,
        })

        console.log(`[TikTok Live] User page response status: ${userPageResponse.status}`)

        if (userPageResponse.status === 200) {
          const html = userPageResponse.data
          
          // Try to extract room ID from various possible locations in HTML
          const roomIdPatterns = [
            /"roomId"\s*:\s*"([^"]+)"/,
            /"liveRoomId"\s*:\s*"([^"]+)"/,
            /"room_id"\s*:\s*"([^"]+)"/,
            /room_id['"]:\s*['"]([^'"]+)['"]/,
            /roomId['"]:\s*['"]([^'"]+)['"]/,
            /liveRoomId['"]:\s*['"]([^'"]+)['"]/,
          ]
          
          for (const pattern of roomIdPatterns) {
            const match = html.match(pattern)
            if (match && match[1] && match[1] !== 'null' && match[1] !== 'undefined' && match[1].length > 0) {
              roomId = match[1]
              events.roomId = roomId
              console.log(`[TikTok Live] Found room ID via pattern: ${roomId}`)
              break
            }
          }

          // Alternative: Try to parse JSON from script tags
          if (!roomId) {
            const scriptPatterns = [
              /window\.__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*({.+?});/s,
              /<script[^>]*>window\.__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*({.+?})<\/script>/s,
              /window\.__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*({[^;]+});/s,
            ]
            
            for (const scriptPattern of scriptPatterns) {
              const scriptMatch = html.match(scriptPattern)
              if (scriptMatch) {
                try {
                  const jsonStr = scriptMatch[1]
                  const data = JSON.parse(jsonStr)
                  roomId = data?.defaultScope?.webapp?.user?.liveRoom?.roomId ||
                           data?.defaultScope?.webapp?.user?.roomId ||
                           data?.webapp?.user?.liveRoom?.roomId ||
                           data?.defaultScope?.liveRoom?.roomId
                  if (roomId) {
                    events.roomId = roomId
                    console.log(`[TikTok Live] Found room ID via JSON parse: ${roomId}`)
                    break
                  }
                } catch (e) {
                  console.log(`[TikTok Live] JSON parse error:`, e.message)
                }
              }
            }
          }

          // Check if user is live by looking for live indicators
          if (!roomId) {
            const liveIndicators = [
              /"isLive":\s*true/,
              /"liveStatus":\s*1/,
              /"status":\s*2/,
              /กำลังไลฟ์/i,
              /LIVE/i,
            ]
            
            const hasLiveIndicator = liveIndicators.some(pattern => pattern.test(html))
            if (!hasLiveIndicator) {
              console.log(`[TikTok Live] No live indicators found - user may not be live`)
            }
          }
        } else {
          console.log(`[TikTok Live] Failed to fetch user page: HTTP ${userPageResponse.status}`)
        }
      } catch (error) {
        console.error(`[TikTok Live] Error fetching user page for ${cleanUsername}:`, error.message)
      }
    }

    if (!roomId) {
      console.log(`[TikTok Live] No room ID found for ${cleanUsername}`)
      return {
        gifts: [],
        comments: [],
        likes: [],
        shares: [],
        error: "ไม่พบไลฟ์สด กรุณาตรวจสอบว่า @username กำลังไลฟ์อยู่",
      }
    }

    console.log(`[TikTok Live] Using room ID: ${roomId}`)

    // Step 2: Connect to TikTok Live WebSocket for real-time events
    // The WebSocket connection will collect events in the background
    // Note: WebcastConnection will find roomId automatically from username
    if (!tiktokLiveConnections.has(cleanUsername)) {
      console.log(`[TikTok Live] Setting up WebSocket connection for ${cleanUsername} (room: ${roomId})`)
      connectTikTokLiveWebSocket(cleanUsername, roomId)
      // Wait a bit for WebSocket to connect and start receiving events
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Step 3: Return events collected from WebSocket
    // Events are continuously updated by WebSocket listeners
    // Note: 'events' was already declared above, just get the updated data
    const eventData = tiktokLiveEvents.get(cleanUsername)
    
    // Return current events (WebSocket updates these in real-time)
    const result = {
      gifts: eventData?.gifts || [],
      comments: eventData?.comments || [],
      likes: eventData?.likes || [],
      shares: eventData?.shares || [],
    }
    
    console.log(`[TikTok Live] Returning events:`, {
      gifts: result.gifts.length,
      comments: result.comments.length,
      likes: result.likes.length,
      shares: result.shares.length,
    })

    return result
  } catch (error) {
    console.error(`Error fetching TikTok Live data for ${username}:`, error.message)
    return {
      gifts: [],
      comments: [],
      likes: [],
      shares: [],
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล",
    }
  }
}

// Cleanup old events every 10 minutes
setInterval(() => {
  const now = Date.now()
  const maxAge = 10 * 60 * 1000 // 10 minutes
  for (const [username, events] of tiktokLiveEvents.entries()) {
    if (now - events.lastFetch > maxAge) {
      tiktokLiveEvents.delete(username)
    }
  }
}, 10 * 60 * 1000)

app.get("/api/tiktok/live", async (req, res) => {
  try {
    const { username } = req.query

    console.log(`[API] TikTok Live request for username: ${username}`)

    if (!username) {
      return res.status(400).json({ 
        message: "Username is required",
        gifts: [],
        comments: [],
        likes: [],
        shares: [],
        error: "กรุณากรอก username"
      })
    }

    // Clean username (remove @ if present)
    const cleanUsername = username.replace(/^@/, "").trim()

    if (!cleanUsername) {
      return res.status(400).json({ 
        message: "Username is required",
        gifts: [],
        comments: [],
        likes: [],
        shares: [],
        error: "กรุณากรอก username"
      })
    }

    console.log(`[API] Fetching TikTok Live data for: ${cleanUsername}`)

    // Fetch REAL data from TikTok Live - NO MOCK DATA
    const data = await fetchTikTokLiveData(cleanUsername)

    console.log(`[API] TikTok Live data fetched:`, {
      gifts: data.gifts?.length || 0,
      comments: data.comments?.length || 0,
      likes: data.likes?.length || 0,
      shares: data.shares?.length || 0,
      error: data.error || null,
    })

    res.json(data)
  } catch (error) {
    console.error("[API] Error fetching TikTok live data:", error)
    res.status(500).json({ 
      message: "Failed to fetch TikTok live data",
      gifts: [],
      comments: [],
      likes: [],
      shares: [],
      error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลจาก TikTok",
    })
  }
})

// =============================================================================
// Donation Widget APIs
// =============================================================================
// In-memory storage for donations (replace with database in production)
const donations = []
let donationIdCounter = 1

// POST: Submit a donation
app.post("/api/donations", async (req, res) => {
  try {
    const { donorName, amount, message, paymentMethod } = req.body
    
    if (!donorName || !amount) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const donation = {
      id: `donation_${donationIdCounter++}`,
      donorName,
      amount: parseFloat(amount),
      message: message || "",
      paymentMethod: paymentMethod || "unknown",
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    }

    donations.unshift(donation)
    
    // Keep only last 100 donations
    if (donations.length > 100) {
      donations.pop()
    }

    console.log(`[Donation] New donation: ${donorName} - ฿${amount}`)
    res.json({ success: true, donation })
  } catch (error) {
    console.error("[Donation] Error:", error)
    res.status(500).json({ message: "Failed to process donation" })
  }
})

// POST: Test donation (for testing widget)
app.post("/api/donations/test", async (req, res) => {
  try {
    const { donorName, amount, message } = req.body
    
    const donation = {
      id: `test_${Date.now()}`,
      donorName: donorName || "ผู้ทดสอบ",
      amount: parseFloat(amount) || 100,
      message: message || "ทดสอบ Widget",
      paymentMethod: "test",
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    }

    donations.unshift(donation)
    
    console.log(`[Donation Test] ${donation.donorName} - ฿${donation.amount}`)
    res.json({ success: true, donation })
  } catch (error) {
    console.error("[Donation Test] Error:", error)
    res.status(500).json({ message: "Failed to test donation" })
  }
})

// GET: Latest donation (for alert widget)
app.get("/api/donations/latest", async (req, res) => {
  try {
    const latest = donations[0] || null
    res.json(latest)
  } catch (error) {
    console.error("[Donation] Error fetching latest:", error)
    res.status(500).json({ message: "Failed to fetch latest donation" })
  }
})

// GET: Total donation amount (for goal widget)
app.get("/api/donations/total", async (req, res) => {
  try {
    const total = donations.reduce((sum, d) => sum + d.amount, 0)
    res.json({ total, count: donations.length })
  } catch (error) {
    console.error("[Donation] Error calculating total:", error)
    res.status(500).json({ message: "Failed to calculate total" })
  }
})

// GET: Leaderboard (for leaderboard widget)
app.get("/api/donations/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    
    // Group by donor name and sum amounts
    const donorTotals = {}
    donations.forEach(d => {
      if (!donorTotals[d.donorName]) {
        donorTotals[d.donorName] = 0
      }
      donorTotals[d.donorName] += d.amount
    })
    
    // Convert to array and sort
    const leaderboard = Object.entries(donorTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, limit)
      .map((item, index) => ({
        rank: index + 1,
        name: item.name,
        amount: item.amount,
      }))
    
    res.json(leaderboard)
  } catch (error) {
    console.error("[Donation] Error fetching leaderboard:", error)
    res.status(500).json({ message: "Failed to fetch leaderboard" })
  }
})

// GET: All donations (for admin)
app.get("/api/donations", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    res.json(donations.slice(0, limit))
  } catch (error) {
    console.error("[Donation] Error fetching donations:", error)
    res.status(500).json({ message: "Failed to fetch donations" })
  }
})

// =============================================================================
// Bootstrap Server
// =============================================================================
async function start() {
  try {
    await runMigrations()
    await bootstrapAdmin()
    app.listen(PORT, () => {
      console.log(`SharkCoder API online on port ${PORT}`)
    })
  } catch (error) {
    console.error("Failed to start API", error)
    process.exit(1)
  }
}

start()

