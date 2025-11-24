function sanitize(value?: string | null) {
  if (!value) return ""
  return value.replace(/\/+$/, "")
}

const ENV_SITE = sanitize(process.env.NEXT_PUBLIC_SITE_URL)
const ENV_PUBLIC_API = sanitize(process.env.NEXT_PUBLIC_API_URL)
const ENV_INTERNAL_API = sanitize(process.env.API_BASE_URL)
const ENV_VERCEL = process.env.VERCEL_URL ? sanitize(`https://${process.env.VERCEL_URL}`) : ""
const PORT = process.env.PORT || process.env.NEXT_PUBLIC_PORT || "3000"
const SERVER_FALLBACK = `http://localhost:${PORT}`

function getPreferredServerOrigin() {
  return ENV_SITE || ENV_PUBLIC_API || ENV_INTERNAL_API || ENV_VERCEL || SERVER_FALLBACK
}

function getBrowserOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin
  }
  return ""
}

export function getSiteBaseUrl() {
  const browserOrigin = getBrowserOrigin()
  if (browserOrigin) {
    return sanitize(browserOrigin)
  }
  return getPreferredServerOrigin()
}

export function getApiBaseUrl() {
  const browserOrigin = getBrowserOrigin()
  if (browserOrigin) {
    return sanitize(browserOrigin)
  }

  return ENV_PUBLIC_API || ENV_INTERNAL_API || getPreferredServerOrigin()
}

export function buildApiUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${getApiBaseUrl()}${normalizedPath}`
}

export function getPublicAssetBaseUrl() {
  const apiBase = getApiBaseUrl()
  if (apiBase.endsWith("/api")) {
    return apiBase.replace(/\/api$/, "")
  }
  return apiBase
}

