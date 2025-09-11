"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Video, 
  Music, 
  Type, 
  Smile, 
  Sparkles, 
  Filter,
  Sliders,
  Settings,
  Upload,
  FolderOpen,
  Wand2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CaptionsPanel } from "./captions-panel"
import { BackgroundRemovalPanel } from "./background-removal-panel"
import { ProjectManagementPanel } from "./project-management-panel"

type Tab = 'media' | 'sounds' | 'text' | 'stickers' | 'effects' | 'filters' | 'adjustment' | 'settings' | 'captions' | 'background' | 'projects'

interface MediaPanelProps {
  onMediaSelect?: (media: any) => void
  onTextAdd?: (text: string) => void
  onSoundSelect?: (sound: any) => void
  onCaptionsUpdate?: (captions: any[]) => void
  onProjectLoad?: (project: any) => void
  onProjectSave?: () => any
  currentTime?: number
  timelineElements?: any[]
  currentProject?: any
}

export function MediaPanel({ 
  onMediaSelect, 
  onTextAdd, 
  onSoundSelect, 
  onCaptionsUpdate,
  onProjectLoad,
  onProjectSave,
  currentTime,
  timelineElements,
  currentProject
}: MediaPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('media')

  const tabs = [
    { id: 'media' as Tab, label: 'Media', icon: Video },
    { id: 'sounds' as Tab, label: 'Sounds', icon: Music },
    { id: 'text' as Tab, label: 'Text', icon: Type },
    { id: 'stickers' as Tab, label: 'Stickers', icon: Smile },
    { id: 'effects' as Tab, label: 'Effects', icon: Sparkles },
    { id: 'filters' as Tab, label: 'Filters', icon: Filter },
    { id: 'adjustment' as Tab, label: 'Adjust', icon: Sliders },
    { id: 'captions' as Tab, label: 'Captions', icon: Type },
    { id: 'background' as Tab, label: 'AI Tools', icon: Wand2 },
    { id: 'projects' as Tab, label: 'Projects', icon: FolderOpen },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'media':
        return <MediaView onMediaSelect={onMediaSelect} />
      case 'sounds':
        return <SoundsView onSoundSelect={onSoundSelect} />
      case 'text':
        return <TextView onTextAdd={onTextAdd} />
      case 'stickers':
        return <StickersView />
      case 'effects':
        return <EffectsView />
      case 'filters':
        return <FiltersView />
      case 'adjustment':
        return <AdjustmentView />
      case 'captions':
        return (
          <CaptionsPanel 
            onCaptionsUpdate={onCaptionsUpdate}
            currentTime={currentTime}
            timelineElements={timelineElements}
          />
        )
      case 'background':
        return (
          <BackgroundRemovalPanel 
            onImageProcessed={(blob) => {
              // Add processed image to timeline
              const newElement = {
                id: Math.random().toString(36).slice(2),
                type: 'image',
                name: 'AI Processed Image',
                url: URL.createObjectURL(blob),
                start: 0,
                end: 5,
                properties: {
                  opacity: 100,
                  scale: 100,
                  rotation: 0
                }
              }
              
              const existingElements = JSON.parse(sessionStorage.getItem('timelineElements') || '[]')
              existingElements.push(newElement)
              sessionStorage.setItem('timelineElements', JSON.stringify(existingElements))
              window.dispatchEvent(new CustomEvent('timelineUpdated'))
            }}
          />
        )
      case 'projects':
        return (
          <ProjectManagementPanel 
            onProjectLoad={onProjectLoad}
            onProjectSave={onProjectSave}
            currentProject={currentProject}
          />
        )
      case 'settings':
        return <SettingsView />
      default:
        return <MediaView onMediaSelect={onMediaSelect} />
    }
  }

  return (
    <div className="h-full flex bg-gray-900 border-r border-gray-700">
      {/* Tab Bar */}
      <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "h-12 w-full flex flex-col items-center gap-1 rounded-none border-0",
                activeTab === tab.id 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs">{tab.label}</span>
            </Button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  )
}

