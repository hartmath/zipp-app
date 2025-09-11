"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  Trash2, 
  Copy,
  Volume2,
  VolumeOff,
  ZoomIn,
  ZoomOut,
  Magnet
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineTrack {
  id: string
  type: 'video' | 'audio' | 'text'
  name: string
  elements: TimelineElement[]
  muted?: boolean
  locked?: boolean
}

interface TimelineElement {
  id: string
  start: number
  end: number
  name: string
  color: string
}

interface TimelineProps {
  duration?: number
  currentTime?: number
  onSeek?: (time: number) => void
  onPlay?: () => void
  onPause?: () => void
  isPlaying?: boolean
}

export function Timeline({ 
  duration = 60, 
  currentTime = 0, 
  onSeek, 
  onPlay, 
  onPause, 
  isPlaying = false 
}: TimelineProps) {
  const [tracks] = useState<TimelineTrack[]>([
    {
      id: 'video-1',
      type: 'video',
      name: 'Video Track 1',
      elements: [
        { id: 'video-1', start: 0, end: 10, name: 'Video Clip 1', color: '#3b82f6' },
        { id: 'video-2', start: 15, end: 25, name: 'Video Clip 2', color: '#3b82f6' }
      ]
    },
    {
      id: 'audio-1',
      type: 'audio',
      name: 'Audio Track 1',
      elements: [
        { id: 'audio-1', start: 0, end: 30, name: 'Background Music', color: '#10b981' }
      ]
    },
    {
      id: 'text-1',
      type: 'text',
      name: 'Text Track 1',
      elements: [
        { id: 'text-1', start: 5, end: 15, name: 'Title Text', color: '#f59e0b' }
      ]
    }
  ])

  const [zoom, setZoom] = useState(1)
  const [snapping, setSnapping] = useState(true)
  const timelineRef = useRef<HTMLDivElement>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current || !onSeek) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const time = (x / width) * duration
    onSeek(Math.max(0, Math.min(time, duration)))
  }, [duration, onSeek])

  const pixelsPerSecond = 50 * zoom

  return (
    <div className="h-full bg-gray-900 border-t border-gray-700 flex flex-col">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={isPlaying ? onPause : onPlay}
            className="h-8 w-8 p-0"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSnapping(!snapping)}
            className={cn("h-8 w-8 p-0", snapping && "bg-blue-600")}
          >
            <Magnet className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 flex">
        {/* Track Labels */}
        <div className="w-48 bg-gray-800 border-r border-gray-700">
          <div className="p-2 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Scissors className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <ScrollArea className="h-full">
            {tracks.map((track) => (
              <div key={track.id} className="p-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {/* Toggle mute */}}
                  >
                    {track.muted ? (
                      <VolumeOff className="h-3 w-3" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                  </Button>
                  <span className="text-sm text-gray-300 truncate">
                    {track.name}
                  </span>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Timeline Ruler and Tracks */}
        <div className="flex-1 flex flex-col">
          {/* Time Ruler */}
          <div className="h-8 bg-gray-800 border-b border-gray-700 relative">
            <div className="absolute inset-0 flex items-center px-2">
              {Array.from({ length: Math.ceil(duration / 5) }, (_, i) => (
                <div
                  key={i}
                  className="absolute text-xs text-gray-400"
                  style={{ left: `${(i * 5 * pixelsPerSecond) + 8}px` }}
                >
                  {formatTime(i * 5)}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Tracks */}
          <ScrollArea className="flex-1">
            <div
              ref={timelineRef}
              className="relative h-full cursor-pointer"
              onClick={handleTimelineClick}
              style={{ minWidth: `${duration * pixelsPerSecond}px` }}
            >
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
              </div>

              {/* Track Elements */}
              {tracks.map((track, trackIndex) => (
                <div
                  key={track.id}
                  className="relative h-12 border-b border-gray-700"
                  style={{ top: `${trackIndex * 48}px` }}
                >
                  {track.elements.map((element) => (
                    <div
                      key={element.id}
                      className="absolute top-1 bottom-1 rounded border-2 border-white/20 cursor-pointer hover:border-white/40 transition-colors"
                      style={{
                        left: `${(element.start / duration) * 100}%`,
                        width: `${((element.end - element.start) / duration) * 100}%`,
                        backgroundColor: element.color,
                      }}
                    >
                      <div className="p-1 text-xs text-white truncate">
                        {element.name}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}