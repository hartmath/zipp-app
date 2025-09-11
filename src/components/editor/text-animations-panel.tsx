"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Type, 
  Play, 
  Pause, 
  Download, 
  Upload, 
  Plus,
  Trash2,
  Settings,
  Loader2,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  getTextAnimationService,
  TextAnimation,
  TextAnimationPreset
} from "@/lib/text-animations"

interface TextAnimationsPanelProps {
  selectedElement?: any
  onAnimationApply?: (animation: TextAnimation) => void
}

export function TextAnimationsPanel({ 
  selectedElement,
  onAnimationApply
}: TextAnimationsPanelProps) {
  const [appliedAnimations, setAppliedAnimations] = useState<TextAnimation[]>([])
  const [selectedPreset, setSelectedPreset] = useState<TextAnimationPreset | null>(null)
  const [customDuration, setCustomDuration] = useState(1)
  const [customDelay, setCustomDelay] = useState(0)
  const [customEasing, setCustomEasing] = useState<TextAnimation['easing']>('ease-out')

  const textAnimationService = getTextAnimationService()
  const presets = textAnimationService.getAnimationPresets()

  const handleApplyAnimation = (preset: TextAnimationPreset) => {
    if (!selectedElement) {
      alert('Please select a text element first')
      return
    }

    const animation = textAnimationService.createAnimation({
      ...preset,
      animation: {
        ...preset.animation,
        duration: customDuration,
        delay: customDelay,
        easing: customEasing
      }
    })

    setAppliedAnimations(prev => [...prev, animation])
    onAnimationApply?.(animation)
    
    alert(`Applied ${preset.name} animation to ${selectedElement.name}`)
  }

  const handleRemoveAnimation = (animationId: string) => {
    textAnimationService.deleteAnimation(animationId)
    setAppliedAnimations(prev => prev.filter(anim => anim.id !== animationId))
  }

  const handleExportAnimations = () => {
    const data = textAnimationService.exportAnimations()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'text-animations.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportAnimations = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (textAnimationService.importAnimations(content)) {
        setAppliedAnimations([...textAnimationService.getAllAnimations()])
        alert('Animations imported successfully!')
      } else {
        alert('Failed to import animations. Invalid file format.')
      }
    }
    reader.readAsText(file)
  }

  const getEasingColor = (easing: TextAnimation['easing']): string => {
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

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Text Animations</h3>
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
          <div className="text-xs text-blue-400 mb-2">
            Selected: {selectedElement.name}
          </div>
        )}
      </div>

      {/* Custom Settings */}
      <div className="p-3 border-b border-gray-700">
        <h4 className="text-xs font-medium text-gray-300 mb-2">Custom Settings</h4>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Duration: {customDuration}s
            </label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={customDuration}
              onChange={(e) => setCustomDuration(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Delay: {customDelay}s
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={customDelay}
              onChange={(e) => setCustomDelay(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Easing</label>
            <select
              value={customEasing}
              onChange={(e) => setCustomEasing(e.target.value as TextAnimation['easing'])}
              className="w-full p-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
            >
              <option value="linear">Linear</option>
              <option value="ease-in">Ease In</option>
              <option value="ease-out">Ease Out</option>
              <option value="ease-in-out">Ease In-Out</option>
              <option value="bounce">Bounce</option>
              <option value="elastic">Elastic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Animation Presets */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-300 mb-2">Animation Presets</h4>
          {presets.map((preset) => (
            <div
              key={preset.name}
              className="p-3 bg-gray-800 rounded border border-gray-700 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h5 className="text-sm text-white font-medium">{preset.name}</h5>
                  <p className="text-xs text-gray-400">{preset.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyAnimation(preset)}
                  disabled={!selectedElement}
                  className="h-6 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Apply
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>Duration: {preset.animation.duration}s</span>
                <span>•</span>
                <span>Easing: {preset.animation.easing}</span>
                <div className={cn(
                  "w-2 h-2 rounded-full ml-auto",
                  getEasingColor(preset.animation.easing)
                )} />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Applied Animations */}
      {appliedAnimations.length > 0 && (
        <div className="p-3 border-t border-gray-700">
          <h4 className="text-xs font-medium text-gray-300 mb-2">Applied Animations</h4>
          <div className="space-y-1">
            {appliedAnimations.map((animation) => (
              <div
                key={animation.id}
                className="flex items-center justify-between p-2 bg-gray-800 rounded"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs text-white">{animation.name}</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    getEasingColor(animation.easing)
                  )} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAnimation(animation.id)}
                  className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!selectedElement && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Type className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No text element selected</p>
            <p className="text-xs">Select a text element to apply animations</p>
          </div>
        </div>
      )}
    </div>
  )
}
