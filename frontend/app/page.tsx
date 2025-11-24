"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function HomePage() {
  const router = useRouter()
  const [nickname, setNickname] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedNickname = localStorage.getItem("user_nickname")
    if (savedNickname) {
      setNickname(savedNickname)
    }
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-2">
            SharkCoder.Live
          </div>
          <p className="text-gray-400 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <main className="w-full max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-4 animate-pulse">
            SharkCoder.Live
          </h1>
          <p className="text-xl text-gray-400 mb-2">ระบบติดตามสตรีมเมอร์ Real-Time PRO</p>
          {nickname && (
            <p className="text-cyan-400">
              ยินดีต้อนรับ, <span className="font-bold">{nickname}</span>! 👋
            </p>
          )}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Live Tracking */}
          <button
            onClick={() => router.push("/live")}
            className="group bg-gray-800/50 border-2 border-gray-700 hover:border-gray-600 rounded-2xl p-8 transition-all hover:scale-105"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📺</div>
            <h2 className="text-2xl font-bold mb-3">Live Tracking</h2>
            <p className="text-gray-400 mb-4">
              ติดตามสตรีมเมอร์ TikTok แบบเรียลไทม์ ดูของขวัญ คอมเมนต์ ไลก์ และแชร์
            </p>
            <div className="text-sm font-semibold">
              เริ่มติดตาม →
            </div>
          </button>

          {/* Donation */}
          <button
            onClick={() => router.push("/donate")}
            className="group bg-gray-800/50 border-2 border-gray-700 hover:border-gray-600 rounded-2xl p-8 transition-all hover:scale-105"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">💝</div>
            <h2 className="text-2xl font-bold mb-3">Donation</h2>
            <p className="text-gray-400 mb-4">
              สนับสนุนสตรีมเมอร์ที่คุณชื่นชอบ ผ่านช่องทางต่างๆ ง่ายและสะดวก
            </p>
            <div className="text-sm font-semibold">
              โดเนทเลย →
            </div>
          </button>

          {/* Widgets */}
          <button
            onClick={() => router.push("/widgets")}
            className="group bg-gray-800/50 border-2 border-gray-700 hover:border-gray-600 rounded-2xl p-8 transition-all hover:scale-105"
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
            <h2 className="text-2xl font-bold mb-3">OBS Widgets</h2>
            <p className="text-gray-400 mb-4">
              ตั้งค่า Widget Overlays สำหรับ OBS Studio แจ้งเตือนโดเนท เป้าหมาย และอันดับ
            </p>
            <div className="text-sm font-semibold">
              ตั้งค่า Widget →
            </div>
          </button>
        </div>

        {/* Features List */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-center">✨ ฟีเจอร์ทั้งหมด</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <h4 className="font-bold text-cyan-400">ติดตามของขวัญ</h4>
                <p className="text-sm text-gray-400">ดูของขวัญที่ได้รับแบบเรียลไทม์</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <h4 className="font-bold text-cyan-400">ติดตามคอมเมนต์</h4>
                <p className="text-sm text-gray-400">อ่านคอมเมนต์จากผู้ชมทันที</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <h4 className="font-bold text-purple-400">แจ้งเตือนโดเนท</h4>
                <p className="text-sm text-gray-400">Widget แสดงการโดเนทใน OBS</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h4 className="font-bold text-purple-400">เป้าหมายโดเนท</h4>
                <p className="text-sm text-gray-400">แสดง Progress Bar เป้าหมาย</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <h4 className="font-bold text-green-400">Leaderboard</h4>
                <p className="text-sm text-gray-400">จัดอันดับผู้สนับสนุนอันดับต้นๆ</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="font-bold text-green-400">Real-Time</h4>
                <p className="text-sm text-gray-400">อัพเดทข้อมูลแบบเรียลไทม์</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>สร้างด้วย ❤️ สำหรับสตรีมเมอร์ไทย</p>
          <p className="mt-2">SharkCoder.Live © 2024</p>
        </div>
      </main>
    </div>
  )
}
