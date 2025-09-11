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

    loadMedia()
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
    // Handle media selection
  }

  const handleTextAdd = (text: string) => {
    console.log('Text added:', text)
    // Handle text addition
  }

  const handleSoundSelect = (sound: any) => {
    console.log('Sound selected:', sound)
    // Handle sound selection
  }

  const handlePropertyChange = (property: string, value: any) => {
    console.log('Property changed:', property, value)
    // Handle property changes
  }

  const handleSave = () => {
    console.log('Saving project...')
    // Handle save
  }

  const handleExport = () => {
    console.log('Exporting...')
    // Handle export
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
          <h1 className="text-lg font-semibold">CapCut Editor</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="h-8"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-8"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
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
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full gap-1"
        >
          {/* Media Panel */}
          <ResizablePanel
            defaultSize={mediaPanelSize}
            minSize={15}
            maxSize={40}
            onResize={setMediaPanelSize}
            className="min-w-0"
          >
            <MediaPanel
              onMediaSelect={handleMediaSelect}
              onTextAdd={handleTextAdd}
              onSoundSelect={handleSoundSelect}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Preview Panel */}
          <ResizablePanel
            defaultSize={previewPanelSize}
            minSize={40}
            onResize={setPreviewPanelSize}
            className="min-w-0"
          >
            <PreviewPanel
              mediaUrl={mediaUrl}
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
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Properties Panel */}
          <ResizablePanel
            defaultSize={propertiesPanelSize}
            minSize={15}
            maxSize={40}
            onResize={setPropertiesPanelSize}
            className="min-w-0"
          >
            <PropertiesPanel
              selectedElement={selectedElement}
              onPropertyChange={handlePropertyChange}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
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
