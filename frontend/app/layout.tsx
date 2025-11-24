import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "SharkCoder.Live - ระบบติดตามสตรีมเมอร์ Real-Time PRO",
  description: "ติดตาม TikTok Live Stream ดูของขวัญ คอมเมนต์ ไลค์ และแชร์แบบ Real-Time",
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="th" suppressHydrationWarning className="dark">
      <body className="font-sans antialiased bg-black text-white">
        {children}
      </body>
    </html>
  )
}
