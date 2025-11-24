"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { api } from "@/lib/api"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  LayoutDashboard,
  Server,
  Wallet,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
  ChevronDown,
  Users,
  Package,
  Upload,
  MessageCircle,
  Folder,
  Megaphone,
  Bot,
  Shield,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { AnnouncementPopup } from "@/components/announcement-popup"
import { useActivityTracker } from "@/hooks/use-activity-tracker"
import { GiftBox } from "@/components/gift-box"
import { MagicMail } from "@/components/magic-mail"
import type { Gift, MagicMail as MagicMailType } from "@/lib/types"

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const isBannedUser = Boolean(user?.is_banned)
  const banReason = user?.ban_reason
  const [pendingGifts, setPendingGifts] = useState<Gift[]>([])
  const [showGiftBox, setShowGiftBox] = useState(false)
  const [currentGift, setCurrentGift] = useState<Gift | null>(null)
  const [pendingMail, setPendingMail] = useState<MagicMailType | null>(null)
  
  // Track user activity
  useActivityTracker()

  // Check for pending gifts
  useEffect(() => {
    if (!user || !isAuthenticated) return

    const checkGifts = async () => {
      try {
        const gifts = await api.gifts.getPending()
        if (gifts.length > 0) {
          setPendingGifts(gifts)
          setCurrentGift(gifts[0])
          setShowGiftBox(true)
        }
      } catch (error) {
        // Silently fail
        console.error("[DashboardLayout] Error checking gifts:", error)
      }
    }

    checkGifts()
  }, [user, isAuthenticated])

  useEffect(() => {
    if (!user || !isAuthenticated) return

    let cancelled = false

    const fetchMail = async () => {
      try {
        const mail = await api.mail.getPending()
        if (cancelled) return

        if (!mail) {
          setPendingMail(null)
          return
        }

        setPendingMail((prev) => (prev && prev.id === mail.id ? prev : mail))
      } catch (error) {
        console.error("[DashboardLayout] Error fetching magic mail:", error)
      }
    }

    fetchMail()
    const interval = setInterval(fetchMail, 20000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [user, isAuthenticated])
  const bannedAtDisplay =
    user?.banned_at
      ? new Date(user.banned_at).toLocaleString("th-TH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const token = localStorage.getItem("auth_token")
    console.log('[DashboardLayout] Auth check:', { hasToken: !!token, hasUser: !!user, isAuthenticated })
    
    if (!token) {
      console.log('[DashboardLayout] No token found, redirecting to login')
      setCheckingAuth(false)
      router.push("/login")
      return
    }

    // If we have a token but still waiting for AuthProvider to resolve, keep showing the loader
    if (!user || !isAuthenticated) {
      setCheckingAuth(true)

      const handleStorage = () => {
        const hasToken = !!localStorage.getItem("auth_token")
        if (!hasToken) {
          console.log('[DashboardLayout] Token removed while waiting for auth, redirecting to login')
      setCheckingAuth(false)
        router.push("/login")
      }
      }

      window.addEventListener("storage", handleStorage)

      return () => {
        window.removeEventListener("storage", handleStorage)
      }
    }

    // AuthProvider resolved with a valid user
      setCheckingAuth(false)
  }, [user, isAuthenticated, router])

  useEffect(() => {
    if (user && isAuthenticated) {
    // Fetch unread notifications count
      api.getUnreadCount()
        .then((data) => {
      setUnreadCount(data.count)
    })
        .catch(() => {
          // Ignore errors
        })
    }
  }, [user, isAuthenticated])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const displayName = `${user?.first_name ?? ""}${user?.last_name ? ` ${user.last_name}` : ""}`.trim() || user?.email || "ผู้ใช้งาน"
  const displayInitial = displayName.charAt(0).toUpperCase()

  // Admin menu items (for "หลังบ้าน" dropdown)
  const adminMenuItems = [
    { href: "/dashboard/categories", label: "หมวดหมู่โฮสติ้ง", icon: Folder },
    { href: "/dashboard/users", label: "ผู้ใช้งาน", icon: Users },
    { href: "/dashboard/admin/active-users", label: "ผู้ใช้ที่กำลังใช้งาน", icon: Activity },
    { href: "/dashboard/topups", label: "คำขอเติมเงิน", icon: Wallet },
    { href: "/dashboard/admin/plans", label: "จัดการแพ็กเกจ", icon: Package },
    { href: "/dashboard/admin/announcements", label: "จัดการประกาศ", icon: Megaphone },
    { href: "/dashboard/admin/ddos", label: "DDoS Protection", icon: Shield },
  ]

  const navItems =
    user?.role === "admin"
      ? [
          { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
          { href: "/dashboard/hostings", label: "โฮสติ้ง", icon: Server },
          { href: "/dashboard/plans", label: "แพ็กเกจ", icon: Package },
          { href: "/dashboard/topup", label: "เติมเงิน", icon: Wallet },
          { href: "/dashboard/files", label: "ฝากไฟล์", icon: Upload },
        ]
      : [
          { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
          { href: "/dashboard/hostings", label: "โฮสติ้งของฉัน", icon: Server },
          { href: "/dashboard/plans", label: "แพ็กเกจ", icon: Package },
          { href: "/dashboard/topup", label: "เติมเงิน", icon: Wallet },
          { href: "/dashboard/files", label: "ฝากไฟล์", icon: Upload },
        ]

  // Show loading state while checking auth
  if (checkingAuth || (!user && !isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 sm:h-16 px-2 sm:px-4">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
            <Link href="/dashboard" className="flex items-center">
              <Image src="/logo.png" alt="Shark Coder" width={150} height={38} className="h-6 sm:h-8 w-auto" />
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Balance */}
            <div className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">฿{Number(user.balance ?? 0).toFixed(2)}</span>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center">
              <ThemeToggle />
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs bg-red-500">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 sm:w-80">
                <DropdownMenuLabel className="text-sm sm:text-base">การแจ้งเตือน</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/dashboard/notifications">
                  <DropdownMenuItem className="text-sm sm:text-base">ดูการแจ้งเตือนทั้งหมด</DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1.5 sm:gap-2 h-9 sm:h-10 px-2 sm:px-3">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-semibold text-primary">{displayInitial}</span>
                  </div>
                  <span className="hidden md:inline text-xs sm:text-sm font-medium">{displayName}</span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    {user.role === "admin" && (
                      <Badge variant="secondary" className="w-fit text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    ตั้งค่า
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <div className="flex pt-14 sm:pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-14 sm:top-16 bottom-0 z-40 w-56 sm:w-64 bg-background border-r border-border transition-transform duration-300 lg:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="p-2 sm:p-4 space-y-1.5 sm:space-y-2 flex flex-col h-full">
            <div className="flex-1 space-y-1.5 sm:space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="font-medium truncate">{item.label}</span>
                </Link>
              )
            })}
            </div>
            
            <Separator className="my-2 sm:my-4" />
            
            {/* Admin "หลังบ้าน" Dropdown */}
            {user?.role === "admin" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 h-auto text-sm sm:text-base bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/40"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium truncate">หลังบ้าน</span>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>เมนูแอดมิน</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {adminMenuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <DropdownMenuItem
                        key={item.href}
                        asChild
                        className={isActive ? "bg-primary/10" : ""}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <a
              href="https://discord.gg/2C4N5GpqH8"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground text-sm sm:text-base"
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="font-medium truncate">เข้าร่วม Discord</span>
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-56 xl:ml-64">
          <div className="p-3 sm:p-4 md:p-6">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Announcement Popup */}
      {isAuthenticated && <AnnouncementPopup />}

      {isBannedUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6">
          <div className="bg-background border-2 border-red-500 shadow-2xl rounded-2xl max-w-lg w-full space-y-6 p-6 sm:p-8">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">บัญชีถูกแบน</h2>
              <p className="text-base sm:text-lg text-red-500 font-semibold">
                โปรดติดต่อแอดมิน หากเป็นการเข้าใจผิด
              </p>
            </div>
            
            {banReason && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">สาเหตุการแบน:</p>
                <p className="text-sm text-red-700 dark:text-red-300">{banReason}</p>
                {bannedAtDisplay && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    วันที่แบน: {bannedAtDisplay}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                คุณสามารถเข้าสู่ระบบได้ แต่จะไม่สามารถใช้งานบริการต่างๆ ได้จนกว่าจะปลดแบน
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="w-full">
                    ติดต่ออีเมล Support
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-red-500/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <a
                    href="https://discord.gg/2C4N5GpqH8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    ติดต่อผ่าน Discord
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AnnouncementPopup />
      
      {pendingMail && (
        <MagicMail
          mail={pendingMail}
          onClose={async () => {
            try {
              await api.mail.open(pendingMail.id)
            } catch (error) {
              console.error("[DashboardLayout] Failed to mark magic mail as opened:", error)
            } finally {
              setPendingMail(null)
            }
          }}
        />
      )}

      {/* Gift Box */}
      {showGiftBox && currentGift && (
        <GiftBox
          gift={currentGift}
          onClaim={() => {
            setPendingGifts(prev => prev.filter(g => g.id !== currentGift.id))
            if (pendingGifts.length > 1) {
              setCurrentGift(pendingGifts[1])
            } else {
              setShowGiftBox(false)
              setCurrentGift(null)
            }
            // Refresh user data
            if (typeof window !== 'undefined') {
              window.location.reload()
            }
          }}
          onClose={() => {
            setShowGiftBox(false)
            setCurrentGift(null)
          }}
        />
      )}
    </div>
  )
}
