"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DonatePage() {
  const router = useRouter()
  const [donorName, setDonorName] = useState("")
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"promptpay" | "bank" | "truemoney" | "ezdn" | null>(null)

  const quickAmounts = [10, 20, 50, 100, 200, 500]

  const paymentMethods = [
    {
      id: "promptpay",
      name: "พร้อมเพย์",
      icon: "💳",
      description: "โอนผ่านพร้อมเพย์ทันที พร้อมเพย์ของสตรีมเมอร์",
    },
    {
      id: "bank",
      name: "บัญชีธนาคาร",
      icon: "🏦",
      description: "โอนผ่านธนาคารโดยตรง บัญชีธนาคารของสตรีมเมอร์",
    },
    {
      id: "truemoney",
      name: "ทรูมันนี่ วอเลท",
      icon: "🧡",
      description: "โอนผ่านทรูมันนี่ วอเลท ง่ายๆ ผ่านมือถือของคุณ",
    },
    {
      id: "ezdn",
      name: "EZDN Plan",
      icon: "💎",
      description: "สนับสนุนแบบแพลน EasyDonate ให้กับสตรีมเมอร์",
    },
  ]

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString())
  }

  const handleSubmit = async () => {
    if (!donorName || !amount || !paymentMethod) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน")
      return
    }
    
    try {
      const response = await fetch("http://localhost:8080/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName,
          amount: parseFloat(amount),
          message,
          paymentMethod,
        }),
      })
      
      if (response.ok) {
        alert(`ขอบคุณ ${donorName} สำหรับการสนับสนุน ${amount} บาท! 💝`)
        // Reset form
        setDonorName("")
        setAmount("")
        setMessage("")
        setPaymentMethod(null)
      } else {
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
      }
    } catch (error) {
      console.error("Error submitting donation:", error)
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <main className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => router.push("/live")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← กลับไปหน้า Live
            </button>
            <button
              onClick={() => router.push("/widgets")}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
            >
              ⚙️ ตั้งค่า Widget
            </button>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-3">
            💝 ใครโดเนทมีชื่อขึ้นจอบน Tiktok 🎉
          </h1>
          <div className="flex items-center justify-center gap-2 text-lg mb-2">
            <span>💡 1 บาทก็โดเนทได้</span>
            <span>แต่จะได้ใจจากลิมไป 1 ดวง</span>
            <span>❤️</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span>💬 ทุกการโดเนทของคุณ = ถ้าส่งใจให้ใต้ผม</span>
            <span>⚠️</span>
          </div>
        </div>

        {/* คำแนะนำ */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div className="text-sm text-gray-300">
              <strong>หมายเหตุ:</strong> ตอนนี้ช่องของคุณโดเนทมีได้ตอนที่ลิมกำลังไลฟ์อยู่เท่านั้น ถ้าไม่ได้ไลฟ์อยู่ ตารางโดเนทก็จะมาเมื่อลิมไลฟ์ใหม่แล้วแจ้งของคุณ
            </div>
          </div>
        </div>

        {/* ขั้นตอนที่ 1: ชื่อของคุณ */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">ขั้นตอนที่ 1: กรอกชื่อที่คุณต้องการจะระบุบอก</h2>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">ชื่อของคุณ</label>
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="ใส่ชื่อของคุณ"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">ข้อความที่คุณต้องการจะระบุบอก</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="ใส่ข้อความของคุณ (ถ้ามี)"
              rows={4}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 resize-none"
            />
          </div>
        </div>

        {/* ขั้นตอนที่ 2: ช่องทางโอนเงิน */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">ขั้นตอนที่ 2: ตำเนินการโอนเงินไปยังสตรีมเมอร์</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as any)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  paymentMethod === method.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-700 bg-gray-800/30 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{method.icon}</span>
                  <span className="font-bold text-lg">{method.name}</span>
                </div>
                <p className="text-sm text-gray-400">{method.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* QR Code และจำนวนเงิน */}
        {paymentMethod && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* QR Code */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-center">วิธีการโอนเงิน:</h3>
              
              <div className="bg-white p-4 rounded-xl mb-4">
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <div className="text-6xl mb-2">📱</div>
                    <p className="text-sm">QR Code จะแสดงที่นี่</p>
                    <p className="text-xs mt-2">สแกนเพื่อโอนเงิน</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-300">
                <p>1. เปิดแอพธนาคารที่คุณใช้ (เช่น K PLUS, NEXT, SCB EASY) ที่ตั้งจริงหรือ QR Code และแสดงหน้าการโอนเงิน</p>
                <p>2. ใส่จำนวนเงินที่อยากโดเนท แล้วแนบ QR Code พร้อมเพย์ที่ แสดงบนหน้าเว็บ</p>
                <p>3. หลังโอนเสร็จ แค่แนบสลิปการโอนเงินในเว็บ แล้วกดปุ่มยืนยันได้เลย!</p>
              </div>
            </div>

            {/* จำนวนเงิน */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">จำนวนเงินที่ต้องการโอนเงิน (บาท)</h3>
              
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="ใส่จำนวนเงิน"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white text-2xl font-bold text-center mb-4 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />

              <div className="grid grid-cols-3 gap-3 mb-6">
                {quickAmounts.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleQuickAmount(value)}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg font-bold transition-all"
                  >
                    {value}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!donorName || !amount || !paymentMethod}
                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-all"
              >
                ยืนยันการโดเนท
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
