"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Music, 
  Play, 
  Pause, 
  Upload, 
  Download, 
  Settings,
  Volume2,
  VolumeX,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  getAudioEffectsService,
  AudioEffect,
  AudioEffectResult
} from "@/lib/audio-effects"

interface AudioEffectsPanelProps {
  onAudioProcessed?: (processedBlob: Blob) => void
}

export function AudioEffectsPanel({ 
  onAudioProcessed 
}: AudioEffectsPanelProps) {
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [effects, setEffects] = useState<AudioEffect[]>([])
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const audioEffectsService = getAudioEffectsService()

  useState(() => {
    // Initialize with default effects
    setEffects(audioEffectsService.getDefaultEffects())
  })

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedAudio(file)
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
      setProcessedAudioUrl(null)
    }
  }

  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleMuteToggle = () => {
    setMuted(!muted)
    if (audioRef.current) {
      audioRef.current.muted = !muted
    }
  }

  const handleEffectToggle = (effectId: string) => {
    setEffects(prev => prev.map(effect => 
      effect.id === effectId 
        ? { ...effect, enabled: !effect.enabled }
        : effect
    ))
  }

  const handleParameterChange = (effectId: string, parameter: string, value: number) => {
    setEffects(prev => prev.map(effect => 
      effect.id === effectId 
        ? { ...effect, parameters: { ...effect.parameters, [parameter]: value } }
        : effect
    ))
  }

  const handleApplyEffects = async () => {
    if (!selectedAudio) return

    try {
      setIsProcessing(true)
      
      const enabledEffects = effects.filter(effect => effect.enabled)
      const result = await audioEffectsService.applyEffects(selectedAudio, enabledEffects)
      
      if (result.success && result.audioBlob) {
        const url = URL.createObjectURL(result.audioBlob)
        setProcessedAudioUrl(url)
        onAudioProcessed?.(result.audioBlob)
      } else {
        alert(`Failed to apply effects: ${result.error}`)
      }

    } catch (error) {
      console.error('Error applying effects:', error)
      alert('Failed to apply effects. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    const url = processedAudioUrl || audioUrl
    if (!url) return

    const a = document.createElement('a')
    a.href = url
    a.download = 'processed-audio.wav'
    a.click()
  }

  const handleAddToTimeline = () => {
    const url = processedAudioUrl || audioUrl
    if (!url) return

    const newElement = {
      id: Math.random().toString(36).slice(2),
      type: 'audio',
      name: 'Processed Audio',
      url: url,
      start: 0,
      end: 10,
      properties: {
        volume: volume,
        muted: muted
      }
    }
    
    const existingElements = JSON.parse(sessionStorage.getItem('timelineElements') || '[]')
    existingElements.push(newElement)
    sessionStorage.setItem('timelineElements', JSON.stringify(existingElements))
    window.dispatchEvent(new CustomEvent('timelineUpdated'))
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Audio Effects</h3>
        
        {/* Upload Section */}
        <div className="space-y-2">
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
            id="audio-upload"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('audio-upload')?.click()}
            className="w-full h-8 text-xs"
          >
            <Upload className="h-3 w-3 mr-2" />
            {selectedAudio ? selectedAudio.name : 'Select Audio File'}
          </Button>
        </div>
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="p-3 border-b border-gray-700">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                className="h-8 w-8 p-0"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMuteToggle}
                    className="h-6 w-6 p-0"
                  >
                    {muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <audio
              ref={audioRef}
              src={processedAudioUrl || audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Effects */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {effects.map((effect) => (
            <div key={effect.id} className="bg-gray-800 rounded border border-gray-700 p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-white font-medium">{effect.name}</h4>
                <Button
                  variant={effect.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleEffectToggle(effect.id)}
                  className="h-6 text-xs"
                >
                  {effect.enabled ? 'ON' : 'OFF'}
                </Button>
              </div>
              
              {effect.enabled && (
                <div className="space-y-2">
                  {Object.entries(effect.parameters).map(([param, value]) => (
                    <div key={param}>
                      <label className="text-xs text-gray-400 mb-1 block capitalize">
                        {param}: {typeof value === 'number' ? value.toFixed(2) : value}
                      </label>
                      <input
                        type="range"
                        min={getParameterMin(param)}
                        max={getParameterMax(param)}
                        step={getParameterStep(param)}
                        value={value}
                        onChange={(e) => handleParameterChange(effect.id, param, parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Actions */}
      {audioUrl && (
        <div className="p-3 border-t border-gray-700">
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyEffects}
              disabled={isProcessing || effects.filter(e => e.enabled).length === 0}
              className="w-full h-8 text-xs"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Settings className="h-3 w-3 mr-2" />
                  Apply Effects
                </>
              )}
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-1 h-8 text-xs"
              >
                <Download className="h-3 w-3 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToTimeline}
                className="flex-1 h-8 text-xs"
              >
                <Music className="h-3 w-3 mr-2" />
                Add to Timeline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions for parameter ranges
function getParameterMin(param: string): number {
  switch (param) {
    case 'duration': return 0.1
    case 'decay': return 0.1
    case 'wet': return 0
    case 'delay': return 0.01
    case 'feedback': return 0
    case 'semitones': return -24
    case 'amount': return 0
    case 'frequency': return 20
    case 'Q': return 0.1
    case 'gain': return -40
    case 'threshold': return -60
    case 'knee': return 0
    case 'ratio': return 1
    case 'attack': return 0
    case 'release': return 0.001
    default: return 0
  }
}

function getParameterMax(param: string): number {
  switch (param) {
    case 'duration': return 10
    case 'decay': return 10
    case 'wet': return 1
    case 'delay': return 2
    case 'feedback': return 0.99
    case 'semitones': return 24
    case 'amount': return 100
    case 'frequency': return 20000
    case 'Q': return 30
    case 'gain': return 40
    case 'threshold': return 0
    case 'knee': return 40
    case 'ratio': return 20
    case 'attack': return 1
    case 'release': return 1
    default: return 100
  }
}

function getParameterStep(param: string): number {
  switch (param) {
    case 'duration': return 0.1
    case 'decay': return 0.1
    case 'wet': return 0.01
    case 'delay': return 0.01
    case 'feedback': return 0.01
    case 'semitones': return 1
    case 'amount': return 1
    case 'frequency': return 1
    case 'Q': return 0.1
    case 'gain': return 1
    case 'threshold': return 1
    case 'knee': return 1
    case 'ratio': return 0.1
    case 'attack': return 0.001
    case 'release': return 0.001
    default: return 0.01
  }
}
