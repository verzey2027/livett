@echo off
echo ========================================
echo SharkCoder - Create PostgreSQL Database
echo ========================================
echo.
echo กำลังสร้าง database 'shark_coder'...
echo.

REM ลองหา psql ใน PATH ปกติ
where psql >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo พบ PostgreSQL ใน PATH
    psql -U postgres -c "CREATE DATABASE shark_coder;"
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ สร้าง database สำเร็จ!
        echo.
        echo ตอนนี้รันคำสั่ง: node index.js
        echo.
    ) else (
        echo.
        echo ❌ ไม่สามารถสร้าง database ได้
        echo กรุณาตรวจสอบ username/password
        echo.
    )
    goto :end
)

REM ลองหาใน Program Files
set PSQL_PATH=
for /d %%i in ("C:\Program Files\PostgreSQL\*") do (
    if exist "%%i\bin\psql.exe" (
        set PSQL_PATH=%%i\bin\psql.exe
        goto :found
    )
)

:found
if defined PSQL_PATH (
    echo พบ PostgreSQL ที่: %PSQL_PATH%
    "%PSQL_PATH%" -U postgres -c "CREATE DATABASE shark_coder;"
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ สร้าง database สำเร็จ!
        echo.
        echo ตอนนี้รันคำสั่ง: node index.js
        echo.
    ) else (
        echo.
        echo ❌ ไม่สามารถสร้าง database ได้
        echo กรุณาตรวจสอบ username/password
        echo.
    )
) else (
    echo.
    echo ❌ ไม่พบ PostgreSQL
    echo.
    echo กรุณาติดตั้ง PostgreSQL ก่อน:
    echo https://www.postgresql.org/download/windows/
    echo.
    echo หรือสร้าง database ด้วยตนเองผ่าน pgAdmin:
    echo 1. เปิด pgAdmin
    echo 2. คลิกขวาที่ Databases
    echo 3. Create -^> Database
    echo 4. ตั้งชื่อ: shark_coder
    echo.
)

:end
pause
