"use client"

export interface ColorGradingOptions {
  brightness: number // -100 to 100
  contrast: number // -100 to 100
  saturation: number // -100 to 100
  hue: number // -180 to 180
  temperature: number // -100 to 100 (blue to orange)
  tint: number // -100 to 100 (green to magenta)
  vibrance: number // -100 to 100
  shadows: number // -100 to 100
  highlights: number // -100 to 100
  midtones: number // -100 to 100
  gamma: number // 0.1 to 3.0
  exposure: number // -3 to 3
  blacks: number // -100 to 100
  whites: number // -100 to 100
}

export interface ColorGradingPreset {
  name: string
  description: string
  options: ColorGradingOptions
}

export interface ColorGradingResult {
  success: boolean
  imageBlob?: Blob
  error?: string
}

class ColorGradingService {
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    this.isInitialized = true
  }

  async applyColorGrading(
    imageBlob: Blob,
    options: ColorGradingOptions
  ): Promise<ColorGradingResult> {
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

      // Apply color grading
      const processedCanvas = await this.processColorGrading(canvas, options)
      
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
      console.error('Color grading error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async processColorGrading(
    canvas: HTMLCanvasElement,
    options: ColorGradingOptions
  ): Promise<HTMLCanvasElement> {
    // Create a new canvas for the result
    const resultCanvas = document.createElement('canvas')
    resultCanvas.width = canvas.width
    resultCanvas.height = canvas.height
    const resultCtx = resultCanvas.getContext('2d')!
    
    // Get image data
    const imageData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Process each pixel
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]
      let a = data[i + 3]
      
      // Apply color grading adjustments
      const processed = this.applyColorAdjustments({ r, g, b, a }, options)
      
      data[i] = processed.r
      data[i + 1] = processed.g
      data[i + 2] = processed.b
      data[i + 3] = processed.a
    }
    
    resultCtx.putImageData(imageData, 0, 0)
    return resultCanvas
  }

  private applyColorAdjustments(
    pixel: { r: number; g: number; b: number; a: number },
    options: ColorGradingOptions
  ): { r: number; g: number; b: number; a: number } {
    let { r, g, b, a } = pixel

    // Convert to 0-1 range
    r = r / 255
    g = g / 255
    b = b / 255

    // Apply brightness
    if (options.brightness !== 0) {
      const brightness = options.brightness / 100
      r = r + brightness
      g = g + brightness
      b = b + brightness
    }

    // Apply contrast
    if (options.contrast !== 0) {
      const contrast = (options.contrast + 100) / 100
      r = (r - 0.5) * contrast + 0.5
      g = (g - 0.5) * contrast + 0.5
      b = (b - 0.5) * contrast + 0.5
    }

    // Apply exposure
    if (options.exposure !== 0) {
      const exposure = Math.pow(2, options.exposure)
      r = r * exposure
      g = g * exposure
      b = b * exposure
    }

    // Apply gamma
    if (options.gamma !== 1) {
      r = Math.pow(r, 1 / options.gamma)
      g = Math.pow(g, 1 / options.gamma)
      b = Math.pow(b, 1 / options.gamma)
    }

    // Convert to HSL for hue and saturation adjustments
    let hsl = this.rgbToHsl(r, g, b)

    // Apply hue shift
    if (options.hue !== 0) {
      hsl.h = (hsl.h + options.hue / 180) % 1
      if (hsl.h < 0) hsl.h += 1
    }

    // Apply saturation
    if (options.saturation !== 0) {
      const saturation = (options.saturation + 100) / 100
      hsl.s = Math.min(1, hsl.s * saturation)
    }

    // Apply vibrance (selective saturation)
    if (options.vibrance !== 0) {
      const vibrance = (options.vibrance + 100) / 100
      if (hsl.s < 0.5) {
        hsl.s = hsl.s * vibrance
      } else {
        hsl.s = hsl.s + (1 - hsl.s) * (vibrance - 1)
      }
    }

    // Convert back to RGB
    const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l)
    r = rgb.r
    g = rgb.g
    b = rgb.b

    // Apply temperature (blue to orange)
    if (options.temperature !== 0) {
      const temp = options.temperature / 100
      if (temp > 0) {
        // Warmer (more orange)
        r = r + temp * 0.1
        b = b - temp * 0.1
      } else {
        // Cooler (more blue)
        r = r + temp * 0.1
        b = b - temp * 0.1
      }
    }

    // Apply tint (green to magenta)
    if (options.tint !== 0) {
      const tint = options.tint / 100
      if (tint > 0) {
        // More magenta
        r = r + tint * 0.1
        b = b + tint * 0.1
        g = g - tint * 0.1
      } else {
        // More green
        r = r + tint * 0.1
        b = b + tint * 0.1
        g = g - tint * 0.1
      }
    }

    // Apply shadows/highlights/midtones
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b
    
    if (luminance < 0.3 && options.shadows !== 0) {
      // Shadows
      const shadowAdjust = options.shadows / 100
      r = r + shadowAdjust * 0.1
      g = g + shadowAdjust * 0.1
      b = b + shadowAdjust * 0.1
    } else if (luminance > 0.7 && options.highlights !== 0) {
      // Highlights
      const highlightAdjust = options.highlights / 100
      r = r + highlightAdjust * 0.1
      g = g + highlightAdjust * 0.1
      b = b + highlightAdjust * 0.1
    } else if (luminance >= 0.3 && luminance <= 0.7 && options.midtones !== 0) {
      // Midtones
      const midtoneAdjust = options.midtones / 100
      r = r + midtoneAdjust * 0.1
      g = g + midtoneAdjust * 0.1
      b = b + midtoneAdjust * 0.1
    }

    // Apply blacks and whites
    if (options.blacks !== 0) {
      const blackAdjust = options.blacks / 100
      const blackLevel = Math.min(r, g, b)
      if (blackLevel < 0.1) {
        r = r + blackAdjust * 0.1
        g = g + blackAdjust * 0.1
        b = b + blackAdjust * 0.1
      }
    }

    if (options.whites !== 0) {
      const whiteAdjust = options.whites / 100
      const whiteLevel = Math.max(r, g, b)
      if (whiteLevel > 0.9) {
        r = r + whiteAdjust * 0.1
        g = g + whiteAdjust * 0.1
        b = b + whiteAdjust * 0.1
      }
    }

    // Clamp values to 0-1 range
    r = Math.max(0, Math.min(1, r))
    g = Math.max(0, Math.min(1, g))
    b = Math.max(0, Math.min(1, b))

    // Convert back to 0-255 range
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
      a: a
    }
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return { h, s, l }
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b

    if (s === 0) {
      r = g = b = l // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }

    return { r, g, b }
  }

  getColorGradingPresets(): ColorGradingPreset[] {
    return [
      {
        name: 'Natural',
        description: 'Natural color correction',
        options: {
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
        }
      },
      {
        name: 'Vibrant',
        description: 'Enhanced colors and contrast',
        options: {
          brightness: 5,
          contrast: 15,
          saturation: 20,
          hue: 0,
          temperature: 5,
          tint: 0,
          vibrance: 25,
          shadows: 10,
          highlights: -5,
          midtones: 5,
          gamma: 1.1,
          exposure: 0.2,
          blacks: 5,
          whites: -5
        }
      },
      {
        name: 'Cinematic',
        description: 'Film-like color grading',
        options: {
          brightness: -5,
          contrast: 20,
          saturation: -10,
          hue: 0,
          temperature: 10,
          tint: 5,
          vibrance: 0,
          shadows: 15,
          highlights: -10,
          midtones: 0,
          gamma: 1.2,
          exposure: -0.1,
          blacks: 10,
          whites: -10
        }
      },
      {
        name: 'Warm',
        description: 'Warm, golden tones',
        options: {
          brightness: 10,
          contrast: 5,
          saturation: 10,
          hue: 0,
          temperature: 25,
          tint: 5,
          vibrance: 15,
          shadows: 5,
          highlights: 0,
          midtones: 10,
          gamma: 1.05,
          exposure: 0.3,
          blacks: 0,
          whites: 0
        }
      },
      {
        name: 'Cool',
        description: 'Cool, blue tones',
        options: {
          brightness: 5,
          contrast: 10,
          saturation: 5,
          hue: 0,
          temperature: -20,
          tint: -5,
          vibrance: 10,
          shadows: 0,
          highlights: 5,
          midtones: 0,
          gamma: 1.1,
          exposure: 0.1,
          blacks: 0,
          whites: 0
        }
      },
      {
        name: 'High Contrast',
        description: 'Dramatic high contrast',
        options: {
          brightness: 0,
          contrast: 40,
          saturation: 0,
          hue: 0,
          temperature: 0,
          tint: 0,
          vibrance: 0,
          shadows: 20,
          highlights: -20,
          midtones: 0,
          gamma: 1.3,
          exposure: 0,
          blacks: 15,
          whites: -15
        }
      },
      {
        name: 'Desaturated',
        description: 'Muted, desaturated look',
        options: {
          brightness: 0,
          contrast: 5,
          saturation: -30,
          hue: 0,
          temperature: 0,
          tint: 0,
          vibrance: -20,
          shadows: 0,
          highlights: 0,
          midtones: 0,
          gamma: 1,
          exposure: 0,
          blacks: 0,
          whites: 0
        }
      },
      {
        name: 'Vintage',
        description: 'Vintage film look',
        options: {
          brightness: 5,
          contrast: 15,
          saturation: -15,
          hue: 5,
          temperature: 15,
          tint: 10,
          vibrance: 0,
          shadows: 10,
          highlights: -5,
          midtones: 5,
          gamma: 1.15,
          exposure: 0.1,
          blacks: 5,
          whites: -5
        }
      }
    ]
  }
}

// Singleton instance
let colorGradingService: ColorGradingService | null = null

export function getColorGradingService(): ColorGradingService {
  if (!colorGradingService) {
    colorGradingService = new ColorGradingService()
  }
  return colorGradingService
}

// Utility functions
export async function applyColorGrading(
  imageBlob: Blob,
  options: ColorGradingOptions
): Promise<ColorGradingResult> {
  const service = getColorGradingService()
  return await service.applyColorGrading(imageBlob, options)
}

export function getColorGradingPresets(): ColorGradingPreset[] {
  const service = getColorGradingService()
  return service.getColorGradingPresets()
}
