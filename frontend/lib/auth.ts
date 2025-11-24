"use client"

import { buildApiUrl, getApiBaseUrl } from "./base-url"

export interface OAuthProvider {
  provider: string
  provider_id: string
}

export interface DiscordInfo {
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  discriminator: string | null
  providerData?: any
  linkedAt: string | null
}

export interface User {
  id: number | string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: "user" | "admin"
  balance?: string | number
  is_banned?: boolean
  ban_reason?: string | null
  banned_at?: string | null
  oauth_provider?: string | null
  oauth_provider_id?: string | null
  oauth_providers?: OAuthProvider[]
  theme_preference?: "light" | "dark" | "system" | null
  created_at: string
  updated_at?: string
  last_login_at?: string
  discord?: DiscordInfo | null
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
}

const API_BASE_URL = getApiBaseUrl()

export const authService = {
  // Login function
  login: async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; user?: User; token?: string; error?: string }> => {
    try {
      const loginUrl = buildApiUrl("/api/auth/login")
      // Only log in development mode for security
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Attempting login')
      }
      
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Login response status:', response.status)
      }

      if (!response.ok) {
        let errorMessage = "เข้าสู่ระบบไม่สำเร็จ"
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        return { success: false, error: errorMessage }
      }

      const data = await response.json()

      // Save token and user to localStorage
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("auth_user", JSON.stringify(data.user))

      return { success: true, user: data.user, token: data.token }
    } catch (error: any) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error("[Auth] Login error:", error)
      }
      
      // Provide more specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: `ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (${API_BASE_URL}). กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต` 
        }
      }
      
      return { success: false, error: error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ" }
    }
  },

  // Register function
  register: async (
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    phone: string,
  ): Promise<{ success: boolean; user?: User; token?: string; error?: string }> => {
    try {
      const response = await fetch(buildApiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, first_name, last_name, phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "สมัครสมาชิกไม่สำเร็จ" }
      }

      // Save token and user to localStorage
      localStorage.setItem("auth_token", data.token)
      localStorage.setItem("auth_user", JSON.stringify(data.user))

      return { success: true, user: data.user, token: data.token }
    } catch (error) {
      console.error("[v0] Register error:", error)
      return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อ" }
    }
  },

  // Get current user from API
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log('[Auth] No token found, returning null')
        }
        return null
      }

      const url = buildApiUrl("/api/auth/me")
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Fetching current user')
      }
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] Response status:', response.status, response.statusText)
      }

      if (!response.ok) {
        let errorMessage = response.statusText
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // ignore
        }

        if (response.status === 401 || response.status === 403) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[Auth] Token invalid, clearing session:", errorMessage)
          }
          localStorage.removeItem("auth_token")
          localStorage.removeItem("auth_user")
          return null
        }

        if (process.env.NODE_ENV === "development") {
          console.error("[Auth] Failed to get current user:", {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
          })
        }

        const error = new Error(`Failed to get current user: ${errorMessage}`)
        ;(error as any).status = response.status
        throw error
      }

      const user = await response.json()
      // Only log in development mode (don't log user data in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] User fetched successfully')
      }
      localStorage.setItem("auth_user", JSON.stringify(user))
      return user
    } catch (error: any) {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('[Auth] Error in getCurrentUser:', error)
      }
      // Re-throw network errors so they can be handled by the caller
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = new Error("Network error: Failed to fetch user data")
        ;(networkError as any).isNetworkError = true
        throw networkError
      }
      // Re-throw other errors
      throw error
    }
  },

  // Get cached user from localStorage
  getCachedUser: (): User | null => {
    if (typeof window === "undefined") return null
    const userStr = localStorage.getItem("auth_user")
    if (!userStr) return null
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  },

  // Get token
  getToken: (): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("auth_token")
  },

  // Logout function
  logout: () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return authService.getToken() !== null
  },

  // Update profile
  updateProfile: async (
    first_name: string,
    last_name: string,
    phone: string,
  ): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return { success: false, error: "ไม่พบข้อมูลการเข้าสู่ระบบ" }

      const response = await fetch(buildApiUrl("/api/auth/profile"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ first_name, last_name, phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "อัปเดตข้อมูลไม่สำเร็จ" }
      }

      localStorage.setItem("auth_user", JSON.stringify(data))
      return { success: true, user: data }
    } catch (error) {
      console.error("[v0] Update profile error:", error)
      return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อ" }
    }
  },

  // Change password
  changePassword: async (
    current_password: string,
    new_password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return { success: false, error: "ไม่พบข้อมูลการเข้าสู่ระบบ" }

      const response = await fetch(buildApiUrl("/api/auth/change-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password, new_password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ" }
      }

      return { success: true }
    } catch (error) {
      console.error("[v0] Change password error:", error)
      return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อ" }
    }
  },
}
