"use client"

import { useEffect, useState } from "react"
import type { DashboardLandingPayload } from "@/app/dashboard/page"

interface SkylineDashboardProps {
  payload: DashboardLandingPayload
}

export default function SkylineDashboard({ payload }: SkylineDashboardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          {payload.logoUrl && (
            <img
              src={payload.logoUrl}
              alt="Logo"
              className="mx-auto mb-6 max-h-32"
            />
          )}
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {payload.heroTitle}
          </h1>
          <p className="text-xl text-gray-400">{payload.heroSubtitle}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">Development Progress</span>
            <span className="text-sm text-cyan-400">{payload.progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${payload.progress}%` }}
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Devlog */}
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">Dev Log</h2>
            <ul className="space-y-2">
              {payload.devlog.map((log, idx) => (
                <li key={idx} className="text-gray-300 flex items-start">
                  <span className="text-cyan-500 mr-2">▸</span>
                  {log}
                </li>
              ))}
            </ul>
          </div>

          {/* Announcements */}
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Announcements</h2>
            <ul className="space-y-2">
              {payload.announcements.map((announcement, idx) => (
                <li key={idx} className="text-gray-300 flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {announcement}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Music Player */}
        {payload.music && payload.music.streamUrl && (
          <div className="bg-gray-800/50 backdrop-blur rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-purple-400">Now Playing</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold">{payload.music.title}</p>
                {payload.music.artist && (
                  <p className="text-sm text-gray-400">{payload.music.artist}</p>
                )}
              </div>
              <audio
                controls
                src={payload.music.streamUrl}
                className="max-w-md"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        )}

        {/* Background Image */}
        {payload.backgroundUrl && (
          <div
            className="fixed inset-0 -z-10 opacity-20 bg-cover bg-center"
            style={{ backgroundImage: `url(${payload.backgroundUrl})` }}
          />
        )}
      </div>
    </div>
  )
}
