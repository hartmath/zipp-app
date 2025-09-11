"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { 
  Music, 
  Play, 
  Pause, 
  Upload, 
  Download, 
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Settings,
  Loader2,
  Sliders
} from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  getMultiTrackAudioService,
  AudioTrack,
  AudioMixer,
  MixResult
} from "@/lib/multi-track-audio"

interface MultiTrackPanelProps {
  onMixComplete?: (mixedBlob: Blob) => void
}

export function MultiTrackPanel({ 
  onMixComplete 
}: MultiTrackPanelProps) {
  const [mixer, setMixer] = useState<AudioMixer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMixing, setIsMixing] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const [masterVolume, setMasterVolume] = useState(1)
  const [masterMuted, setMasterMuted] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const multiTrackService = getMultiTrackAudioService()

  useEffect(() => {
    // Initialize mixer
    initializeMixer()
  }, [])

  const initializeMixer = async () => {
    try {
      const newMixer = await multiTrackService.createMixer('Main Mix')
      setMixer(newMixer)
    } catch (error) {
      console.error('Failed to initialize mixer:', error)
    }
  }

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !mixer) return

    try {
      for (const file of files) {
        const track = await multiTrackService.createTrack(file, file.name)
        const updatedMixer = await multiTrackService.addTrackToMixer(mixer, file, file.name)
        setMixer(updatedMixer)
      }
    } catch (error) {
      console.error('Error adding tracks:', error)
      alert('Failed to add audio tracks. Please try again.')
    }
  }

  const handleRemoveTrack = async (trackId: string) => {
    if (!mixer) return

    try {
      const updatedMixer = await multiTrackService.removeTrackFromMixer(mixer, trackId)
      setMixer(updatedMixer)
      if (selectedTrack === trackId) {
        setSelectedTrack(null)
      }
    } catch (error) {
      console.error('Error removing track:', error)
    }
  }

  const handleTrackPropertyChange = async (
    trackId: string,
    property: keyof AudioTrack,
    value: any
  ) => {
    if (!mixer) return

    try {
      const updates = { [property]: value }
      const updatedMixer = await multiTrackService.updateTrackProperties(mixer, trackId, updates)
      setMixer(updatedMixer)
    } catch (error) {
      console.error('Error updating track properties:', error)
    }
  }

  const handleMixTracks = async () => {
    if (!mixer || mixer.tracks.length === 0) return

    try {
      setIsMixing(true)
      const result = await multiTrackService.exportMixer(mixer)
      
      if (result.success && result.audioBlob) {
        onMixComplete?.(result.audioBlob)
        alert('Audio mix completed successfully!')
      } else {
        alert(`Failed to mix tracks: ${result.error}`)
      }
    } catch (error) {
      console.error('Error mixing tracks:', error)
      alert('Failed to mix tracks. Please try again.')
    } finally {
      setIsMixing(false)
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

  const handleMasterVolumeChange = (volume: number) => {
    setMasterVolume(volume)
    if (mixer) {
      setMixer({ ...mixer, masterVolume: volume })
    }
  }

  const handleMasterMuteToggle = () => {
    setMasterMuted(!masterMuted)
    if (mixer) {
      setMixer({ ...mixer, masterMuted: !masterMuted })
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTotalDuration = (): number => {
    if (!mixer) return 0
    return Math.max(...mixer.tracks.map(track => track.startTime + track.duration), 0)
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Multi-Track Audio</h3>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={handleAudioUpload}
              className="hidden"
              id="audio-upload"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('audio-upload')?.click()}
              className="h-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMixTracks}
              disabled={!mixer || mixer.tracks.length === 0 || isMixing}
              className="h-8"
            >
              {isMixing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sliders className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Master Controls */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">Master</span>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={masterVolume}
                onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMasterMuteToggle}
                className="h-6 w-6 p-0"
              >
                {masterMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              </Button>
            </div>
            <span className="text-xs text-gray-400 w-8">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">Duration</span>
            <span className="text-xs text-white">
              {formatTime(getTotalDuration())}
            </span>
          </div>
        </div>
      </div>

      {/* Tracks List */}
      <ScrollArea className="flex-1 p-3">
        {!mixer || mixer.tracks.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Music className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">No audio tracks</p>
            <p className="text-xs">Upload audio files to start mixing</p>
          </div>
        ) : (
          <div className="space-y-2">
            {mixer.tracks.map((track) => (
              <div
                key={track.id}
                className={cn(
                  "p-3 bg-gray-800 rounded border border-gray-700",
                  selectedTrack === track.id && "border-blue-500 bg-blue-900/20"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: track.color }}
                    />
                    <h4 className="text-sm text-white font-medium">{track.name}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTrack(
                        selectedTrack === track.id ? null : track.id
                      )}
                      className="h-6 w-6 p-0"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTrack(track.id)}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-12">Volume</span>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={track.volume}
                        onChange={(e) => handleTrackPropertyChange(track.id, 'volume', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTrackPropertyChange(track.id, 'muted', !track.muted)}
                        className="h-5 w-5 p-0"
                      >
                        {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                      </Button>
                    </div>
                    <span className="text-xs text-gray-400 w-8">
                      {Math.round(track.volume * 100)}%
                    </span>
                  </div>
                  
                  {/* Pan Control */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-12">Pan</span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs text-gray-400">L</span>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.1"
                        value={track.pan}
                        onChange={(e) => handleTrackPropertyChange(track.id, 'pan', parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-gray-400">R</span>
                    </div>
                    <span className="text-xs text-gray-400 w-8">
                      {track.pan > 0 ? `R${Math.round(track.pan * 100)}` : 
                       track.pan < 0 ? `L${Math.round(Math.abs(track.pan) * 100)}` : 'C'}
                    </span>
                  </div>
                  
                  {/* Timing Info */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-12">Timing</span>
                    <span className="text-xs text-white">
                      {formatTime(track.startTime)} - {formatTime(track.startTime + track.duration)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Playback Controls */}
      {mixer && mixer.tracks.length > 0 && (
        <div className="p-3 border-t border-gray-700">
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
                <span className="text-xs text-gray-400">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1 bg-gray-700 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full"
                    style={{ width: `${(currentTime / getTotalDuration()) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">
                  {formatTime(getTotalDuration())}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
