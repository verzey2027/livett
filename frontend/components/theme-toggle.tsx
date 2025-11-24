"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import styled from "styled-components"
import { useAuth } from "./auth-provider"
import { api } from "@/lib/api"

const ToggleContainer = styled.div`
  position: relative;
  width: 60px;
  height: 30px;
  cursor: pointer;
`

const ToggleTrack = styled.div<{ $isDark: boolean }>`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 15px;
  background: ${props => props.$isDark 
    ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
    : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
  };
  transition: all 0.3s ease;
  box-shadow: ${props => props.$isDark
    ? 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
    : 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'
  };
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 15px;
    background: ${props => props.$isDark
      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 50%, rgba(236, 72, 153, 0.3) 100%)'
      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(236, 72, 153, 0.2) 100%)'
    };
    opacity: ${props => props.$isDark ? 0.6 : 0.4};
    animation: shimmer 3s ease-in-out infinite;
  }
  
  @keyframes shimmer {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
`

const ToggleThumb = styled.div<{ $isDark: boolean }>`
  position: absolute;
  top: 3px;
  left: ${props => props.$isDark ? '33px' : '3px'};
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.$isDark
    ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)'
    : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)'
  };
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.$isDark
    ? '0 2px 8px rgba(59, 130, 246, 0.4), 0 0 0 2px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    : '0 2px 8px rgba(251, 191, 36, 0.4), 0 0 0 2px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
  };
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.$isDark
      ? 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)'
      : 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%)'
    };
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 0.6;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.2);
    }
  }
`

const IconContainer = styled.div<{ $isDark: boolean }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.3s ease;
  opacity: ${props => props.$isDark ? 1 : 0};
  pointer-events: none;
  
  ${props => props.$isDark ? 'left: 8px;' : 'right: 8px;'}
  
  svg {
    width: 14px;
    height: 14px;
    color: ${props => props.$isDark ? '#fbbf24' : '#1e293b'};
  }
`

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { user, updateUser } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Sync theme with user preference from database on mount
    if (user?.theme_preference && user.theme_preference !== 'system' && theme !== user.theme_preference) {
      setTheme(user.theme_preference)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.theme_preference]) // Only run when user preference changes, not on every theme change

  if (!mounted) {
    return (
      <ToggleContainer>
        <ToggleTrack $isDark={false} />
        <ToggleThumb $isDark={false} />
      </ToggleContainer>
    )
  }

  const isDark = resolvedTheme === 'dark'

  const handleToggle = async () => {
    if (isUpdating) return

    const newTheme = isDark ? 'light' : 'dark'
    setIsUpdating(true)

    try {
      // Update theme in database (if user is logged in)
      if (user) {
        await api.auth.updateTheme(newTheme as "light" | "dark" | "system")
        // Update user in context
        updateUser({
          ...user,
          theme_preference: newTheme as "light" | "dark" | "system",
        })
      }

      // Update local theme and localStorage (always, even if not logged in)
      setTheme(newTheme)
      localStorage.setItem('theme', newTheme)
    } catch (error) {
      console.error('Failed to update theme preference:', error)
      // Still update local theme even if API call fails
      setTheme(newTheme)
      localStorage.setItem('theme', newTheme)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <ToggleContainer onClick={handleToggle} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <ToggleTrack $isDark={isDark} />
      <ToggleThumb $isDark={isDark} />
      <IconContainer $isDark={isDark}>
        {isDark ? (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </IconContainer>
    </ToggleContainer>
  )
}

