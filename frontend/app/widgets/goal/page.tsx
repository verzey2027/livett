"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

interface DonationGoal {
  current: number
  target: number
  title: string
}

function GoalWidget() {
  const searchParams = useSearchParams()
  const [goal, setGoal] = useState<DonationGoal>({
    current: 0,
    target: 1000,
    title: "เป้าหมายการโดเนท",
  })

  // ดึงค่าจาก URL parameters
  const targetAmount = searchParams.get("target") || "1000"
  const title = searchParams.get("title") || "เป้าหมายการโดเนท"
  const barColor = searchParams.get("barColor") || "#06b6d4"
  const bgColor = searchParams.get("bgColor") || "rgba(0,0,0,0.8)"

  useEffect(() => {
    setGoal((prev) => ({ ...prev, target: parseInt(targetAmount), title }))

    // ฟังก์ชันดึงข้อมูลยอดโดเนทปัจจุบัน
    const fetchCurrentAmount = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/donations/total")
        if (response.ok) {
          const data = await response.json()
          setGoal((prev) => ({ ...prev, current: data.total || 0 }))
        }
      } catch (error) {
        console.error("Error fetching donation total:", error)
      }
    }

    // ดึงข้อมูลทันทีและทุก 5 วินาที
    fetchCurrentAmount()
    const interval = setInterval(fetchCurrentAmount, 5000)
    return () => clearInterval(interval)
  }, [targetAmount, title])

  const percentage = Math.min((goal.current / goal.target) * 100, 100)

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-transparent">
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ backgroundColor: bgColor }}
      >
        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white">{goal.title}</h2>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full h-12 bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: barColor,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>

          {/* Percentage Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-lg drop-shadow-lg">
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Amount Display */}
        <div className="flex justify-between items-center text-white">
          <div className="text-center">
            <div className="text-sm text-gray-400">ปัจจุบัน</div>
            <div className="text-2xl font-bold" style={{ color: barColor }}>
              ฿{goal.current.toLocaleString()}
            </div>
          </div>

          <div className="text-3xl text-gray-500">→</div>

          <div className="text-center">
            <div className="text-sm text-gray-400">เป้าหมาย</div>
            <div className="text-2xl font-bold text-purple-400">
              ฿{goal.target.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Remaining Amount */}
        {goal.current < goal.target && (
          <div className="mt-4 text-center text-gray-300 text-sm">
            เหลืออีก ฿{(goal.target - goal.current).toLocaleString()} เพื่อถึงเป้าหมาย
          </div>
        )}

        {/* Goal Reached */}
        {goal.current >= goal.target && (
          <div className="mt-4 text-center">
            <div className="text-2xl animate-bounce">🎉</div>
            <div className="text-green-400 font-bold">ถึงเป้าหมายแล้ว!</div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}

export default function DonationGoalWidget() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center p-4 bg-transparent">
        <p className="text-white text-sm opacity-50">กำลังโหลด...</p>
      </div>
    }>
      <GoalWidget />
    </Suspense>
  )
}
