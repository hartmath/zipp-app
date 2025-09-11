"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Upload, 
  Download, 
  Palette, 
  Image, 
  Settings,
  Loader2,
  RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  getColorGradingService,
  ColorGradingOptions,
  ColorGradingResult,
  ColorGradingPreset
} from "@/lib/color-grading"

interface ColorGradingPanelProps {
  onImageProcessed?: (processedBlob: Blob) => void
}

export function ColorGradingPanel({ 
  onImageProcessed 
}: ColorGradingPanelProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [options, setOptions] = useState<ColorGradingOptions>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    temperature: 0,
    tint: 0,
    vibrance: 0,
    shadows: 0,
    highlights: 0,
    midtones: 0,
    gamma: 1,
    exposure: 0,
    blacks: 0,
    whites: 0
  })

  const imageInputRef = useRef<HTMLInputElement>(null)
  const colorGradingService = getColorGradingService()
  const presets = colorGradingService.getColorGradingPresets()

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setProcessedImage(null)
    }
  }

  const handleApplyColorGrading = async () => {
    if (!selectedImage) return

    try {
      setIsProcessing(true)
      
      const result = await colorGradingService.applyColorGrading(selectedImage, options)
      
      if (result.success && result.imageBlob) {
        const imageUrl = URL.createObjectURL(result.imageBlob)
        setProcessedImage(imageUrl)
        onImageProcessed?.(result.imageBlob)
      } else {
        alert(`Color grading failed: ${result.error}`)
      }

    } catch (error) {
      console.error('Error applying color grading:', error)
      alert('Failed to apply color grading. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePresetSelect = (preset: ColorGradingPreset) => {
    setOptions(preset.options)
  }

  const handleReset = () => {
    setOptions({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      temperature: 0,
      tint: 0,
      vibrance: 0,
      shadows: 0,
      highlights: 0,
      midtones: 0,
      gamma: 1,
      exposure: 0,
      blacks: 0,
      whites: 0
    })
  }

  const handleDownload = () => {
    const url = processedImage || (selectedImage ? URL.createObjectURL(selectedImage) : null)
    if (!url) return

    const a = document.createElement('a')
    a.href = url
    a.download = 'color-graded.png'
    a.click()
  }

  const handleAddToTimeline = () => {
    const url = processedImage || (selectedImage ? URL.createObjectURL(selectedImage) : null)
    if (!url) return

    const newElement = {
      id: Math.random().toString(36).slice(2),
      type: 'image',
      name: 'Color Graded Image',
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

  const SliderControl = ({ 
    label, 
    value, 
    min, 
    max, 
    step = 1, 
    onChange 
  }: {
    label: string
    value: number
    min: number
    max: number
    step?: number
    onChange: (value: number) => void
  }) => (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">
        {label}: {value}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Color Grading</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8"
            >
              <RotateCcw className="h-4 w-4" />
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

      {/* Presets */}
      <div className="p-3 border-b border-gray-700">
        <h4 className="text-xs font-medium text-gray-300 mb-2">Presets</h4>
        <ScrollArea className="h-20">
          <div className="flex gap-1">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect(preset)}
                className="h-6 text-xs whitespace-nowrap"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Basic Adjustments */}
      <div className="p-3 border-b border-gray-700">
        <h4 className="text-xs font-medium text-gray-300 mb-2">Basic</h4>
        <div className="space-y-2">
          <SliderControl
            label="Brightness"
            value={options.brightness}
            min={-100}
            max={100}
            onChange={(value) => setOptions(prev => ({ ...prev, brightness: value }))}
          />
          <SliderControl
            label="Contrast"
            value={options.contrast}
            min={-100}
            max={100}
            onChange={(value) => setOptions(prev => ({ ...prev, contrast: value }))}
          />
          <SliderControl
            label="Saturation"
            value={options.saturation}
            min={-100}
            max={100}
            onChange={(value) => setOptions(prev => ({ ...prev, saturation: value }))}
          />
          <SliderControl
            label="Hue"
            value={options.hue}
            min={-180}
            max={180}
            onChange={(value) => setOptions(prev => ({ ...prev, hue: value }))}
          />
        </div>
      </div>

      {/* Color Temperature */}
      <div className="p-3 border-b border-gray-700">
        <h4 className="text-xs font-medium text-gray-300 mb-2">Color</h4>
        <div className="space-y-2">
          <SliderControl
            label="Temperature"
            value={options.temperature}
            min={-100}
            max={100}
            onChange={(value) => setOptions(prev => ({ ...prev, temperature: value }))}
          />
          <SliderControl
            label="Tint"
            value={options.tint}
            min={-100}
            max={100}
            onChange={(value) => setOptions(prev => ({ ...prev, tint: value }))}
          />
          <SliderControl
            label="Vibrance"
            value={options.vibrance}
            min={-100}
            max={100}
            onChange={(value) => setOptions(prev => ({ ...prev, vibrance: value }))}
          />
        </div>
      </div>

      {/* Tone */}
      <div className="p-3 border-b border-gray-700">
        <h4 className="text-xs font-medium text-gray-300 mb-2">Tone</h4>
        <div className="space-y-2">
          <SliderControl
            label="Exposure"
            value={options.exposure}
            min={-3}
            max={3}
            step={0.1}
            onChange={(value) => setOptions(prev => ({ ...prev, exposure: value }))}
          />
          <SliderControl
            label="Gamma"
            value={options.gamma}
            min={0.1}
            max={3}
            step={0.1}
            onChange={(value) => setOptions(prev => ({ ...prev, gamma: value }))}
          />
          <SliderControl
            label="Shadows"
            value={options.shadows}
            min={-100}
            max={100}
            onChange={(value) => setOptions(prev => ({ ...prev, shadows: value }))}
          />
          <SliderControl
            label="Highlights"
            value={options.highlights}
            min={-100}
            max={100}
            onChange={(value) => setOptions(prev => ({ ...prev, highlights: value }))}
          />
          <SliderControl
            label="Midtones"
            value={options.midtones}
            min={-100}
            max={100}
            onChange={(value) => setOptions(prev => ({ ...prev, midtones: value }))}
          />
          <SliderControl
            label="Blacks"
            value={options.blacks}
            min={-100}
            max={100}
            onChange={(value) => setOptions(prev => ({ ...prev, blacks: value }))}
          />
          <SliderControl
            label="Whites"
            value={options.whites}
            min={-100}
            max={100}
            onChange={(value) => setOptions(prev => ({ ...prev, whites: value }))}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 border-b border-gray-700">
        <Button
          variant="outline"
          size="sm"
          onClick={handleApplyColorGrading}
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
              <Palette className="h-3 w-3 mr-2" />
              Apply Color Grading
            </>
          )}
        </Button>
      </div>

      {/* Preview */}
      {selectedImage && (
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
            <Palette className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No image selected</p>
            <p className="text-xs">Upload an image to apply color grading</p>
          </div>
        </div>
      )}
    </div>
  )
}
