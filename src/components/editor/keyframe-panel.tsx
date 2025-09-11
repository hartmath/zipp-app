"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Edit3,
  Download,
  Upload,
  Settings,
  Key,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  getKeyframeAnimationService,
  AnimatedProperty,
  Keyframe
} from "@/lib/keyframe-animation"

interface KeyframePanelProps {
  selectedElement?: any
  currentTime?: number
  onPropertyChange?: (property: string, value: number) => void
}

export function KeyframePanel({ 
  selectedElement,
  currentTime = 0,
  onPropertyChange
}: KeyframePanelProps) {
  const [animations, setAnimations] = useState<AnimatedProperty[]>([])
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null)
  const [editingKeyframe, setEditingKeyframe] = useState<string | null>(null)
  const [editTime, setEditTime] = useState("")
  const [editValue, setEditValue] = useState("")
  const [editEasing, setEditEasing] = useState<Keyframe['easing']>('linear')

  const keyframeService = getKeyframeAnimationService()

  useEffect(() => {
    setAnimations(keyframeService.getAllAnimations())
  }, [])

  useEffect(() => {
    if (selectedElement) {
      // Update animated values based on current time
      animations.forEach(animation => {
        const value = keyframeService.getValueAtTime(animation.id, currentTime)
        if (onPropertyChange) {
          onPropertyChange(animation.name.toLowerCase(), value)
        }
      })
    }
  }, [currentTime, animations, selectedElement, onPropertyChange])

  const handleCreateAnimation = (propertyName: string) => {
    const propertyId = `${selectedElement?.id}_${propertyName}`
    const animation = keyframeService.createAnimation(propertyId, propertyName)
    setAnimations(keyframeService.getAllAnimations())
    setSelectedAnimation(propertyId)
  }

  const handleAddKeyframe = (animationId: string) => {
    const animation = keyframeService.getAnimation(animationId)
    if (!animation) return

    const newKeyframe: Keyframe = {
      id: `keyframe_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      time: currentTime,
      properties: { value: 0 },
      easing: 'linear'
    }

    animation.keyframes.push(newKeyframe)
    animation.keyframes.sort((a, b) => a.time - b.time)
    setAnimations([...keyframeService.getAllAnimations()])
  }

  const handleEditKeyframe = (keyframe: Keyframe) => {
    setEditingKeyframe(keyframe.id)
    setEditTime(keyframe.time.toString())
    setEditValue(keyframe.properties.value.toString())
    setEditEasing(keyframe.easing)
  }

  const handleSaveEdit = (animationId: string, keyframeId: string) => {
    keyframeService.updateKeyframe(animationId, keyframeId, {
      time: parseFloat(editTime),
      properties: { value: parseFloat(editValue) },
      easing: editEasing
    })
    
    setAnimations([...keyframeService.getAllAnimations()])
    setEditingKeyframe(null)
    setEditTime("")
    setEditValue("")
  }

  const handleDeleteKeyframe = (animationId: string, keyframeId: string) => {
    keyframeService.removeKeyframe(animationId, keyframeId)
    setAnimations([...keyframeService.getAllAnimations()])
  }

  const handleDeleteAnimation = (animationId: string) => {
    keyframeService.deleteAnimation(animationId)
    setAnimations([...keyframeService.getAllAnimations()])
    if (selectedAnimation === animationId) {
      setSelectedAnimation(null)
    }
  }

  const handleExportAnimations = () => {
    const data = keyframeService.exportAnimations()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'animations.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportAnimations = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (keyframeService.importAnimations(content)) {
        setAnimations([...keyframeService.getAllAnimations()])
        alert('Animations imported successfully!')
      } else {
        alert('Failed to import animations. Invalid file format.')
      }
    }
    reader.readAsText(file)
  }

  const getEasingColor = (easing: Keyframe['easing']): string => {
    switch (easing) {
      case 'linear': return 'bg-gray-500'
      case 'ease-in': return 'bg-blue-500'
      case 'ease-out': return 'bg-green-500'
      case 'ease-in-out': return 'bg-purple-500'
      case 'bounce': return 'bg-yellow-500'
      case 'elastic': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  const commonProperties = ['opacity', 'scale', 'rotation', 'x', 'y', 'brightness', 'contrast']

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Keyframe Animation</h3>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={handleImportAnimations}
              className="hidden"
              id="import-animations"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('import-animations')?.click()}
              className="h-8"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAnimations}
              className="h-8"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {selectedElement && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Selected: {selectedElement.name}</p>
            <div className="flex flex-wrap gap-1">
              {commonProperties.map(prop => (
                <Button
                  key={prop}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateAnimation(prop)}
                  className="h-6 text-xs"
                >
                  <Key className="h-3 w-3 mr-1" />
                  {prop}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Animations List */}
      <ScrollArea className="flex-1 p-3">
        {animations.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Key className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No animations yet</p>
            <p className="text-xs">Select an element and create animations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {animations.map((animation) => (
              <div
                key={animation.id}
                className={cn(
                  "bg-gray-800 rounded border border-gray-700 p-3",
                  selectedAnimation === animation.id && "border-blue-500 bg-blue-900/20"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm text-white font-medium">{animation.name}</h4>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddKeyframe(animation.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAnimation(
                        selectedAnimation === animation.id ? null : animation.id
                      )}
                      className="h-6 w-6 p-0"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAnimation(animation.id)}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {selectedAnimation === animation.id && (
                  <div className="space-y-2">
                    {animation.keyframes.map((keyframe) => (
                      <div
                        key={keyframe.id}
                        className="flex items-center gap-2 p-2 bg-gray-700 rounded"
                      >
                        {editingKeyframe === keyframe.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              placeholder="Time"
                              className="h-6 text-xs w-16"
                            />
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder="Value"
                              className="h-6 text-xs w-16"
                            />
                            <select
                              value={editEasing}
                              onChange={(e) => setEditEasing(e.target.value as Keyframe['easing'])}
                              className="h-6 text-xs bg-gray-800 border border-gray-600 rounded px-1"
                            >
                              <option value="linear">Linear</option>
                              <option value="ease-in">Ease In</option>
                              <option value="ease-out">Ease Out</option>
                              <option value="ease-in-out">Ease In-Out</option>
                              <option value="bounce">Bounce</option>
                              <option value="elastic">Elastic</option>
                            </select>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(animation.id, keyframe.id)}
                              className="h-6 text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingKeyframe(null)}
                              className="h-6 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-1">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-300">
                                  {formatTime(keyframe.time)}
                                </span>
                              </div>
                              <span className="text-xs text-white">
                                {keyframe.properties.value}
                              </span>
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                getEasingColor(keyframe.easing)
                              )} />
                              <span className="text-xs text-gray-400">
                                {keyframe.easing}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditKeyframe(keyframe)}
                                className="h-5 w-5 p-0"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteKeyframe(animation.id, keyframe.id)}
                                className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
