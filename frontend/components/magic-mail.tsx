"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, Mail, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MagicMail } from "@/lib/types"

interface MagicMailProps {
  mail: MagicMail
  onClose: () => void
}

export function MagicMail({ mail, onClose }: MagicMailProps) {
  const [isOpened, setIsOpened] = useState(false)

  const handleOpen = () => {
    setIsOpened(true)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative w-full max-w-lg"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 z-30 bg-white text-primary rounded-full p-2 shadow-lg border border-primary/30"
            aria-label="ปิดจดหมาย"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Envelope state */}
          {!isOpened ? (
            <div className="relative flex flex-col items-center gap-6">
              <motion.div
                animate={{
                  y: [-5, 5, -5],
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="relative w-[320px] h-[220px]"
              >
                <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl border-4 border-red-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-100 via-white to-red-50 opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Mail className="h-16 w-16 text-red-500 animate-pulse" />
                  </div>
                </div>
                <div className="absolute inset-x-4 top-3 h-10 bg-red-500 rounded-lg shadow-inner" />
                <div className="absolute inset-x-4 bottom-3 h-12 bg-red-500/80 rounded-lg blur" />
                <motion.div
                  animate={{ rotate: [-1, 1, -1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 border-4 border-dashed border-red-400 rounded-2xl"
                />
                <motion.div
                  animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -left-6 -top-6 w-10 h-10 bg-red-400 rounded-full blur-2xl"
                />
                <motion.div
                  animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute -right-8 top-1/2 w-12 h-12 bg-pink-400 rounded-full blur-2xl"
                />
              </motion.div>
              <Button
                onClick={handleOpen}
                className="bg-red-500 hover:bg-red-600 text-white text-lg px-8 py-6 rounded-full shadow-2xl"
              >
                เปิดจดหมายจากแอดมิน
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative overflow-hidden rounded-3xl border-4 border-red-300 bg-gradient-to-br from-white via-red-50 to-white shadow-[0_20px_80px_rgba(220,38,38,0.35)]"
            >
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(30)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-red-400 opacity-60"
                    initial={{ y: Math.random() * 200, x: Math.random() * 400 }}
                    animate={{ y: "+=20" }}
                    transition={{
                      duration: 2 + Math.random(),
                      repeat: Infinity,
                      repeatType: "mirror",
                    }}
                  >
                    ✉️
                  </motion.span>
                ))}
              </div>
              <div className="relative z-10 p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ rotate: -20, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="p-3 rounded-full bg-red-500/10 text-red-500"
                  >
                    <Sparkles className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <p className="uppercase text-xs text-red-500 tracking-[0.3em]">Magic Mail</p>
                    <h2 className="text-2xl font-bold text-slate-900">{mail.title}</h2>
                  </div>
                </div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-base sm:text-lg leading-relaxed text-slate-700 whitespace-pre-line"
                >
                  {mail.message}
                </motion.p>
                {mail.include_discord_button && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex"
                  >
                    <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-base py-6">
                      <a
                        href={mail.cta_url || "https://discord.gg/2C4N5GpqH8"}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {mail.cta_label || "ติดต่อแอดมินผ่าน Discord"}
                      </a>
                    </Button>
                  </motion.div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-red-100">
                  <p className="text-xs uppercase tracking-widest text-red-400">
                    ส่งเมื่อ {new Date(mail.created_at).toLocaleString("th-TH")}
                  </p>
                  <Button variant="outline" onClick={onClose}>
                    ปิดจดหมาย
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

