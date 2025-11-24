"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

interface DonationAlert {
  id: string
  donorName: string
  amount: number
  message?: string
  timestamp: number
}

function AlertWidget() {
  const searchParams = useSearchParams()
  const [currentAlert, setCurrentAlert] = useState<DonationAlert | null>(null)
  const [isShowing, setIsShowing] = useState(false)

  // ดึงค่าจาก URL parameters สำหรับ customization
  const textColor = searchParams.get("textColor") || "#ffffff"
  const bgColor = searchParams.get("bgColor") || "rgba(0,0,0,0.8)"
  const fontSize = searchParams.get("fontSize") || "32"

  useEffect(() => {
    // ฟังก์ชันดึงข้อมูลโดเนทใหม่จาก backend
    const checkForNewDonations = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/donations/latest")
        if (response.ok) {
          const data = await response.json()
          if (data && data.id !== currentAlert?.id) {
            showAlert(data)
          }
        }
      } catch (error) {
        console.error("Error fetching donations:", error)
      }
    }

    const showAlert = (donation: DonationAlert) => {
      setCurrentAlert(donation)
      setIsShowing(true)

      // ซ่อนหลังจาก 5 วินาที
      setTimeout(() => {
        setIsShowing(false)
        setTimeout(() => setCurrentAlert(null), 500)
      }, 5000)
    }

    // ตรวจสอบทุก 2 วินาที
    const interval = setInterval(checkForNewDonations, 2000)
    return () => clearInterval(interval)
  }, [currentAlert])

  if (!currentAlert) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-transparent">
        <p className="text-white text-sm opacity-50">รอการโดเนท...</p>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-transparent">
      <div
        className={`transition-all duration-500 transform ${
          isShowing ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
        style={{
          backgroundColor: bgColor,
          color: textColor,
          fontSize: `${fontSize}px`,
        }}
      >
        <div className="px-12 py-8 rounded-2xl border-4 border-cyan-400 shadow-2xl">
          <div className="text-center space-y-4">
            {/* Animation Icon */}
            <div className="text-6xl animate-bounce">💝</div>

            {/* Donor Name */}
            <div className="font-bold text-4xl">
              {currentAlert.donorName}
            </div>

            {/* Amount */}
            <div className="text-5xl font-black text-cyan-400">
              ฿{currentAlert.amount}
            </div>

            {/* Message */}
            {currentAlert.message && (
              <div className="text-2xl italic text-gray-300 max-w-2xl">
                "{currentAlert.message}"
              </div>
            )}

            {/* Thank you message */}
            <div className="text-3xl text-purple-400 animate-pulse">
              ขอบคุณสำหรับการสนับสนุน! ❤️
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DonationAlertWidget() {
  return (
    <Suspense fallback={
      <div className="w-screen h-screen flex items-center justify-center bg-transparent">
        <p className="text-white text-sm opacity-50">กำลังโหลด...</p>
      </div>
    }>
      <AlertWidget />
    </Suspense>
  )
}
