"use client"

export interface AudioEffect {
  id: string
  name: string
  type: 'reverb' | 'echo' | 'pitch' | 'distortion' | 'filter' | 'compressor'
  parameters: Record<string, number>
  enabled: boolean
}

export interface AudioEffectResult {
  success: boolean
  audioBlob?: Blob
  error?: string
}

class AudioEffectsService {
  private audioContext: AudioContext | null = null
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
      throw new Error('Audio effects not supported in this browser')
    }
  }

  async applyEffects(
    audioBlob: Blob,
    effects: AudioEffect[]
  ): Promise<AudioEffectResult> {
    try {
      await this.initialize()
      if (!this.audioContext) throw new Error('Audio context not initialized')

      // Convert blob to audio buffer
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      // Create offline context for processing
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      )

      // Create source
      const source = offlineContext.createBufferSource()
      source.buffer = audioBuffer

      // Apply effects
      let currentNode: AudioNode = source
      
      for (const effect of effects) {
        if (!effect.enabled) continue
        
        const effectNode = await this.createEffectNode(offlineContext, effect)
        if (effectNode) {
          currentNode.connect(effectNode)
          currentNode = effectNode
        }
      }

      // Connect to destination
      currentNode.connect(offlineContext.destination)

      // Start processing
      source.start(0)

      // Render audio
      const processedBuffer = await offlineContext.startRendering()

      // Convert back to blob
      const processedBlob = await this.audioBufferToBlob(processedBuffer)

      return {
        success: true,
        audioBlob: processedBlob
      }

    } catch (error) {
      console.error('Audio effects error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async createEffectNode(
    context: OfflineAudioContext,
    effect: AudioEffect
  ): Promise<AudioNode | null> {
    switch (effect.type) {
      case 'reverb':
        return this.createReverbNode(context, effect.parameters)
      case 'echo':
        return this.createEchoNode(context, effect.parameters)
      case 'pitch':
        return this.createPitchNode(context, effect.parameters)
      case 'distortion':
        return this.createDistortionNode(context, effect.parameters)
      case 'filter':
        return this.createFilterNode(context, effect.parameters)
      case 'compressor':
        return this.createCompressorNode(context, effect.parameters)
      default:
        return null
    }
  }

  private createReverbNode(context: OfflineAudioContext, params: Record<string, number>): AudioNode {
    const convolver = context.createConvolver()
    
    // Create impulse response for reverb
    const length = context.sampleRate * (params.duration || 2)
    const impulse = context.createBuffer(2, length, context.sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, params.decay || 2)
      }
    }
    
    convolver.buffer = impulse
    return convolver
  }

  private createEchoNode(context: OfflineAudioContext, params: Record<string, number>): AudioNode {
    const delay = context.createDelay()
    const feedback = context.createGain()
    const wetGain = context.createGain()
    
    delay.delayTime.value = params.delay || 0.3
    feedback.gain.value = params.feedback || 0.3
    wetGain.gain.value = params.wet || 0.5
    
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wetGain)
    
    return wetGain
  }

  private createPitchNode(context: OfflineAudioContext, params: Record<string, number>): AudioNode {
    // Simple pitch shifting using playback rate
    const source = context.createBufferSource()
    source.playbackRate.value = Math.pow(2, (params.semitones || 0) / 12)
    return source
  }

  private createDistortionNode(context: OfflineAudioContext, params: Record<string, number>): AudioNode {
    const distortion = context.createWaveShaper()
    
    const amount = params.amount || 50
    const samples = 44100
    const curve = new Float32Array(samples)
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1
      curve[i] = Math.tanh(x * amount)
    }
    
    distortion.curve = curve
    distortion.oversample = '4x'
    
    return distortion
  }

  private createFilterNode(context: OfflineAudioContext, params: Record<string, number>): AudioNode {
    const filter = context.createBiquadFilter()
    
    filter.type = (params.type as BiquadFilterType) || 'lowpass'
    filter.frequency.value = params.frequency || 1000
    filter.Q.value = params.Q || 1
    filter.gain.value = params.gain || 0
    
    return filter
  }

  private createCompressorNode(context: OfflineAudioContext, params: Record<string, number>): AudioNode {
    const compressor = context.createDynamicsCompressor()
    
    compressor.threshold.value = params.threshold || -24
    compressor.knee.value = params.knee || 30
    compressor.ratio.value = params.ratio || 12
    compressor.attack.value = params.attack || 0.003
    compressor.release.value = params.release || 0.25
    
    return compressor
  }

  private async audioBufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
    const numberOfChannels = audioBuffer.numberOfChannels
    const length = audioBuffer.length * numberOfChannels * 2 // 16-bit
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
    view.setUint32(28, audioBuffer.sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length, true)

    // Convert audio data
    let offset = 44
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample * 0x7FFF, true)
        offset += 2
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  getDefaultEffects(): AudioEffect[] {
    return [
      {
        id: 'reverb',
        name: 'Reverb',
        type: 'reverb',
        parameters: {
          duration: 2,
          decay: 2,
          wet: 0.3
        },
        enabled: false
      },
      {
        id: 'echo',
        name: 'Echo',
        type: 'echo',
        parameters: {
          delay: 0.3,
          feedback: 0.3,
          wet: 0.5
        },
        enabled: false
      },
      {
        id: 'pitch',
        name: 'Pitch Shift',
        type: 'pitch',
        parameters: {
          semitones: 0
        },
        enabled: false
      },
      {
        id: 'distortion',
        name: 'Distortion',
        type: 'distortion',
        parameters: {
          amount: 50
        },
        enabled: false
      },
      {
        id: 'lowpass',
        name: 'Low Pass Filter',
        type: 'filter',
        parameters: {
          type: 'lowpass',
          frequency: 1000,
          Q: 1,
          gain: 0
        },
        enabled: false
      },
      {
        id: 'highpass',
        name: 'High Pass Filter',
        type: 'filter',
        parameters: {
          type: 'highpass',
          frequency: 200,
          Q: 1,
          gain: 0
        },
        enabled: false
      },
      {
        id: 'compressor',
        name: 'Compressor',
        type: 'compressor',
        parameters: {
          threshold: -24,
          knee: 30,
          ratio: 12,
          attack: 0.003,
          release: 0.25
        },
        enabled: false
      }
    ]
  }
}

// Singleton instance
let audioEffectsService: AudioEffectsService | null = null

export function getAudioEffectsService(): AudioEffectsService {
  if (!audioEffectsService) {
    audioEffectsService = new AudioEffectsService()
  }
  return audioEffectsService
}

// Utility functions
export async function applyAudioEffects(
  audioBlob: Blob,
  effects: AudioEffect[]
): Promise<AudioEffectResult> {
  const service = getAudioEffectsService()
  return await service.applyEffects(audioBlob, effects)
}

export function getDefaultAudioEffects(): AudioEffect[] {
  const service = getAudioEffectsService()
  return service.getDefaultEffects()
}
