"use client"

import { useState } from "react"
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
  FolderOpen
} from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = 'media' | 'sounds' | 'text' | 'stickers' | 'effects' | 'filters' | 'adjustment' | 'settings'

interface MediaPanelProps {
  onMediaSelect?: (media: any) => void
  onTextAdd?: (text: string) => void
  onSoundSelect?: (sound: any) => void
}

export function MediaPanel({ onMediaSelect, onTextAdd, onSoundSelect }: MediaPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('media')

  const tabs = [
    { id: 'media' as Tab, label: 'Media', icon: Video },
    { id: 'sounds' as Tab, label: 'Sounds', icon: Music },
    { id: 'text' as Tab, label: 'Text', icon: Type },
    { id: 'stickers' as Tab, label: 'Stickers', icon: Smile },
    { id: 'effects' as Tab, label: 'Effects', icon: Sparkles },
    { id: 'filters' as Tab, label: 'Filters', icon: Filter },
    { id: 'adjustment' as Tab, label: 'Adjust', icon: Sliders },
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
  const [mediaFiles] = useState([
    { id: '1', name: 'Video 1', type: 'video', thumbnail: '/api/placeholder/100/60' },
    { id: '2', name: 'Image 1', type: 'image', thumbnail: '/api/placeholder/100/60' },
    { id: '3', name: 'Video 2', type: 'video', thumbnail: '/api/placeholder/100/60' },
  ])

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="grid grid-cols-2 gap-2">
          {mediaFiles.map((file) => (
            <div
              key={file.id}
              className="aspect-video bg-gray-800 rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => onMediaSelect?.(file)}
            >
              <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center">
                <span className="text-xs text-gray-400">{file.name}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function SoundsView({ onSoundSelect }: { onSoundSelect?: (sound: any) => void }) {
  const [sounds] = useState([
    { id: '1', name: 'Background Music 1', duration: '2:30' },
    { id: '2', name: 'Sound Effect 1', duration: '0:15' },
    { id: '3', name: 'Background Music 2', duration: '3:45' },
  ])

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Upload className="h-4 w-4 mr-2" />
            Upload Audio
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {sounds.map((sound) => (
            <div
              key={sound.id}
              className="p-3 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => onSoundSelect?.(sound)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{sound.name}</p>
                  <p className="text-xs text-gray-400">{sound.duration}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Music className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function TextView({ onTextAdd }: { onTextAdd?: (text: string) => void }) {
  const [text, setText] = useState('')
  const [textStyles] = useState([
    { name: 'Title', style: 'text-2xl font-bold' },
    { name: 'Subtitle', style: 'text-lg font-semibold' },
    { name: 'Body', style: 'text-base' },
    { name: 'Caption', style: 'text-sm' },
  ])

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
            onClick={() => {
              if (text.trim()) {
                onTextAdd?.(text)
                setText('')
              }
            }}
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
            >
              <p className={`text-white ${style.style}`}>{style.name}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function StickersView() {
  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      <div className="text-center">
        <Smile className="h-12 w-12 mx-auto mb-2" />
        <p>Stickers coming soon...</p>
      </div>
    </div>
  )
}

function EffectsView() {
  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      <div className="text-center">
        <Sparkles className="h-12 w-12 mx-auto mb-2" />
        <p>Effects coming soon...</p>
      </div>
    </div>
  )
}

function FiltersView() {
  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      <div className="text-center">
        <Filter className="h-12 w-12 mx-auto mb-2" />
        <p>Filters coming soon...</p>
      </div>
    </div>
  )
}

function AdjustmentView() {
  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      <div className="text-center">
        <Sliders className="h-12 w-12 mx-auto mb-2" />
        <p>Adjustments coming soon...</p>
      </div>
    </div>
  )
}

function SettingsView() {
  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      <div className="text-center">
        <Settings className="h-12 w-12 mx-auto mb-2" />
        <p>Settings coming soon...</p>
      </div>
    </div>
  )
}
