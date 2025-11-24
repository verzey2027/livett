"use client"

import { useState, useEffect } from "react"
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { api, normalizeImageUrl } from "@/lib/api"

interface Announcement {
  id: number
  title: string
  title_th?: string
  message: string
  message_th?: string
  type: "info" | "success" | "warning" | "error"
  image_url?: string
  created_at: string
  updated_at: string
}

export function AnnouncementPopup() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [loading, setLoading] = useState(false)
  const [closeClickCount, setCloseClickCount] = useState(0)

  const STORAGE_KEY = "dismissed_announcements_v1"

  const readDismissed = (): Record<number, string> => {
    if (typeof window === "undefined") return {}
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return {}
      return JSON.parse(raw)
    } catch (error) {
      console.warn("Failed to parse dismissed announcements from storage:", error)
      return {}
    }
  }

  const isDismissedLocally = (announcement: Announcement) => {
    const dismissed = readDismissed()
    const storedTimestamp = dismissed[announcement.id]
    return storedTimestamp && storedTimestamp === announcement.updated_at
  }

  const persistDismissed = (announcement: Announcement) => {
    if (typeof window === "undefined") return
    try {
      const dismissed = readDismissed()
      dismissed[announcement.id] = announcement.updated_at
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed))
    } catch (error) {
      console.warn("Failed to save dismissed announcements:", error)
    }
  }

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await api.getAnnouncements()
        const filtered = data.filter((announcement: Announcement) => !isDismissedLocally(announcement))
        setAnnouncements(filtered)
        if (data.length > 0) {
          setCurrentIndex(0)
        }
      } catch (error: any) {
        // Don't log auth errors - they're handled by apiCall
        if (!error.isAuthError) {
          console.error("Error fetching announcements:", error)
        }
        // If auth error, component will be unmounted due to redirect
      }
    }

    fetchAnnouncements()
  }, [])

  // Reset close click count when announcement changes
  useEffect(() => {
    setCloseClickCount(0)
  }, [currentIndex, announcements])

  const currentAnnouncement = announcements[currentIndex]

  if (!currentAnnouncement) {
    return null
  }

  const handleClose = async () => {
    // Require 2 clicks to close
    if (closeClickCount === 0) {
      setCloseClickCount(1)
      return
    }

    // Second click - actually close
    setLoading(true)
    try {
      // If "don't show again" is checked, dismiss permanently
      // Otherwise, dismiss temporarily (will show again after 3 hours)
      await api.dismissAnnouncement(currentAnnouncement.id, dontShowAgain)
      
      // Remove dismissed announcement from list
      setAnnouncements(announcements.filter(a => a.id !== currentAnnouncement.id))
      setCurrentIndex(0)
      persistDismissed(currentAnnouncement)
      setCloseClickCount(0) // Reset for next announcement
    } catch (error) {
      console.error("Error dismissing announcement:", error)
    } finally {
      setLoading(false)
      setCloseClickCount(0) // Reset even on error
    }
  }

  const getTypeIcon = () => {
    switch (currentAnnouncement.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getTypeColor = () => {
    switch (currentAnnouncement.type) {
      case "success":
        return "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
      case "warning":
        return "border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800"
      case "error":
        return "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800"
      default:
        return "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800"
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-md border-2 ${getTypeColor()} shadow-2xl overflow-hidden rounded-lg bg-background`}>
        {currentAnnouncement.image_url && (
          <div className="relative w-full">
            <img
              src={normalizeImageUrl(currentAnnouncement.image_url) || ""}
              alt={currentAnnouncement.title_th || currentAnnouncement.title}
              className="w-full h-auto object-contain block rounded-t-lg"
              style={{ marginTop: 0, marginBottom: 0 }}
              onError={(e) => {
                console.error("Failed to load announcement image:", currentAnnouncement.image_url)
                e.currentTarget.style.display = "none"
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white border-none z-10"
              onClick={handleClose}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="space-y-4 p-6">
          {!currentAnnouncement.image_url && (
            <div className="flex items-start justify-end -mt-6 -mr-6">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleClose}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-3">
            {getTypeIcon()}
            <CardTitle className="text-lg sm:text-xl">
              {currentAnnouncement.title_th || currentAnnouncement.title}
            </CardTitle>
          </div>
          
          <CardDescription className="text-sm sm:text-base whitespace-pre-line">
            {currentAnnouncement.message_th || currentAnnouncement.message}
          </CardDescription>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(!!checked)}
            />
            <label
              htmlFor="dont-show-again"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              ไม่ต้องแสดงอีก
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
              variant={closeClickCount === 1 ? "destructive" : "default"}
            >
              {loading ? "กำลังปิด..." : closeClickCount === 1 ? "คลิกอีกครั้งเพื่อปิด" : "ปิด"}
            </Button>
            {announcements.length > 1 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {currentIndex + 1} / {announcements.length}
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}

