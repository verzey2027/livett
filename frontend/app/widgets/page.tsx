"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function WidgetsPage() {
  const router = useRouter()
  const [copiedWidget, setCopiedWidget] = useState<string | null>(null)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"

  const widgets = [
    {
      id: "alert",
      name: "Widget แจ้งเตือนโดเนท",
      icon: "🔔",
      description: "แสดงแอนิเมชันเมื่อมีคนโดเนท พร้อมชื่อ จำนวนเงิน และข้อความ",
      url: `${baseUrl}/widgets/alert`,
      testable: true,
      customizable: [
        { param: "textColor", label: "สีข้อความ", default: "#ffffff", type: "color" },
        { param: "bgColor", label: "สีพื้นหลัง", default: "rgba(0,0,0,0.8)", type: "text" },
        { param: "fontSize", label: "ขนาดตัวอักษร", default: "32", type: "number" },
      ],
    },
    {
      id: "goal",
      name: "Widget เป้าหมายการโดเนท",
      icon: "🎯",
      description: "แสดงความคืบหน้าเป้าหมายการโดเนท พร้อม progress bar",
      url: `${baseUrl}/widgets/goal`,
      testable: false,
      customizable: [
        { param: "target", label: "เป้าหมาย (บาท)", default: "1000", type: "number" },
        { param: "title", label: "ชื่อเป้าหมาย", default: "เป้าหมายการโดเนท", type: "text" },
        { param: "barColor", label: "สี Progress Bar", default: "#06b6d4", type: "color" },
        { param: "bgColor", label: "สีพื้นหลัง", default: "rgba(0,0,0,0.8)", type: "text" },
      ],
    },
    {
      id: "leaderboard",
      name: "Widget การจัดอันดับ",
      icon: "🏆",
      description: "แสดงรายชื่อผู้โดเนทอันดับต้นๆ แบบเรียลไทม์",
      url: `${baseUrl}/widgets/leaderboard`,
      testable: false,
      customizable: [
        { param: "limit", label: "จำนวนอันดับ", default: "10", type: "number" },
        { param: "title", label: "ชื่อ Widget", default: "🏆 อันดับผู้สนับสนุน", type: "text" },
        { param: "bgColor", label: "สีพื้นหลัง", default: "rgba(0,0,0,0.8)", type: "text" },
      ],
    },
  ]

  const copyToClipboard = (text: string, widgetId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedWidget(widgetId)
    setTimeout(() => setCopiedWidget(null), 2000)
  }

  const testWidget = async (widgetId: string) => {
    if (widgetId === "alert") {
      try {
        await fetch("http://localhost:8080/api/donations/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            donorName: "ผู้ทดสอบ",
            amount: 100,
            message: "ทดสอบ Widget แจ้งเตือน",
          }),
        })
        alert("ส่งการทดสอบแล้ว! ดูที่ Widget ใน OBS")
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการทดสอบ")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <main className="w-full max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push("/live")}
            className="mb-4 text-gray-400 hover:text-white transition-colors"
          >
            ← กลับไปหน้า Live
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-3">
            ⚙️ ตั้งค่า Widget Overlays
          </h1>
          <p className="text-gray-400">สำหรับ OBS Studio และโปรแกรมสตรีมอื่นๆ</p>
        </div>

        {/* คำแนะนำการใช้งาน */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>📖</span>
            <span>วิธีเพิ่ม Widget ใน OBS Studio</span>
          </h2>
          <ol className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">1.</span>
              <span>ในส่วน <strong>Sources</strong> ให้กดรูป <strong>+</strong> ด้านล่าง</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">2.</span>
              <span>เลือก <strong>Browser</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">3.</span>
              <span>ตั้งชื่อ Widget ของตัวเอง แล้วกด <strong>OK</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">4.</span>
              <span>คัดลอกลิงก์ Widget ด้านล่างแล้ววางในช่อง <strong>URL</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">5.</span>
              <span>ตั้งค่าขนาด: <strong>Width: 1920, Height: 1080</strong></span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-cyan-400">6.</span>
              <span>กด <strong>OK</strong> เพื่อเสร็จสิ้น</span>
            </li>
          </ol>
        </div>

        {/* Widgets List */}
        <div className="space-y-6">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-5xl">{widget.icon}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{widget.name}</h3>
                  <p className="text-gray-400">{widget.description}</p>
                </div>
              </div>

              {/* URL Display */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between gap-4">
                  <code className="text-cyan-400 text-sm flex-1 overflow-x-auto">
                    {widget.url}
                  </code>
                  <button
                    onClick={() => copyToClipboard(widget.url, widget.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors whitespace-nowrap"
                  >
                    {copiedWidget === widget.id ? "✓ คัดลอกแล้ว" : "📋 คัดลอก"}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.open(widget.url, "_blank")}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                  👁️ ดูตัวอย่าง
                </button>
                {widget.testable && (
                  <button
                    onClick={() => testWidget(widget.id)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                  >
                    🧪 ทดสอบ Widget
                  </button>
                )}
              </div>

              {/* Customization Options */}
              {widget.customizable && widget.customizable.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-gray-400 hover:text-white transition-colors">
                    ⚙️ ตัวเลือกการปรับแต่ง (คลิกเพื่อดู)
                  </summary>
                  <div className="mt-4 space-y-2 text-sm text-gray-300">
                    {widget.customizable.map((option) => (
                      <div key={option.param} className="flex justify-between">
                        <span>{option.label}:</span>
                        <code className="text-cyan-400">
                          ?{option.param}={option.default}
                        </code>
                      </div>
                    ))}
                    <div className="mt-2 text-xs text-gray-500">
                      เพิ่มพารามิเตอร์เหล่านี้ต่อท้าย URL เพื่อปรับแต่ง เช่น: {widget.url}?target=5000
                    </div>
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-purple-900/20 border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-3">💡 เคล็ดลับ</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• Widget จะอัพเดทอัตโนมัติเมื่อมีการโดเนทใหม่</li>
            <li>• สามารถปรับขนาดและตำแหน่งใน OBS ได้ตามต้องการ</li>
            <li>• ใช้ปุ่ม "ทดสอบ Widget" เพื่อดูว่า Widget ทำงานถูกต้อง</li>
            <li>• Widget เป้าหมายและการจัดอันดับจะแสดงข้อมูลจริงทันที</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
