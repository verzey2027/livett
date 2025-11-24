"use client"

import { useEffect, useState, useRef } from "react"
import { api } from "@/lib/api"
import type { Gift } from "@/lib/types"
import { Gift as GiftIcon, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface GiftBoxProps {
  gift: Gift
  onClaim: () => void
  onClose: () => void
}

export function GiftBox({ gift, onClaim, onClose }: GiftBoxProps) {
  const [isOpening, setIsOpening] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(10)
  const [domain, setDomain] = useState("")
  const [domainError, setDomainError] = useState("")
  const [isCreatingHosting, setIsCreatingHosting] = useState(false)
  const [hostingCreated, setHostingCreated] = useState(false)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [])

  const handleOpen = async () => {
    setIsOpening(true)
    
    // Animation delay
    setTimeout(() => {
      setShowContent(true)
    }, 1000)
    
    setTimeout(async () => {
      setIsClaiming(true)
      try {
        await api.gifts.claim(gift.id)
        setIsClaiming(false)
        
        // For hosting gifts, don't start countdown yet - wait for domain input
        if (gift.gift_type === "hosting") {
          // Don't start countdown, wait for domain
          return
        }
        
        // For balance gifts, start countdown timer
        countdownRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) {
                clearInterval(countdownRef.current)
                countdownRef.current = null
              }
              setTimeout(() => {
                onClaim()
              }, 500)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } catch (error: any) {
        console.error("Error claiming gift:", error)
        alert(error.message || "เกิดข้อผิดพลาดในการรับของขวัญ")
        setIsClaiming(false)
      }
    }, 2000)
  }

  const handleCreateHosting = async () => {
    if (!domain.trim()) {
      setDomainError("กรุณากรอกชื่อโดเมน")
      return
    }
    
    setDomainError("")
    setIsCreatingHosting(true)
    
    try {
      await api.gifts.createHosting(gift.id, domain.trim())
      setHostingCreated(true)
      
      // Start countdown after hosting is created
      countdownRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current)
              countdownRef.current = null
            }
            setTimeout(() => {
              onClaim()
            }, 500)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      console.error("Error creating hosting:", error)
      setDomainError(error.message || "เกิดข้อผิดพลาดในการสร้าง hosting")
    } finally {
      setIsCreatingHosting(false)
    }
  }

  const handleClose = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    onClaim()
  }

  const getGiftDescription = () => {
    if (gift.gift_type === "balance") {
      return `คุณได้รับเงิน ${parseFloat(gift.balance_amount || "0").toFixed(2)} บาท`
    } else if (gift.gift_type === "hosting") {
      return `คุณได้รับโฮสติ้ง: ${gift.plan_name_th || gift.plan_name || "โฮสติ้ง"}`
    }
    return "คุณได้รับของขวัญ"
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        {/* Falling sparkles background */}
        <div className="absolute inset-0 overflow-hidden">
          {typeof window !== 'undefined' && [...Array(50)].map((_, i) => {
            const width = window.innerWidth || 1920
            const height = window.innerHeight || 1080
            return (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                initial={{
                  x: Math.random() * width,
                  y: -20,
                  opacity: 0,
                }}
                animate={{
                  y: height + 20,
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            )
          })}
        </div>

        {/* Main gift box */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: isOpening ? 0.8 : 1, rotate: isOpening ? 0 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative z-10"
        >
          {!isOpening ? (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative cursor-pointer"
              onClick={handleOpen}
            >
              {/* Gift box with ribbon */}
              <div className="relative">
                {/* Box */}
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 165, 0, 0.4)",
                      "0 0 50px rgba(255, 215, 0, 0.9), 0 0 100px rgba(255, 165, 0, 0.6)",
                      "0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 165, 0, 0.4)",
                    ],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-72 h-72 bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-xl relative overflow-hidden shadow-2xl"
                >
                  {/* Animated background gradient */}
                  <motion.div
                    animate={{
                      background: [
                        "linear-gradient(135deg, #fbbf24, #f97316, #ec4899)",
                        "linear-gradient(135deg, #f59e0b, #ea580c, #db2777)",
                        "linear-gradient(135deg, #fbbf24, #f97316, #ec4899)",
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0"
                  />
                  
                  {/* Shine effect */}
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full z-10"
                  />
                  
                  {/* Gift icon with animation */}
                  <motion.div
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center z-20"
                  >
                    <GiftIcon className="w-40 h-40 text-white drop-shadow-2xl" />
                  </motion.div>
                  
                  {/* Ribbon */}
                  <motion.div
                    animate={{
                      rotate: [-45, -40, -45],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-red-600 transform -rotate-45 -translate-y-10 z-30 shadow-lg"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-red-700 rounded-full shadow-inner"
                    />
                  </motion.div>
                  
                  {/* Glowing particles around box */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-3 h-3 bg-yellow-300 rounded-full"
                      style={{
                        top: `${20 + (i * 10)}%`,
                        left: `${10 + (i % 2) * 80}%`,
                      }}
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </motion.div>
                
                {/* Click to open text */}
                <motion.div
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    y: [0, -5, 0],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-white text-2xl font-bold text-center whitespace-nowrap drop-shadow-lg"
                >
                  ✨ คลิกเพื่อเปิดกล่อง! ✨
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl relative overflow-hidden border-4 border-yellow-300"
            >
              {/* Animated gradient background */}
              <motion.div
                animate={{
                  background: [
                    "linear-gradient(135deg, #9333ea, #ec4899, #dc2626)",
                    "linear-gradient(135deg, #7c3aed, #db2777, #b91c1c)",
                    "linear-gradient(135deg, #9333ea, #ec4899, #dc2626)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0"
              />
              
              {/* Background sparkles */}
              <div className="absolute inset-0">
                {typeof window !== 'undefined' && [...Array(30)].map((_, i) => {
                  const width = 400
                  const height = 400
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                      initial={{
                        x: Math.random() * width,
                        y: Math.random() * height,
                        opacity: 0,
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 2, 0],
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 2 + Math.random(),
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  )
                })}
              </div>
              
              {/* Pulsing glow effect */}
              <motion.div
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-radial from-yellow-300/20 via-transparent to-transparent"
              />

              <div className="relative z-10 text-center space-y-4">
                {/* Sparkles Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="flex justify-center"
                >
                  <Sparkles className="w-20 h-20 text-yellow-300 drop-shadow-2xl" />
                </motion.div>

                {/* Main Title */}
                <motion.h2
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg leading-tight px-4"
                >
                  🎉 คุณได้รับของขวัญ<br />จากผู้ดูแล! 🎉
                </motion.h2>

                {/* Gift Details */}
                {showContent && (
                  <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                    className="bg-white/30 backdrop-blur-md rounded-xl p-5 mx-4 border-2 border-yellow-300/50 shadow-xl"
                  >
                    <motion.div
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(255, 215, 0, 0.5)",
                          "0 0 40px rgba(255, 215, 0, 0.8)",
                          "0 0 20px rgba(255, 215, 0, 0.5)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="space-y-2"
                    >
                      <p className="text-white text-lg sm:text-xl font-bold drop-shadow-lg">
                        {getGiftDescription()}
                      </p>
                      {gift.message && (
                        <p className="text-white/95 text-sm sm:text-base font-medium">{gift.message}</p>
                      )}
                    </motion.div>
                  </motion.div>
                )}

                {/* Loading or Action Buttons */}
                {isClaiming ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white space-y-2"
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
                    <p className="text-sm sm:text-base">กำลังรับของขวัญ...</p>
                  </motion.div>
                ) : showContent ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="space-y-4 px-4"
                  >
                    {/* Domain input for hosting gifts */}
                    {gift.gift_type === "hosting" && !hostingCreated && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div>
                          <label className="block text-white text-sm font-semibold mb-2">
                            กรุณากรอกชื่อโดเมน
                          </label>
                          <input
                            type="text"
                            value={domain}
                            onChange={(e) => {
                              setDomain(e.target.value)
                              setDomainError("")
                            }}
                            placeholder="example.com"
                            className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm border-2 border-yellow-300/50 text-white placeholder-white/60 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-yellow-300/50"
                          />
                          {domainError && (
                            <p className="text-red-300 text-sm mt-1">{domainError}</p>
                          )}
                        </div>
                        <Button
                          onClick={handleCreateHosting}
                          disabled={isCreatingHosting || !domain.trim()}
                          className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg shadow-lg hover:scale-105 transition-transform w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCreatingHosting ? "กำลังสร้าง hosting..." : "สร้าง Hosting"}
                        </Button>
                      </motion.div>
                    )}
                    
                    {/* Success message for hosting */}
                    {gift.gift_type === "hosting" && hostingCreated && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-500/20 border-2 border-green-400/50 rounded-lg p-4"
                      >
                        <p className="text-green-200 font-bold text-lg mb-2">✅ สร้าง Hosting สำเร็จ!</p>
                        <p className="text-green-100 text-sm">โดเมน: {domain}</p>
                      </motion.div>
                    )}
                    
                    {/* Countdown timer (only show after hosting is created or for balance gifts) */}
                    {timeRemaining > 0 && (gift.gift_type === "balance" || hostingCreated) && (
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-yellow-300 text-base sm:text-lg font-bold"
                      >
                        ปิดอัตโนมัติใน {timeRemaining} วินาที
                      </motion.div>
                    )}
                    
                    {/* Close button (only show after hosting is created or for balance gifts) */}
                    {(gift.gift_type === "balance" || hostingCreated) && (
                      <Button
                        onClick={handleClose}
                        className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg shadow-lg hover:scale-105 transition-transform w-full sm:w-auto"
                      >
                        ปิด
                      </Button>
                    )}
                  </motion.div>
                ) : null}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Close button (only when not opening) */}
        {!isOpening && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-20"
          >
            <X className="w-6 h-6" />
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

