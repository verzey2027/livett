# 🚀 Quick Deploy Guide

## ✅ Database Setup - เสร็จแล้ว!

คุณได้ตั้งค่า Database บน Neon เรียบร้อยแล้ว:
- ✅ ตารางทั้งหมดถูกสร้างแล้ว
- ✅ Admin account พร้อมใช้งาน

**Admin Login:**
- Email: `admin@sharkcoder.dev`
- Password: `admin1234`

---

## 📦 ขั้นตอนต่อไป: Deploy ไปยัง Vercel

### 1️⃣ Deploy Backend

1. ไปที่ https://vercel.com/new
2. Import repository: `verzey2027/livett`
3. ตั้งค่า:
   - **Project Name**: `livett-backend`
   - **Framework Preset**: Other
   - **Root Directory**: `./` (ปล่อยว่าง)
   - **Build Command**: (ปล่อยว่าง)

4. **Environment Variables** - เพิ่มตัวแปรเหล่านี้:

```
DATABASE_URL
postgresql://neondb_owner:npg_9ah1ASpsRwCb@ep-sweet-unit-a1ddd0ph-pooler.ap-southeast-1.aws.neon.tech/ttlive?sslmode=require

JWT_SECRET
your-super-secret-key-change-this-to-random-string

NODE_ENV
production

PORT
8080
```

5. คลิก **Deploy**
6. รอสักครู่ จะได้ URL เช่น: `https://livett-backend.vercel.app`
7. ทดสอบ: เปิด `https://livett-backend.vercel.app/api/health`

---

### 2️⃣ Deploy Frontend

1. กลับไปที่ https://vercel.com/new
2. Import repository เดิม: `verzey2027/livett`
3. ตั้งค่า:
   - **Project Name**: `livett` หรือ `livett-frontend`
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto)

4. **Environment Variables**:

```
NEXT_PUBLIC_API_URL
https://livett-backend.vercel.app
```

5. คลิก **Deploy**
6. รอสักครู่ จะได้ URL เช่น: `https://livett.vercel.app`

---

## 🎉 เสร็จแล้ว!

ทดสอบระบบ:
1. เปิด `https://livett.vercel.app`
2. ไปที่ `/login`
3. Login ด้วย:
   - Email: `admin@sharkcoder.dev`
   - Password: `admin1234`
4. ทดสอบหน้าต่างๆ:
   - `/live` - Live view
   - `/donate` - Donation form
   - `/widgets/alert` - Alert widget
   - `/dashboard` - Admin dashboard

---

## 🔧 ถ้ามีปัญหา

### Backend ไม่ทำงาน
- ตรวจสอบ Environment Variables
- ดู Logs ใน Vercel Dashboard → Deployments → View Function Logs

### Frontend เชื่อมต่อไม่ได้
- ตรวจสอบว่า `NEXT_PUBLIC_API_URL` ถูกต้อง
- เปิด Browser Console (F12) ดู error

### CORS Error
เพิ่มใน `index.js`:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://livett.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

---

## 📱 ใช้งานจริง

**สำหรับ Streamer:**
1. แชร์ลิงก์โดเนท: `https://livett.vercel.app/donate`
2. เพิ่ม Widget ใน OBS:
   - Browser Source → URL: `https://livett.vercel.app/widgets/alert`
3. เปิดหน้า Live: `https://livett.vercel.app/live`

**Widget URLs:**
- Alert: `/widgets/alert?textColor=ffffff&fontSize=32`
- Goal: `/widgets/goal?target=5000&title=เป้าหมายวันนี้`
- Leaderboard: `/widgets/leaderboard?limit=10`

---

## 🎯 Next Steps

- [ ] เปลี่ยนรหัสผ่าน Admin
- [ ] ตั้งค่า Custom Domain (ถ้าต้องการ)
- [ ] ทดสอบการโดเนท
- [ ] ตั้งค่า Widget ใน OBS
- [ ] แชร์ลิงก์ให้ผู้ชม

**Happy Streaming! 🎮🎉**
