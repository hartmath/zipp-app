"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Download, Share } from "lucide-react"
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from "@/components/ui/resizable"
import { Timeline } from "@/components/editor/timeline"
import { PreviewPanel } from "@/components/editor/preview-panel"
import { MediaPanel } from "@/components/editor/media-panel"
import { PropertiesPanel } from "@/components/editor/properties-panel"
import { loadBlobUrl } from "@/lib/media-store"

export default function CapCutEditor() {
  const router = useRouter()
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(60)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [selectedElement, setSelectedElement] = useState<any>(null)
  const [timelineElements, setTimelineElements] = useState<any[]>([])

  // Panel sizes
  const [mediaPanelSize, setMediaPanelSize] = useState(20)
  const [previewPanelSize, setPreviewPanelSize] = useState(60)
  const [propertiesPanelSize, setPropertiesPanelSize] = useState(20)

  useEffect(() => {
    // Load media from session storage
    const loadMedia = async () => {
      try {
        const mediaKey = sessionStorage.getItem('mediaKey')
        const mediaKind = sessionStorage.getItem('mediaKind')
        
        if (mediaKey && mediaKind) {
          const result = await loadBlobUrl(mediaKey)
          if (result?.url) {
            setMediaUrl(result.url)
            setMediaType(mediaKind as 'image' | 'video')
          }
        }
      } catch (error) {
        console.error('Error loading media:', error)
      }
    }

    // Load timeline elements
    const loadTimelineElements = () => {
      try {
        const elements = sessionStorage.getItem('timelineElements')
        if (elements) {
          setTimelineElements(JSON.parse(elements))
        }
      } catch (error) {
        console.error('Error loading timeline elements:', error)
      }
    }

    loadMedia()
    loadTimelineElements()

    // Listen for timeline updates
    const handleTimelineUpdate = () => {
      loadTimelineElements()
    }
    
    window.addEventListener('timelineUpdated', handleTimelineUpdate)
    return () => window.removeEventListener('timelineUpdated', handleTimelineUpdate)
  }, [])

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleSeek = (time: number) => {
    setCurrentTime(time)
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
  }

  const handleMuteToggle = () => {
    setMuted(!muted)
  }

  const handleMediaSelect = (media: any) => {
    console.log('Media selected:', media)
    // Add media to timeline
    const newElement = {
      id: Math.random().toString(36).slice(2),
      type: media.type,
      name: media.name,
      url: media.url,
      properties: {
        opacity: 100,
        volume: 100,
        rotation: 0,
        scale: 100,
        color: '#ffffff',
        fontSize: 16
      }
    }
    
    setSelectedElement(newElement)
    
    // Add to timeline
    const timelineElement = {
      ...newElement,
      start: currentTime,
      end: currentTime + (media.type === 'video' ? 10 : 5)
    }
    
    // Save to session storage
    const existingElements = JSON.parse(sessionStorage.getItem('timelineElements') || '[]')
    existingElements.push(timelineElement)
    sessionStorage.setItem('timelineElements', JSON.stringify(existingElements))
    
    // Trigger timeline update
    window.dispatchEvent(new CustomEvent('timelineUpdated'))
  }

  const handleTextAdd = (text: string) => {
    console.log('Text added:', text)
    // Add text element to timeline
    const newElement = {
      id: Math.random().toString(36).slice(2),
      type: 'text',
      name: text,
      text: text,
      properties: {
        opacity: 100,
        volume: 100,
        rotation: 0,
        scale: 100,
        color: '#ffffff',
        fontSize: 16
      }
    }
    
    setSelectedElement(newElement)
    
    // Add to timeline
    const timelineElement = {
      ...newElement,
      start: currentTime,
      end: currentTime + 5
    }
    
    // Save to session storage
    const existingElements = JSON.parse(sessionStorage.getItem('timelineElements') || '[]')
    existingElements.push(timelineElement)
    sessionStorage.setItem('timelineElements', JSON.stringify(existingElements))
    
    // Trigger timeline update
    window.dispatchEvent(new CustomEvent('timelineUpdated'))
  }

  const handleSoundSelect = (sound: any) => {
    console.log('Sound selected:', sound)
    // Add audio to timeline
    const newElement = {
      id: Math.random().toString(36).slice(2),
      type: 'audio',
      name: sound.name,
      url: sound.url,
      properties: {
        opacity: 100,
        volume: 100,
        rotation: 0,
        scale: 100,
        color: '#ffffff',
        fontSize: 16
      }
    }
    
    setSelectedElement(newElement)
    
    // Add to timeline
    const timelineElement = {
      ...newElement,
      start: currentTime,
      end: currentTime + 30
    }
    
    // Save to session storage
    const existingElements = JSON.parse(sessionStorage.getItem('timelineElements') || '[]')
    existingElements.push(timelineElement)
    sessionStorage.setItem('timelineElements', JSON.stringify(existingElements))
    
    // Trigger timeline update
    window.dispatchEvent(new CustomEvent('timelineUpdated'))
  }

  const handlePropertyChange = (property: string, value: any) => {
    console.log('Property changed:', property, value)
    // Update selected element properties
    if (selectedElement) {
      const updatedElement = {
        ...selectedElement,
        properties: {
          ...selectedElement.properties,
          [property]: value
        }
      }
      
      setSelectedElement(updatedElement)
      
      // Update in timeline elements
      const updatedTimelineElements = timelineElements.map(el => 
        el.id === selectedElement.id ? updatedElement : el
      )
      setTimelineElements(updatedTimelineElements)
      sessionStorage.setItem('timelineElements', JSON.stringify(updatedTimelineElements))
      
      // Trigger timeline update
      window.dispatchEvent(new CustomEvent('timelineUpdated'))
    }
  }

  const handleSave = async () => {
    try {
      // Save current project state to session storage
      const projectData = {
        mediaUrl,
        mediaType,
        currentTime,
        duration,
        volume,
        muted,
        selectedElement,
        timelineElements,
        timestamp: Date.now()
      }
      
      sessionStorage.setItem('editorProject', JSON.stringify(projectData))
      console.log('Project saved successfully')
      
      // Show success feedback
      alert('Project saved successfully!')
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Error saving project. Please try again.')
    }
  }

  const handleExport = async () => {
    try {
      // Save final project and navigate to post page
      await handleSave()
      
      // Navigate to post page for publishing
      router.push('/create/post')
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Error exporting project. Please try again.')
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-900">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Zipplign</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="h-8"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-8 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Continue to Post
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <div className="h-full w-full flex gap-1">
          {/* Media Panel */}
          <div 
            className="min-w-0"
            style={{ width: `${mediaPanelSize}%` }}
          >
            <MediaPanel
              onMediaSelect={handleMediaSelect}
              onTextAdd={handleTextAdd}
              onSoundSelect={handleSoundSelect}
            />
          </div>

          <div className="w-1 bg-gray-700" />

          {/* Preview Panel */}
          <div 
            className="min-w-0"
            style={{ width: `${previewPanelSize}%` }}
          >
            <PreviewPanel
              mediaUrl={mediaUrl || undefined}
              mediaType={mediaType}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              volume={volume}
              muted={muted}
              onVolumeChange={handleVolumeChange}
              onMuteToggle={handleMuteToggle}
              timelineElements={timelineElements}
              selectedElement={selectedElement}
            />
          </div>

          <div className="w-1 bg-gray-700" />

          {/* Properties Panel */}
          <div 
            className="min-w-0"
            style={{ width: `${propertiesPanelSize}%` }}
          >
            <PropertiesPanel
              selectedElement={selectedElement}
              onPropertyChange={handlePropertyChange}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="h-64 border-t border-gray-700">
        <Timeline
          duration={duration}
          currentTime={currentTime}
          onSeek={handleSeek}
          onPlay={handlePlay}
          onPause={handlePause}
          isPlaying={isPlaying}
        />
      </div>
    </div>
  )
}
