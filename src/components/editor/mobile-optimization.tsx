"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Menu, 
  X, 
  Maximize2, 
  Minimize2,
  Smartphone,
  Monitor
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileOptimizationProps {
  children: React.ReactNode
  className?: string
}

export function MobileOptimization({ children, className }: MobileOptimizationProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      
      // Check orientation
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      setOrientation(newOrientation)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu)
  }

  if (!isMobile) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={cn(
      "h-screen w-screen bg-black text-white overflow-hidden",
      isFullscreen && "fixed inset-0 z-50",
      className
    )}>
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="h-8 w-8 p-0"
          >
            {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <span className="text-sm font-medium">Zipplign</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8 w-8 p-0"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex h-full">
        {/* Mobile Sidebar */}
        {showMobileMenu && (
          <div className="w-64 bg-gray-900 border-r border-gray-700 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-gray-400 mb-2">Device Info</div>
              <div className="text-xs text-white mb-4">
                <div>Screen: {window.innerWidth} × {window.innerHeight}</div>
                <div>Orientation: {orientation}</div>
                <div>Mode: {isFullscreen ? 'Fullscreen' : 'Normal'}</div>
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                >
                  <Smartphone className="h-3 w-3 mr-2" />
                  Mobile View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                >
                  <Monitor className="h-3 w-3 mr-2" />
                  Desktop View
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={cn(
          "flex-1 overflow-hidden",
          showMobileMenu && "hidden md:block"
        )}>
          {children}
        </div>
      </div>
    </div>
  )
}

// Mobile-specific components
export function MobileTimeline() {
  return (
    <div className="h-32 bg-gray-800 border-t border-gray-700 p-2">
      <div className="text-xs text-gray-400 mb-2">Timeline (Mobile)</div>
      <div className="h-20 bg-gray-700 rounded flex items-center justify-center">
        <span className="text-xs text-gray-500">Timeline controls</span>
      </div>
    </div>
  )
}

export function MobilePreview() {
  return (
    <div className="flex-1 bg-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="text-sm text-gray-400 mb-2">Preview (Mobile)</div>
        <div className="w-32 h-48 bg-gray-700 rounded flex items-center justify-center">
          <span className="text-xs text-gray-500">9:16</span>
        </div>
      </div>
    </div>
  )
}

export function MobileControls() {
  return (
    <div className="h-16 bg-gray-900 border-t border-gray-700 flex items-center justify-center gap-4">
      <Button size="sm" className="h-8 w-8 p-0">
        <span className="text-xs">▶</span>
      </Button>
      <Button size="sm" className="h-8 w-8 p-0">
        <span className="text-xs">⏸</span>
      </Button>
      <Button size="sm" className="h-8 w-8 p-0">
        <span className="text-xs">⏹</span>
      </Button>
    </div>
  )
}

// Responsive utility hooks
export function useMobileOptimization() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setIsMobile(width <= 768)
      setIsTablet(width > 768 && width <= 1024)
      setIsDesktop(width > 1024)
      
      setOrientation(height > width ? 'portrait' : 'landscape')
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice)

    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])

  return {
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }
}

// Touch-friendly components
export function TouchButton({ 
  children, 
  onClick, 
  className,
  ...props 
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  [key: string]: any
}) {
  return (
    <Button
      className={cn(
        "min-h-[44px] min-w-[44px] touch-manipulation",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  )
}

export function TouchSlider({ 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  className 
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={cn(
        "w-full h-12 touch-manipulation",
        className
      )}
    />
  )
}
