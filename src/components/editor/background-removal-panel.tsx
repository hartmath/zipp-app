"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Upload, 
  Download, 
  Wand2, 
  Image, 
  Video, 
  Palette,
  Settings,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  getBackgroundRemovalService,
  BackgroundRemovalOptions,
  BackgroundRemovalResult
} from "@/lib/background-removal"

interface BackgroundRemovalPanelProps {
  onImageProcessed?: (processedBlob: Blob) => void
  onVideoProcessed?: (processedBlob: Blob) => void
}

export function BackgroundRemovalPanel({ 
  onImageProcessed, 
  onVideoProcessed 
}: BackgroundRemovalPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [selectedBackground, setSelectedBackground] = useState<File | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [options, setOptions] = useState<BackgroundRemovalOptions>({
    model: 'u2net',
    threshold: 0.5,
    alphaMatting: true
  })

  const imageInputRef = useRef<HTMLInputElement>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const backgroundRemovalService = getBackgroundRemovalService()

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      setProcessedImage(null)
    }
  }

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedBackground(file)
    }
  }

  const handleRemoveBackground = async () => {
    if (!selectedImage) return

    try {
      setIsProcessing(true)
      setProcessingProgress(0)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const result = await backgroundRemovalService.removeBackground(selectedImage, options)
      
      clearInterval(progressInterval)
      setProcessingProgress(100)

      if (result.success && result.imageBlob) {
        const imageUrl = URL.createObjectURL(result.imageBlob)
        setProcessedImage(imageUrl)
        onImageProcessed?.(result.imageBlob)
      } else {
        alert(`Background removal failed: ${result.error}`)
      }

    } catch (error) {
      console.error('Background removal error:', error)
      alert('Failed to remove background. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }

  const handleReplaceBackground = async () => {
    if (!selectedImage || !selectedBackground) return

    try {
      setIsProcessing(true)
      setProcessingProgress(0)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const result = await backgroundRemovalService.replaceBackground(
        selectedImage,
        selectedBackground,
        options
      )
      
      clearInterval(progressInterval)
      setProcessingProgress(100)

      if (result.success && result.imageBlob) {
        const imageUrl = URL.createObjectURL(result.imageBlob)
        setProcessedImage(imageUrl)
        onImageProcessed?.(result.imageBlob)
      } else {
        alert(`Background replacement failed: ${result.error}`)
      }

    } catch (error) {
      console.error('Background replacement error:', error)
      alert('Failed to replace background. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }

  const handleDownload = () => {
    if (!processedImage) return

    const a = document.createElement('a')
    a.href = processedImage
    a.download = 'background-removed.png'
    a.click()
  }

  const handleAddToTimeline = () => {
    if (!processedImage) return

    // Convert image URL to blob and add to timeline
    fetch(processedImage)
      .then(res => res.blob())
      .then(blob => {
        const newElement = {
          id: Math.random().toString(36).slice(2),
          type: 'image',
          name: 'Background Removed Image',
          url: processedImage,
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
      })
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Background Removal</h3>
        
        {/* Upload Section */}
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Foreground Image</label>
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
          
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Background Image (Optional)</label>
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => backgroundInputRef.current?.click()}
              className="w-full h-8 text-xs"
            >
              <Upload className="h-3 w-3 mr-2" />
              {selectedBackground ? selectedBackground.name : 'Select Background'}
            </Button>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="p-3 border-b border-gray-700">
        <h4 className="text-xs font-medium text-gray-300 mb-2">Options</h4>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Model</label>
            <select
              value={options.model}
              onChange={(e) => setOptions(prev => ({ ...prev, model: e.target.value as any }))}
              className="w-full p-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
            >
              <option value="u2net">U²-Net (General)</option>
              <option value="u2netp">U²-Net+ (Lightweight)</option>
              <option value="u2net_human_seg">Human Segmentation</option>
              <option value="u2net_cloth_seg">Cloth Segmentation</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Threshold: {options.threshold}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={options.threshold}
              onChange={(e) => setOptions(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 border-b border-gray-700">
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveBackground}
            disabled={!selectedImage || isProcessing}
            className="w-full h-8 text-xs"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Processing... {processingProgress}%
              </>
            ) : (
              <>
                <Wand2 className="h-3 w-3 mr-2" />
                Remove Background
              </>
            )}
          </Button>
          
          {selectedBackground && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReplaceBackground}
              disabled={!selectedImage || !selectedBackground || isProcessing}
              className="w-full h-8 text-xs"
            >
              <Palette className="h-3 w-3 mr-2" />
              Replace Background
            </Button>
          )}
        </div>
      </div>

      {/* Preview */}
      <ScrollArea className="flex-1 p-3">
        {selectedImage && (
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
        )}
        
        {!selectedImage && (
          <div className="text-center text-gray-400 py-8">
            <Wand2 className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No image selected</p>
            <p className="text-xs">Upload an image to remove background</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
