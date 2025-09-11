"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Edit3, 
  Trash2, 
  Plus,
  Download,
  Upload,
  Settings
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  getCaptionsService, 
  CaptionSegment, 
  CaptionOptions 
} from "@/lib/ai-captions"

interface CaptionsPanelProps {
  onCaptionsUpdate?: (captions: CaptionSegment[]) => void
  currentTime?: number
  timelineElements?: any[]
}

export function CaptionsPanel({ 
  onCaptionsUpdate, 
  currentTime = 0,
  timelineElements = []
}: CaptionsPanelProps) {
  const [captions, setCaptions] = useState<CaptionSegment[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [editingCaption, setEditingCaption] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [selectedCaption, setSelectedCaption] = useState<string | null>(null)

  const captionsService = getCaptionsService()

  useEffect(() => {
    // Load existing captions from timeline elements
    const existingCaptions = timelineElements
      .filter(el => el.type === 'caption')
      .map(el => ({
        id: el.id,
        text: el.text || el.name,
        start: el.start || 0,
        end: el.end || 5,
        confidence: 0.9
      }))
    
    setCaptions(existingCaptions)
  }, [timelineElements])

  const handleStartRecording = async () => {
    try {
      setIsRecording(true)
      // In a real implementation, you'd start audio recording here
      console.log('Recording started...')
    } catch (error) {
      console.error('Failed to start recording:', error)
      setIsRecording(false)
    }
  }

  const handleStopRecording = async () => {
    try {
      setIsRecording(false)
      setIsTranscribing(true)
      
      // Simulate audio blob (in real implementation, you'd get this from recording)
      const audioBlob = new Blob(['fake audio data'], { type: 'audio/wav' })
      
      const newCaptions = await captionsService.transcribeAudio(audioBlob, {
        language: 'en-US',
        enableAutomaticPunctuation: true
      })
      
      setCaptions(prev => [...prev, ...newCaptions])
      onCaptionsUpdate?.(newCaptions)
      
    } catch (error) {
      console.error('Failed to transcribe audio:', error)
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleGenerateFromVideo = async () => {
    try {
      setIsTranscribing(true)
      
      // Get video from session storage
      const videoUrl = sessionStorage.getItem('mediaKey')
      if (!videoUrl) {
        alert('No video found. Please upload a video first.')
        return
      }
      
      // Simulate video blob (in real implementation, you'd get this from the video)
      const videoBlob = new Blob(['fake video data'], { type: 'video/mp4' })
      
      const newCaptions = await captionsService.generateCaptionsFromVideo(videoBlob, {
        language: 'en-US',
        enableAutomaticPunctuation: true
      })
      
      setCaptions(prev => [...prev, ...newCaptions])
      onCaptionsUpdate?.(newCaptions)
      
    } catch (error) {
      console.error('Failed to generate captions:', error)
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleEditCaption = (captionId: string, text: string) => {
    setEditingCaption(captionId)
    setEditText(text)
  }

  const handleSaveEdit = () => {
    if (!editingCaption) return
    
    setCaptions(prev => prev.map(caption => 
      caption.id === editingCaption 
        ? { ...caption, text: editText }
        : caption
    ))
    
    setEditingCaption(null)
    setEditText("")
  }

  const handleDeleteCaption = (captionId: string) => {
    setCaptions(prev => prev.filter(caption => caption.id !== captionId))
  }

  const handleAddCaption = () => {
    const newCaption: CaptionSegment = {
      id: `caption_${Date.now()}`,
      text: "New caption",
      start: currentTime,
      end: currentTime + 3,
      confidence: 1.0
    }
    
    setCaptions(prev => [...prev, newCaption])
    setEditingCaption(newCaption.id)
    setEditText("New caption")
  }

  const handleCaptionClick = (caption: CaptionSegment) => {
    setSelectedCaption(caption.id)
    // Seek to caption start time
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('seekToTime', { detail: caption.start }))
    }
  }

  const handleExportCaptions = () => {
    const srtContent = captions.map((caption, index) => 
      `${index + 1}\n${formatTime(caption.start)} --> ${formatTime(caption.end)}\n${caption.text}\n`
    ).join('\n')
    
    const blob = new Blob([srtContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'captions.srt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Captions</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCaptions}
              className="h-8"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCaption}
              className="h-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isTranscribing}
            className="flex-1"
          >
            {isRecording ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Record Audio
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateFromVideo}
            disabled={isTranscribing}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            {isTranscribing ? 'Generating...' : 'From Video'}
          </Button>
        </div>
      </div>

      {/* Captions List */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {captions.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Mic className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No captions yet</p>
              <p className="text-xs">Record audio or generate from video</p>
            </div>
          ) : (
            captions.map((caption) => (
              <div
                key={caption.id}
                className={cn(
                  "p-3 bg-gray-800 rounded border border-gray-700 cursor-pointer transition-colors",
                  selectedCaption === caption.id && "border-blue-500 bg-blue-900/20",
                  currentTime >= caption.start && currentTime <= caption.end && "border-green-500 bg-green-900/20"
                )}
                onClick={() => handleCaptionClick(caption)}
              >
                {editingCaption === caption.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        className="h-6 text-xs"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCaption(null)}
                        className="h-6 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-white mb-1">{caption.text}</p>
                      <p className="text-xs text-gray-400">
                        {formatTime(caption.start)} - {formatTime(caption.end)}
                        <span className="ml-2">({Math.round(caption.confidence * 100)}%)</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditCaption(caption.id, caption.text)
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCaption(caption.id)
                        }}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
