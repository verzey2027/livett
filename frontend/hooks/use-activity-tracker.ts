"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"

export function useActivityTracker() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !user) return

    // Update activity when pathname changes
    const updateActivity = async () => {
      try {
        await api.activity.update(pathname)
      } catch (error) {
        // Silently fail - don't block the app
        console.error("[ActivityTracker] Failed to update activity:", error)
      }
    }

    // Update immediately
    updateActivity()

    // Also update periodically (every 30 seconds) to keep user active
    const interval = setInterval(updateActivity, 30000)

    return () => clearInterval(interval)
  }, [pathname, user, isAuthenticated])
}

