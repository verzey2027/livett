# 🦈 SharkCoder - คู่มือการติดตั้งและใช้งาน

## 📋 สารบัญ
1. [ข้อกำหนดระบบ](#ข้อกำหนดระบบ)
2. [การติดตั้ง](#การติดตั้ง)
3. [การรันโปรเจค](#การรันโปรเจค)
4. [แก้ปัญหา](#แก้ปัญหา)

---

## 🖥️ ข้อกำหนดระบบ

- **Node.js** v16 หรือสูงกว่า
- **PostgreSQL** v12 หรือสูงกว่า
- **npm** หรือ **yarn**

---

## 📦 การติดตั้ง

### ขั้นตอนที่ 1: ติดตั้ง PostgreSQL

ดาวน์โหลดและติดตั้ง PostgreSQL จาก:
👉 https://www.postgresql.org/download/windows/

**สำคัญ:** จดรหัสผ่านที่ตั้งไว้ตอนติดตั้ง!

### ขั้นตอนที่ 2: สร้าง Database

**วิธีที่ 1 - ใช้ไฟล์ .cmd (ง่ายที่สุด):**
```cmd
create_database.cmd
```

**วิธีที่ 2 - ใช้ pgAdmin:**
1. เปิด pgAdmin
2. คลิกขวาที่ **Databases** → **Create** → **Database**
3. ตั้งชื่อ: `shark_coder`
4. คลิก **Save**

**วิธีที่ 3 - ใช้ Command Line:**
```cmd
psql -U postgres -c "CREATE DATABASE shark_coder;"
```

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables

แก้ไขไฟล์ `.env` (ถ้ายังไม่มีให้สร้างใหม่):

```env
PORT=8080
DB_USER=postgres
DB_HOST=localhost
DB_PASSWORD=postgres
DB_PORT=5432
DB_NAME=shark_coder
JWT_SECRET=shark-coder-access
JWT_REFRESH_SECRET=shark-coder-refresh
ALLOWED_ORIGINS=http://localhost:3000
ADMIN_EMAIL=admin@sharkcoder.dev
ADMIN_PASSWORD=admin1234
FRONTEND_URL=http://localhost:3000
```

**⚠️ สำคัญ:** แก้ `DB_PASSWORD` ให้ตรงกับรหัสผ่าน PostgreSQL ของคุณ!

### ขั้นตอนที่ 4: ติดตั้ง Dependencies

```cmd
npm install
cd frontend
npm install
cd ..
```

---

## 🚀 การรันโปรเจค

### วิธีที่ 1 - ใช้ไฟล์ .cmd (แนะนำ)

**รัน Backend:**
```cmd
START.cmd
```

**รัน Frontend:** (เปิด Command Prompt ใหม่)
```cmd
Run_Dev.cmd
```

### วิธีที่ 2 - ใช้ Command Line

**Terminal 1 - Backend:**
```cmd
node index.js
```

**Terminal 2 - Frontend:**
```cmd
cd frontend
npm run dev
```

---

## ✅ ตรวจสอบว่าทำงานหรือไม่

เปิดเบราว์เซอร์:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080/health
- **API Docs:** http://localhost:8080/api-docs (ถ้ามี)

ถ้าเห็นหน้าเว็บแสดงว่าสำเร็จ! 🎉

---

## 🔐 ข้อมูลเข้าสู่ระบบ Admin

หลังจากรัน Backend ครั้งแรก ระบบจะสร้าง Admin account อัตโนมัติ:

- **Email:** `admin@sharkcoder.dev`
- **Password:** `admin1234`

---

## 🔧 แก้ปัญหา

### ❌ Backend แสดง "ECONNREFUSED"

**สาเหตุ:** เชื่อมต่อ PostgreSQL ไม่ได้

**วิธีแก้:**
1. ตรวจสอบว่า PostgreSQL service กำลังรันอยู่
   - Windows: Services → หา "postgresql" → ต้องเป็น "Running"
2. ตรวจสอบว่าสร้าง database `shark_coder` แล้ว
3. ตรวจสอบ `DB_PASSWORD` ใน `.env`

### ❌ Backend แสดง "password authentication failed"

**สาเหตุ:** รหัสผ่านไม่ถูกต้อง

**วิธีแก้:**
1. แก้ไข `DB_PASSWORD` ใน `.env` ให้ตรงกับรหัสผ่าน postgres
2. หรือรีเซ็ตรหัสผ่าน:
   ```cmd
   psql -U postgres
   ALTER USER postgres PASSWORD 'postgres';
   \q
   ```

### ❌ Frontend แสดง "Failed to fetch"

**สาเหตุ:** Backend ไม่ได้รัน

**วิธีแก้:**
1. ตรวจสอบว่า Backend รันอยู่ที่ port 8080
2. เปิด http://localhost:8080/health ดูว่าตอบกลับมาไหม
3. ดู error ใน Console ของ Backend

### ❌ "psql: command not found"

**สาเหตุ:** PostgreSQL ยังไม่ได้เพิ่มใน PATH

**วิธีแก้:**
1. ใช้ pgAdmin แทน (GUI)
2. หรือเพิ่ม PostgreSQL ใน PATH:
   - เพิ่ม `C:\Program Files\PostgreSQL\15\bin` ใน Environment Variables

### ❌ Port 3000 หรือ 8080 ถูกใช้งานอยู่

**วิธีแก้:**
1. หา process ที่ใช้ port:
   ```cmd
   netstat -ano | findstr :3000
   netstat -ano | findstr :8080
   ```
2. ปิด process:
   ```cmd
   taskkill /PID <PID> /F
   ```

---

## 📁 โครงสร้างโปรเจค

```
shark_coder/
├── index.js              # Backend API (Node.js + Express)
├── .env                  # Environment variables
├── package.json          # Backend dependencies
├── START.cmd             # รัน Backend
├── create_database.cmd   # สร้าง database
├── frontend/             # Frontend (Next.js)
│   ├── package.json      # Frontend dependencies
│   ├── app/              # Next.js pages
│   └── lib/              # Utilities
├── media/                # Uploaded files
│   ├── branding/         # Logos & backgrounds
│   └── music/            # Music tracks
└── README_THAI.md        # คู่มือนี้
```

---

## 🎯 Quick Start (สำหรับคนรีบ)

```cmd
# 1. สร้าง database
create_database.cmd

# 2. แก้ไข .env (ใส่รหัสผ่าน PostgreSQL)
notepad .env

# 3. รัน Backend
START.cmd

# 4. รัน Frontend (Terminal ใหม่)
Run_Dev.cmd

# 5. เปิดเบราว์เซอร์
start http://localhost:3000
```

---

## 📚 เอกสารเพิ่มเติม

- [SETUP_POSTGRESQL.md](SETUP_POSTGRESQL.md) - คู่มือ PostgreSQL แบบละเอียด
- [SETUP_XAMPP.md](SETUP_XAMPP.md) - คู่มือ MySQL (ถ้าต้องการใช้ MySQL แทน)

---

## 💡 Tips

1. **ใช้ pgAdmin** สำหรับจัดการ database ง่ายๆ
2. **ดู logs** ของ Backend เพื่อ debug ปัญหา
3. **เปิด Developer Tools** (F12) ใน Browser เพื่อดู error
4. **Restart Backend** หลังจากแก้ไข `.env`

---

## 🆘 ต้องการความช่วยเหลือ?

ถ้ายังมีปัญหา:
1. ตรวจสอบ error message ใน Terminal
2. ดู logs ใน Browser Console (F12)
3. ตรวจสอบว่า PostgreSQL รันอยู่
4. ตรวจสอบว่า port 3000 และ 8080 ว่าง

---

**สนุกกับการ code! 🚀**
