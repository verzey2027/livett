# 🚀 Deploy LiveTT ไปยัง Vercel

คู่มือการ Deploy ระบบ Live Donation ขึ้น Vercel (ฟรี!)

## 📋 สิ่งที่ต้องเตรียม

1. บัญชี GitHub (มีอยู่แล้ว ✅)
2. บัญชี Vercel (สมัครฟรีที่ https://vercel.com)
3. Database Online (เลือกอย่างใดอย่างหนึ่ง):
   - **Neon** (PostgreSQL ฟรี) - แนะนำ
   - **PlanetScale** (MySQL ฟรี)
   - **Supabase** (PostgreSQL ฟรี)

---

## 🗄️ ขั้นตอนที่ 1: ตั้งค่า Database Online

### วิธีที่ 1: ใช้ Neon (PostgreSQL) - แนะนำ

1. ไปที่ https://neon.tech
2. สมัครสมาชิก (ใช้ GitHub login ได้)
3. สร้าง Project ใหม่
4. คัดลอก **Connection String** ที่ได้
   - จะเป็นแบบนี้: `postgresql://user:password@ep-xxx.neon.tech/neondb`

5. รัน SQL เพื่อสร้างตาราง:
   - ไปที่ SQL Editor ใน Neon
   - Copy โค้ดจาก `setup_mysql.sql` (แก้ไขให้เข้ากับ PostgreSQL)
   - หรือใช้โค้ดนี้:

```sql
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้างตาราง donation_goals
CREATE TABLE donation_goals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง admin user เริ่มต้น (password: admin1234)
INSERT INTO users (email, password, first_name, last_name, role)
VALUES ('admin@sharkcoder.dev', '$2b$10$YourHashedPasswordHere', 'Admin', 'User', 'admin');
```

### วิธีที่ 2: ใช้ Supabase (PostgreSQL)

1. ไปที่ https://supabase.com
2. สร้าง Project ใหม่
3. ไปที่ Settings → Database
4. คัดลอก **Connection String** (URI mode)
5. รัน SQL ใน SQL Editor เหมือนข้างบน

---

## 🚀 ขั้นตอนที่ 2: Deploy Backend ไปยัง Vercel

### 2.1 เตรียม Backend

1. **สร้าง Repository แยกสำหรับ Backend** (แนะนำ):
   ```bash
   # สร้างโฟลเดอร์ใหม่
   mkdir livett-backend
   cd livett-backend
   
   # Copy ไฟล์ Backend
   # - index.js
   # - package.json
   # - vercel.json
   # - mysql-helper.js (ถ้าใช้)
   # - mysql-migrations.js (ถ้าใช้)
   ```

2. **Push ขึ้น GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Backend for LiveTT"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/livett-backend.git
   git push -u origin main
   ```

### 2.2 Deploy บน Vercel

1. ไปที่ https://vercel.com/dashboard
2. คลิก **"Add New Project"**
3. เลือก Repository: `livett-backend`
4. ตั้งค่า:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (ถ้าไม่ได้แยก repo)
   - **Build Command**: (ปล่อยว่าง)
   - **Output Directory**: (ปล่อยว่าง)

5. **เพิ่ม Environment Variables**:
   คลิก "Environment Variables" แล้วเพิ่ม:
   
   ```
   DATABASE_URL = postgresql://user:password@ep-xxx.neon.tech/neondb
   JWT_SECRET = your-super-secret-key-change-this
   NODE_ENV = production
   PORT = 8080
   ```

6. คลิก **"Deploy"**

7. รอสักครู่ จะได้ URL เช่น: `https://livett-backend.vercel.app`

8. **ทดสอบ**: เปิด `https://livett-backend.vercel.app/api/health`
   - ถ้าเห็น `{"status":"ok"}` แสดงว่าสำเร็จ! ✅

---

## 🎨 ขั้นตอนที่ 3: Deploy Frontend ไปยัง Vercel

### 3.1 เตรียม Frontend

1. **แก้ไขไฟล์ `frontend/.env.production`**:
   ```env
   NEXT_PUBLIC_API_URL=https://livett-backend.vercel.app
   ```

2. **หรือตั้งค่าใน Vercel Environment Variables**

### 3.2 Deploy Frontend

1. กลับไปที่ Vercel Dashboard
2. คลิก **"Add New Project"** อีกครั้ง
3. เลือก Repository เดิม: `livett`
4. ตั้งค่า:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: (ปล่อยว่าง - Next.js จัดการเอง)

5. **เพิ่ม Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL = https://livett-backend.vercel.app
   ```

6. คลิก **"Deploy"**

7. รอสักครู่ จะได้ URL เช่น: `https://livett.vercel.app`

---

## ✅ ขั้นตอนที่ 4: ทดสอบระบบ

1. **เปิด Frontend**: `https://livett.vercel.app`
2. **ทดสอบ Login**: ไปที่ `/login`
   - Email: `admin@sharkcoder.dev`
   - Password: `admin1234`
3. **ทดสอบ Donate**: ไปที่ `/donate`
4. **ทดสอบ Live View**: ไปที่ `/live`
5. **ทดสอบ Widgets**: ไปที่ `/widgets/alert`

---

## 🔧 การตั้งค่าเพิ่มเติม

### เชื่อม Domain ของคุณเอง

1. ไปที่ Project Settings → Domains
2. เพิ่ม Domain ของคุณ (เช่น `donate.yourdomain.com`)
3. ตั้งค่า DNS ตามที่ Vercel บอก

### อัพเดทโค้ด

เมื่อคุณ push โค้ดใหม่ขึ้น GitHub:
- Vercel จะ **auto-deploy** ให้อัตโนมัติ! 🎉

---

## 🐛 แก้ปัญหาที่พบบ่อย

### ❌ Backend ไม่ทำงาน

**ปัญหา**: เปิด `/api/health` แล้วเจอ error

**แก้ไข**:
1. ตรวจสอบ Environment Variables ใน Vercel
2. ตรวจสอบ Logs: Project → Deployments → คลิกที่ deployment → View Function Logs
3. ตรวจสอบว่า `DATABASE_URL` ถูกต้อง

### ❌ Frontend เชื่อมต่อ Backend ไม่ได้

**ปัญหา**: เปิดหน้าเว็บแล้วไม่มีข้อมูล

**แก้ไข**:
1. เปิด Browser Console (F12)
2. ดู Network tab ว่า API call ไปที่ไหน
3. ตรวจสอบว่า `NEXT_PUBLIC_API_URL` ถูกต้อง
4. ลอง Redeploy Frontend

### ❌ CORS Error

**ปัญหา**: เจอ error "CORS policy"

**แก้ไข**:
1. เพิ่ม CORS middleware ใน `index.js`:
   ```javascript
   app.use(cors({
     origin: ['https://livett.vercel.app', 'http://localhost:3000'],
     credentials: true
   }));
   ```
2. Redeploy Backend

### ❌ Database Connection Error

**ปัญหา**: ไม่สามารถเชื่อมต่อ Database

**แก้ไข**:
1. ตรวจสอบว่า Database online ทำงานอยู่
2. ตรวจสอบ Connection String
3. ตรวจสอบว่า IP ของ Vercel ไม่ถูกบล็อก (บาง Database ต้องเพิ่ม IP whitelist)

---

## 💰 ค่าใช้จ่าย

- **Vercel**: ฟรี (Hobby Plan)
  - Bandwidth: 100GB/เดือน
  - Builds: 6,000 นาที/เดือน
  - เพียงพอสำหรับ Streamer ขนาดกลาง

- **Neon/Supabase**: ฟรี
  - Storage: 500MB - 1GB
  - เพียงพอสำหรับเริ่มต้น

---

## 🎉 เสร็จแล้ว!

ตอนนี้ระบบของคุณ Deploy แล้ว:
- ✅ Backend: `https://livett-backend.vercel.app`
- ✅ Frontend: `https://livett.vercel.app`
- ✅ Database: Online และพร้อมใช้งาน

**แชร์ลิงก์ให้ผู้ชมได้เลย!** 🚀

---

## 📚 ลิงก์ที่เป็นประโยชน์

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
