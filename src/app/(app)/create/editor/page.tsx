"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Download, Share, Undo, Redo } from "lucide-react"
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
import { exportTimelineToVideo, ExportOptions } from "@/lib/video-export"

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
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [currentProject, setCurrentProject] = useState<any>(null)
  
  // Undo/Redo functionality
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

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

    // Initialize history with current state
    if (timelineElements.length > 0 && history.length === 0) {
      setHistory([{ timelineElements: [...timelineElements] }])
      setHistoryIndex(0)
    }

    // Listen for timeline updates
    const handleTimelineUpdate = () => {
      loadTimelineElements()
    }
    
    // Listen for element selection
    const handleElementSelected = (event: any) => {
      setSelectedElement(event.detail)
    }
    
    // Add keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' && selectedElement) {
        // Delete selected element
        const updatedElements = timelineElements.filter(el => el.id !== selectedElement.id)
        setTimelineElements(updatedElements)
        sessionStorage.setItem('timelineElements', JSON.stringify(updatedElements))
        setSelectedElement(null)
        window.dispatchEvent(new CustomEvent('timelineUpdated'))
      } else if (event.key === ' ' && !event.repeat) {
        // Spacebar to play/pause
        event.preventDefault()
        if (isPlaying) {
          handlePause()
        } else {
          handlePlay()
        }
      } else if (event.key === 'ArrowLeft' && event.ctrlKey) {
        // Ctrl+Left to seek backward
        event.preventDefault()
        setCurrentTime(Math.max(0, currentTime - 1))
      } else if (event.key === 'ArrowRight' && event.ctrlKey) {
        // Ctrl+Right to seek forward
        event.preventDefault()
        setCurrentTime(Math.min(duration, currentTime + 1))
      } else if (event.key === 'z' && event.ctrlKey && !event.shiftKey) {
        // Ctrl+Z to undo
        event.preventDefault()
        handleUndo()
      } else if ((event.key === 'z' && event.ctrlKey && event.shiftKey) || (event.key === 'y' && event.ctrlKey)) {
        // Ctrl+Shift+Z or Ctrl+Y to redo
        event.preventDefault()
        handleRedo()
      }
    }
    
    window.addEventListener('timelineUpdated', handleTimelineUpdate)
    window.addEventListener('elementSelected', handleElementSelected)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('timelineUpdated', handleTimelineUpdate)
      window.removeEventListener('elementSelected', handleElementSelected)
      window.removeEventListener('keydown', handleKeyDown)
    }
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
      
      // Add to history
      addToHistory(updatedTimelineElements)
      
      // Trigger timeline update
      window.dispatchEvent(new CustomEvent('timelineUpdated'))
    }
  }

  const addToHistory = (newTimelineElements: any[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ timelineElements: [...newTimelineElements] })
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      setHistoryIndex(historyIndex + 1)
    }
    
    setHistory(newHistory)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const state = history[newIndex]
      setTimelineElements([...state.timelineElements])
      setHistoryIndex(newIndex)
      sessionStorage.setItem('timelineElements', JSON.stringify(state.timelineElements))
      window.dispatchEvent(new CustomEvent('timelineUpdated'))
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const state = history[newIndex]
      setTimelineElements([...state.timelineElements])
      setHistoryIndex(newIndex)
      sessionStorage.setItem('timelineElements', JSON.stringify(state.timelineElements))
      window.dispatchEvent(new CustomEvent('timelineUpdated'))
    }
  }

  const handleCaptionsUpdate = (captions: any[]) => {
    // Add captions to timeline
    const updatedElements = [...timelineElements, ...captions]
    setTimelineElements(updatedElements)
    sessionStorage.setItem('timelineElements', JSON.stringify(updatedElements))
    addToHistory(updatedElements)
    window.dispatchEvent(new CustomEvent('timelineUpdated'))
  }

  const handleProjectLoad = (project: any) => {
    setCurrentProject(project)
    setTimelineElements(project.timelineElements || [])
    setDuration(project.duration || 60)
    sessionStorage.setItem('timelineElements', JSON.stringify(project.timelineElements || []))
    window.dispatchEvent(new CustomEvent('timelineUpdated'))
  }

  const handleProjectSave = () => {
    return {
      name: currentProject?.name || 'Untitled Project',
      description: currentProject?.description || '',
      duration: duration,
      fps: 30,
      canvasSize: { width: 1080, height: 1920 },
      timelineElements: timelineElements,
      mediaFiles: [], // TODO: Load from session storage
      settings: {
        quality: 'medium' as const,
        format: 'mp4' as const,
        includeAudio: true
      }
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
      setIsExporting(true)
      setExportProgress(0)
      
      // Save final project first
      await handleSave()
      
      if (timelineElements.length === 0) {
        alert('No elements to export. Please add some media to the timeline.')
        setIsExporting(false)
        return
      }
      
      // Export video
      const exportOptions: ExportOptions = {
        format: 'mp4',
        quality: 'medium',
        fps: 30,
        width: 1080,
        height: 1920 // 9:16 aspect ratio for mobile
      }
      
      const result = await exportTimelineToVideo(
        timelineElements,
        exportOptions,
        (progress) => setExportProgress(progress)
      )
      
      if (result.success && result.blob) {
        // Save exported video to session storage for post page
        const videoUrl = URL.createObjectURL(result.blob)
        sessionStorage.setItem('exportedVideo', videoUrl)
        sessionStorage.setItem('exportedVideoType', 'video/mp4')
        
        // Navigate to post page
        router.push('/create/post')
      } else {
        alert(`Export failed: ${result.error || 'Unknown error'}`)
      }
      
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Error exporting project. Please try again.')
    } finally {
      setIsExporting(false)
      setExportProgress(0)
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
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="h-8"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="h-8"
          >
            <Redo className="h-4 w-4" />
          </Button>
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
            disabled={isExporting}
            className="h-8 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? `Exporting... ${Math.round(exportProgress)}%` : 'Continue to Post'}
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
              onCaptionsUpdate={handleCaptionsUpdate}
              onProjectLoad={handleProjectLoad}
              onProjectSave={handleProjectSave}
              currentTime={currentTime}
              timelineElements={timelineElements}
              currentProject={currentProject}
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
