"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authService, type User, type AuthState } from "@/lib/auth"
import PacmanLoader from "@/components/ui/pacman-loader"

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    phone: string,
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (user: User) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    token: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken()
      const cachedUser = authService.getCachedUser()

      console.log('[AuthProvider] Initializing auth:', { hasToken: !!token, hasCachedUser: !!cachedUser })

      let authPromise: Promise<void> = Promise.resolve()

      if (token) {
        if (cachedUser) {
          // Set cached user immediately for faster UI
          console.log('[AuthProvider] Setting cached user immediately')
          setAuthState({ user: cachedUser, isAuthenticated: true, token })
          // Apply theme from cached user
          applyTheme(cachedUser.theme_preference)
        }

        // Then verify and refresh from API
        authPromise = (async () => {
          try {
            console.log('[AuthProvider] Fetching user from API...')
            const user = await authService.getCurrentUser()
            if (user) {
              console.log('[AuthProvider] User fetched successfully')
              setAuthState({ user, isAuthenticated: true, token })
              // Apply theme from user preference
              applyTheme(user.theme_preference)
            } else {
              console.warn('[AuthProvider] No user returned from API')
              // Token invalid, clear state
              setAuthState({ user: null, isAuthenticated: false, token: null })
            }
          } catch (error: any) {
            console.error('[AuthProvider] Error fetching user:', error)
            // Network error or API unavailable - keep cached user but log error
            if (cachedUser) {
              // If we have cached user, keep it even if API fails
              console.warn("[Auth] Failed to verify user from API, using cached user:", error.message)
              setAuthState({ user: cachedUser, isAuthenticated: true, token })
              // Apply theme from cached user
              applyTheme(cachedUser.theme_preference)
            } else {
              // No cached user - check if it's an auth error
              if (error.status === 401 || error.status === 403) {
                console.warn('[AuthProvider] Auth error, clearing state')
                setAuthState({ user: null, isAuthenticated: false, token: null })
              } else {
                // Network error but we have token - try to use token anyway
                // AuthProvider will handle this gracefully
                console.warn("[Auth] Network error during auth check:", error.message)
              }
            }
          }
        })()
      } else {
        console.log('[AuthProvider] No token found')
        // No user logged in - apply theme from localStorage or system preference
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme === 'dark' || savedTheme === 'light') {
          applyTheme(savedTheme as "light" | "dark")
        } else {
          // Use system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          applyTheme(prefersDark ? 'dark' : 'light')
        }
      }

      // Wait for API call to complete (but don't force 2.5 second delay)
      // This makes the UI more responsive
      await authPromise
      setIsLoading(false)
      console.log('[AuthProvider] Auth initialization complete')
    }

    initAuth()
  }, [])

  // Apply theme preference to document
  const applyTheme = (themePreference?: "light" | "dark" | "system" | null) => {
    if (typeof window === 'undefined') return
    
    const root = document.documentElement
    
    // If no preference, try to get from localStorage first
    if (!themePreference) {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark' || savedTheme === 'light') {
        themePreference = savedTheme as "light" | "dark"
      } else {
        // Use system preference if no saved theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        themePreference = prefersDark ? 'dark' : 'light'
      }
    }
    
    if (themePreference === 'dark') {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else if (themePreference === 'light') {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else if (themePreference === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        root.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    }
  }

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password)
    if (result.success && result.user && result.token) {
      setAuthState({ user: result.user, isAuthenticated: true, token: result.token })
      // Apply theme from user preference
      applyTheme(result.user.theme_preference)
    }
    return { success: result.success, error: result.error }
  }

  const register = async (email: string, password: string, first_name: string, last_name: string, phone: string) => {
    const result = await authService.register(email, password, first_name, last_name, phone)
    if (result.success && result.user && result.token) {
      setAuthState({ user: result.user, isAuthenticated: true, token: result.token })
      // Apply theme from user preference (defaults to light)
      applyTheme(result.user.theme_preference || 'light')
    }
    return { success: result.success, error: result.error }
  }

  const logout = () => {
    // Get current theme before logout to preserve it
    const currentTheme = localStorage.getItem('theme') || 'light'
    authService.logout()
    setAuthState({ user: null, isAuthenticated: false, token: null })
    // Apply saved theme after logout (don't reset to light)
    if (currentTheme === 'dark' || currentTheme === 'light') {
      applyTheme(currentTheme as "light" | "dark")
    }
  }

  const updateUser = (user: User) => {
    // Preserve current theme preference if new user object doesn't have it
    const currentUser = authState.user
    const currentTheme = currentUser?.theme_preference || localStorage.getItem('theme') || 'light'
    
    // Merge theme preference from current user if new user doesn't have it
    const userWithTheme = {
      ...user,
      theme_preference: user.theme_preference || currentTheme as "light" | "dark" | "system"
    }
    
    setAuthState((prev) => ({ ...prev, user: userWithTheme }))
    localStorage.setItem("auth_user", JSON.stringify(userWithTheme))
    
    // Only apply theme if it actually changed
    if (user.theme_preference && user.theme_preference !== currentTheme) {
    applyTheme(user.theme_preference)
    } else {
      // Preserve current theme
      applyTheme(currentTheme as "light" | "dark" | "system")
    }
  }

  const refreshUser = async () => {
    try {
    const user = await authService.getCurrentUser()
    if (user) {
      setAuthState((prev) => ({ ...prev, user }))
        // Apply theme from user preference
        applyTheme(user.theme_preference)
      }
    } catch (error: any) {
      console.warn("[Auth] Failed to refresh user:", error.message)
      // Don't throw - just log the error
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <PacmanLoader />
          <p className="mt-4 text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
