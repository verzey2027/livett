"use client"

import type {
  Hosting,
  Notification,
  Transaction,
  TopupRequest,
  HostingPlan,
  User,
  PromptPayPayment,
  PromptPayStatus,
  TrueMoneyRedemption,
  File as StoredFile,
  HostingCategory,
  HostingCategoryStats,
  PaginatedResponse,
  BotInstance,
  ApiToken,
  HarFile,
  UserRestrictions,
  Gift,
  MagicMail,
} from "./types"
import { buildApiUrl, getApiBaseUrl, getPublicAssetBaseUrl } from "./base-url"

const API_BASE_URL = getApiBaseUrl()
const PUBLIC_ASSET_BASE_URL = getPublicAssetBaseUrl()

const getHost = (value?: string | null) => {
  if (!value) return ""
  try {
    return new URL(value).host
  } catch {
    return ""
  }
}

// Helper function to normalize image URLs
// Replaces localhost URLs or HTTP URLs with the correct HTTPS API URL
export function normalizeImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null
  
  // If it's a data URL (base64), return as is
  if (imageUrl.startsWith("data:")) return imageUrl
  
  const baseUrl = PUBLIC_ASSET_BASE_URL || API_BASE_URL
  const baseHost = getHost(baseUrl)
  
  // Ensure baseUrl is valid
  if (!baseUrl || !baseUrl.startsWith("https://")) {
    console.error("[normalizeImageUrl] Invalid baseUrl:", baseUrl, "API_BASE_URL:", API_BASE_URL)
    return imageUrl // Return original if baseUrl is invalid
  }
  
  // Handle malformed URLs with missing slashes after protocol
  // These URLs have ":" but missing "//" after "https"
  if (imageUrl.match(/^https:\/[^\/]/)) {
    // Extract the path (everything after "/api" or "/")
    const pathMatch = imageUrl.match(/(\/api\/.*)$/)
    if (pathMatch) {
      // Directly return with correct base URL
      return `${baseUrl}${pathMatch[1]}`
    }
    // Try to extract any path starting with "/"
    const anyPathMatch = imageUrl.match(/(\/.*)$/)
    if (anyPathMatch) {
      return `${baseUrl}${anyPathMatch[1]}`
    }
  }
  
  // Fix malformed URLs like "https:/.example.com" or "https:///.example.com"
  // These seem to be corrupted URLs that need fixing
  if (imageUrl.includes("https:") || imageUrl.includes("http:")) {
    // Fix URLs like "https:/.domain.com" -> extract path and use baseUrl
    if (imageUrl.match(/https?:\/\./) && baseHost && imageUrl.includes(baseHost)) {
      // Extract the path part (everything after the domain or starting with /api)
      const pathMatch = imageUrl.match(/(\/api\/.*)$/) || imageUrl.match(/(\/[^\/].*)$/)
      if (pathMatch) {
        return `${baseUrl}${pathMatch[1]}`
      }
    }
    
    // Fix URLs that have "https:/" or "http:/" without double slash (but not the pattern above)
    if (imageUrl.match(/https?:\/[^\/\.]/)) {
      const fixedUrl = imageUrl.replace(/https?:\/([^\/])/, "https://$1")
      if (fixedUrl !== imageUrl) {
        imageUrl = fixedUrl
      }
    }
  }
  
  // If it already starts with https://, check if it's localhost or needs fixing
  if (imageUrl.startsWith("https://")) {
    // Check if it's a malformed URL (like "https:/.domain.com" that was fixed above)
    if ((baseHost && imageUrl.includes(`https:/.${baseHost}`)) || imageUrl.match(/https:\/\/?\./)) {
      // Extract path and reconstruct with correct base URL
      const pathMatch = imageUrl.match(/\/api\/.*$/)
      if (pathMatch) {
        return `${baseUrl}${pathMatch[0]}`
      }
      // Try to extract any path
      const anyPathMatch = imageUrl.match(/(\/[^\/].*)$/)
      if (anyPathMatch) {
        return `${baseUrl}${anyPathMatch[1]}`
      }
    }
    
    // If it's already a valid HTTPS URL and not localhost, return as is
    if (!imageUrl.includes("localhost") && API_BASE_URL && imageUrl.startsWith(API_BASE_URL)) {
      return imageUrl
    }
    
    // If it's https://localhost or needs fixing, extract path and replace with correct base URL
    try {
      const urlObj = new URL(imageUrl)
      return `${baseUrl}${urlObj.pathname}${urlObj.search}${urlObj.hash}`
    } catch (e) {
      // If URL parsing fails, try to extract path manually
      const pathMatch = imageUrl.match(/https?:\/\/[^\/]+(\/.*)$/)
      if (pathMatch) {
        return `${baseUrl}${pathMatch[1]}`
      }
      // Try to extract path from malformed URLs
      const malformedPathMatch = imageUrl.match(/(\/api\/.*)$/) || imageUrl.match(/(\/[^\/].*)$/)
      if (malformedPathMatch) {
        return `${baseUrl}${malformedPathMatch[1]}`
      }
      console.error("[normalizeImageUrl] Failed to parse HTTPS URL:", imageUrl, e)
      return imageUrl
    }
  }
  
  // Replace localhost URLs or HTTP URLs with correct API URL
  if (imageUrl.includes("localhost") || imageUrl.startsWith("http://")) {
    try {
      // Extract the path from the URL (e.g., /api/files/public/token.png)
      const urlObj = new URL(imageUrl)
      return `${baseUrl}${urlObj.pathname}${urlObj.search}${urlObj.hash}`
    } catch (e) {
      // If URL parsing fails, try to extract path manually
      // Handle cases like "http://localhost:8080/api/files/public/token.png"
      const pathMatch = imageUrl.match(/https?:\/\/[^\/]+(\/.*)$/)
      if (pathMatch) {
        return `${baseUrl}${pathMatch[1]}`
      }
      // Try to extract path from any format
      const anyPathMatch = imageUrl.match(/(\/api\/.*)$/) || imageUrl.match(/(\/[^\/].*)$/)
      if (anyPathMatch) {
        return `${baseUrl}${anyPathMatch[1]}`
      }
      console.error("[normalizeImageUrl] Failed to parse HTTP/localhost URL:", imageUrl, e)
      return imageUrl
    }
  }
  
  // If it's a relative URL, prepend the API base URL
  if (imageUrl.startsWith("/")) {
    return `${baseUrl}${imageUrl}`
  }
  
  // Return as is if it's already a valid URL
  return imageUrl
}

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

