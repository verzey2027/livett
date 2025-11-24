"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/components/auth-provider"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Shark Coder" width={180} height={45} className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/#plans" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              แพ็กเกจ
            </Link>
            <Link
              href="/#features"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              ฟีเจอร์
            </Link>
            <Link href="/#pricing" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              ราคา
            </Link>
            <Link href="/#contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              ติดต่อเรา
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/dashboard">แดชบอร์ด</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">เข้าสู่ระบบ</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/register">เริ่มต้นใช้งาน</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            <Link
              href="/#plans"
              className="block py-2 text-sm font-medium text-foreground hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              แพ็กเกจ
            </Link>
            <Link
              href="/#features"
              className="block py-2 text-sm font-medium text-foreground hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              ฟีเจอร์
            </Link>
            <Link
              href="/#pricing"
              className="block py-2 text-sm font-medium text-foreground hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              ราคา
            </Link>
            <Link
              href="/#contact"
              className="block py-2 text-sm font-medium text-foreground hover:text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              ติดต่อเรา
            </Link>
            <div className="pt-4 space-y-2">
              {isAuthenticated ? (
                <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                  <Link href="/dashboard">แดชบอร์ด</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href="/login">เข้าสู่ระบบ</Link>
                  </Button>
                  <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                    <Link href="/register">เริ่มต้นใช้งาน</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
