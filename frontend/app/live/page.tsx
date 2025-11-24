"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface LiveData {
  gifts: Array<{ username: string; gift: string; count: number; time: string }>
  comments: Array<{ username: string; comment: string; time: string }>
  likes: Array<{ username: string; time: string }>
  shares: Array<{ username: string; time: string }>
}

function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  }
  return "http://localhost:8080"
}

export default function LivePage() {
  const router = useRouter()
  const [nickname, setNickname] = useState<string>("")
  const [showNicknameInput, setShowNicknameInput] = useState(true)
  
  // Dual Tracking States
  const [username1, setUsername1] = useState("")
  const [username2, setUsername2] = useState("")
  const [isDualMode, setIsDualMode] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState("")
  
  // Data for Streamer 1 (last 10 minutes)
  const [data1, setData1] = useState<LiveData>({
    gifts: [],
    comments: [],
    likes: [],
    shares: [],
  })
  
  // Data for Streamer 2 (last 10 minutes)
  const [data2, setData2] = useState<LiveData>({
    gifts: [],
    comments: [],
    likes: [],
    shares: [],
  })
  
  // Total stats (all time)
  const [totalStats1, setTotalStats1] = useState({ gifts: 0, comments: 0, likes: 0, shares: 0 })
  const [totalStats2, setTotalStats2] = useState({ gifts: 0, comments: 0, likes: 0, shares: 0 })
  
  const [isTracking, setIsTracking] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [error1, setError1] = useState<string | null>(null)
  const [error2, setError2] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showStreamView, setShowStreamView] = useState(false)
  
  const intervalRef1 = useRef<NodeJS.Timeout | null>(null)
  const intervalRef2 = useRef<NodeJS.Timeout | null>(null)
  
  // Column visibility toggles (default: all visible)
  const [visibleColumns, setVisibleColumns] = useState({
    gifts: true,
    comments: true,
    likes: true,
    shares: true,
  })
  
  // Legacy compatibility
  const username = username1
  const setUsername = setUsername1
  const data = data1
  const setData = setData1
  const error = error1
  const setError = setError1
  const wsRef = useRef<WebSocket | null>(null)
  const intervalRef = intervalRef1

  // Check if nickname is saved
  useEffect(() => {
    const savedNickname = localStorage.getItem("user_nickname")
    if (savedNickname) {
      setNickname(savedNickname)
      setShowNicknameInput(false)
    }
    setMounted(true)
  }, [])

  const formatTime = () => {
    const now = new Date()
    return now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  const startTracking = () => {
    if (!username.trim()) return
    
    setIsTracking(true)
    
    // Clear existing data
    setData({
      gifts: [],
      comments: [],
      likes: [],
      shares: [],
    })

    // Start polling for data
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const apiUrl = getApiBaseUrl()
        const cleanUsername = username.replace(/^@/, "").trim()
        
        if (!cleanUsername) {
          setError("กรุณากรอก username")
          setLoading(false)
          return
        }

        console.log(`[TikTok Live] Fetching data for: ${cleanUsername}`)
        const response = await fetch(`${apiUrl}/api/tiktok/live?username=${encodeURIComponent(cleanUsername)}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Network error" }))
          setError(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
          console.error(`[TikTok Live] API Error:`, errorData)
          setLoading(false)
          return
        }

        const newData = await response.json()
        console.log(`[TikTok Live] Received data:`, newData)
        
        // Show error if API returns error message
        if (newData.error) {
          setError(newData.error)
          setLoading(false)
          return
        }
        
        // Update data with timestamps
        let hasNewData = false

        if (newData.gifts && Array.isArray(newData.gifts) && newData.gifts.length > 0) {
          hasNewData = true
          setData(prev => {
            const newGifts = newData.gifts.map((g: any) => ({ ...g, time: g.time || formatTime(), timestamp: Date.now() }))
            // Filter out duplicates by username + gift + time
            const existingKeys = new Set(prev.gifts.map((g: any) => `${g.username}_${g.gift}_${g.time}`))
            const uniqueNewGifts = newGifts.filter((g: any) => !existingKeys.has(`${g.username}_${g.gift}_${g.time}`))
            
            if (uniqueNewGifts.length === 0) return prev
            
            return {
              ...prev,
              gifts: [...uniqueNewGifts, ...prev.gifts],
            }
          })
        }
        
        if (newData.comments && Array.isArray(newData.comments) && newData.comments.length > 0) {
          hasNewData = true
          setData(prev => {
            const newComments = newData.comments.map((c: any) => ({ ...c, time: c.time || formatTime(), timestamp: Date.now() }))
            // Filter out duplicates by username + comment text + time
            const existingKeys = new Set(prev.comments.map((c: any) => `${c.username}_${c.comment}_${c.time}`))
            const uniqueNewComments = newComments.filter((c: any) => !existingKeys.has(`${c.username}_${c.comment}_${c.time}`))
            
            if (uniqueNewComments.length === 0) return prev
            
            return {
              ...prev,
              comments: [...uniqueNewComments, ...prev.comments],
            }
          })
        }
        
        if (newData.likes && Array.isArray(newData.likes) && newData.likes.length > 0) {
          hasNewData = true
          setData(prev => {
            const newLikes = newData.likes.map((l: any) => ({ ...l, time: l.time || formatTime(), timestamp: Date.now() }))
            // Filter out duplicates: one like per user per second (ไม่ฟลัดข้อความ)
            const existingKeys = new Set(prev.likes.map((l: any) => `${l.username}_${l.time}`))
            const uniqueNewLikes = newLikes.filter((l: any) => !existingKeys.has(`${l.username}_${l.time}`))
            
            if (uniqueNewLikes.length === 0) return prev
            
            return {
              ...prev,
              likes: [...uniqueNewLikes, ...prev.likes],
            }
          })
        }
        
        if (newData.shares && Array.isArray(newData.shares) && newData.shares.length > 0) {
          hasNewData = true
          setData(prev => {
            const newShares = newData.shares.map((s: any) => ({ ...s, time: s.time || formatTime(), timestamp: Date.now() }))
            // Filter out duplicates: one share per user per second (ถ้าแชร์ 1 ครั้งก็แสดงแค่ 1 ครั้ง)
            const existingKeys = new Set(prev.shares.map((s: any) => `${s.username}_${s.time}`))
            const uniqueNewShares = newShares.filter((s: any) => !existingKeys.has(`${s.username}_${s.time}`))
            
            if (uniqueNewShares.length === 0) return prev
            
            return {
              ...prev,
              shares: [...uniqueNewShares, ...prev.shares],
            }
          })
        }

        if (!hasNewData && Object.keys(newData).length > 0) {
          console.log(`[TikTok Live] No new events, but connection OK`)
        }

        setLoading(false)
      } catch (error: any) {
        console.error("[TikTok Live] Error fetching data:", error)
        setError(error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล")
        setLoading(false)
      }
    }

    // Initial fetch
    fetchData()
    
    // Poll every 1 second for real-time updates
    intervalRef.current = setInterval(fetchData, 1000)
    
    // Update total stats every 10 minutes
    const updateTotalStats = () => {
      setTotalStats1(prev => ({
        gifts: prev.gifts + data1.gifts.length,
        comments: prev.comments + data1.comments.length,
        likes: prev.likes + data1.likes.length,
        shares: prev.shares + data1.shares.length,
      }))
      console.log('[Stats] Updated total stats for last 10 minutes')
    }
    
    const statsInterval = setInterval(updateTotalStats, 10 * 60 * 1000) // 10 minutes
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      clearInterval(statsInterval)
    }
  }

  const stopTracking = () => {
    setIsTracking(false)
    setLoading(false)
    setError1(null)
    setError2(null)
    if (intervalRef1.current) {
      clearInterval(intervalRef1.current)
      intervalRef1.current = null
    }
    if (intervalRef2.current) {
      clearInterval(intervalRef2.current)
      intervalRef2.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }
  
  // Start Dual Tracking
  const startDualTracking = () => {
    if (!username1.trim() || !username2.trim()) {
      alert("กรุณากรอก Username ทั้ง 2 คน")
      return
    }
    
    setIsDualMode(true)
    setIsTracking(true)
    
    // Clear existing data
    setData1({ gifts: [], comments: [], likes: [], shares: [] })
    setData2({ gifts: [], comments: [], likes: [], shares: [] })
    
    // Start tracking both streamers
    startTrackingStreamer(username1, setData1, setError1, intervalRef1)
    startTrackingStreamer(username2, setData2, setError2, intervalRef2)
  }
  
  // Generic function to track a streamer
  const startTrackingStreamer = (
    username: string,
    setData: React.Dispatch<React.SetStateAction<LiveData>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>,
    intervalRef: React.MutableRefObject<NodeJS.Timeout | null>
  ) => {
    const fetchData = async () => {
      try {
        const apiUrl = getApiBaseUrl()
        const cleanUsername = username.replace(/^@/, "").trim()
        
        const response = await fetch(`${apiUrl}/api/tiktok/live?username=${encodeURIComponent(cleanUsername)}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Network error" }))
          setError(errorData.message || `HTTP ${response.status}`)
          return
        }

        const newData = await response.json()
        
        if (newData.error) {
          setError(newData.error)
          return
        }
        
        // Update data
        if (newData.gifts?.length > 0) {
          setData(prev => ({
            ...prev,
            gifts: [...newData.gifts.map((g: any) => ({ ...g, time: g.time || formatTime() })), ...prev.gifts],
          }))
        }
        
        if (newData.comments?.length > 0) {
          setData(prev => ({
            ...prev,
            comments: [...newData.comments.map((c: any) => ({ ...c, time: c.time || formatTime() })), ...prev.comments],
          }))
        }
        
        if (newData.likes?.length > 0) {
          setData(prev => ({
            ...prev,
            likes: [...newData.likes.map((l: any) => ({ ...l, time: l.time || formatTime() })), ...prev.likes],
          }))
        }
        
        if (newData.shares?.length > 0) {
          setData(prev => ({
            ...prev,
            shares: [...newData.shares.map((s: any) => ({ ...s, time: s.time || formatTime() })), ...prev.shares],
          }))
        }
      } catch (error: any) {
        console.error(`[TikTok Live] Error for ${username}:`, error)
        setError(error.message || "เกิดข้อผิดพลาด")
      }
    }

    fetchData()
    intervalRef.current = setInterval(fetchData, 1000)
  }

  const goToLive = () => {
    if (username) {
      const cleanUsername = username.replace("@", "")
      window.open(`https://www.tiktok.com/@${cleanUsername}/live`, "_blank")
    }
  }

  // Filter data by last 10 minutes
  const filterLast10Minutes = (items: any[]) => {
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000) // 10 minutes in milliseconds
    return items.filter(item => {
      // If item has timestamp, use it; otherwise keep it
      if (item.timestamp) {
        return item.timestamp >= tenMinutesAgo
      }
      return true
    })
  }
  
  const filterData = (items: any[], search: string) => {
    // First filter by last 10 minutes
    const recentItems = filterLast10Minutes(items)
    
    if (!search) return recentItems
    const lowerSearch = search.toLowerCase()
    return recentItems.filter(item => 
      item.username?.toLowerCase().includes(lowerSearch) ||
      item.comment?.toLowerCase().includes(lowerSearch) ||
      item.gift?.toLowerCase().includes(lowerSearch)
    )
  }
  
  // Render data columns for dual mode
  const renderDataColumns = (data: LiveData, username: string, colorTheme: 'cyan' | 'purple') => {
    const colors = {
      cyan: {
        border: 'border-cyan-500/50',
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        gradient: 'from-cyan-400 to-purple-500',
      },
      purple: {
        border: 'border-purple-500/50',
        text: 'text-purple-400',
        bg: 'bg-purple-500/10',
        gradient: 'from-purple-400 to-pink-500',
      },
    }
    
    const theme = colors[colorTheme]
    
    return (
      <>
        {/* Gifts */}
        {visibleColumns.gifts && (
          <div className={`bg-gray-800/30 backdrop-blur-sm border ${theme.border} rounded-lg p-4 flex flex-col overflow-hidden`}>
            <h3 className={`text-sm font-bold ${theme.text} mb-3 flex items-center gap-2`}>
              <span>🎁</span>
              <span>ของขวัญ ({data.gifts.length})</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-600">
              {data.gifts.map((gift, idx) => (
                <div key={idx} className="bg-gray-900/50 border border-gray-700/30 p-2 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white font-bold text-[10px]`}>
                      {gift.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate text-xs">{gift.username}</div>
                      <div className="text-orange-300 text-[10px]">🎁 {gift.gift} ×{gift.count}</div>
                    </div>
                  </div>
                </div>
              ))}
              {data.gifts.length === 0 && (
                <div className="text-gray-500 text-center py-4 text-xs">ยังไม่มีของขวัญ</div>
              )}
            </div>
          </div>
        )}
        
        {/* Comments */}
        {visibleColumns.comments && (
          <div className={`bg-gray-800/30 backdrop-blur-sm border ${theme.border} rounded-lg p-4 flex flex-col overflow-hidden`}>
            <h3 className={`text-sm font-bold ${theme.text} mb-3 flex items-center gap-2`}>
              <span>💬</span>
              <span>คอมเมนต์ ({data.comments.length})</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-600">
              {data.comments.map((comment, idx) => (
                <div key={idx} className="bg-gray-900/50 border border-gray-700/30 p-2 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0`}>
                      {comment.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate text-xs">{comment.username}</div>
                      <div className="text-gray-200 text-[10px] break-words">{comment.comment}</div>
                    </div>
                  </div>
                </div>
              ))}
              {data.comments.length === 0 && (
                <div className="text-gray-500 text-center py-4 text-xs">ยังไม่มีคอมเมนต์</div>
              )}
            </div>
          </div>
        )}
        
        {/* Likes */}
        {visibleColumns.likes && (
          <div className={`bg-gray-800/30 backdrop-blur-sm border ${theme.border} rounded-lg p-4 flex flex-col overflow-hidden`}>
            <h3 className={`text-sm font-bold ${theme.text} mb-3 flex items-center gap-2`}>
              <span>❤️</span>
              <span>ไลก์ ({data.likes.length})</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-600">
              {data.likes.map((like, idx) => (
                <div key={idx} className="bg-gray-900/50 border border-gray-700/30 p-2 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center text-white font-bold text-[10px]">
                      {like.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-semibold text-white truncate text-xs">{like.username}</div>
                  </div>
                </div>
              ))}
              {data.likes.length === 0 && (
                <div className="text-gray-500 text-center py-4 text-xs">ยังไม่มีไลก์</div>
              )}
            </div>
          </div>
        )}
        
        {/* Shares */}
        {visibleColumns.shares && (
          <div className={`bg-gray-800/30 backdrop-blur-sm border ${theme.border} rounded-lg p-4 flex flex-col overflow-hidden`}>
            <h3 className={`text-sm font-bold ${theme.text} mb-3 flex items-center gap-2`}>
              <span>🔄</span>
              <span>แชร์ ({data.shares.length})</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-600">
              {data.shares.map((share, idx) => (
                <div key={idx} className="bg-gray-900/50 border border-gray-700/30 p-2 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-[10px]">
                      {share.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-semibold text-white truncate text-xs">{share.username}</div>
                  </div>
                </div>
              ))}
              {data.shares.length === 0 && (
                <div className="text-gray-500 text-center py-4 text-xs">ยังไม่มีแชร์</div>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  useEffect(() => {
    setMounted(true)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-2">
            SharkCoder.Live
          </div>
          <p className="text-gray-400 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  // แสดงหน้าใส่ชื่อเล่น
  if (showNicknameInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-3">
              SharkCoder.Live
            </h1>
            <p className="text-gray-400">ระบบติดตามสตรีมเมอร์ Real-Time PRO</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">👋</div>
              <h2 className="text-2xl font-bold mb-2">ยินดีต้อนรับ!</h2>
              <p className="text-gray-400">กรุณาใส่ชื่อเล่นของคุณเพื่อเข้าใช้งาน</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">ชื่อเล่น</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && nickname.trim()) {
                      localStorage.setItem("user_nickname", nickname.trim())
                      setShowNicknameInput(false)
                    }
                  }}
                  placeholder="ใส่ชื่อเล่นของคุณ"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  autoFocus
                />
              </div>

              <button
                onClick={() => {
                  if (nickname.trim()) {
                    localStorage.setItem("user_nickname", nickname.trim())
                    setShowNicknameInput(false)
                  }
                }}
                disabled={!nickname.trim()}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            ชื่อเล่นจะถูกบันทึกไว้ในเครื่องของคุณ
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Main Content */}
      <main className={`w-full ${isTracking ? 'px-0 py-0' : 'px-2 sm:px-4 py-6 sm:py-8'}`}>
        {/* Header Section - ซ่อนเมื่อกดติดตาม */}
        {!isTracking && (
          <div className="mb-8 text-center">
            <div className="flex items-center justify-between max-w-6xl mx-auto px-4">
              <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-3 animate-pulse">
                  SharkCoder.Live
                </h1>
                <p className="text-gray-400 text-sm sm:text-base">
                  ระบบติดตามสตรีมเมอร์ Real-Time PRO
                </p>
              </div>
              <div className="text-right space-y-2">
                <p className="text-sm text-gray-400">ผู้ใช้งาน</p>
                <p className="text-cyan-400 font-semibold">{nickname}</p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => router.push("/widgets")}
                    className="px-3 py-1 text-xs bg-yellow-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    ⚙️ Widget
                  </button>
                  <button
                    onClick={() => router.push("/donate")}
                    className="px-3 py-1 text-xs bg-green-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    💝 โดเนท
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem("user_nickname")
                      setNickname("")
                      setShowNicknameInput(true)
                    }}
                    className="px-3 py-1 text-xs bg-red-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls - ซ่อนเมื่อกดติดตาม */}
        {!isTracking && (
          <div className="mb-8 space-y-4">
          
          {/* Mode Toggle */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsDualMode(false)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                !isDualMode 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              👤 โหมดเดี่ยว
            </button>
            <button
              onClick={() => setIsDualMode(true)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                isDualMode 
                  ? "bg-purple-600 text-white" 
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              👥 โหมดคู่ (2 คน)
            </button>
          </div>
          
          {/* Single Mode */}
          {!isDualMode && (
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <input
                type="text"
                value={username1}
                onChange={(e) => {
                  setUsername1(e.target.value)
                  setError1(null)
                }}
                placeholder="กรอกไอดีที่ต้องการชมไลฟ์"
                className="px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 w-full sm:w-64 transition-all"
                suppressHydrationWarning
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    startTracking()
                    setShowStreamView(true)
                  }}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
                >
                  เริ่มติดตาม
                </button>
                <button
                  onClick={goToLive}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
                >
                  ไปที่ไลฟ์สด
                </button>
                <button
                  onClick={() => router.push("/donate")}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
                >
                  💝 โดเนท
                </button>
              </div>
            </div>
          )}
          
          {/* Dual Mode */}
          {isDualMode && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-semibold">คนที่ 1:</span>
                  <input
                    type="text"
                    value={username1}
                    onChange={(e) => {
                      setUsername1(e.target.value)
                      setError1(null)
                    }}
                    placeholder="@username1"
                    className="px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-cyan-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 w-full sm:w-48 transition-all"
                    suppressHydrationWarning
                  />
                </div>
                <span className="text-gray-500 text-2xl">VS</span>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-semibold">คนที่ 2:</span>
                  <input
                    type="text"
                    value={username2}
                    onChange={(e) => {
                      setUsername2(e.target.value)
                      setError2(null)
                    }}
                    placeholder="@username2"
                    className="px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-purple-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 w-full sm:w-48 transition-all"
                    suppressHydrationWarning
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={startDualTracking}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-all"
                >
                  🚀 เริ่มติดตาม 2 คนพร้อมกัน
                </button>
              </div>
            </div>
          )}
          
          {/* Search Input */}
          <div className="flex justify-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหา: ชื่อคน, คอมเมนต์"
              className="px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 w-full sm:w-96 transition-all"
              suppressHydrationWarning
            />
          </div>
          
          {/* Column Visibility Toggles */}
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <span className="text-sm text-gray-400">แสดง:</span>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={visibleColumns.gifts}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, gifts: e.target.checked })}
                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/50 cursor-pointer transition-all"
                suppressHydrationWarning
              />
              <span className="text-sm text-gray-300 group-hover:text-cyan-400 transition-colors">
                🎁 ของขวัญ
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={visibleColumns.comments}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, comments: e.target.checked })}
                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-2 focus:ring-purple-500/50 cursor-pointer transition-all"
                suppressHydrationWarning
              />
              <span className="text-sm text-gray-300 group-hover:text-purple-400 transition-colors">
                💬 คอมเมนต์
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={visibleColumns.likes}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, likes: e.target.checked })}
                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-pink-500 focus:ring-2 focus:ring-pink-500/50 cursor-pointer transition-all"
                suppressHydrationWarning
              />
              <span className="text-sm text-gray-300 group-hover:text-pink-400 transition-colors">
                ❤️ ไลก์
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={visibleColumns.shares}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, shares: e.target.checked })}
                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-2 focus:ring-green-500/50 cursor-pointer transition-all"
                suppressHydrationWarning
              />
              <span className="text-sm text-gray-300 group-hover:text-green-400 transition-colors">
                🔄 แชร์
              </span>
            </label>
          </div>
          
          {/* Status Banner */}
          {isTracking && !error && (
            <div className="flex justify-center animate-fade-in">
              <div className="bg-gradient-to-r from-cyan-900/40 via-purple-900/40 to-cyan-900/40 backdrop-blur-sm border border-cyan-500/50 text-cyan-200 px-6 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-cyan-500/20">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                <span className="font-medium">
                  กำลังติดตาม: @{username.replace(/^@/, "")}
                </span>
                {loading && (
                  <span className="text-sm text-cyan-300/70">(กำลังดึงข้อมูล...)</span>
                )}
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="flex justify-center animate-fade-in">
              <div className="bg-red-900/40 backdrop-blur-sm border border-red-700/50 text-red-200 px-6 py-3 rounded-xl max-w-2xl">
                <strong>⚠️ เกิดข้อผิดพลาด:</strong> {error}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Floating Control Bar - แสดงเมื่อกดติดตาม */}
        {isTracking && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-cyan-500/30 shadow-lg">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-white">LIVE</span>
                <span className="text-sm text-cyan-400">@{username.replace('@', '')}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-cyan-400">🎁 {data.gifts.length}</span>
                  <span className="text-purple-400">💬 {data.comments.length}</span>
                  <span className="text-pink-400">❤️ {data.likes.length}</span>
                  <span className="text-green-400">🔄 {data.shares.length}</span>
                </div>
                
                <button
                  onClick={() => setShowStreamView(!showStreamView)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition-all"
                >
                  {showStreamView ? "ซ่อนสตรีม" : "แสดงสตรีม"}
                </button>
                
                <button
                  onClick={stopTracking}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition-all"
                >
                  หยุดติดตาม
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Data Columns */}
        
        {/* Dual Mode - แบ่งจอบน-ล่าง */}
        {isDualMode && isTracking ? (
          <div className="space-y-4 pt-16">
            {/* Stream Widgets - แสดงทั้ง 2 สตรีม */}
            {showStreamView && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Stream 1 */}
                <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 border-2 border-cyan-500/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <h3 className="text-lg font-bold text-cyan-400">🎥 {username1.replace('@', '')}</h3>
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-cyan-900/30 rounded-lg border border-cyan-500/30 flex items-center justify-center relative overflow-hidden mb-3">
                    <div className="absolute inset-0 bg-black/40"></div>
                    <div className="relative z-10 text-center">
                      <div className="w-12 h-12 mx-auto bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mb-2 animate-pulse">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <button
                        onClick={() => window.open(`https://www.tiktok.com/@${username1.replace('@', '')}/live`, '_blank', 'width=800,height=600')}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold text-xs transition-all"
                      >
                        เปิดสตรีม
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-2 text-center">
                      <div className="font-bold text-cyan-400">{data1.gifts.length}</div>
                      <div className="text-gray-400">🎁 ของขวัญ</div>
                    </div>
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-2 text-center">
                      <div className="font-bold text-cyan-400">{data1.comments.length}</div>
                      <div className="text-gray-400">💬 คอมเมนต์</div>
                    </div>
                  </div>
                </div>
                
                {/* Stream 2 */}
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-2 border-purple-500/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <h3 className="text-lg font-bold text-purple-400">🎥 {username2.replace('@', '')}</h3>
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30 flex items-center justify-center relative overflow-hidden mb-3">
                    <div className="absolute inset-0 bg-black/40"></div>
                    <div className="relative z-10 text-center">
                      <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-2 animate-pulse">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <button
                        onClick={() => window.open(`https://www.tiktok.com/@${username2.replace('@', '')}/live`, '_blank', 'width=800,height=600')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-xs transition-all"
                      >
                        เปิดสตรีม
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2 text-center">
                      <div className="font-bold text-purple-400">{data2.gifts.length}</div>
                      <div className="text-gray-400">🎁 ของขวัญ</div>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2 text-center">
                      <div className="font-bold text-purple-400">{data2.comments.length}</div>
                      <div className="text-gray-400">💬 คอมเมนต์</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Streamer 1 - บน */}
            <div className="border-b-4 border-cyan-500/50 pb-4">
              <div className="bg-cyan-900/20 border border-cyan-500/50 rounded-lg px-4 py-2 mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold text-cyan-400">
                  👤 {username1.replace('@', '')} - คนที่ 1
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-cyan-400">🎁 {data1.gifts.length}</span>
                  <span className="text-cyan-400">💬 {data1.comments.length}</span>
                  <span className="text-cyan-400">❤️ {data1.likes.length}</span>
                  <span className="text-cyan-400">🔄 {data1.shares.length}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 h-[50vh]">
                {renderDataColumns(data1, username1, 'cyan')}
              </div>
            </div>
            
            {/* Streamer 2 - ล่าง */}
            <div className="pt-4">
              <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg px-4 py-2 mb-3 flex items-center justify-between">
                <h2 className="text-xl font-bold text-purple-400">
                  👤 {username2.replace('@', '')} - คนที่ 2
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-purple-400">🎁 {data2.gifts.length}</span>
                  <span className="text-purple-400">💬 {data2.comments.length}</span>
                  <span className="text-purple-400">❤️ {data2.likes.length}</span>
                  <span className="text-purple-400">🔄 {data2.shares.length}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 h-[50vh]">
                {renderDataColumns(data2, username2, 'purple')}
              </div>
            </div>
          </div>
        ) : (
          // Single Mode - เหมือนเดิม
          <div className={`grid gap-2 sm:gap-3 md:gap-4 ${
            isTracking 
              ? 'h-screen pt-16'
              : ''
          } ${
            showStreamView && isTracking
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'
              : Object.values(visibleColumns).filter(Boolean).length === 1 
              ? 'grid-cols-1' 
              : Object.values(visibleColumns).filter(Boolean).length === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : Object.values(visibleColumns).filter(Boolean).length === 3
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          }`}>
          
          {/* Stream Column - แสดงเป็นคอลัมน์แรก */}
          {showStreamView && isTracking && (
            <div className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-cyan-500/50 ${isTracking ? 'rounded-none' : 'rounded-2xl'} p-5 ${isTracking ? 'h-full' : 'h-[600px]'} flex flex-col shadow-xl`}>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cyan-500/30">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <h2 className="text-lg font-bold text-cyan-400">
                  🎥 สตรีม
                </h2>
              </div>
              
              <div className="flex-1 flex flex-col gap-3">
                {/* Stream Preview */}
                <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-cyan-900/30 rounded-xl border border-cyan-500/30 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/40"></div>
                  <div className="relative z-10 text-center p-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mb-3 animate-pulse">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <p className="text-cyan-400 font-semibold text-sm mb-2">
                      @{username.replace('@', '')}
                    </p>
                    <button
                      onClick={() => window.open(`https://www.tiktok.com/@${username.replace('@', '')}/live`, '_blank', 'width=900,height=700')}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-lg font-semibold text-xs transition-all shadow-lg"
                    >
                      เปิดสตรีม
                    </button>
                  </div>
                </div>
                
                {/* Quick Stats - 10 นาทีล่าสุด */}
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2 mb-2">
                  <p className="text-xs text-yellow-400 text-center font-semibold">
                    📊 10 นาทีล่าสุด
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2 text-center">
                    <div className="text-xl font-bold text-cyan-400">{filterLast10Minutes(data.gifts).length}</div>
                    <div className="text-[10px] text-gray-400 mt-1">🎁 ของขวัญ</div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2 text-center">
                    <div className="text-xl font-bold text-purple-400">{filterLast10Minutes(data.comments).length}</div>
                    <div className="text-[10px] text-gray-400 mt-1">💬 คอมเมนต์</div>
                  </div>
                  <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-2 text-center">
                    <div className="text-xl font-bold text-pink-400">{filterLast10Minutes(data.likes).length}</div>
                    <div className="text-[10px] text-gray-400 mt-1">❤️ ไลก์</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                    <div className="text-xl font-bold text-green-400">{filterLast10Minutes(data.shares).length}</div>
                    <div className="text-[10px] text-gray-400 mt-1">🔄 แชร์</div>
                  </div>
                </div>
                
                {/* Total Stats */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2 mt-2">
                  <p className="text-xs text-blue-400 text-center font-semibold mb-1">
                    📈 ยอดรวมทั้งหมด
                  </p>
                  <div className="grid grid-cols-4 gap-1 text-[10px]">
                    <div className="text-center">
                      <div className="font-bold text-cyan-400">{totalStats1.gifts}</div>
                      <div className="text-gray-500">🎁</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-purple-400">{totalStats1.comments}</div>
                      <div className="text-gray-500">💬</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-pink-400">{totalStats1.likes}</div>
                      <div className="text-gray-500">❤️</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-400">{totalStats1.shares}</div>
                      <div className="text-gray-500">🔄</div>
                    </div>
                  </div>
                </div>
                
                {/* Info */}
                <div className="bg-gray-900/50 border border-gray-700/30 rounded-lg p-2 mt-2">
                  <p className="text-[10px] text-gray-400 text-center">
                    💡 แสดงข้อมูล 10 นาทีล่าสุด<br/>
                    ยอดรวมอัพเดททุก 10 นาที
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Gifts Column */}
          {visibleColumns.gifts && (
          <div className={`bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 ${isTracking ? 'rounded-none' : 'rounded-2xl'} p-5 ${isTracking ? 'h-full' : 'h-[600px]'} flex flex-col shadow-xl hover:border-cyan-500/50 transition-all duration-300`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700/50">
              <span className="text-2xl">🎁</span>
              <h2 className="text-lg font-bold text-cyan-400">
                ของขวัญ
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
              {filterData(data.gifts, searchTerm).map((gift, idx) => (
                <div key={idx} className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/30 p-3 rounded-lg hover:border-cyan-500/30 transition-all">
                  <div className="flex items-start gap-3">
                    {/* Profile Picture */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {gift.username.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Username with border */}
                      <div className="inline-block bg-blue-900 border border-white-100 px-1.5 py-1 rounded-md">
                        <span className="font-semibold text-white text-sm">{gift.username}</span>
                      </div>
                      
                      {/* Gift Details */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/50 px-3 py-1 rounded-md text-sm text-orange-300 font-semibold">
                          🎁 {gift.gift}
                        </span>
                        {gift.count > 1 && (
                          <span className="text-cyan-400 font-bold text-sm">×{gift.count}</span>
                        )}
                      </div>
                      
                      {/* Time - smallest */}
                      <div className="text-gray-500 text-[10px]">{gift.time}</div>
                    </div>
                  </div>
                </div>
              ))}
              {filterData(data.gifts, searchTerm).length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-3 opacity-50">🎁</div>
                  <div className="text-gray-400 text-sm">ยังไม่มีใครส่งของขวัญ</div>
                  <div className="text-gray-600 text-xs mt-1">รอสักครู่นะ...</div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Comments Column */}
          {visibleColumns.comments && (
          <div className={`bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 ${isTracking ? 'rounded-none' : 'rounded-2xl'} p-5 ${isTracking ? 'h-full' : 'h-[600px]'} flex flex-col shadow-xl hover:border-purple-500/50 transition-all duration-300`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700/50">
              <span className="text-2xl">💬</span>
              <h2 className="text-lg font-bold text-purple-400">
                คนคอมเมนต์
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
              {filterData(data.comments, searchTerm).map((comment, idx) => (
                <div key={idx} className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/30 p-3 rounded-lg hover:border-purple-500/30 transition-all">
                  <div className="flex items-start gap-3">
                    {/* Profile Picture */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {comment.username.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Username with border */}
                      <div className="inline-block bg-blue-900 border border-white-100 px-1.5 py-1 rounded-md">
                        <span className="font-semibold text-white text-sm">{comment.username}</span>
                      </div>
                      
                      {/* Comment Message */}
                      <div className="bg-gray-800/30 border border-white-700/20 px-3 py-2 rounded-lg">
                        <p className="text-gray-100 text-sm break-words leading-relaxed">{comment.comment}</p>
                      </div>
                      
                      {/* Time - smallest */}
                      <div className="text-gray-500 text-[10px]">{comment.time}</div>
                    </div>
                  </div>
                </div>
              ))}
              {filterData(data.comments, searchTerm).length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-3 opacity-50">💬</div>
                  <div className="text-gray-400 text-sm">ยังไม่มีใครคอมเมนต์</div>
                  <div className="text-gray-600 text-xs mt-1">เป็นคนแรกสิ!</div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Likes Column */}
          {visibleColumns.likes && (
          <div className={`bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 ${isTracking ? 'rounded-none' : 'rounded-2xl'} p-5 ${isTracking ? 'h-full' : 'h-[600px]'} flex flex-col shadow-xl hover:border-pink-500/50 transition-all duration-300`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700/50">
              <span className="text-2xl">❤️</span>
              <h2 className="text-lg font-bold text-pink-400">
                คนกดไลก์
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-pink-500/20 scrollbar-track-transparent">
              {filterData(data.likes, searchTerm).map((like, idx) => (
                <div key={idx} className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/30 p-3 rounded-lg hover:border-pink-500/30 transition-all">
                  <div className="flex items-start gap-3">
                    {/* Profile Picture */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {like.username.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Username with border */}
                      <div className="inline-block bg-blue-900 border border-white-100 px-1.5 py-1 rounded-md">
                        <span className="font-semibold text-white text-sm">{like.username}</span>
                      </div>
                      
                      {/* Like Action */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-pink-400 text-base">❤️</span>
                        <span className="text-gray-400 text-xs">ถูกใจไลฟ์นี้</span>
                      </div>
                      
                      {/* Time - smallest */}
                      <div className="text-gray-500 text-[10px]">{like.time}</div>
                    </div>
                  </div>
                </div>
              ))}
              {filterData(data.likes, searchTerm).length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-3 opacity-50">❤️</div>
                  <div className="text-gray-400 text-sm">ยังไม่มีใครกดไลก์</div>
                  <div className="text-gray-600 text-xs mt-1">มาเป็นคนแรกเลย!</div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Shares Column */}
          {visibleColumns.shares && (
          <div className={`bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 ${isTracking ? 'rounded-none' : 'rounded-2xl'} p-5 ${isTracking ? 'h-full' : 'h-[600px]'} flex flex-col shadow-xl hover:border-green-500/50 transition-all duration-300`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700/50">
              <span className="text-2xl">🔄</span>
              <h2 className="text-lg font-bold text-green-400">
                คนแชร์
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-green-500/20 scrollbar-track-transparent">
              {filterData(data.shares, searchTerm).map((share, idx) => (
                <div key={idx} className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/30 p-3 rounded-lg hover:border-green-500/30 transition-all">
                  <div className="flex items-start gap-3">
                    {/* Profile Picture */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {share.username.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Username with border */}
                      <div className="inline-block bg-blue-900 border border-white-100 px-1.5 py-1 rounded-md">
                        <span className="font-semibold text-white text-sm">{share.username}</span>
                      </div>
                      
                      {/* Share Action */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-green-400 text-base">🔄</span>
                        <span className="text-gray-400 text-xs">แชร์ไลฟ์นี้</span>
                      </div>
                      
                      {/* Time - smallest */}
                      <div className="text-gray-500 text-[10px]">{share.time}</div>
                    </div>
                  </div>
                </div>
              ))}
              {filterData(data.shares, searchTerm).length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-3 opacity-50">🔄</div>
                  <div className="text-gray-400 text-sm">ยังไม่มีใครแชร์</div>
                  <div className="text-gray-600 text-xs mt-1">ช่วยแชร์หน่อยสิ~</div>
                </div>
              )}
            </div>
          </div>
          )}
          </div>
        )}
      </main>
    </div>
  )
}