// Helper function for API calls with proper error handling
export async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken()
  
  if (!token) {
    // Don't throw error for admin endpoints - they will be called after login
    // Just return a rejected promise that can be caught silently
    const error = new Error("No authentication token found. Please login again.")
    ;(error as any).status = 401
    ;(error as any).isAuthError = true
    // Don't log this error - it's expected during initial page load
    throw error
  }
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options?.headers,
  }

  const fullUrl = buildApiUrl(endpoint)

  try {
    // Debug logging removed in production for security
    // Only log in development mode
    if (process.env.NODE_ENV === 'development' && (endpoint.includes('/api/tokens') || endpoint.includes('/api/har'))) {
      console.log('[apiCall] Calling endpoint:', {
        endpoint,
        // Don't log fullUrl or API_BASE_URL in production
      })
    }
    
    // Add timeout for fetch requests (30 seconds)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    const response = await fetch(fullUrl, { 
      ...options, 
      headers,
      signal: controller.signal
    }).finally(() => {
      clearTimeout(timeoutId)
    })

    if (!response.ok) {
      let errorMessage = response.statusText
      let errorData: any = {}
      
      try {
        errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // If response is not JSON, use status text
      }

      // Handle authentication errors (401, 403)
      if (response.status === 401 || response.status === 403) {
        // Clear invalid token and user data
        if (typeof window !== 'undefined') {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("auth_user")
          
          // Only redirect if we're not already on login page
          if (!window.location.pathname.includes('/login')) {
            // Use setTimeout to avoid redirect during render
            setTimeout(() => {
              window.location.href = '/login?error=session_expired'
            }, 100)
          }
        }
        
        const error = new Error(errorMessage || 'Invalid or expired token. Please login again.')
        ;(error as any).status = response.status
        ;(error as any).statusText = response.statusText
        ;(error as any).data = errorData
        ;(error as any).isAuthError = true
        ;(error as any).fullUrl = fullUrl
        ;(error as any).API_BASE_URL = API_BASE_URL
        throw error
      }

      // Add status code to error message for better debugging
      const error = new Error(errorMessage || `API request failed with status ${response.status}`)
      ;(error as any).status = response.status
      ;(error as any).statusText = response.statusText
      ;(error as any).data = errorData
      ;(error as any).fullUrl = fullUrl
      ;(error as any).API_BASE_URL = API_BASE_URL
      
      throw error
    }

    const data = await response.json()
    return data as T
  } catch (error: any) {
    // Handle network errors gracefully
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      const timeoutError = new Error("Request timeout. Please check your connection and try again.")
      ;(timeoutError as any).status = 408
      ;(timeoutError as any).isNetworkError = true
      throw timeoutError
    }
    
    // Handle connection reset and timeout errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message?.includes('ECONNRESET') || error.message?.includes('ETIMEDOUT')) {
      const connectionError = new Error("Connection error. Please ensure the backend server is running.")
      ;(connectionError as any).status = 503
      ;(connectionError as any).isNetworkError = true
      throw connectionError
    }
    
    // Re-throw if already has status (is HTTP error)
    if (error.status) {
      // Make sure fullUrl is attached
      if (!error.fullUrl) {
        ;(error as any).fullUrl = fullUrl
        ;(error as any).API_BASE_URL = API_BASE_URL
      }
      throw error
    }
    
    // Check if it's a network error (fetch failed) - handle first
    if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
      // Always log network errors with full details for debugging
      console.error(`[API] Network error (${endpoint}):`, {
        errorName: error.name,
        errorMessage: error.message,
        fullUrl,
        API_BASE_URL,
        endpoint,
        stack: error.stack
      })
      console.warn(`[API] Network error (${endpoint}): Backend server may be down or unreachable at ${fullUrl}`)
      
      const networkError = new Error(
        `ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่า backend server ทำงานอยู่ที่ ${API_BASE_URL}`
      )
      ;(networkError as any).isNetworkError = true
      ;(networkError as any).fullUrl = fullUrl
      ;(networkError as any).API_BASE_URL = API_BASE_URL
      throw networkError
    }
    
    // Network or other errors (but not auth errors - they're handled by redirect)
    if (!error.isAuthError) {
      // Only log non-network errors
      console.error(`[API] Request error (${endpoint}):`, error)
    } else {
      // Suppress console error for auth errors - they're handled by redirect
      // Only log if it's not a redirect scenario
      if (typeof window === 'undefined' || window.location.pathname.includes('/login')) {
        // Server-side or already on login page - log it
        console.warn(`[API] Auth error (${endpoint}):`, error.message)
      }
    }
    
    const networkError = new Error(
      error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบว่า API server ทำงานอยู่"
    )
    ;(networkError as any).isNetworkError = true
    throw networkError
  }
}

