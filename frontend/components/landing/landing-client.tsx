"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"

export type LandingPayload = {
  heroTitle: string
  heroSubtitle: string
  progress: number
  devlog: string[]
  announcements: string[]
  logoUrl: string | null
  backgroundUrl: string | null
  music: {
    id: string
    title: string
    artist?: string | null
    streamUrl: string | null
    mimeType?: string | null
  } | null
}

type Props = {
  payload: LandingPayload
}

export default function LandingClient({ payload }: Props) {
  const { user, isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Logo */}
        {payload.logoUrl ? (
          <div className="flex justify-center mb-8">
            <img
              src={payload.logoUrl}
              alt="Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
        ) : (
          <div className="flex justify-center mb-8">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-400">SC</span>
            </div>
          </div>
        )}

        {/* Welcome Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            ยินดีต้อนรับ
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-md mx-auto">
            {payload.heroSubtitle || "ยินดีต้อนรับสู่ Sharkcoder City"}
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          {isAuthenticated && user ? (
            <Link href="/dashboard">
              <Button size="lg" className="px-8 py-6 text-lg">
                ไปที่ Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="lg" className="px-8 py-6 text-lg">
                เข้าสู่ระบบ
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
