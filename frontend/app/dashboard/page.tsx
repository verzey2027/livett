import SkylineDashboard from "@/components/dashboard/skyline-dashboard"
import { getApiBaseUrl } from "@/lib/base-url"

export const revalidate = 0
export const dynamic = "force-dynamic"

const API_BASE_URL = getApiBaseUrl()
const assetOrigin = API_BASE_URL.replace(/\/api$/, "") || API_BASE_URL

function absolutize(path?: string | null) {
  if (!path) return null
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  return `${assetOrigin}${path}`
}

export type DashboardLandingPayload = {
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

async function fetchDashboardLanding(): Promise<DashboardLandingPayload> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/landing`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) throw new Error(`Landing payload failed with ${res.status}`)
    const data = (await res.json()) as DashboardLandingPayload
    return {
      ...data,
      logoUrl: absolutize(data.logoUrl),
      backgroundUrl: absolutize(data.backgroundUrl),
      music: data.music
        ? {
            ...data.music,
            streamUrl: absolutize(data.music.streamUrl),
          }
        : null,
    }
  } catch (error) {
    console.error("[Dashboard] Unable to load landing payload:", error)
    return {
      heroTitle: "Sharkcoder Command Center",
      heroSubtitle: "Monitor the megacity, track your identity, and sync with dev updates.",
      progress: 12,
      devlog: ["Calibrating holograms", "Spawning neon railways"],
      announcements: ["⚠ System fallback enabled", "Connect to city core to sync data"],
      logoUrl: null,
      backgroundUrl: null,
      music: null,
    }
  }
}

export default async function DashboardPage() {
  const payload = await fetchDashboardLanding()
  return <SkylineDashboard payload={payload} />
}