function MediaView({ onMediaSelect }: { onMediaSelect?: (media: any) => void }) {
  const [mediaFiles, setMediaFiles] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  // Load existing media from session storage
  useEffect(() => {
    const loadExistingMedia = () => {
      try {
        const existingMedia = sessionStorage.getItem('userMedia')
        if (existingMedia) {
          setMediaFiles(JSON.parse(existingMedia))
        }
      } catch (error) {
        console.error('Error loading existing media:', error)
      }
    }
    loadExistingMedia()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const newMediaFiles = []
      
      for (const file of files) {
        const url = URL.createObjectURL(file)
        const mediaItem = {
          id: Math.random().toString(36).slice(2),
          name: file.name,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          url: url,
          file: file,
          size: file.size,
          lastModified: file.lastModified
        }
        newMediaFiles.push(mediaItem)
      }

      const updatedFiles = [...mediaFiles, ...newMediaFiles]
      setMediaFiles(updatedFiles)
      sessionStorage.setItem('userMedia', JSON.stringify(updatedFiles))
      
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Error uploading files. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="video/*,image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="media-upload"
            disabled={uploading}
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => document.getElementById('media-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="grid grid-cols-2 gap-2">
          {mediaFiles.length === 0 ? (
            <div className="col-span-2 text-center text-gray-400 py-8">
              <Upload className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No media files yet</p>
              <p className="text-xs">Upload videos or images to get started</p>
            </div>
          ) : (
            mediaFiles.map((file) => (
              <div
                key={file.id}
                className="aspect-video bg-gray-800 rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors overflow-hidden"
                onClick={() => onMediaSelect?.(file)}
              >
                {file.type === 'video' ? (
                  <video
                    src={file.url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                  <p className="text-xs text-white truncate">{file.name}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function SoundsView({ onSoundSelect }: { onSoundSelect?: (sound: any) => void }) {
  const [sounds, setSounds] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  // Load existing sounds from session storage
  useEffect(() => {
    const loadExistingSounds = () => {
      try {
        const existingSounds = sessionStorage.getItem('userSounds')
        if (existingSounds) {
          setSounds(JSON.parse(existingSounds))
        }
      } catch (error) {
        console.error('Error loading existing sounds:', error)
      }
    }
    loadExistingSounds()
  }, [])

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const newSounds = []
      
      for (const file of files) {
        if (file.type.startsWith('audio/')) {
          const url = URL.createObjectURL(file)
          const audio = new Audio(url)
          
          // Get duration
          const duration = await new Promise((resolve) => {
            audio.onloadedmetadata = () => {
              const minutes = Math.floor(audio.duration / 60)
              const seconds = Math.floor(audio.duration % 60)
              resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`)
            }
            audio.onerror = () => resolve('0:00')
          })

          const soundItem = {
            id: Math.random().toString(36).slice(2),
            name: file.name,
            url: url,
            file: file,
            duration: duration,
            size: file.size
          }
          newSounds.push(soundItem)
        }
      }

      const updatedSounds = [...sounds, ...newSounds]
      setSounds(updatedSounds)
      sessionStorage.setItem('userSounds', JSON.stringify(updatedSounds))
      
    } catch (error) {
      console.error('Error uploading audio files:', error)
      alert('Error uploading audio files. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleAudioUpload}
            className="hidden"
            id="audio-upload"
            disabled={uploading}
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => document.getElementById('audio-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Audio'}
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {sounds.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Music className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No audio files yet</p>
              <p className="text-xs">Upload audio files to get started</p>
            </div>
          ) : (
            sounds.map((sound) => (
              <div
                key={sound.id}
                className="p-3 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => onSoundSelect?.(sound)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-white truncate">{sound.name}</p>
                    <p className="text-xs text-gray-400">{sound.duration}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      const audio = new Audio(sound.url)
                      audio.play()
                    }}
                  >
                    <Music className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function TextView({ onTextAdd }: { onTextAdd?: (text: string) => void }) {
  const [text, setText] = useState('')
  const [textElements, setTextElements] = useState<any[]>([])
  const [textStyles] = useState([
    { name: 'Title', style: 'text-2xl font-bold', fontSize: 24 },
    { name: 'Subtitle', style: 'text-lg font-semibold', fontSize: 18 },
    { name: 'Body', style: 'text-base', fontSize: 16 },
    { name: 'Caption', style: 'text-sm', fontSize: 14 },
  ])

  // Load existing text elements from session storage
  useEffect(() => {
    const loadExistingText = () => {
      try {
        const existingText = sessionStorage.getItem('userTextElements')
        if (existingText) {
          setTextElements(JSON.parse(existingText))
        }
      } catch (error) {
        console.error('Error loading existing text:', error)
      }
    }
    loadExistingText()
  }, [])

  const handleAddText = () => {
    if (!text.trim()) return

    const newTextElement = {
      id: Math.random().toString(36).slice(2),
      text: text.trim(),
      style: 'text-base',
      fontSize: 16,
      color: '#ffffff',
      timestamp: Date.now()
    }

    const updatedElements = [...textElements, newTextElement]
    setTextElements(updatedElements)
    sessionStorage.setItem('userTextElements', JSON.stringify(updatedElements))
    
    onTextAdd?.(text.trim())
    setText('')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Enter text..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400"
          />
          <Button 
            size="sm" 
            className="w-full"
            onClick={handleAddText}
            disabled={!text.trim()}
          >
            Add Text
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Text Styles</h4>
          {textStyles.map((style, index) => (
            <div
              key={index}
              className="p-3 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => {
                if (text.trim()) {
                  const newTextElement = {
                    id: Math.random().toString(36).slice(2),
                    text: text.trim(),
                    style: style.style,
                    fontSize: style.fontSize,
                    color: '#ffffff',
                    timestamp: Date.now()
                  }
                  const updatedElements = [...textElements, newTextElement]
                  setTextElements(updatedElements)
                  sessionStorage.setItem('userTextElements', JSON.stringify(updatedElements))
                  onTextAdd?.(text.trim())
                  setText('')
                }
              }}
            >
              <p className={`text-white ${style.style}`}>{style.name}</p>
            </div>
          ))}
          
          {textElements.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-gray-300 mb-2 mt-4">Recent Text</h4>
              {textElements.slice(-5).map((element) => (
                <div
                  key={element.id}
                  className="p-2 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => onTextAdd?.(element.text)}
                >
                  <p className="text-sm text-white truncate">{element.text}</p>
                  <p className="text-xs text-gray-400">{new Date(element.timestamp).toLocaleTimeString()}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function StickersView() {
  const stickers = [
    { id: '1', name: 'Heart', emoji: '❤️' },
    { id: '2', name: 'Fire', emoji: '🔥' },
    { id: '3', name: 'Star', emoji: '⭐' },
    { id: '4', name: 'Thumbs Up', emoji: '👍' },
    { id: '5', name: 'Party', emoji: '🎉' },
    { id: '6', name: 'Cool', emoji: '😎' },
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">Stickers</h3>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="grid grid-cols-3 gap-2">
          {stickers.map((sticker) => (
            <div
              key={sticker.id}
              className="aspect-square bg-gray-800 rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-center text-2xl"
              onClick={() => {
                // Add sticker to timeline
                const newElement = {
                  id: Math.random().toString(36).slice(2),
                  type: 'sticker',
                  name: sticker.name,
                  emoji: sticker.emoji,
                  start: 0,
                  end: 5,
                  properties: {
                    opacity: 100,
                    scale: 100,
                    rotation: 0
                  }
                }
                
                const existingElements = JSON.parse(sessionStorage.getItem('timelineElements') || '[]')
                existingElements.push(newElement)
                sessionStorage.setItem('timelineElements', JSON.stringify(existingElements))
                window.dispatchEvent(new CustomEvent('timelineUpdated'))
              }}
            >
              {sticker.emoji}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function EffectsView() {
  const effects = [
    { id: '1', name: 'Fade In', type: 'transition' },
    { id: '2', name: 'Fade Out', type: 'transition' },
    { id: '3', name: 'Zoom In', type: 'animation' },
    { id: '4', name: 'Zoom Out', type: 'animation' },
    { id: '5', name: 'Slide Left', type: 'transition' },
    { id: '6', name: 'Slide Right', type: 'transition' },
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">Effects</h3>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {effects.map((effect) => (
            <div
              key={effect.id}
              className="p-3 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => {
                // Apply effect to selected element
                console.log('Applying effect:', effect.name)
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{effect.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{effect.type}</p>
                </div>
                <Sparkles className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function FiltersView() {
  const filters = [
    { id: '1', name: 'Vintage', preview: 'sepia' },
    { id: '2', name: 'Black & White', preview: 'grayscale' },
    { id: '3', name: 'Bright', preview: 'brightness' },
    { id: '4', name: 'Dark', preview: 'darken' },
    { id: '5', name: 'Warm', preview: 'warm' },
    { id: '6', name: 'Cool', preview: 'cool' },
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">Filters</h3>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="grid grid-cols-2 gap-2">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className="aspect-video bg-gray-800 rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors flex items-center justify-center"
              onClick={() => {
                // Apply filter to selected element
                console.log('Applying filter:', filter.name)
              }}
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-600 rounded mb-2 mx-auto"></div>
                <p className="text-xs text-white">{filter.name}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function AdjustmentView() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">Adjustments</h3>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Brightness</label>
            <input
              type="range"
              min="0"
              max="200"
              defaultValue="100"
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Contrast</label>
            <input
              type="range"
              min="0"
              max="200"
              defaultValue="100"
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Saturation</label>
            <input
              type="range"
              min="0"
              max="200"
              defaultValue="100"
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Hue</label>
            <input
              type="range"
              min="-180"
              max="180"
              defaultValue="0"
              className="w-full"
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

function SettingsView() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">Settings</h3>
      </div>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Project FPS</label>
            <select className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white">
              <option value="24">24 FPS</option>
              <option value="30" selected>30 FPS</option>
              <option value="60">60 FPS</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Canvas Size</label>
            <select className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white">
              <option value="1080x1920" selected>1080x1920 (9:16)</option>
              <option value="1920x1080">1920x1080 (16:9)</option>
              <option value="1080x1080">1080x1080 (1:1)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Quality</label>
            <select className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
