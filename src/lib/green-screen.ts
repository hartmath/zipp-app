"use client"

export interface GreenScreenOptions {
  color: string // Hex color to remove
  tolerance: number // 0-100, how similar colors to remove
  edgeSoftness: number // 0-100, softness of edges
  spillSuppression: number // 0-100, remove color spill
  shadows: boolean // Keep shadows
  highlights: boolean // Keep highlights
}

export interface GreenScreenResult {
  success: boolean
  imageBlob?: Blob
  error?: string
}

class GreenScreenService {
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    this.isInitialized = true
  }

  async applyGreenScreen(
    imageBlob: Blob,
    options: GreenScreenOptions
  ): Promise<GreenScreenResult> {
    try {
      await this.initialize()

      // Create canvas for processing
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Failed to create canvas context')
      }

      // Load image
      const img = new Image()
      const imageUrl = URL.createObjectURL(imageBlob)
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Apply green screen effect
      const processedCanvas = await this.processGreenScreen(canvas, options)
      
      // Convert to blob
      const resultBlob = await new Promise<Blob>((resolve) => {
        processedCanvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/png')
      })

      URL.revokeObjectURL(imageUrl)

      return {
        success: true,
        imageBlob: resultBlob
      }

    } catch (error) {
      console.error('Green screen error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async processGreenScreen(
    canvas: HTMLCanvasElement,
    options: GreenScreenOptions
  ): Promise<HTMLCanvasElement> {
    const { color, tolerance, edgeSoftness, spillSuppression, shadows, highlights } = options
    
    // Create a new canvas for the result
    const resultCanvas = document.createElement('canvas')
    resultCanvas.width = canvas.width
    resultCanvas.height = canvas.height
    const resultCtx = resultCanvas.getContext('2d')!
    
    // Get image data
    const imageData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Parse target color
    const targetColor = this.hexToRgb(color)
    if (!targetColor) {
      throw new Error('Invalid color format')
    }
    
    // Process each pixel
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]
      
      // Calculate color similarity
      const similarity = this.calculateColorSimilarity(
        { r, g, b },
        targetColor
      )
      
      // Determine if pixel should be transparent
      let alpha = a
      
      if (similarity <= tolerance) {
        // Check for shadows and highlights
        const isShadow = shadows && this.isShadowPixel(r, g, b)
        const isHighlight = highlights && this.isHighlightPixel(r, g, b)
        
        if (!isShadow && !isHighlight) {
          alpha = 0 // Make transparent
        } else {
          // Reduce opacity for shadows/highlights
          alpha = Math.floor(a * 0.3)
        }
      } else {
        // Apply spill suppression
        if (spillSuppression > 0) {
          const spillReduction = this.calculateSpillSuppression(
            { r, g, b },
            targetColor,
            spillSuppression
          )
          
          data[i] = Math.max(0, Math.min(255, r - spillReduction.r))
          data[i + 1] = Math.max(0, Math.min(255, g - spillReduction.g))
          data[i + 2] = Math.max(0, Math.min(255, b - spillReduction.b))
        }
      }
      
      // Apply edge softness
      if (alpha > 0 && alpha < 255 && edgeSoftness > 0) {
        alpha = this.applyEdgeSoftness(alpha, similarity, tolerance, edgeSoftness)
      }
      
      data[i + 3] = alpha
    }
    
    resultCtx.putImageData(imageData, 0, 0)
    return resultCanvas
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  private calculateColorSimilarity(
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number }
  ): number {
    // Calculate Euclidean distance in RGB space
    const dr = color1.r - color2.r
    const dg = color1.g - color2.g
    const db = color1.b - color2.b
    
    const distance = Math.sqrt(dr * dr + dg * dg + db * db)
    
    // Convert to percentage (0-100)
    return (distance / Math.sqrt(3 * 255 * 255)) * 100
  }

  private isShadowPixel(r: number, g: number, b: number): boolean {
    // Simple shadow detection based on low brightness
    const brightness = (r + g + b) / 3
    return brightness < 80
  }

  private isHighlightPixel(r: number, g: number, b: number): boolean {
    // Simple highlight detection based on high brightness
    const brightness = (r + g + b) / 3
    return brightness > 200
  }

  private calculateSpillSuppression(
    pixelColor: { r: number; g: number; b: number },
    targetColor: { r: number; g: number; b: number },
    suppressionAmount: number
  ): { r: number; g: number; b: number } {
    const factor = suppressionAmount / 100
    
    // Reduce the target color component
    const reduction = {
      r: Math.max(0, pixelColor.r - targetColor.r) * factor,
      g: Math.max(0, pixelColor.g - targetColor.g) * factor,
      b: Math.max(0, pixelColor.b - targetColor.b) * factor
    }
    
    return reduction
  }

  private applyEdgeSoftness(
    alpha: number,
    similarity: number,
    tolerance: number,
    softness: number
  ): number {
    if (similarity <= tolerance) return alpha
    
    // Calculate softness factor
    const softnessFactor = softness / 100
    const edgeDistance = similarity - tolerance
    const maxEdgeDistance = 100 - tolerance
    
    if (edgeDistance >= maxEdgeDistance) return alpha
    
    // Apply softness
    const softnessMultiplier = 1 - (edgeDistance / maxEdgeDistance) * softnessFactor
    return Math.floor(alpha * softnessMultiplier)
  }

  // Predefined color presets
  getColorPresets(): { name: string; color: string; description: string }[] {
    return [
      { name: 'Green Screen', color: '#00FF00', description: 'Standard green screen' },
      { name: 'Blue Screen', color: '#0000FF', description: 'Standard blue screen' },
      { name: 'Chroma Green', color: '#00B140', description: 'Professional chroma green' },
      { name: 'Chroma Blue', color: '#1800FF', description: 'Professional chroma blue' },
      { name: 'Custom', color: '#00FF00', description: 'Custom color selection' }
    ]
  }

  // Auto-detect green screen color from image
  async detectGreenScreenColor(imageBlob: Blob): Promise<string> {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) throw new Error('Failed to create canvas context')

      const img = new Image()
      const imageUrl = URL.createObjectURL(imageBlob)
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Sample pixels from corners and edges (common green screen areas)
      const samplePoints = [
        { x: 0, y: 0 }, // Top-left
        { x: canvas.width - 1, y: 0 }, // Top-right
        { x: 0, y: canvas.height - 1 }, // Bottom-left
        { x: canvas.width - 1, y: canvas.height - 1 }, // Bottom-right
        { x: Math.floor(canvas.width / 2), y: 0 }, // Top-center
        { x: Math.floor(canvas.width / 2), y: canvas.height - 1 }, // Bottom-center
      ]

      const colorCounts: { [key: string]: number } = {}
      
      for (const point of samplePoints) {
        const imageData = ctx.getImageData(point.x, point.y, 1, 1)
        const [r, g, b] = imageData.data
        const colorKey = `${r},${g},${b}`
        colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1
      }

      // Find the most common color
      let mostCommonColor = ''
      let maxCount = 0
      
      for (const [color, count] of Object.entries(colorCounts)) {
        if (count > maxCount) {
          maxCount = count
          mostCommonColor = color
        }
      }

      URL.revokeObjectURL(imageUrl)

      if (mostCommonColor) {
        const [r, g, b] = mostCommonColor.split(',').map(Number)
        return this.rgbToHex(r, g, b)
      }

      return '#00FF00' // Default green
    } catch (error) {
      console.error('Error detecting green screen color:', error)
      return '#00FF00' // Default green
    }
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  }
}

// Singleton instance
let greenScreenService: GreenScreenService | null = null

export function getGreenScreenService(): GreenScreenService {
  if (!greenScreenService) {
    greenScreenService = new GreenScreenService()
  }
  return greenScreenService
}

// Utility functions
export async function applyGreenScreen(
  imageBlob: Blob,
  options: GreenScreenOptions
): Promise<GreenScreenResult> {
  const service = getGreenScreenService()
  return await service.applyGreenScreen(imageBlob, options)
}

export async function detectGreenScreenColor(imageBlob: Blob): Promise<string> {
  const service = getGreenScreenService()
  return await service.detectGreenScreenColor(imageBlob)
}
