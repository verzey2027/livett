"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { api } from "@/lib/api"
import { toast } from "sonner"
import PacmanLoader from "@/components/ui/pacman-loader"
import { 
  Image as ImageIcon, 
  Music, 
  Type, 
  Users, 
  FileText, 
  Upload,
  Save,
  X,
  Trash2
} from "lucide-react"
import { getApiBaseUrl } from "@/lib/base-url"

const API_BASE_URL = getApiBaseUrl()

export default function AdminPanelPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  
  // Landing Content
  const [landingContent, setLandingContent] = useState({
    heroTitle: "",
    heroSubtitle: "",
    progress: 0,
    devlog: [] as string[],
    announcements: [] as string[],
  })
  const [devlogInput, setDevlogInput] = useState("")
  const [announcementInput, setAnnouncementInput] = useState("")
  
  // Assets
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [musicFile, setMusicFile] = useState<File | null>(null)
  const [musicTitle, setMusicTitle] = useState("")
  const [musicArtist, setMusicArtist] = useState("")
  
  // Admin Logs
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    
    if (user.role !== "admin") {
      toast.error("ไม่มีสิทธิ์เข้าถึง", {
        description: "คุณต้องเป็น Admin เท่านั้น",
      })
      router.push("/dashboard")
      return
    }
    
    loadData()
  }, [user, router])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/landing`, {
        cache: "no-store",
      })
      if (res.ok) {
        const data = await res.json()
        setLandingContent({
          heroTitle: data.heroTitle || "",
          heroSubtitle: data.heroSubtitle || "",
          progress: data.progress || 0,
          devlog: data.devlog || [],
          announcements: data.announcements || [],
        })
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLanding = async () => {
    try {
      setSaving(true)
      await api.admin.updateLanding({
        heroTitle: landingContent.heroTitle,
        heroSubtitle: landingContent.heroSubtitle,
        progress: landingContent.progress,
        devlog: landingContent.devlog,
        announcements: landingContent.announcements,
      })
      toast.success("บันทึกสำเร็จ", {
        description: "อัปเดตเนื้อหาหน้า Landing แล้ว",
      })
    } catch (error: any) {
      toast.error("บันทึกไม่สำเร็จ", {
        description: error.message || "เกิดข้อผิดพลาด",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUploadAsset = async (type: "logo" | "background") => {
    const file = type === "logo" ? logoFile : backgroundFile
    if (!file) {
      toast.error("กรุณาเลือกไฟล์", {
        description: "กรุณาเลือกไฟล์ที่จะอัปโหลด",
      })
      return
    }

    try {
      setUploading(type)
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`${API_BASE_URL}/api/admin/assets/${type}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "อัปโหลดไม่สำเร็จ")
      }

      const data = await res.json()
      toast.success("อัปโหลดสำเร็จ", {
        description: `อัปโหลด${type === "logo" ? "โลโก้" : "พื้นหลัง"}เรียบร้อยแล้ว`,
      })
      
      if (type === "logo") setLogoFile(null)
      if (type === "background") setBackgroundFile(null)
      
      // Reload page to see changes
      setTimeout(() => window.location.reload(), 1000)
    } catch (error: any) {
      toast.error("อัปโหลดไม่สำเร็จ", {
        description: error.message || "เกิดข้อผิดพลาด",
      })
    } finally {
      setUploading(null)
    }
  }

  const handleUploadMusic = async () => {
    if (!musicFile || !musicTitle) {
      toast.error("กรุณากรอกข้อมูลให้ครบ", {
        description: "กรุณาเลือกไฟล์และกรอกชื่อเพลง",
      })
      return
    }

    try {
      setUploading("music")
      const formData = new FormData()
      formData.append("file", musicFile)
      formData.append("title", musicTitle)
      if (musicArtist) formData.append("artist", musicArtist)

      const res = await fetch(`${API_BASE_URL}/api/admin/music`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "อัปโหลดไม่สำเร็จ")
      }

      toast.success("อัปโหลดเพลงสำเร็จ", {
        description: "เพลงใหม่ถูกอัปโหลดและเปิดใช้งานแล้ว",
      })
      
      setMusicFile(null)
      setMusicTitle("")
      setMusicArtist("")
      
      setTimeout(() => window.location.reload(), 1000)
    } catch (error: any) {
      toast.error("อัปโหลดไม่สำเร็จ", {
        description: error.message || "เกิดข้อผิดพลาด",
      })
    } finally {
      setUploading(null)
    }
  }

  const loadLogs = async () => {
    try {
      setLoadingLogs(true)
      const res = await fetch(`${API_BASE_URL}/api/admin/logs?limit=50`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      }
    } catch (error) {
      console.error("Error loading logs:", error)
      toast.error("โหลด logs ไม่สำเร็จ")
    } finally {
      setLoadingLogs(false)
    }
  }

  const addDevlog = () => {
    if (!devlogInput.trim()) return
    setLandingContent({
      ...landingContent,
      devlog: [...landingContent.devlog, devlogInput.trim()],
    })
    setDevlogInput("")
  }

  const removeDevlog = (index: number) => {
    setLandingContent({
      ...landingContent,
      devlog: landingContent.devlog.filter((_, i) => i !== index),
    })
  }

  const addAnnouncement = () => {
    if (!announcementInput.trim()) return
    setLandingContent({
      ...landingContent,
      announcements: [...landingContent.announcements, announcementInput.trim()],
    })
    setAnnouncementInput("")
  }

  const removeAnnouncement = (index: number) => {
    setLandingContent({
      ...landingContent,
      announcements: landingContent.announcements.filter((_, i) => i !== index),
    })
  }

  if (loading || !user || user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <PacmanLoader />
            <p className="mt-4 text-gray-600">กำลังโหลด...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
          <p className="text-gray-600 mt-1">จัดการระบบหลังบ้านทั้งหมด</p>
        </div>

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="content" className="data-[state=active]:bg-gray-100">
              <Type className="mr-2 h-4 w-4" />
              เนื้อหา
            </TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-gray-100">
              <ImageIcon className="mr-2 h-4 w-4" />
              ไฟล์สื่อ
            </TabsTrigger>
            <TabsTrigger value="music" className="data-[state=active]:bg-gray-100">
              <Music className="mr-2 h-4 w-4" />
              เพลง
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-100">
              <Users className="mr-2 h-4 w-4" />
              ผู้ใช้
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-gray-100">
              <FileText className="mr-2 h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">แก้ไขเนื้อหาหน้า Landing</CardTitle>
                <CardDescription>แก้ไขข้อความที่แสดงบนหน้าแรก</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="heroTitle" className="text-gray-700">Hero Title</Label>
                  <Input
                    id="heroTitle"
                    value={landingContent.heroTitle}
                    onChange={(e) =>
                      setLandingContent({ ...landingContent, heroTitle: e.target.value })
                    }
                    placeholder="SharkCoder — The Future City Builder"
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="heroSubtitle" className="text-gray-700">Hero Subtitle</Label>
                  <Input
                    id="heroSubtitle"
                    value={landingContent.heroSubtitle}
                    onChange={(e) =>
                      setLandingContent({ ...landingContent, heroSubtitle: e.target.value })
                    }
                    placeholder="Premium metaverse experience for ambitious citizens."
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="progress" className="text-gray-700">Progress (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={landingContent.progress}
                    onChange={(e) =>
                      setLandingContent({
                        ...landingContent,
                        progress: parseInt(e.target.value) || 0,
                      })
                    }
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label className="text-gray-700">Devlog</Label>
                  <div className="space-y-2">
                    {landingContent.devlog.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={item} readOnly className="border-gray-300" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDevlog(index)}
                          className="border-gray-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={devlogInput}
                        onChange={(e) => setDevlogInput(e.target.value)}
                        placeholder="เพิ่ม Devlog ใหม่..."
                        className="border-gray-300"
                        onKeyPress={(e) => e.key === "Enter" && addDevlog()}
                      />
                      <Button onClick={addDevlog} variant="outline" className="border-gray-300">
                        เพิ่ม
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-700">Announcements</Label>
                  <div className="space-y-2">
                    {landingContent.announcements.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={item} readOnly className="border-gray-300" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAnnouncement(index)}
                          className="border-gray-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={announcementInput}
                        onChange={(e) => setAnnouncementInput(e.target.value)}
                        placeholder="เพิ่ม Announcement ใหม่..."
                        className="border-gray-300"
                        onKeyPress={(e) => e.key === "Enter" && addAnnouncement()}
                      />
                      <Button onClick={addAnnouncement} variant="outline" className="border-gray-300">
                        เพิ่ม
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSaveLanding}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">อัปโหลดโลโก้</CardTitle>
                <CardDescription>เปลี่ยนโลโก้เว็บไซต์ (PNG, JPG)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logo" className="text-gray-700">เลือกไฟล์</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="border-gray-300"
                  />
                </div>
                <Button
                  onClick={() => handleUploadAsset("logo")}
                  disabled={!logoFile || uploading === "logo"}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading === "logo" ? "กำลังอัปโหลด..." : "อัปโหลดโลโก้"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">อัปโหลดพื้นหลัง</CardTitle>
                <CardDescription>เปลี่ยนพื้นหลังเว็บไซต์ (PNG, JPG)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="background" className="text-gray-700">เลือกไฟล์</Label>
                  <Input
                    id="background"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => setBackgroundFile(e.target.files?.[0] || null)}
                    className="border-gray-300"
                  />
                </div>
                <Button
                  onClick={() => handleUploadAsset("background")}
                  disabled={!backgroundFile || uploading === "background"}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading === "background" ? "กำลังอัปโหลด..." : "อัปโหลดพื้นหลัง"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="music" className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">อัปโหลดเพลง</CardTitle>
                <CardDescription>อัปโหลดเพลงใหม่สำหรับหน้า Landing (MP3)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="musicTitle" className="text-gray-700">ชื่อเพลง *</Label>
                  <Input
                    id="musicTitle"
                    value={musicTitle}
                    onChange={(e) => setMusicTitle(e.target.value)}
                    placeholder="ชื่อเพลง"
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="musicArtist" className="text-gray-700">ศิลปิน</Label>
                  <Input
                    id="musicArtist"
                    value={musicArtist}
                    onChange={(e) => setMusicArtist(e.target.value)}
                    placeholder="ชื่อศิลปิน (ไม่บังคับ)"
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="music" className="text-gray-700">ไฟล์เพลง</Label>
                  <Input
                    id="music"
                    type="file"
                    accept="audio/mpeg,audio/mp3"
                    onChange={(e) => setMusicFile(e.target.files?.[0] || null)}
                    className="border-gray-300"
                  />
                </div>
                <Button
                  onClick={handleUploadMusic}
                  disabled={!musicFile || !musicTitle || uploading === "music"}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading === "music" ? "กำลังอัปโหลด..." : "อัปโหลดเพลง"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">จัดการผู้ใช้</CardTitle>
                <CardDescription>ดูและจัดการผู้ใช้ทั้งหมด</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push("/dashboard/users")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Users className="mr-2 h-4 w-4" />
                  ไปที่หน้าจัดการผู้ใช้
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Admin Logs</CardTitle>
                <CardDescription>ประวัติการกระทำของแอดมินทั้งหมด</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={loadLogs}
                  disabled={loadingLogs}
                  className="mb-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loadingLogs ? "กำลังโหลด..." : "โหลด Logs"}
                </Button>
                {logs.length > 0 && (
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{log.action}</p>
                            <p className="text-sm text-gray-600">
                              โดย: {log.admin_email || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(log.created_at).toLocaleString("th-TH")}
                            </p>
                          </div>
                          {log.payload && (
                            <pre className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 max-w-md overflow-auto">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

