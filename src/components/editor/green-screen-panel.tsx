"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { 
  Upload, 
  Download, 
  Wand2, 
  Image, 
  Palette,
  Settings,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  getGreenScreenService,
  GreenScreenOptions,
  GreenScreenResult
} from "@/lib/green-screen"

interface GreenScreenPanelProps {
  onImageProcessed?: (processedBlob: Blob) => void
}

export function GreenScreenPanel({ 
  onImageProcessed 
}: GreenScreenPanelProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [options, setOptions] = useState<GreenScreenOptions>({
    color: '#00FF00',
    tolerance: 30,
    edgeSoftness: 20,
    spillSuppression: 50,
    shadows: true,
    highlights: true
  })
  const [showPreview, setShowPreview] = useState(true)
  const [detectedColor, setDetectedColor] = useState<string | null>(null)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const greenScreenService = getGreenScreenService()

  const colorPresets = greenScreenService.getColorPresets()

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setProcessedImage(null)
      
      // Auto-detect green screen color
      try {
        const detected = await greenScreenService.detectGreenScreenColor(file)
        setDetectedColor(detected)
        setOptions(prev => ({ ...prev, color: detected }))
      } catch (error) {
        console.error('Error detecting color:', error)
      }
    }
  }

  const handleApplyGreenScreen = async () => {
    if (!selectedImage) return

    try {
      setIsProcessing(true)
      
      const result = await greenScreenService.applyGreenScreen(selectedImage, options)
      
      if (result.success && result.imageBlob) {
        const imageUrl = URL.createObjectURL(result.imageBlob)
        setProcessedImage(imageUrl)
        onImageProcessed?.(result.imageBlob)
      } else {
        alert(`Green screen processing failed: ${result.error}`)
      }

    } catch (error) {
      console.error('Error applying green screen:', error)
      alert('Failed to apply green screen. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    const url = processedImage || (selectedImage ? URL.createObjectURL(selectedImage) : null)
    if (!url) return

    const a = document.createElement('a')
    a.href = url
    a.download = 'green-screen-processed.png'
    a.click()
  }

  const handleAddToTimeline = () => {
    const url = processedImage || (selectedImage ? URL.createObjectURL(selectedImage) : null)
    if (!url) return

    const newElement = {
      id: Math.random().toString(36).slice(2),
      type: 'image',
      name: 'Green Screen Image',
      url: url,
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
  }

  const handlePresetSelect = (preset: typeof colorPresets[0]) => {
    setOptions(prev => ({ ...prev, color: preset.color }))
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Green Screen</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="h-8"
            >
              {showPreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Upload Section */}
        <div className="space-y-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => imageInputRef.current?.click()}
            className="w-full h-8 text-xs"
          >
            <Upload className="h-3 w-3 mr-2" />
            {selectedImage ? selectedImage.name : 'Select Image'}
          </Button>
        </div>
      </div>

      {/* Color Presets */}
      <div className="p-3 border-b border-gray-700">
        <h4 className="text-xs font-medium text-gray-300 mb-2">Color Presets</h4>
        <div className="grid grid-cols-2 gap-1">
          {colorPresets.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => handlePresetSelect(preset)}
              className={cn(
                "h-6 text-xs justify-start",
                options.color === preset.color && "bg-blue-600 border-blue-500"
              )}
            >
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: preset.color }}
              />
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="p-3 border-b border-gray-700">
        <h4 className="text-xs font-medium text-gray-300 mb-2">Settings</h4>
        <div className="space-y-3">
          {/* Color Selection */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Target Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={options.color}
                onChange={(e) => setOptions(prev => ({ ...prev, color: e.target.value }))}
                className="w-8 h-6 rounded border border-gray-600"
              />
              <Input
                value={options.color}
                onChange={(e) => setOptions(prev => ({ ...prev, color: e.target.value }))}
                className="h-6 text-xs"
              />
            </div>
            {detectedColor && (
              <p className="text-xs text-blue-400 mt-1">
                Auto-detected: {detectedColor}
              </p>
            )}
          </div>
          
          {/* Tolerance */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Tolerance: {options.tolerance}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={options.tolerance}
              onChange={(e) => setOptions(prev => ({ ...prev, tolerance: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
          
          {/* Edge Softness */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Edge Softness: {options.edgeSoftness}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={options.edgeSoftness}
              onChange={(e) => setOptions(prev => ({ ...prev, edgeSoftness: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
          
          {/* Spill Suppression */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Spill Suppression: {options.spillSuppression}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={options.spillSuppression}
              onChange={(e) => setOptions(prev => ({ ...prev, spillSuppression: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
          
          {/* Advanced Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Keep Shadows</span>
              <Button
                variant={options.shadows ? "default" : "outline"}
                size="sm"
                onClick={() => setOptions(prev => ({ ...prev, shadows: !prev.shadows }))}
                className="h-5 text-xs"
              >
                {options.shadows ? 'ON' : 'OFF'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Keep Highlights</span>
              <Button
                variant={options.highlights ? "default" : "outline"}
                size="sm"
                onClick={() => setOptions(prev => ({ ...prev, highlights: !prev.highlights }))}
                className="h-5 text-xs"
              >
                {options.highlights ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 border-b border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={handleApplyGreenScreen}
          disabled={!selectedImage || isProcessing}
          className="w-full h-8 text-xs"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Wand2 className="h-3 w-3 mr-2" />
              Apply Green Screen
            </>
          )}
        </Button>
      </div>

      {/* Preview */}
      {showPreview && selectedImage && (
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium text-gray-300 mb-2">Original</h4>
              <div className="aspect-video bg-gray-800 rounded border border-gray-700 overflow-hidden">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Original"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {processedImage && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-300">Processed</h4>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownload}
                      className="h-6 w-6 p-0"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddToTimeline}
                      className="h-6 w-6 p-0"
                    >
                      <Image className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="aspect-video bg-gray-800 rounded border border-gray-700 overflow-hidden">
                  <img
                    src={processedImage}
                    alt="Processed"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
      
      {!selectedImage && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Wand2 className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No image selected</p>
            <p className="text-xs">Upload an image to apply green screen</p>
          </div>
        </div>
      )}
    </div>
  )
}
