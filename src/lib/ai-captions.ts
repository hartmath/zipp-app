"use client"

export interface CaptionSegment {
  id: string
  text: string
  start: number
  end: number
  confidence: number
}

export interface CaptionOptions {
  language?: string
  maxAlternatives?: number
  enableAutomaticPunctuation?: boolean
  enableWordTimeOffsets?: boolean
}

class AICaptionsService {
  private isInitialized = false
  private recognition: SpeechRecognition | null = null

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser')
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()
    
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'
    this.recognition.maxAlternatives = 1

    this.isInitialized = true
  }

  async transcribeAudio(
    audioBlob: Blob,
    options: CaptionOptions = {}
  ): Promise<CaptionSegment[]> {
    try {
      await this.initialize()
      
      // For demo purposes, we'll simulate transcription
      // In a real implementation, you'd use Web Speech API or a service like Google Cloud Speech-to-Text
      return this.simulateTranscription(audioBlob, options)
    } catch (error) {
      console.error('Transcription error:', error)
      throw new Error('Failed to transcribe audio')
    }
  }

  private simulateTranscription(audioBlob: Blob, options: CaptionOptions): CaptionSegment[] {
    // Simulate transcription with realistic timing
    const duration = this.estimateAudioDuration(audioBlob)
    const segments: CaptionSegment[] = []
    
    const sampleTexts = [
      "Welcome to our amazing video editor",
      "This is a demonstration of automatic captions",
      "You can edit your videos with professional tools",
      "Add effects, filters, and transitions easily",
      "Export your content in high quality",
      "Share your creations with the world",
      "Thank you for using our video editor",
      "Create amazing content today"
    ]

    let currentTime = 0
    let segmentId = 1

    for (const text of sampleTexts) {
      if (currentTime >= duration) break
      
      const segmentDuration = Math.min(3 + Math.random() * 2, duration - currentTime)
      
      segments.push({
        id: `caption_${segmentId++}`,
        text,
        start: currentTime,
        end: currentTime + segmentDuration,
        confidence: 0.85 + Math.random() * 0.15
      })
      
      currentTime += segmentDuration
    }

    return segments
  }

  private estimateAudioDuration(audioBlob: Blob): number {
    // Rough estimation based on file size
    // In a real implementation, you'd decode the audio to get exact duration
    const sizeInMB = audioBlob.size / (1024 * 1024)
    return Math.max(10, sizeInMB * 2) // Rough estimate: 2 seconds per MB
  }

  async generateCaptionsFromVideo(
    videoBlob: Blob,
    options: CaptionOptions = {}
  ): Promise<CaptionSegment[]> {
    try {
      // Extract audio from video for transcription
      const audioBlob = await this.extractAudioFromVideo(videoBlob)
      return await this.transcribeAudio(audioBlob, options)
    } catch (error) {
      console.error('Video caption generation error:', error)
      throw new Error('Failed to generate captions from video')
    }
  }

  private async extractAudioFromVideo(videoBlob: Blob): Promise<Blob> {
    // Create a video element to extract audio
    const video = document.createElement('video')
    video.src = URL.createObjectURL(videoBlob)
    
    return new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        // For demo purposes, return the original blob
        // In a real implementation, you'd use Web Audio API or FFmpeg to extract audio
        resolve(videoBlob)
      }
      video.onerror = () => reject(new Error('Failed to load video'))
    })
  }

  async addCaptionsToTimeline(
    captions: CaptionSegment[],
    timelineElements: any[]
  ): Promise<any[]> {
    const newElements = captions.map(caption => ({
      id: caption.id,
      type: 'caption',
      name: caption.text,
      text: caption.text,
      start: caption.start,
      end: caption.end,
      properties: {
        opacity: 100,
        fontSize: 16,
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 8,
        borderRadius: 4,
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        position: 'bottom'
      }
    }))

    return [...timelineElements, ...newElements]
  }

  async editCaption(
    captionId: string,
    newText: string,
    timelineElements: any[]
  ): Promise<any[]> {
    return timelineElements.map(element => {
      if (element.id === captionId && element.type === 'caption') {
        return {
          ...element,
          text: newText,
          name: newText
        }
      }
      return element
    })
  }

  async deleteCaption(
    captionId: string,
    timelineElements: any[]
  ): Promise<any[]> {
    return timelineElements.filter(element => element.id !== captionId)
  }

  async adjustCaptionTiming(
    captionId: string,
    start: number,
    end: number,
    timelineElements: any[]
  ): Promise<any[]> {
    return timelineElements.map(element => {
      if (element.id === captionId && element.type === 'caption') {
        return {
          ...element,
          start,
          end
        }
      }
      return element
    })
  }
}

// Singleton instance
let captionsService: AICaptionsService | null = null

export function getCaptionsService(): AICaptionsService {
  if (!captionsService) {
    captionsService = new AICaptionsService()
  }
  return captionsService
}

// Utility functions
export async function generateCaptionsForVideo(
  videoBlob: Blob,
  options?: CaptionOptions
): Promise<CaptionSegment[]> {
  const service = getCaptionsService()
  return await service.generateCaptionsFromVideo(videoBlob, options)
}

export async function addCaptionsToProject(
  captions: CaptionSegment[],
  timelineElements: any[]
): Promise<any[]> {
  const service = getCaptionsService()
  return await service.addCaptionsToTimeline(captions, timelineElements)
}

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
