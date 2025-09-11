"use client"

import { useState, useRef, useCallback, useEffect } from "react"
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
  const [tracks, setTracks] = useState<TimelineTrack[]>([])
  const [timelineElements, setTimelineElements] = useState<any[]>([])

  // Load timeline elements from session storage
  useEffect(() => {
    const loadTimelineElements = () => {
      try {
        const elements = sessionStorage.getItem('timelineElements')
        if (elements) {
          const parsedElements = JSON.parse(elements)
          setTimelineElements(parsedElements)
          
          // Convert elements to tracks
          const videoElements = parsedElements.filter((el: any) => el.type === 'video')
          const audioElements = parsedElements.filter((el: any) => el.type === 'audio')
          const textElements = parsedElements.filter((el: any) => el.type === 'text')
          
          const newTracks: TimelineTrack[] = []
          
          if (videoElements.length > 0) {
            newTracks.push({
              id: 'video-1',
              type: 'video',
              name: 'Video Track',
              elements: videoElements.map((el: any) => ({
                id: el.id,
                start: el.start || 0,
                end: el.end || 10,
                name: el.name || 'Video Clip',
                color: '#3b82f6'
              }))
            })
          }
          
          if (audioElements.length > 0) {
            newTracks.push({
              id: 'audio-1',
              type: 'audio',
              name: 'Audio Track',
              elements: audioElements.map((el: any) => ({
                id: el.id,
                start: el.start || 0,
                end: el.end || 30,
                name: el.name || 'Audio Clip',
                color: '#10b981'
              }))
            })
          }
          
          if (textElements.length > 0) {
            newTracks.push({
              id: 'text-1',
              type: 'text',
              name: 'Text Track',
              elements: textElements.map((el: any) => ({
                id: el.id,
                start: el.start || 0,
                end: el.end || 5,
                name: el.name || 'Text',
                color: '#f59e0b'
              }))
            })
          }
          
          setTracks(newTracks)
        }
      } catch (error) {
        console.error('Error loading timeline elements:', error)
      }
    }
    loadTimelineElements()
  }, [])

  // Add new element to timeline
  const addElementToTimeline = (element: any) => {
    const newElement = {
      id: element.id,
      type: element.type,
      name: element.name,
      start: currentTime,
      end: currentTime + (element.type === 'video' ? 10 : element.type === 'audio' ? 30 : 5),
      properties: element.properties || {}
    }
    
    const updatedElements = [...timelineElements, newElement]
    setTimelineElements(updatedElements)
    sessionStorage.setItem('timelineElements', JSON.stringify(updatedElements))
    
    // Refresh tracks
    window.dispatchEvent(new CustomEvent('timelineUpdated'))
  }

  // Listen for new elements being added
  useEffect(() => {
    const handleTimelineUpdate = () => {
      const elements = sessionStorage.getItem('timelineElements')
      if (elements) {
        const parsedElements = JSON.parse(elements)
        setTimelineElements(parsedElements)
      }
    }
    
    window.addEventListener('timelineUpdated', handleTimelineUpdate)
    return () => window.removeEventListener('timelineUpdated', handleTimelineUpdate)
  }, [])

  const handleElementDelete = useCallback((elementId: string) => {
    const updatedElements = timelineElements.filter(el => el.id !== elementId)
    setTimelineElements(updatedElements)
    sessionStorage.setItem('timelineElements', JSON.stringify(updatedElements))
    window.dispatchEvent(new CustomEvent('timelineUpdated'))
  }, [timelineElements])

  const [zoom, setZoom] = useState(1)
  const [snapping, setSnapping] = useState(true)
  const [draggedElement, setDraggedElement] = useState<string | null>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  
  // Calculate pixels per second based on zoom
  const pixelsPerSecond = 20 * zoom

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current || !onSeek) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x / (duration * pixelsPerSecond)) * duration
    onSeek(Math.max(0, Math.min(time, duration)))
  }, [duration, onSeek, pixelsPerSecond])

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
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(e) => {
                e.preventDefault()
                const elementId = e.dataTransfer.getData('text/plain')
                if (elementId && timelineRef.current) {
                  const rect = timelineRef.current.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const newStart = (x / rect.width) * duration
                  
                  // Update element position
                  const updatedElements = timelineElements.map(el => {
                    if (el.id === elementId) {
                      const duration = el.end - el.start
                      return {
                        ...el,
                        start: Math.max(0, newStart),
                        end: Math.max(0, newStart + duration)
                      }
                    }
                    return el
                  })
                  
                  setTimelineElements(updatedElements)
                  sessionStorage.setItem('timelineElements', JSON.stringify(updatedElements))
                  window.dispatchEvent(new CustomEvent('timelineUpdated'))
                }
              }}
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
                      className="absolute top-1 bottom-1 rounded border-2 border-white/20 cursor-move hover:border-white/40 transition-colors group"
                      style={{
                        left: `${(element.start / duration) * 100}%`,
                        width: `${((element.end - element.start) / duration) * 100}%`,
                        backgroundColor: element.color,
                      }}
                      draggable
                      onDragStart={(e) => {
                        setDraggedElement(element.id)
                        e.dataTransfer.setData('text/plain', element.id)
                      }}
                      onDragEnd={() => {
                        setDraggedElement(null)
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        // Select element
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('elementSelected', { detail: element }))
                        }
                      }}
                    >
                      <div className="p-1 text-xs text-white truncate relative">
                        {element.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleElementDelete(element.id)
                          }}
                        >
                          <Trash2 className="h-2 w-2" />
                        </Button>
                      </div>
                      
                      {/* Resize handles */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity bg-white/50"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          const startX = e.clientX
                          const startTime = element.start
                          
                          const handleMouseMove = (e: MouseEvent) => {
                            const deltaX = e.clientX - startX
                            const deltaTime = (deltaX / (timelineRef.current?.getBoundingClientRect().width || 1)) * duration
                            const newStart = Math.max(0, Math.min(startTime + deltaTime, element.end - 0.1))
                            
                            const updatedElements = timelineElements.map(el => {
                              if (el.id === element.id) {
                                return { ...el, start: newStart }
                              }
                              return el
                            })
                            setTimelineElements(updatedElements)
                          }
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove)
                            document.removeEventListener('mouseup', handleMouseUp)
                            sessionStorage.setItem('timelineElements', JSON.stringify(timelineElements))
                            window.dispatchEvent(new CustomEvent('timelineUpdated'))
                          }
                          
                          document.addEventListener('mousemove', handleMouseMove)
                          document.addEventListener('mouseup', handleMouseUp)
                        }}
                      />
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity bg-white/50"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          const startX = e.clientX
                          const startTime = element.end
                          
                          const handleMouseMove = (e: MouseEvent) => {
                            const deltaX = e.clientX - startX
                            const deltaTime = (deltaX / (timelineRef.current?.getBoundingClientRect().width || 1)) * duration
                            const newEnd = Math.max(element.start + 0.1, Math.min(startTime + deltaTime, duration))
                            
                            const updatedElements = timelineElements.map(el => {
                              if (el.id === element.id) {
                                return { ...el, end: newEnd }
                              }
                              return el
                            })
                            setTimelineElements(updatedElements)
                          }
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove)
                            document.removeEventListener('mouseup', handleMouseUp)
                            sessionStorage.setItem('timelineElements', JSON.stringify(timelineElements))
                            window.dispatchEvent(new CustomEvent('timelineUpdated'))
                          }
                          
                          document.addEventListener('mousemove', handleMouseMove)
                          document.addEventListener('mouseup', handleMouseUp)
                        }}
                      />
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