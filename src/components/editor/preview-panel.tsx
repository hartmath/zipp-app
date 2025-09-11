"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeOff,
  Maximize,
  Settings
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PreviewPanelProps {
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  currentTime?: number
  duration?: number
  isPlaying?: boolean
  onPlay?: () => void
  onPause?: () => void
  onSeek?: (time: number) => void
  volume?: number
  muted?: boolean
  onVolumeChange?: (volume: number) => void
  onMuteToggle?: () => void
  timelineElements?: any[]
  selectedElement?: any
}

export function PreviewPanel({
  mediaUrl,
  mediaType = 'image',
  currentTime = 0,
  duration = 60,
  isPlaying = false,
  onPlay,
  onPause,
  onSeek,
  volume = 1,
  muted = false,
  onVolumeChange,
  onMuteToggle,
  timelineElements = [],
  selectedElement
}: PreviewPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const time = (x / width) * duration
    onSeek(Math.max(0, Math.min(time, duration)))
  }

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative bg-black flex items-center justify-center overflow-hidden",
        isFullscreen ? "fixed inset-0 z-50" : "h-full w-full"
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Media Display */}
      <div className="relative w-full h-full flex items-center justify-center">
        {mediaUrl ? (
          mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="max-w-full max-h-full object-contain"
              onTimeUpdate={(e) => {
                if (onSeek) {
                  onSeek(e.currentTarget.currentTime)
                }
              }}
              onLoadedMetadata={(e) => {
                if (onSeek) {
                  onSeek(0)
                }
              }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
          )
        ) : (
          <div className="text-gray-500 text-center">
            <div className="text-4xl mb-4">📹</div>
            <p>No media selected</p>
            <p className="text-sm">Upload or record media to get started</p>
          </div>
        )}
        
        {/* Timeline Elements Overlay */}
        {timelineElements.map((element) => {
          const isVisible = currentTime >= element.start && currentTime <= element.end
          if (!isVisible) return null
          
          return (
            <div
              key={element.id}
              className={cn(
                "absolute pointer-events-auto cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all",
                selectedElement?.id === element.id && "ring-2 ring-blue-500"
              )}
              style={{
                opacity: (element.properties?.opacity || 100) / 100,
                transform: `rotate(${element.properties?.rotation || 0}deg) scale(${(element.properties?.scale || 100) / 100})`,
                color: element.properties?.color || '#ffffff',
                fontSize: `${element.properties?.fontSize || 16}px`,
                left: element.properties?.x || '50%',
                top: element.properties?.y || '50%',
                transformOrigin: 'center'
              }}
              onClick={(e) => {
                e.stopPropagation()
                // This will be handled by the parent component
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('elementSelected', { detail: element }))
                }
              }}
            >
              {element.type === 'text' && (
                <div className="text-center select-none">
                  {element.text || element.name}
                </div>
              )}
              {element.type === 'video' && element.url && (
                <video
                  src={element.url}
                  className="max-w-xs max-h-xs object-contain"
                  muted
                  loop
                />
              )}
              {element.type === 'image' && element.url && (
                <img
                  src={element.url}
                  alt={element.name}
                  className="max-w-xs max-h-xs object-contain"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 pointer-events-none">
          {/* Top Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
            >
              <Maximize className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <Button
              variant="ghost"
              size="lg"
              onClick={isPlaying ? onPause : onPlay}
              className="h-16 w-16 rounded-full bg-black/50 hover:bg-black/70 border-2 border-white/20"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
            {/* Progress Bar */}
            <div 
              className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-4"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-red-500 rounded-full transition-all duration-100"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPause}
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPlaying ? onPause : onPlay}
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPlay}
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-white">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMuteToggle}
                  className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                >
                  {muted ? (
                    <VolumeOff className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Exit */}
      {isFullscreen && (
        <div className="absolute top-4 left-4 pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(false)}
            className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  )
}
