"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

interface Donor {
  rank: number
  name: string
  amount: number
}

function LeaderboardContent() {
  const searchParams = useSearchParams()
  const [topDonors, setTopDonors] = useState<Donor[]>([])

  // ดึงค่าจาก URL parameters
  const limit = searchParams.get("limit") || "10"
  const bgColor = searchParams.get("bgColor") || "rgba(0,0,0,0.8)"
  const title = searchParams.get("title") || "🏆 อันดับผู้สนับสนุน"

  useEffect(() => {
    // ฟังก์ชันดึงข้อมูล leaderboard
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/donations/leaderboard?limit=${limit}`)
        if (response.ok) {
          const data = await response.json()
          setTopDonors(data)
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
      }
    }

    // ดึงข้อมูลทันทีและทุก 10 วินาที
    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 10000)
    return () => clearInterval(interval)
  }, [limit])

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇"
      case 2:
        return "🥈"
      case 3:
        return "🥉"
      default:
        return `#${rank}`
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-400"
      case 2:
        return "text-gray-300"
      case 3:
        return "text-orange-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-transparent">
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: bgColor }}
      >
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white">{title}</h2>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3">
          {topDonors.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">💝</div>
              <div>ยังไม่มีผู้สนับสนุน</div>
              <div className="text-sm">เป็นคนแรกได้เลย!</div>
            </div>
          ) : (
            topDonors.map((donor) => (
              <div
                key={donor.rank}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                  donor.rank <= 3
                    ? "bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border-2 border-cyan-400/50"
                    : "bg-gray-800/50 border border-gray-700"
                }`}
              >
                {/* Rank */}
                <div className={`text-2xl font-bold ${getRankColor(donor.rank)} min-w-[60px]`}>
                  {getRankEmoji(donor.rank)}
                </div>

                {/* Name */}
                <div className="flex-1 px-4">
                  <div className="text-white font-semibold text-lg truncate">
                    {donor.name}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div className="text-cyan-400 font-bold text-xl">
                    ฿{donor.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-400 text-sm">
          อัพเดทอัตโนมัติทุก 10 วินาที
        </div>
      </div>
    </div>
  )
}

export default function LeaderboardWidget() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center p-4 bg-transparent">
        <p className="text-white text-sm opacity-50">กำลังโหลด...</p>
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  )
}
