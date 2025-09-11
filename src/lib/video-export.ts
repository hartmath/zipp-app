"use client"

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

export interface ExportOptions {
  format: 'mp4' | 'webm'
  quality: 'low' | 'medium' | 'high'
  fps: number
  width: number
  height: number
}

export interface ExportResult {
  success: boolean
  blob?: Blob
  error?: string
  progress?: number
}

class VideoExporter {
  private ffmpeg: FFmpeg | null = null
  private isLoaded = false

  async initialize(): Promise<void> {
    if (this.isLoaded) return

    this.ffmpeg = new FFmpeg()
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    this.isLoaded = true
  }

  async exportVideo(
    timelineElements: any[],
    options: ExportOptions,
    onProgress?: (progress: number) => void
  ): Promise<ExportResult> {
    try {
      if (!this.ffmpeg || !this.isLoaded) {
        await this.initialize()
      }

      if (!this.ffmpeg) {
        throw new Error('FFmpeg failed to initialize')
      }

      // Create a simple video from timeline elements
      const canvas = document.createElement('canvas')
      canvas.width = options.width
      canvas.height = options.height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Failed to create canvas context')
      }

      // Render frames
      const fps = options.fps
      const duration = Math.max(...timelineElements.map(el => el.end || 0), 10)
      const totalFrames = Math.ceil(duration * fps)
      
      const frames: string[] = []
      
      for (let frame = 0; frame < totalFrames; frame++) {
        const time = frame / fps
        
        // Clear canvas
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Render timeline elements at this time
        timelineElements.forEach(element => {
          if (time >= element.start && time <= element.end) {
            this.renderElement(ctx, element, time, canvas.width, canvas.height)
          }
        })
        
        // Convert frame to blob
        const frameBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob)
          }, 'image/png')
        })
        
        const frameData = await fetchFile(frameBlob)
        const frameName = `frame_${frame.toString().padStart(6, '0')}.png`
        
        await this.ffmpeg.writeFile(frameName, frameData)
        frames.push(frameName)
        
        // Update progress
        const progress = (frame / totalFrames) * 100
        onProgress?.(progress)
      }

      // Create video from frames
      const outputName = `output.${options.format}`
      const qualityMap = {
        low: '23',
        medium: '20',
        high: '18'
      }

      await this.ffmpeg.exec([
        '-framerate', fps.toString(),
        '-i', 'frame_%06d.png',
        '-c:v', options.format === 'mp4' ? 'libx264' : 'libvpx-vp9',
        '-crf', qualityMap[options.quality],
        '-pix_fmt', 'yuv420p',
        '-y',
        outputName
      ])

      // Get the output file
      const data = await this.ffmpeg.readFile(outputName)
      const blob = new Blob([data], { 
        type: options.format === 'mp4' ? 'video/mp4' : 'video/webm' 
      })

      // Clean up
      frames.forEach(frame => {
        this.ffmpeg?.deleteFile(frame)
      })
      this.ffmpeg?.deleteFile(outputName)

      return {
        success: true,
        blob
      }

    } catch (error) {
      console.error('Export error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private renderElement(
    ctx: CanvasRenderingContext2D,
    element: any,
    time: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const properties = element.properties || {}
    
    ctx.save()
    
    // Apply transformations
    ctx.globalAlpha = (properties.opacity || 100) / 100
    ctx.translate(canvasWidth / 2, canvasHeight / 2)
    ctx.rotate((properties.rotation || 0) * Math.PI / 180)
    ctx.scale((properties.scale || 100) / 100, (properties.scale || 100) / 100)
    
    if (element.type === 'text') {
      ctx.fillStyle = properties.color || '#ffffff'
      ctx.font = `${properties.fontSize || 16}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(element.text || element.name, 0, 0)
    } else if (element.type === 'image' && element.url) {
      // For images, we'd need to load and draw them
      // This is a simplified version
      ctx.fillStyle = '#333333'
      ctx.fillRect(-50, -50, 100, 100)
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Image', 0, 0)
    } else if (element.type === 'video' && element.url) {
      // For videos, we'd need to extract frames
      // This is a simplified version
      ctx.fillStyle = '#666666'
      ctx.fillRect(-75, -50, 150, 100)
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Video', 0, 0)
    }
    
    ctx.restore()
  }

  async cleanup(): Promise<void> {
    if (this.ffmpeg) {
      await this.ffmpeg.terminate()
      this.ffmpeg = null
      this.isLoaded = false
    }
  }
}

// Singleton instance
let exporter: VideoExporter | null = null

export function getVideoExporter(): VideoExporter {
  if (!exporter) {
    exporter = new VideoExporter()
  }
  return exporter
}

export async function exportTimelineToVideo(
  timelineElements: any[],
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<ExportResult> {
  const videoExporter = getVideoExporter()
  return await videoExporter.exportVideo(timelineElements, options, onProgress)
}
