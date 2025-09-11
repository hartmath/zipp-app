"use client"

export interface AudioTrack {
  id: string
  name: string
  audioBlob: Blob
  startTime: number
  duration: number
  volume: number
  muted: boolean
  pan: number // -1 (left) to 1 (right)
  effects: string[] // Effect IDs
  color: string
}

export interface AudioMixer {
  id: string
  name: string
  tracks: AudioTrack[]
  masterVolume: number
  masterMuted: boolean
  sampleRate: number
  bitDepth: number
}

export interface MixResult {
  success: boolean
  audioBlob?: Blob
  error?: string
}

class MultiTrackAudioService {
  private audioContext: AudioContext | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
      throw new Error('Multi-track audio not supported in this browser')
    }
  }

  async createTrack(
    audioBlob: Blob,
    name: string,
    startTime: number = 0
  ): Promise<AudioTrack> {
    try {
      await this.initialize()
      
      // Get audio duration
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
      const duration = audioBuffer.duration

      const track: AudioTrack = {
        id: `track_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name,
        audioBlob,
        startTime,
        duration,
        volume: 1,
        muted: false,
        pan: 0,
        effects: [],
        color: this.getRandomColor()
      }

      return track
    } catch (error) {
      console.error('Error creating track:', error)
      throw new Error('Failed to create audio track')
    }
  }

  async mixTracks(tracks: AudioTrack[], options: {
    sampleRate?: number
    bitDepth?: number
    masterVolume?: number
  } = {}): Promise<MixResult> {
    try {
      await this.initialize()
      if (!this.audioContext) throw new Error('Audio context not initialized')

      const {
        sampleRate = 44100,
        bitDepth = 16,
        masterVolume = 1
      } = options

      // Find the total duration
      const totalDuration = Math.max(...tracks.map(track => track.startTime + track.duration))
      const totalSamples = Math.ceil(totalDuration * sampleRate)

      // Create offline context for mixing
      const offlineContext = new OfflineAudioContext(
        2, // Stereo
        totalSamples,
        sampleRate
      )

      // Create gain nodes for each track
      const trackGains: GainNode[] = []
      const trackPans: StereoPannerNode[] = []

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i]
        if (track.muted) continue

        // Create source
        const arrayBuffer = await track.audioBlob.arrayBuffer()
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer)
        const source = offlineContext.createBufferSource()
        source.buffer = audioBuffer

        // Create gain node for volume
        const gainNode = offlineContext.createGain()
        gainNode.gain.value = track.volume * masterVolume

        // Create pan node
        const panNode = offlineContext.createStereoPanner()
        panNode.pan.value = track.pan

        // Connect: source -> gain -> pan -> destination
        source.connect(gainNode)
        gainNode.connect(panNode)
        panNode.connect(offlineContext.destination)

        // Start playback at the track's start time
        source.start(0, track.startTime)

        trackGains.push(gainNode)
        trackPans.push(panNode)
      }

      // Render the mixed audio
      const mixedBuffer = await offlineContext.startRendering()

      // Convert to blob
      const audioBlob = await this.audioBufferToBlob(mixedBuffer, bitDepth)

      return {
        success: true,
        audioBlob
      }

    } catch (error) {
      console.error('Mix tracks error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async addTrackToMixer(
    mixer: AudioMixer,
    audioBlob: Blob,
    name: string,
    startTime: number = 0
  ): Promise<AudioMixer> {
    const newTrack = await this.createTrack(audioBlob, name, startTime)
    
    return {
      ...mixer,
      tracks: [...mixer.tracks, newTrack]
    }
  }

  async removeTrackFromMixer(
    mixer: AudioMixer,
    trackId: string
  ): Promise<AudioMixer> {
    return {
      ...mixer,
      tracks: mixer.tracks.filter(track => track.id !== trackId)
    }
  }

  async updateTrackProperties(
    mixer: AudioMixer,
    trackId: string,
    updates: Partial<Omit<AudioTrack, 'id' | 'audioBlob' | 'duration'>>
  ): Promise<AudioMixer> {
    return {
      ...mixer,
      tracks: mixer.tracks.map(track =>
        track.id === trackId ? { ...track, ...updates } : track
      )
    }
  }

  async createMixer(name: string): Promise<AudioMixer> {
    return {
      id: `mixer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      tracks: [],
      masterVolume: 1,
      masterMuted: false,
      sampleRate: 44100,
      bitDepth: 16
    }
  }

  async exportMixer(mixer: AudioMixer): Promise<MixResult> {
    return await this.mixTracks(mixer.tracks, {
      sampleRate: mixer.sampleRate,
      bitDepth: mixer.bitDepth,
      masterVolume: mixer.masterMuted ? 0 : mixer.masterVolume
    })
  }

  private getRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  private async audioBufferToBlob(audioBuffer: AudioBuffer, bitDepth: number = 16): Promise<Blob> {
    const numberOfChannels = audioBuffer.numberOfChannels
    const length = audioBuffer.length * numberOfChannels * (bitDepth / 8)
    const arrayBuffer = new ArrayBuffer(44 + length)
    const view = new DataView(arrayBuffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, audioBuffer.sampleRate, true)
    view.setUint32(28, audioBuffer.sampleRate * numberOfChannels * (bitDepth / 8), true)
    view.setUint16(32, numberOfChannels * (bitDepth / 8), true)
    view.setUint16(34, bitDepth, true)
    writeString(36, 'data')
    view.setUint32(40, length, true)

    // Convert audio data
    let offset = 44
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]))
        
        if (bitDepth === 16) {
          view.setInt16(offset, sample * 0x7FFF, true)
          offset += 2
        } else if (bitDepth === 32) {
          view.setInt32(offset, sample * 0x7FFFFFFF, true)
          offset += 4
        }
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  // Utility methods for common operations
  async fadeIn(track: AudioTrack, fadeDuration: number): Promise<AudioTrack> {
    // This would require more complex audio processing
    // For now, return the track as-is
    return track
  }

  async fadeOut(track: AudioTrack, fadeDuration: number): Promise<AudioTrack> {
    // This would require more complex audio processing
    // For now, return the track as-is
    return track
  }

  async crossfade(track1: AudioTrack, track2: AudioTrack, fadeDuration: number): Promise<AudioTrack[]> {
    // This would require more complex audio processing
    // For now, return the tracks as-is
    return [track1, track2]
  }

  // Timeline integration
  async syncWithTimeline(tracks: AudioTrack[], timelineElements: any[]): Promise<AudioTrack[]> {
    // Sync audio tracks with video timeline elements
    return tracks.map(track => {
      // Find corresponding timeline element
      const timelineElement = timelineElements.find(el => 
        el.type === 'audio' && el.url === URL.createObjectURL(track.audioBlob)
      )
      
      if (timelineElement) {
        return {
          ...track,
          startTime: timelineElement.start || 0,
          duration: (timelineElement.end || track.duration) - (timelineElement.start || 0)
        }
      }
      
      return track
    })
  }
}

// Singleton instance
let multiTrackAudioService: MultiTrackAudioService | null = null

export function getMultiTrackAudioService(): MultiTrackAudioService {
  if (!multiTrackAudioService) {
    multiTrackAudioService = new MultiTrackAudioService()
  }
  return multiTrackAudioService
}

// Utility functions
export async function createAudioTrack(
  audioBlob: Blob,
  name: string,
  startTime?: number
): Promise<AudioTrack> {
  const service = getMultiTrackAudioService()
  return await service.createTrack(audioBlob, name, startTime)
}

export async function mixAudioTracks(
  tracks: AudioTrack[],
  options?: {
    sampleRate?: number
    bitDepth?: number
    masterVolume?: number
  }
): Promise<MixResult> {
  const service = getMultiTrackAudioService()
  return await service.mixTracks(tracks, options)
}

export async function createAudioMixer(name: string): Promise<AudioMixer> {
  const service = getMultiTrackAudioService()
  return await service.createMixer(name)
}
