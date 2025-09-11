"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { 
  RotateCcw, 
  RotateCw, 
  Move, 
  Type, 
  Palette,
  Volume2,
  Scissors,
  Copy,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PropertiesPanelProps {
  selectedElement?: {
    id: string
    type: 'video' | 'audio' | 'text'
    name: string
    properties: {
      opacity?: number
      volume?: number
      rotation?: number
      scale?: number
      color?: string
      fontSize?: number
    }
  }
  onPropertyChange?: (property: string, value: any) => void
  onDelete?: () => void
  onDuplicate?: () => void
  onSplit?: () => void
}

export function PropertiesPanel({ 
  selectedElement, 
  onPropertyChange, 
  onDelete, 
  onDuplicate, 
  onSplit 
}: PropertiesPanelProps) {
  const [properties, setProperties] = useState({
    opacity: 100,
    volume: 100,
    rotation: 0,
    scale: 100,
    color: '#ffffff',
    fontSize: 16,
    ...selectedElement?.properties
  })

  const handlePropertyChange = (property: string, value: any) => {
    setProperties(prev => ({ ...prev, [property]: value }))
    onPropertyChange?.(property, value)
  }

  if (!selectedElement) {
    return (
      <div className="h-full bg-gray-900 border-l border-gray-700 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-4">🎬</div>
          <p>No element selected</p>
          <p className="text-sm">Select an element to edit its properties</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-900 border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Properties</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSplit}
              className="h-6 w-6 p-0"
            >
              <Scissors className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">{selectedElement.name}</p>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Transform */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-gray-300 uppercase tracking-wide">Transform</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Opacity</span>
              <span className="text-xs text-gray-400">{properties.opacity}%</span>
            </div>
            <Slider
              value={[properties.opacity]}
              onValueChange={([value]) => handlePropertyChange('opacity', value)}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Scale</span>
              <span className="text-xs text-gray-400">{properties.scale}%</span>
            </div>
            <Slider
              value={[properties.scale]}
              onValueChange={([value]) => handlePropertyChange('scale', value)}
              max={200}
              min={10}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Rotation</span>
              <span className="text-xs text-gray-400">{properties.rotation}°</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePropertyChange('rotation', properties.rotation - 90)}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Slider
                value={[properties.rotation]}
                onValueChange={([value]) => handlePropertyChange('rotation', value)}
                max={360}
                min={-360}
                step={1}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePropertyChange('rotation', properties.rotation + 90)}
                className="h-8 w-8 p-0"
              >
                <RotateCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Audio Properties */}
        {selectedElement.type === 'audio' && (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-300 uppercase tracking-wide">Audio</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Volume</span>
                <span className="text-xs text-gray-400">{properties.volume}%</span>
              </div>
              <Slider
                value={[properties.volume]}
                onValueChange={([value]) => handlePropertyChange('volume', value)}
                max={200}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Text Properties */}
        {selectedElement.type === 'text' && (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-300 uppercase tracking-wide">Text</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Font Size</span>
                <span className="text-xs text-gray-400">{properties.fontSize}px</span>
              </div>
              <Slider
                value={[properties.fontSize]}
                onValueChange={([value]) => handlePropertyChange('fontSize', value)}
                max={72}
                min={8}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm text-gray-300">Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={properties.color}
                  onChange={(e) => handlePropertyChange('color', e.target.value)}
                  className="w-8 h-8 rounded border border-gray-600 bg-transparent cursor-pointer"
                />
                <div className="flex gap-1">
                  {['#ffffff', '#ff4757', '#2ed573', '#1e90ff', '#f1c40f', '#8e44ad'].map((color) => (
                    <button
                      key={color}
                      onClick={() => handlePropertyChange('color', color)}
                      className={cn(
                        "w-6 h-6 rounded border-2 transition-all",
                        properties.color === color ? "border-white" : "border-gray-600"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Position */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-gray-300 uppercase tracking-wide">Position</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">X</label>
              <input
                type="number"
                placeholder="0"
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Y</label>
              <input
                type="number"
                placeholder="0"
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
