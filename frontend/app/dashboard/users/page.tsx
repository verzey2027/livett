"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/components/auth-provider"
import { api } from "@/lib/api"
import type { User } from "@/lib/types"
import { Users, Search, Shield, Trash2, Ban, UserCheck, CheckCircle2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import PacmanLoader from "@/components/ui/pacman-loader"

export default function UsersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [banningUser, setBanningUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState("")
  const [banning, setBanning] = useState(false)
  const [unbanningUser, setUnbanningUser] = useState<User | null>(null)
  const [unbanning, setUnbanning] = useState(false)
  const [changingRoleUser, setChangingRoleUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<"user" | "admin">("user")
  const [changingRole, setChangingRole] = useState(false)
  const hasCheckedAuth = useRef(false)

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      if (!user) {
        toast.error("กรุณาเข้าสู่ระบบก่อน")
        router.push("/login")
        return
      }

      if (user.role !== "admin") {
        toast.error("ไม่มีสิทธิ์เข้าถึง", {
          description: `คุณต้อง login ด้วยบัญชี Admin เท่านั้น`,
        })
        router.push("/dashboard")
        return
      }

      const data = await api.admin.getUsers()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error: any) {
      console.error("Error loading users:", error)
      
      if (error.message?.includes("Admin access required") || error.status === 403) {
        toast.error("ไม่มีสิทธิ์เข้าถึง", {
          description: `บัญชีของคุณไม่มีสิทธิ์ Admin`,
          duration: 6000,
        })
        router.push("/dashboard")
      } else if (error.status === 401 || error.message?.includes("token")) {
        toast.error("เซสชันหมดอายุ", {
          description: "กรุณาเข้าสู่ระบบอีกครั้ง",
        })
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
        router.push("/login")
      } else {
        toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้", {
          description: error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasCheckedAuth.current) {
      return
    }

    const checkAuthAndLoad = async () => {
      try {
        hasCheckedAuth.current = true
        setCheckingAuth(true)
        
        if (!user) {
          setCheckingAuth(false)
          router.push("/login")
          return
        }

        const token = localStorage.getItem("auth_token")
        
        if (!token) {
          setCheckingAuth(false)
          toast.error("กรุณาเข้าสู่ระบบก่อน")
          router.push("/login")
          return
        }

        let payload: any
        try {
          payload = JSON.parse(atob(token.split('.')[1]))
          
          if (payload.role !== "admin") {
            setCheckingAuth(false)
            toast.error("ไม่มีสิทธิ์เข้าถึง", {
              description: `บัญชีของคุณมี role เป็น "${payload.role}" ไม่ใช่ "admin"`,
              duration: 10000,
            })
            router.push("/dashboard")
            return
          }
        } catch (error) {
          setCheckingAuth(false)
          console.error("[Users Page] Error decoding token:", error)
          toast.error("Token ไม่ถูกต้อง", {
            description: "กรุณา login ใหม่อีกครั้ง",
          })
          router.push("/login")
          return
        }

        const cachedUserStr = localStorage.getItem("auth_user")
        
        if (!cachedUserStr) {
          setCheckingAuth(false)
          toast.error("กรุณาเข้าสู่ระบบก่อน")
          router.push("/login")
          return
        }

        let currentUser: User
        try {
          currentUser = JSON.parse(cachedUserStr)
        } catch {
          setCheckingAuth(false)
          toast.error("ข้อมูลผู้ใช้ไม่ถูกต้อง")
          router.push("/login")
          return
        }

        if (currentUser.role !== "admin") {
          setCheckingAuth(false)
          toast.error("ไม่มีสิทธิ์เข้าถึง", {
            description: `บัญชี ${currentUser.email} ไม่มีสิทธิ์ Admin`,
            duration: 8000,
          })
          router.push("/dashboard")
          return
        }

        setCheckingAuth(false)
        await loadUsers()
      } catch (error) {
        console.error("[Users Page] Error in checkAuthAndLoad:", error)
        setCheckingAuth(false)
        hasCheckedAuth.current = false
        toast.error("เกิดข้อผิดพลาด", {
          description: "ไม่สามารถตรวจสอบสิทธิ์ได้ กรุณาลองใหม่อีกครั้ง",
        })
        router.push("/dashboard")
      }
    }

    checkAuthAndLoad()
  }, [user, router])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
      return
    }

    const q = searchQuery.toLowerCase()
    setFilteredUsers(
      users.filter((u) => {
        return (
          u.email.toLowerCase().includes(q) ||
          (u.discord?.username && u.discord.username.toLowerCase().includes(q)) ||
          (u.discord?.displayName && u.discord.displayName.toLowerCase().includes(q))
        )
      }),
    )
  }, [searchQuery, users])

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    setDeleting(true)

    try {
      await api.admin.deleteUser(deletingUser.id)
      
      toast.success("ลบผู้ใช้สำเร็จ", {
        description: `ลบ ${deletingUser.email} เรียบร้อย`,
      })

      setDeletingUser(null)
      await loadUsers()
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast.error("เกิดข้อผิดพลาดในการลบผู้ใช้", {
        description: error.message || "ไม่สามารถลบผู้ใช้ได้",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleBanUser = async () => {
    if (!banningUser) return
    if (!banReason.trim()) {
      toast.error("กรุณาระบุเหตุผลในการแบน")
      return
    }

    setBanning(true)

    try {
      await api.admin.banUser(banningUser.id, banReason.trim())
      
      toast.success("แบนผู้ใช้สำเร็จ", {
        description: `ผู้ใช้ ${banningUser.email} ถูกแบนแล้ว`,
      })

      setBanningUser(null)
      setBanReason("")
      await loadUsers()
    } catch (error: any) {
      console.error("Error banning user:", error)
      toast.error("เกิดข้อผิดพลาดในการแบนผู้ใช้", {
        description: error.message || "ไม่สามารถแบนผู้ใช้ได้",
      })
    } finally {
      setBanning(false)
    }
  }

  const handleUnbanUser = async () => {
    if (!unbanningUser) return

    setUnbanning(true)

    try {
      await api.admin.unbanUser(unbanningUser.id)
      
      toast.success("ยกเลิกการแบนสำเร็จ", {
        description: `ผู้ใช้ ${unbanningUser.email} ถูกยกเลิกการแบนแล้ว`,
      })

      setUnbanningUser(null)
      await loadUsers()
    } catch (error: any) {
      console.error("Error unbanning user:", error)
      toast.error("เกิดข้อผิดพลาดในการยกเลิกการแบน", {
        description: error.message || "ไม่สามารถยกเลิกการแบนได้",
      })
    } finally {
      setUnbanning(false)
    }
  }

  const handleChangeRole = async () => {
    if (!changingRoleUser) return

    setChangingRole(true)

    try {
      await api.admin.updateUser(changingRoleUser.id, { role: newRole })
      
      toast.success("เปลี่ยน role สำเร็จ", {
        description: `เปลี่ยน role ของ ${changingRoleUser.email} เป็น ${newRole}`,
      })

      setChangingRoleUser(null)
      setNewRole("user")
      await loadUsers()
    } catch (error: any) {
      console.error("Error changing role:", error)
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยน role", {
        description: error.message || "ไม่สามารถเปลี่ยน role ได้",
      })
    } finally {
      setChangingRole(false)
    }
  }

  if (checkingAuth || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <PacmanLoader />
            <p className="mt-4 text-muted-foreground">กำลังตรวจสอบสิทธิ์...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (user.role !== "admin") return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
            <p className="text-gray-600 mt-1">ดูและจัดการข้อมูลผู้ใช้งานทั้งหมด</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">ผู้ใช้งานทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
        </div>

        {/* Search */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="ค้นหาอีเมล หรือ Discord username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md border-gray-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users */}
        {loading ? (
          <div className="text-center py-12">
            <PacmanLoader />
            <p className="mt-4 text-gray-600">กำลังโหลด...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">ไม่พบผู้ใช้งาน</h3>
              <p className="text-gray-600">ลองค้นหาด้วยคำอื่น</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((u) => (
              <Card key={u.id} className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        {u.discord?.avatarUrl ? (
                          <img
                            src={u.discord.avatarUrl}
                            alt="Discord Avatar"
                            width={48}
                            height={48}
                            className="rounded-full border border-gray-200 bg-gray-50 object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-gray-400">
                              {u.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                          <div>
                          <p className="font-semibold text-gray-900">{u.email}</p>
                          {u.discord && (
                            <div className="flex items-center gap-2 mt-1">
                              <CheckCircle2 className="h-3 w-3 text-blue-500" />
                              <span className="text-xs text-gray-600">
                                {u.discord.displayName || u.discord.username || "Discord"}
                                    </span>
                              </div>
                            )}
                          </div>
                      </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {u.role === "admin" ? (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                            <Shield className="h-3 w-3 mr-1" /> Admin
                          </Badge>
                        ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                          User
                        </Badge>
                        )}
                        {u.is_banned && (
                        <Badge className="bg-red-100 text-red-700 border-red-200">
                            <Ban className="h-3 w-3 mr-1" /> ถูกแบน
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                      <p className="text-gray-500 mb-1">สมัครเมื่อ</p>
                      <p className="text-gray-900">
                        {new Date(u.created_at ?? new Date()).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        </p>
                      </div>

                      <div>
                      <p className="text-gray-500 mb-1">User ID</p>
                      <p className="text-xs text-gray-700 font-mono">{typeof u.id === 'string' ? u.id.slice(0, 8) : u.id}</p>
                      </div>

                    {u.discord && (
                      <>
                      <div>
                          <p className="text-gray-500 mb-1">Discord Username</p>
                          <p className="text-gray-900">@{u.discord.username || "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">เชื่อมต่อ Discord</p>
                          <p className="text-gray-900">
                            {u.discord.linkedAt
                              ? new Date(u.discord.linkedAt).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                                })
                              : "—"}
                        </p>
                      </div>
                      </>
                    )}
                    </div>

                  {u.is_banned && u.ban_reason && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>เหตุผลการแบน:</strong> {u.ban_reason}
                      </p>
                      {u.banned_at && (
                        <p className="text-xs text-red-600 mt-1">
                          เมื่อ {new Date(u.banned_at).toLocaleString("th-TH")}
                        </p>
                      )}
                      </div>
                    )}

                      {u.role !== "admin" && (
                    <div className="flex gap-2 flex-wrap pt-4 border-t border-gray-200">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                          setChangingRoleUser(u)
                          setNewRole(u.role === "admin" ? "user" : "admin")
                        }}
                        className="border-gray-300"
                      >
                        <Shield className="h-4 w-4 mr-2" /> เปลี่ยน Role
                          </Button>

                          {u.is_banned ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 border-gray-300"
                              onClick={() => setUnbanningUser(u)}
                            >
                              <UserCheck className="h-4 w-4 mr-2" /> ยกเลิกการแบน
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-gray-300"
                              onClick={() => {
                                setBanningUser(u)
                                setBanReason("")
                              }}
                            >
                              <Ban className="h-4 w-4 mr-2" /> แบนผู้ใช้
                            </Button>
                          )}

                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setDeletingUser(u)}
                        className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> ลบผู้ใช้
                          </Button>
                        </div>
                      )}
                  </CardContent>
                </Card>
            ))}
          </div>
        )}
      </div>

      {/* Ban User Dialog */}
      <Dialog open={!!banningUser} onOpenChange={() => !banning && setBanningUser(null)}>
        <DialogContent className="border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">แบนผู้ใช้</DialogTitle>
            <DialogDescription className="text-gray-600">
              คุณต้องการแบนผู้ใช้ <strong>{banningUser?.email}</strong> ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="ban-reason" className="text-gray-700">เหตุผลในการแบน (จำเป็น)</Label>
              <Input
                id="ban-reason"
                placeholder="เช่น ละเมิดข้อกำหนดการใช้งาน"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                disabled={banning}
                className="border-gray-300"
              />
              <p className="text-xs text-gray-500 mt-1">
                ผู้ใช้ที่ถูกแบนจะไม่สามารถเข้าสู่ระบบได้
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setBanningUser(null)
                setBanReason("")
              }}
              disabled={banning}
              className="border-gray-300"
            >
              ยกเลิก
            </Button>
            <Button 
              onClick={handleBanUser} 
              disabled={banning || !banReason.trim()}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {banning ? "กำลังแบน..." : "ยืนยันแบน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban User Alert Dialog */}
      <AlertDialog open={!!unbanningUser} onOpenChange={(open) => !open && !unbanning && setUnbanningUser(null)}>
        <AlertDialogContent className="border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">ยกเลิกการแบนผู้ใช้</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              คุณต้องการยกเลิกการแบนผู้ใช้ <strong>{unbanningUser?.email}</strong> ใช่หรือไม่?
              <br />
              <span className="text-green-600 font-semibold">
                ผู้ใช้จะสามารถเข้าสู่ระบบได้อีกครั้ง
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unbanning} className="border-gray-300">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnbanUser}
              disabled={unbanning}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {unbanning ? "กำลังยกเลิก..." : "ยืนยันยกเลิกการแบน"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <Dialog open={!!changingRoleUser} onOpenChange={() => !changingRole && setChangingRoleUser(null)}>
        <DialogContent className="border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">เปลี่ยน Role</DialogTitle>
            <DialogDescription className="text-gray-600">
              เปลี่ยน role ของ <strong>{changingRoleUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="role" className="text-gray-700">บทบาท (Role)</Label>
              <Select
                value={newRole}
                onValueChange={(value: "admin" | "user") => setNewRole(value)}
                disabled={changingRole}
              >
                <SelectTrigger id="role" className="border-gray-300">
                  <SelectValue placeholder="เลือกบทบาท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (ผู้ใช้ทั่วไป)</SelectItem>
                  <SelectItem value="admin">Admin (ผู้ดูแลระบบ)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                ⚠️ เปลี่ยน role เป็น admin ต้อง logout และ login ใหม่เพื่อให้ token ถูกอัพเดต
              </p>
            </div>
              </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangingRoleUser(null)}
              disabled={changingRole}
              className="border-gray-300"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={changingRole}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {changingRole ? "กำลังเปลี่ยน..." : "ยืนยัน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Alert Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && !deleting && setDeletingUser(null)}>
        <AlertDialogContent className="border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">ยืนยันการลบผู้ใช้</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              คุณต้องการลบผู้ใช้ <strong>{deletingUser?.email}</strong> ใช่หรือไม่?
              <br />
              <span className="text-red-600 font-semibold">
                การกระทำนี้ไม่สามารถยกเลิกได้ และจะลบข้อมูลทั้งหมดที่เกี่ยวข้อง
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="border-gray-300">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "กำลังลบ..." : "ยืนยันลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