export const api = {
  // Hostings
  getHostings: () => apiCall<Hosting[]>("/api/hostings"),

  getHosting: (id: number) => apiCall<Hosting>(`/api/hostings/${id}`),

  createHosting: (data: { plan_id: number; domain: string; duration_months?: number; duration_days?: number; two_factor_token?: string }) =>
    apiCall<{
      hosting: Hosting
      credentials?: {
        domain?: string
        username: string
        password: string
        control_panel?: string
        control_panel_url?: string
      }
      message: string
    }>("/api/hostings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyHosting2FA: (token: string) =>
    apiCall<{ success: boolean; message: string }>("/api/hostings/verify-2fa", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  renewHosting: (id: number, duration: { duration_months?: number; duration_days?: number }) =>
    apiCall<{ message: string; new_expire_date: string }>(`/api/hostings/${id}/renew`, {
      method: "POST",
      body: JSON.stringify(duration),
    }),

  changeHostingPlan: (id: number, new_plan_id: number) =>
    apiCall<{ 
      message: string
      hosting: Hosting
      price_difference: number
      refunded: number
      charged: number
      package_warning?: string
      limit_warning?: string
    }>(`/api/hostings/${id}/change-plan`, {
      method: "POST",
      body: JSON.stringify({ new_plan_id }),
    }),

  suspendHosting: (id: number) =>
    apiCall<{ message: string }>(`/api/hostings/${id}/suspend`, {
      method: "POST",
    }),

  unsuspendHosting: (id: number) =>
    apiCall<{ message: string }>(`/api/hostings/${id}/unsuspend`, {
      method: "POST",
    }),

  deleteHosting: (id: number) =>
    apiCall<{ message: string }>(`/api/hostings/${id}`, {
      method: "DELETE",
    }),

  // Notifications
  getNotifications: () => apiCall<Notification[]>("/api/notifications"),

  getUnreadCount: () => apiCall<{ count: number }>("/api/notifications/unread-count"),

  markAsRead: (id: number) =>
    apiCall<Notification>(`/api/notifications/${id}/read`, {
      method: "PUT",
    }),

  markAllAsRead: () =>
    apiCall<{ message: string }>("/api/notifications/read-all", {
      method: "PUT",
    }),

  deleteNotification: (id: number) =>
    apiCall<{ message: string }>(`/api/notifications/${id}`, {
      method: "DELETE",
    }),

  // Transactions
  getTransactions: () => apiCall<Transaction[]>("/api/transactions"),

  // Invoices
  getInvoices: () => apiCall<any[]>("/api/invoices"),

  getInvoice: (id: number) => apiCall<any>(`/api/invoices/${id}`),

  // Topup
  createManualTopup: (data: { amount: number; slip_image_url: string }) =>
    apiCall<TopupRequest>("/api/topup", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        payment_method: "manual",
      }),
    }),

  createSlipTopup: (data: { amount: number; slip_image_url: string }) =>
    apiCall<TopupRequest>("/api/topup", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        payment_method: "slip",
      }),
    }),

  getTopups: () => apiCall<TopupRequest[]>("/api/topup"),

  // Slip verification
  getSlipStatus: (topupId: number) =>
    apiCall<any>(`/api/topup/${topupId}/slip`),

  verifySlip: (topupId: number) =>
    apiCall<{ success: boolean; slip: any }>(`/api/topup/${topupId}/slip/verify`, {
      method: "POST",
    }),

  // Payment endpoints
  payment: {
    // Create PromptPay payment
    createPromptPay: (amount: number) =>
      apiCall<{ success: boolean; message: string; data: PromptPayPayment }>("/api/payment/promptpay/create", {
        method: "POST",
        body: JSON.stringify({ amount }),
      }),

    // Check PromptPay payment status
    checkPromptPay: (topup_id: number) =>
      apiCall<PromptPayStatus>("/api/payment/promptpay/check", {
        method: "POST",
        body: JSON.stringify({ topup_id }),
      }),

    // Redeem TrueMoney voucher
    redeemTrueMoney: (voucher_link: string) =>
      apiCall<TrueMoneyRedemption>("/api/payment/truemoney/redeem", {
        method: "POST",
        body: JSON.stringify({ voucher_link }),
      }),

    // Get payment history
    getPayments: () => apiCall<TopupRequest[]>("/api/payments"),
  },

  // Plans
  getPlans: (categoryId?: number) => {
    const query = categoryId ? `?category_id=${categoryId}` : ""
    return apiCall<HostingPlan[]>(`/api/plans${query}`)
  },

  getPlan: (id: number) => apiCall<HostingPlan>(`/api/plans/${id}`),
  
  // Hosting Categories (public)
  getHostingCategories: () => apiCall<HostingCategory[]>("/api/hosting-categories"),

  createPlan: (data: Partial<HostingPlan>) =>
    apiCall<HostingPlan>("/api/plans", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePlan: (id: number, data: Partial<HostingPlan>) =>
    apiCall<HostingPlan>(`/api/plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deletePlan: (id: number) =>
    apiCall<{ message: string }>(`/api/plans/${id}`, {
      method: "DELETE",
    }),

  getPlanUsage: (id: number) =>
    apiCall<{
      plan_id: number
      plan_name: string
      hosting_count: number
      hostings: Array<{ id: number; domain: string; status: string; user_id: number; email: string }>
    }>(`/api/admin/plans/${id}/usage`),

  // Auth endpoints
  auth: {
    getMe: () => apiCall<User>("/api/auth/me"),

    updateProfile: (data: { first_name?: string; last_name?: string; phone?: string }) =>
      apiCall<User>("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    changePassword: (data: { two_factor_token: string; new_password: string }) =>
      apiCall<{ message: string }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    changeEmail: (data: { new_email: string; two_factor_token: string }) =>
      apiCall<{ success: boolean; message: string; new_email: string }>("/api/auth/change-email", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    linkOAuth: (provider: "discord") => {
      const token = getAuthToken()
      if (!token) {
        throw new Error("No authentication token found")
      }
      // Redirect to backend endpoint with token in query parameter
      // Backend will extract token from query and authenticate
      window.location.href = `${API_BASE_URL}/api/auth/link-oauth/${provider}?token=${encodeURIComponent(token)}`
    },

    updateTheme: (theme_preference: "light" | "dark" | "system") =>
      apiCall<{ message: string; theme_preference: string }>("/api/auth/theme", {
        method: "PUT",
        body: JSON.stringify({ theme_preference }),
      }),
  },

  // Files endpoints
  files: {
    upload: (data: { filename: string; original_filename: string; file_data: string; mime_type?: string; file_size?: number; description?: string; is_public?: boolean }) =>
      apiCall<StoredFile>("/api/files/upload", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getAll: () => apiCall<StoredFile[]>("/api/files"),

    getById: (id: number) => apiCall<StoredFile>(`/api/files/${id}`),

    togglePublic: (id: number, is_public: boolean) =>
      apiCall<{ id: number; is_public: boolean; public_token: string | null }>(`/api/files/${id}/public`, {
        method: "PUT",
        body: JSON.stringify({ is_public }),
      }),

    delete: (id: number) =>
      apiCall<{ message: string }>(`/api/files/${id}`, {
        method: "DELETE",
      }),
  },

  // Announcements (for all users)
  getAnnouncements: () => apiCall<any[]>("/api/announcements"),

  dismissAnnouncement: (id: number, permanent: boolean = false) =>
    apiCall<{ success: boolean; message: string }>(`/api/announcements/${id}/dismiss`, {
      method: "POST",
      body: JSON.stringify({ permanent }),
    }),

  // Admin endpoints
  admin: {
    getDashboard: () =>
      apiCall<{
        total_users: number
        total_hostings: number
        active_hostings: number
        pending_topups: number
        total_revenue: number
        revenue_this_month: number
        expiring_soon: number
      }>("/api/admin/dashboard"),

    getUsers: () => apiCall<User[]>("/api/admin/users"),

    getActiveUsers: (options?: { force?: boolean }) => {
      const query = options?.force ? "?force=true" : ""
      return apiCall<User[]>(`/api/admin/users/active${query}`)
    },

    sendMagicMail: (data: { user_ids: number[]; title: string; message: string; include_discord_button?: boolean }) =>
      apiCall<{ success: boolean; count: number }>("/api/admin/mail/broadcast", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateUserBalance: (userId: number, amount: number, reason: string) =>
      apiCall<{ id: number; email: string; balance: string }>(`/api/admin/users/${userId}/balance`, {
        method: "PUT",
        body: JSON.stringify({ amount, reason }),
      }),

    updateUser: (userId: number | string, data: { first_name?: string; last_name?: string; email?: string; phone?: string; role?: "admin" | "user" }) =>
      apiCall<User>(`/api/admin/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    deleteUser: (userId: number | string) =>
      apiCall<{ message: string }>(`/api/admin/users/${userId}`, {
        method: "DELETE",
      }),

    banUser: (userId: number | string, reason?: string) =>
      apiCall<User>(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),

    unbanUser: (userId: number | string) =>
      apiCall<User>(`/api/admin/users/${userId}/unban`, {
        method: "POST",
      }),

    updateLanding: (data: {
      heroTitle: string
      heroSubtitle: string
      progress: number
      devlog: string[]
      announcements: string[]
    }) =>
      apiCall<{ success: boolean }>("/api/admin/landing", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    // User Restrictions
    restrictions: {
      get: (userId: number) =>
        apiCall<UserRestrictions>(`/api/admin/users/${userId}/restrictions`),

      update: (userId: number, data: {
        disable_promptpay?: boolean
        disable_truemoney?: boolean
        disable_bot?: boolean
        disable_all?: boolean
        reason?: string
      }) =>
        apiCall<{ message: string; restrictions: UserRestrictions }>(
          `/api/admin/users/${userId}/restrictions`,
          {
            method: "PUT",
            body: JSON.stringify(data),
          }
        ),

      remove: (userId: number) =>
        apiCall<{ message: string }>(`/api/admin/users/${userId}/restrictions`, {
          method: "DELETE",
        }),
    },

    getPendingTopups: () => apiCall<TopupRequest[]>("/api/topup/pending"),

    approveTopup: (id: number, admin_note: string) =>
      apiCall<{ message: string }>(`/api/topup/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ admin_note }),
      }),

    rejectTopup: (id: number, admin_note: string) =>
      apiCall<{ message: string }>(`/api/topup/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ admin_note }),
      }),

    // DDoS Protection
    ddos: {
      getStats: () =>
        apiCall<{
          stats: {
            total_attacks: string
            active_attacks: string
            mitigated_attacks: string
            attacks_24h: string
            attacks_7d: string
            total_requests_blocked: string
          }
          blocked: {
            total_blocked: string
            permanent_blocks: string
            active_blocks: string
          }
          topIPs: Array<{
            ip_address: string
            attack_count: string
            total_requests: string
            last_attack: string
          }>
          recentAttacks: Array<{
            id: number
            ip_address: string
            attack_type: string
            request_count: number
            time_window_seconds: number
            endpoints: string[]
            user_agents: string[]
            detected_at: string
            mitigated_at: string | null
            status: string
          }>
        }>("/api/admin/ddos/stats"),

      getBlockedIPs: (options?: { page?: number; limit?: number; search?: string }) => {
        const params = new URLSearchParams()
        if (options?.page) params.append("page", options.page.toString())
        if (options?.limit) params.append("limit", options.limit.toString())
        if (options?.search) params.append("search", options.search)
        const query = params.toString() ? `?${params.toString()}` : ""
        return apiCall<{
          data: Array<{
            id: number
            ip_address: string
            reason: string
            blocked_at: string
            blocked_until: string | null
            is_permanent: boolean
            blocked_by: number | null
            blocked_by_email: string | null
            request_count: number
            attack_count: string
          }>
          total: number
          page: number
          limit: number
        }>(`/api/admin/ddos/blocked-ips${query}`)
      },

      getAttacks: (options?: { page?: number; limit?: number; status?: string; ip_address?: string }) => {
        const params = new URLSearchParams()
        if (options?.page) params.append("page", options.page.toString())
        if (options?.limit) params.append("limit", options.limit.toString())
        if (options?.status) params.append("status", options.status)
        if (options?.ip_address) params.append("ip_address", options.ip_address)
        const query = params.toString() ? `?${params.toString()}` : ""
        return apiCall<{
          data: Array<{
            id: number
            ip_address: string
            attack_type: string
            request_count: number
            time_window_seconds: number
            endpoints: string[]
            user_agents: string[]
            detected_at: string
            mitigated_at: string | null
            status: string
          }>
          total: number
          page: number
          limit: number
        }>(`/api/admin/ddos/attacks${query}`)
      },

      blockIP: (data: { ip_address: string; reason?: string; is_permanent?: boolean; duration_hours?: number }) =>
        apiCall<{ success: boolean; message: string }>("/api/admin/ddos/block-ip", {
          method: "POST",
          body: JSON.stringify(data),
        }),

      unblockIP: (ip_address: string) =>
        apiCall<{ success: boolean; message: string }>("/api/admin/ddos/unblock-ip", {
          method: "POST",
          body: JSON.stringify({ ip_address }),
        }),

      getIPLogs: (ip: string, limit?: number) => {
        const query = limit ? `?limit=${limit}` : ""
        return apiCall<{
          data: Array<{
            id: number
            ip_address: string
            endpoint: string
            method: string
            user_agent: string | null
            referer: string | null
            status_code: number
            response_time: number
            created_at: string
          }>
        }>(`/api/admin/ddos/ip-logs/${ip}${query}`)
      },
    },

    sendNotification: (data: {
      user_id: number
      title: string
      title_th?: string
      message: string
      message_th?: string
      type?: "info" | "success" | "warning" | "error"
    }) =>
      apiCall<Notification>("/api/admin/notifications", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getUserHostings: (userId: number) => apiCall<Hosting[]>(`/api/admin/users/${userId}/hostings`),

    updateHostingStatus: (hostingId: number, data: { status: "active" | "suspended"; reason?: string }) =>
      apiCall<{ success: boolean; status: string; admin_note: string }>(`/api/admin/hostings/${hostingId}/status`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    deleteHosting: (hostingId: number, reason?: string) =>
      apiCall<{ success: boolean }>(`/api/admin/hostings/${hostingId}`, {
        method: "DELETE",
        body: JSON.stringify({ reason }),
      }),

    createGift: (data: {
      user_id: number
      gift_type: "hosting" | "balance"
      plan_id?: number
      balance_amount?: number
      duration_months?: number
      message?: string
    }) =>
      apiCall<Gift>("/api/admin/gifts", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getUserFiles: (userId: number) => apiCall<StoredFile[]>(`/api/admin/users/${userId}/files`),

    getUserFileById: (userId: number, fileId: number) => apiCall<StoredFile & { file_data?: string }>(`/api/admin/users/${userId}/files/${fileId}`),

    toggleUserFilePublic: (userId: number, fileId: number, is_public: boolean) =>
      apiCall<{ id: number; is_public: boolean; public_token: string | null }>(`/api/admin/users/${userId}/files/${fileId}/public`, {
        method: "PUT",
        body: JSON.stringify({ is_public }),
      }),

    deleteUserFile: (userId: number, fileId: number) =>
      apiCall<{ message: string }>(`/api/admin/users/${userId}/files/${fileId}`, {
        method: "DELETE",
      }),

    // Hosting Categories
    getHostingCategories: (params?: {
      page?: number
      size?: number
      search?: string
      is_active?: string
    }) => {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append("page", params.page.toString())
      if (params?.size) queryParams.append("size", params.size.toString())
      if (params?.search) queryParams.append("search", params.search)
      if (params?.is_active) queryParams.append("is_active", params.is_active)
      const query = queryParams.toString()
      return apiCall<PaginatedResponse<HostingCategory>>(
        `/api/admin/hosting-categories${query ? `?${query}` : ""}`
      )
    },

    getHostingCategory: (id: number) =>
      apiCall<HostingCategory>(`/api/admin/hosting-categories/${id}`),

    createHostingCategory: (data: Partial<HostingCategory>) =>
      apiCall<HostingCategory>("/api/admin/hosting-categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateHostingCategory: (id: number, data: Partial<HostingCategory>) =>
      apiCall<HostingCategory>(`/api/admin/hosting-categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    deleteHostingCategory: (id: number) =>
      apiCall<{ message: string }>(`/api/admin/hosting-categories/${id}`, {
        method: "DELETE",
      }),

    getDirectAdminPackage: (packageId: string, categoryId?: number) => {
      const query = categoryId ? `?category_id=${categoryId}` : ""
      return apiCall<{ success: boolean; data: { name: string; disk_space: number; bandwidth: number; databases: number; email_accounts: number; subdomains: number; addon_domains: number; ftp_accounts: number } }>(`/api/admin/directadmin/package/${packageId}${query}`)
    },

    toggleHostingCategoryStatus: (id: number) =>
      apiCall<HostingCategory>(`/api/admin/hosting-categories/${id}/toggle`, {
        method: "POST",
      }),

    testHostingCategoryConnection: (id: number) =>
      apiCall<{ success: boolean; connection_status: "online" | "offline"; message: string; error?: string }>(
        `/api/admin/hosting-categories/${id}/test-connection`,
        {
          method: "POST",
        }
      ),

    getHostingCategoryStats: () =>
      apiCall<HostingCategoryStats>("/api/admin/hosting-categories/stats"),

    // Plans Management
    getPlans: (params?: {
      page?: number
      size?: number
      search?: string
      category_id?: string
      is_active?: string
    }) => {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append("page", params.page.toString())
      if (params?.size) queryParams.append("size", params.size.toString())
      if (params?.search) queryParams.append("search", params.search)
      if (params?.category_id) queryParams.append("category_id", params.category_id)
      if (params?.is_active) queryParams.append("is_active", params.is_active)
      const query = queryParams.toString()
      return apiCall<PaginatedResponse<HostingPlan>>(
        `/api/admin/plans${query ? `?${query}` : ""}`
      )
    },

    getPlanStats: () =>
      apiCall<{
        total_count: number
        active_count: number
        monthly_sales: number
        popular_package: string
      }>("/api/admin/plans/stats"),

    togglePlanStatus: (id: number) =>
      apiCall<HostingPlan>(`/api/admin/plans/${id}/toggle`, {
        method: "POST",
      }),

    // Admin Announcements
    getAdminAnnouncements: () => apiCall<any[]>("/api/admin/announcements"),

    createAnnouncement: (data: {
      title: string
      title_th?: string
      message: string
      message_th?: string
      type?: "info" | "success" | "warning" | "error"
      image_url?: string
      is_active?: boolean
    }) =>
      apiCall<any>("/api/admin/announcements", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateAnnouncement: (id: number, data: {
      title?: string
      title_th?: string
      message?: string
      message_th?: string
      type?: "info" | "success" | "warning" | "error"
      image_url?: string
      is_active?: boolean
    }) =>
      apiCall<any>(`/api/admin/announcements/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    deleteAnnouncement: (id: number) =>
      apiCall<{ success: boolean; message: string }>(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      }),
  },

  // Bot Hosting
  getBots: () => apiCall<BotInstance[]>("/api/bots"),

  getBot: (id: number) => apiCall<BotInstance>(`/api/bots/${id}`),

  createBot: (data: { name: string; bot_type: "nodejs" | "python"; entry_file?: string }) =>
    apiCall<BotInstance>("/api/bots", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteBot: (id: number) =>
    apiCall<{ success: boolean; message: string }>(`/api/bots/${id}`, {
      method: "DELETE",
    }),

  startBot: (id: number) =>
    apiCall<BotInstance>(`/api/bots/${id}/start`, {
      method: "POST",
    }),

  stopBot: (id: number) =>
    apiCall<BotInstance>(`/api/bots/${id}/stop`, {
      method: "POST",
    }),

  installDependencies: (id: number) =>
    apiCall<{ success: boolean; dependencies: string[] }>(`/api/bots/${id}/install-dependencies`, {
      method: "POST",
    }),

  getBotFiles: (id: number, filePath?: string) => {
    const query = filePath ? `?path=${encodeURIComponent(filePath)}` : "";
    return apiCall<{ type: "directory" | "file"; files?: any[]; name?: string; path?: string; content?: string; size?: number; modified?: string }>(
      `/api/bots/${id}/files${query}`
    );
  },

  createBotFile: (id: number, data: { path: string; type: "file" | "directory"; content?: string }) =>
    apiCall<{ success: boolean; path: string }>(`/api/bots/${id}/files`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBotFile: (id: number, data: { path: string; content: string }) =>
    apiCall<{ success: boolean }>(`/api/bots/${id}/files`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteBotFile: (id: number, filePath: string) =>
    apiCall<{ success: boolean }>(`/api/bots/${id}/files?path=${encodeURIComponent(filePath)}`, {
      method: "DELETE",
    }),

  uploadBotFile: (id: number, file: File, extract?: boolean) => {
    const formData = new FormData();
    formData.append("file", file);
    if (extract) {
      formData.append("extract", "true");
    }
    return apiCall<{ success: boolean; path?: string; extracted?: boolean; message?: string }>(`/api/bots/${id}/upload`, {
      method: "POST",
      headers: {}, // Let browser set Content-Type with boundary for multipart/form-data
      body: formData,
    });
  },

  executeCommand: (id: number, command: string) =>
    apiCall<{ success: boolean; stdout: string; stderr: string; exitCode: number }>(`/api/bots/${id}/command`, {
      method: "POST",
      body: JSON.stringify({ command }),
    }),

  // API Tokens
  apiTokens: {
    list: () => apiCall<{ success: boolean; data: ApiToken[] }>("/api/tokens"),
    
    create: (data: { name: string; webhook_url?: string; webhook_secret?: string; ip_whitelist?: string }) =>
      apiCall<{ success: boolean; data: ApiToken }>("/api/tokens", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    
    delete: (id: number) =>
      apiCall<{ success: boolean; message: string }>(`/api/tokens/${id}`, {
        method: "DELETE",
      }),
  },

  // HAR Files
  harFiles: {
    upload: (harData: string) =>
      apiCall<{ success: boolean; message: string; data: HarFile }>("/api/har/upload", {
        method: "POST",
        body: JSON.stringify({ har_data: harData }),
      }),

    test: () =>
      apiCall<{
        success: boolean
        connected: boolean
        message: string
        data?: {
          deposits: Array<{
            amount: number
            account: string
            datetime: string
            balance: number
          }>
          withdrawals: Array<{
            amount: number
            account: string
            datetime: string
            balance: number
          }>
          total_deposits: number
          total_withdrawals: number
        }
        details?: {
          has_cookies: boolean
          has_auth_token: boolean
          cookie_count: number
          transactions_found?: number
        }
      }>("/api/har/test", {
        method: "POST",
      }),

    getTransactions: (limit?: number) => {
      const query = limit ? `?limit=${limit}` : ""
      return apiCall<{
        success: boolean
        data: {
          deposits: Array<{
            amount: number
            account: string
            datetime: string
            balance: number
          }>
          withdrawals: Array<{
            amount: number
            account: string
            datetime: string
            balance: number
          }>
        }
        fetched_at: string
      }>(`/api/har/transactions${query}`)
    },

    getHistory: () =>
      apiCall<{
        success: boolean
        error?: string
        data?: {
          har_file: {
            id: number
            is_valid: boolean
            created_at: string
            last_checked?: string | null
            cookie_count: number
            has_auth_token: boolean
          }
          payment_checks: Array<{
            id: number
            payment_id: string
            amount: number
            ref?: string | null
            status: string
            transaction_time?: string | null
            completed_at?: string | null
            created_at: string
            expires_at: string
            token_name?: string | null
          }>
          webhook_logs: Array<{
            id: number
            payment_id: string
            webhook_url: string
            response_code?: number | null
            sent_at: string
            amount: number
            ref?: string | null
            success: boolean
          }>
        }
      }>("/api/har/history"),
  },

  // User Activity
  activity: {
    update: (current_page: string) =>
      apiCall<{ success: boolean }>("/api/user/activity", {
        method: "POST",
        body: JSON.stringify({ current_page }),
      }),
  },

  // Gifts
  gifts: {
    getPending: () => apiCall<Gift[]>("/api/gifts/pending"),
    
    claim: (id: number) =>
      apiCall<{ success: boolean; gift: Gift }>(`/api/gifts/${id}/claim`, {
        method: "POST",
      }),
    
    createHosting: (id: number, domain: string) =>
      apiCall<{ success: boolean; hosting: Hosting }>(`/api/gifts/${id}/create-hosting`, {
        method: "POST",
        body: JSON.stringify({ domain }),
      }),
  },

  mail: {
    getPending: () => apiCall<MagicMail | null>("/api/mail/pending"),
    open: (id: number) =>
      apiCall<{ success: boolean }>(`/api/mail/${id}/open`, {
        method: "POST",
      }),
  },
}
