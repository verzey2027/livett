@echo off
echo ========================================
echo SharkCoder - PostgreSQL Installation
echo ========================================
echo.
echo คุณมี 2 ทางเลือก:
echo.
echo 1. ติดตั้ง PostgreSQL ผ่าน Chocolatey (แนะนำ - ง่ายที่สุด)
echo 2. ดาวน์โหลดและติดตั้งเอง
echo.
echo ========================================
echo ทางเลือกที่ 1: Chocolatey
echo ========================================
echo.
echo ถ้าคุณมี Chocolatey แล้ว รันคำสั่ง:
echo   choco install postgresql
echo.
echo ถ้ายังไม่มี Chocolatey ติดตั้งก่อนด้วย:
echo   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
echo.
echo ========================================
echo ทางเลือกที่ 2: ดาวน์โหลดเอง
echo ========================================
echo.
echo 1. ไปที่: https://www.postgresql.org/download/windows/
echo 2. ดาวน์โหลด PostgreSQL Installer
echo 3. ติดตั้งและตั้งรหัสผ่าน postgres
echo 4. สร้าง database ชื่อ shark_coder
echo.
echo หลังจากติดตั้งเสร็จ รันคำสั่ง:
echo   psql -U postgres
echo   CREATE DATABASE shark_coder;
echo   \q
echo.
echo แล้วรัน: node index.js
echo.
pause
