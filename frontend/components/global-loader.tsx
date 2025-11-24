"use client"

import { useEffect, useState } from "react"
import PacmanLoader from "@/components/ui/pacman-loader"

export function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(true)
  const [isHiding, setIsHiding] = useState(false)

  useEffect(() => {
    // Show loader for 1.5 seconds, then fade out
    const hideTimer = setTimeout(() => {
      setIsHiding(true)
    }, 1500)

    const removeTimer = setTimeout(() => {
      setIsLoading(false)
    }, 1800) // 1.5s + 0.3s fade out

    return () => {
      clearTimeout(hideTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div className={`global-loading-overlay ${isHiding ? 'hiding' : ''}`}>
      <PacmanLoader />
    </div>
  )
}

