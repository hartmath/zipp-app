"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Move, RotateCcw, RotateCw, Play, Pause, SkipBack, SkipForward, Scissors, Crop as CropIcon, SlidersHorizontal, Type as TypeIcon, Music, Sparkles, Wand2, RotateCw as RotateIcon, Gauge, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { loadBlobUrl, saveBlob } from '@/lib/media-store';
import { Timeline } from '@/components/editor/timeline';
import { useToast } from '@/hooks/use-toast';
import { ReactNode } from 'react';

type MediaKind = 'image' | 'video';
type MediaClip = { id: string; url: string; kind: MediaKind; duration: number; start: number; end: number };

export default function EditPage() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<MediaKind | null>(null);
  
  // Multi-clip support
  const [clips, setClips] = useState<MediaClip[]>([]);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [caption, setCaption] = useState('');

  // Trim state (in seconds)
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  // Filters
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Advanced tools
  const [playbackRate, setPlaybackRate] = useState(1);
  const [rotation, setRotation] = useState(0); // degrees
  const [cropZoom, setCropZoom] = useState(1); // 1-2x zoom
  const DEFAULT_DURATION = 12;

  type Overlay = { id: string; text: string; xPct: number; yPct: number; color: string; size: number };
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [newText, setNewText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);
  const draggingIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [overlayDurations, setOverlayDurations] = useState<Record<string, { start: number; end: number }>>({});
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seekHoldRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mediaTransform = useMemo(() => `rotate(${rotation}deg) scale(${cropZoom})`, [rotation, cropZoom]);
  const mediaFilter = useMemo(() => `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`, [brightness, contrast, saturation]);

  useEffect(() => {
    // Load media clips from session storage
    (async () => {
      try {
        // Check for playlist first
        const playlistData = sessionStorage.getItem('mediaPlaylist');
        if (playlistData) {
          const playlist = JSON.parse(playlistData);
          const loadedClips: MediaClip[] = [];
          let totalDuration = 0;
          
          for (const item of playlist) {
            const rec = await loadBlobUrl(item.key);
            if (rec?.url) {
              const clipDuration = item.kind === 'image' ? DEFAULT_DURATION : (item.duration || DEFAULT_DURATION);
              loadedClips.push({
                id: item.key,
                url: rec.url,
                kind: item.kind,
                duration: clipDuration,
                start: totalDuration,
                end: totalDuration + clipDuration
              });
              totalDuration += clipDuration;
            }
          }
          
          if (loadedClips.length > 0) {
            setClips(loadedClips);
            setMediaUrl(loadedClips[0].url);
            setMediaKind(loadedClips[0].kind);
            setDuration(totalDuration);
            setTrimStart(0);
            setTrimEnd(totalDuration);
            setLoading(false);
            return;
          }
        }

        // Fallback to single media
        const key = sessionStorage.getItem('mediaKey');
        const kind = sessionStorage.getItem('mediaKind') as MediaKind | null;
        const fallbackImage = sessionStorage.getItem('capturedImage');
        const fallbackVideo = sessionStorage.getItem('capturedVideo');
        
        if (key) {
          const rec = await loadBlobUrl(key);
          if (rec?.url) {
            const clipDuration = kind === 'image' ? DEFAULT_DURATION : DEFAULT_DURATION;
            setClips([{
              id: key,
              url: rec.url,
              kind: rec.kind as MediaKind,
              duration: clipDuration,
              start: 0,
              end: clipDuration
            }]);
            setMediaUrl(rec.url);
            setMediaKind(rec.kind as MediaKind);
            setLoading(false);
            return;
          }
        }
        if (fallbackImage) {
          setClips([{
            id: 'fallback-image',
            url: fallbackImage,
            kind: 'image',
            duration: DEFAULT_DURATION,
            start: 0,
            end: DEFAULT_DURATION
          }]);
          setMediaUrl(fallbackImage);
          setMediaKind('image');
          setDuration(DEFAULT_DURATION);
          setTrimStart(0);
          setTrimEnd(DEFAULT_DURATION);
          setLoading(false);
          return;
        }
        if (fallbackVideo) {
          setClips([{
            id: 'fallback-video',
            url: fallbackVideo,
            kind: 'video',
            duration: DEFAULT_DURATION,
            start: 0,
            end: DEFAULT_DURATION
          }]);
          setMediaUrl(fallbackVideo);
          setMediaKind('video');
          setLoading(false);
          return;
        }
        toast({ title: 'No media found', description: 'Please capture or upload media first.', variant: 'destructive' });
        router.push('/create');
      } catch {
        setLoading(false);
      }
    })();
  }, [router, toast]);

  // Fallback duration if metadata never arrives
  useEffect(() => {
    if ((duration === 0 || !isFinite(duration)) && (mediaUrl || mediaKind === 'image')) {
      setDuration(DEFAULT_DURATION);
      if (!trimEnd) setTrimEnd(DEFAULT_DURATION);
    }
  }, [duration, trimEnd, mediaUrl, mediaKind]);

  // Load selected music for audio sync
  useEffect(() => {
    try {
      const music = typeof window !== 'undefined' ? sessionStorage.getItem('selectedMusic') : null;
      if (music) {
        const track = JSON.parse(music);
        const url = track?.preview_url || track?.music_preview_url || track?.url;
        if (url) {
          const el = new Audio(url);
          el.crossOrigin = 'anonymous';
          audioRef.current = el;
        }
      }
    } catch {}
    return () => {
      try { audioRef.current?.pause(); } catch {}
      audioRef.current = null;
    };
  }, []);

  // Load overlay durations saved from timeline, if any
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem('overlayDurations') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setOverlayDurations(parsed || {});
      }
    } catch {}
  }, []);

  // Keep edit text in sync with current selection
  useEffect(() => {
    const sel = overlays.find(o => o.id === selectedOverlayId);
    setEditText(sel?.text || '');
  }, [selectedOverlayId, overlays]);

  const onLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const d = Math.max(0, Math.floor(videoRef.current.duration || 0));
      setDuration(d);
      setTrimStart(0);
      setTrimEnd(d);
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Loop within trim and keep playhead synced
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      const t = v.currentTime;
      setPlayhead(t);
      if ((trimEnd || duration) && t >= (trimEnd || duration)) {
        v.currentTime = trimStart;
        if (audioRef.current) audioRef.current.currentTime = trimStart;
        if (!isPlaying) v.pause();
      }
    };
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, [trimStart, trimEnd, duration, isPlaying]);

  const applyTrimAndFilters = useCallback(async () => {
    if (!mediaUrl) return;
    if (mediaKind === 'image') {
      // Render image with filters to canvas
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => {
        img.onload = res as any;
        img.onerror = rej as any;
        img.src = mediaUrl;
      });
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      (ctx as any).filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      // Apply rotation and zoom for image as well
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(cropZoom, cropZoom);
      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      ctx.restore();
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) return;
      const key = await saveBlob('image', blob);
      sessionStorage.setItem('mediaKey', key);
      sessionStorage.setItem('mediaKind', 'image');
      toast({ title: 'Image updated' });
      return;
    }

    // For video: basic trim by setting startTime and endTime on export using MediaSource API is complex.
    // Here we save selected cover frame and store trim range for server processing.
    const coverBlob = await captureCurrentFrame();
    if (coverBlob) {
      const key = await saveBlob('image', coverBlob);
      sessionStorage.setItem('coverImageKey', key);
    }
    sessionStorage.setItem('trimStart', String(trimStart));
    sessionStorage.setItem('trimEnd', String(trimEnd || duration));
    sessionStorage.setItem('filters', JSON.stringify({ brightness, contrast, saturation }));
    sessionStorage.setItem('playbackRate', String(playbackRate));
    sessionStorage.setItem('rotation', String(rotation));
    sessionStorage.setItem('cropZoom', String(cropZoom));
    sessionStorage.setItem('overlays', JSON.stringify(overlays));
    toast({ title: 'Edits saved' });
  }, [brightness, contrast, duration, mediaKind, mediaUrl, saturation, toast, trimEnd, trimStart]);

  const captureCurrentFrame = useCallback(async (): Promise<Blob | null> => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    (ctx as any).filter = mediaFilter;
    // Apply rotation and zoom about center
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(cropZoom, cropZoom);
    ctx.drawImage(video, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.restore();
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  }, [mediaFilter, rotation, cropZoom]);

  // Drag to move overlays on the stage
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingIdRef.current || !stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;
      setOverlays(arr => arr.map(o => o.id === draggingIdRef.current ? { ...o, xPct: Math.max(0, Math.min(100, xPct)), yPct: Math.max(0, Math.min(100, yPct)) } : o));
    };
    const onUp = () => { draggingIdRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const handleNext = async () => {
    setLoading(true);
    try {
      await applyTrimAndFilters();
      if (caption) sessionStorage.setItem('editorCaption', caption);
      router.push('/create/post');
    } finally {
      setLoading(false);
    }
  };

  // Timeline interactions with multi-clip support
  const [playhead, setPlayhead] = useState(0);
  
  // Switch media source based on playhead position
  useEffect(() => {
    if (clips.length === 0) return;
    
    const currentClip = clips.find(clip => playhead >= clip.start && playhead < clip.end);
    if (currentClip && currentClip.url !== mediaUrl) {
      setMediaUrl(currentClip.url);
      setMediaKind(currentClip.kind);
      setCurrentClipIndex(clips.indexOf(currentClip));
    }
    
    // Set video time relative to clip start
    if (videoRef.current && currentClip && currentClip.kind === 'video') {
      const relativeTime = playhead - currentClip.start;
      videoRef.current.currentTime = Math.min(Math.max(relativeTime, 0), currentClip.duration);
    }
    
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(Math.max(playhead, 0), duration || 0);
    }
  }, [playhead, clips, mediaUrl, duration]);

  const overlaysAsClips = useMemo(() => overlays.map((o) => {
    const d = overlayDurations[o.id];
    const start = d ? d.start : Math.max(trimStart, Math.min(playhead, (trimEnd || duration || DEFAULT_DURATION)));
    const end = d ? d.end : Math.min(start + 3, (trimEnd || duration || DEFAULT_DURATION));
    return { id: o.id, text: o.text, start, end, color: o.color };
  }), [overlays, overlayDurations, duration, playhead, trimStart, trimEnd]);

  // Avoid sessionStorage during render
  const [hasMusic, setHasMusic] = useState(false);
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        setHasMusic(!!sessionStorage.getItem('selectedMusic'));
      }
    } catch {}
  }, []);

  // Transport controls
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (isPlaying) {
      if (v) v.pause();
      audioRef.current?.pause();
      setIsPlaying(false);
      if (tickerRef.current) { clearInterval(tickerRef.current); tickerRef.current = null; }
      return;
    }
    if (mediaKind === 'video' && v) {
      if (v.currentTime < trimStart || v.currentTime > (trimEnd || duration)) v.currentTime = trimStart;
      v.play().catch(() => {});
      if (audioRef.current) {
        audioRef.current.currentTime = v.currentTime;
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
      return;
    }
    // Image playback: simulate timeline ticking
    const startAt = Math.min(Math.max(playhead, trimStart), trimEnd || duration || DEFAULT_DURATION);
    let t = startAt;
    if (audioRef.current) {
      audioRef.current.currentTime = t;
      audioRef.current.play().catch(() => {});
    }
    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = setInterval(() => {
      t += 0.05; // 50ms steps
      const endMark = (trimEnd || duration || DEFAULT_DURATION);
      if (t >= endMark) t = trimStart;
      setPlayhead(t);
      if (audioRef.current) audioRef.current.currentTime = t;
    }, 50);
    setIsPlaying(true);
  }, [isPlaying, trimStart, trimEnd, duration, mediaKind, playhead]);

  const step = useCallback((delta: number) => {
    const v = videoRef.current;
    const base = mediaKind === 'video' && v ? (v.currentTime || 0) : playhead;
    const t = Math.min(Math.max(base + delta, 0), (trimEnd || duration || 0));
    if (mediaKind === 'video' && v) v.currentTime = t;
    if (audioRef.current) audioRef.current.currentTime = t;
    setPlayhead(t);
  }, [duration, mediaKind, playhead, trimEnd]);

  const startSeekHold = (delta: number) => {
    if (seekHoldRef.current) clearInterval(seekHoldRef.current);
    seekHoldRef.current = setInterval(() => step(delta), 80);
  };
  const stopSeekHold = () => { if (seekHoldRef.current) { clearInterval(seekHoldRef.current); seekHoldRef.current = null; } };

  // Cleanup ticker on unmount
  useEffect(() => () => { if (tickerRef.current) clearInterval(tickerRef.current); }, []);

  const [activeTool, setActiveTool] = useState<'edit' | 'crop' | 'adjust' | 'rotate' | 'speed' | 'sound' | 'text' | 'effect' | 'magic'>('edit');

  return (
    <div className="flex h-full w-full flex-col bg-black text-white">
      <header className="flex items-center justify-between p-3 border-b border-gray-800">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-sm font-semibold">Edit your {mediaKind || 'media'}</h1>
        <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={handleNext}>Next</Button>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-black p-4">
          {loading && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          <div ref={stageRef} className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-lg overflow-hidden border border-gray-700">
            <div className="absolute inset-0 flex items-center justify-center">
              {mediaKind === 'image' && mediaUrl && (
                <Image src={mediaUrl} alt="Edit" fill className="object-cover" style={{ transform: mediaTransform, filter: mediaFilter } as any} />
              )}
              {mediaKind === 'video' && mediaUrl && (
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  className="h-full w-full object-cover"
                  onLoadedMetadata={onLoadedMetadata}
                  style={{ transform: mediaTransform, filter: mediaFilter } as any}
                />
              )}
            </div>
            {/* Overlays */}
            {overlays.map((o) => {
              const windowRange = overlayDurations[o.id];
              const isVisible = !windowRange || (playhead >= windowRange.start && playhead <= windowRange.end);
              if (!isVisible) return null;
              return (
              <div
                key={o.id}
                className="absolute cursor-move select-none"
                style={{ left: `${o.xPct}%`, top: `${o.yPct}%`, color: o.color, fontSize: o.size, transform: 'translate(-50%, -50%)' }}
                onMouseDown={(e) => { draggingIdRef.current = o.id; e.preventDefault(); }}
                onClick={() => setSelectedOverlayId(o.id)}
              >
                <span className="inline-flex items-center gap-1"><Move className="h-3 w-3 opacity-70" />{o.text}</span>
              </div>
              );
            })}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Tools */}
        <div className="border-t border-gray-800 p-3 space-y-3 bg-black pb-28">
          {/* Transport controls */}
          <div className="flex items-center justify-center gap-3 text-xs text-white/80 w-full">
            <button aria-label="rewind to start" className="px-2 py-1 rounded bg-white/10" onClick={() => { setPlayhead(trimStart); if (videoRef.current) videoRef.current.currentTime = trimStart; if (audioRef.current) audioRef.current.currentTime = trimStart; }}><RotateCcw className="h-4 w-4" /></button>
            <button aria-label="step back" className="px-2 py-1 rounded bg-white/10" onMouseDown={() => startSeekHold(-0.1)} onMouseUp={stopSeekHold} onMouseLeave={stopSeekHold} onClick={() => step(-0.1)}><SkipBack className="h-4 w-4" /></button>
            <button aria-label="play pause" className="h-7 w-7 rounded-full bg-white text-black font-bold flex items-center justify-center" onClick={togglePlay}>{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
            <button aria-label="step forward" className="px-2 py-1 rounded bg-white/10" onMouseDown={() => startSeekHold(0.1)} onMouseUp={stopSeekHold} onMouseLeave={stopSeekHold} onClick={() => step(0.1)}><SkipForward className="h-4 w-4" /></button>
            <div className="ml-2 tabular-nums">{String(Math.floor(playhead/60)).padStart(2,'0')}:{String(Math.floor(playhead%60)).padStart(2,'0')} / {String(Math.floor(((trimEnd||duration||DEFAULT_DURATION))/60)).padStart(2,'0')}:{String(Math.floor(((trimEnd||duration||DEFAULT_DURATION))%60)).padStart(2,'0')}</div>
          </div>

          {/* Tool panels */}
          {activeTool === 'crop' && (
            <div className="mt-2 space-y-2">
              <ControlRow label="Zoom" value={cropZoom} min={1} max={2} step={0.01} onChange={setCropZoom} format={(v) => `${v.toFixed(2)}x`} />
            </div>
          )}
          {activeTool === 'adjust' && (
            <div className="mt-2 space-y-2">
              <ControlRow label="Brightness" value={brightness} min={50} max={150} step={1} onChange={setBrightness} format={(v)=>`${v}%`} />
              <ControlRow label="Contrast" value={contrast} min={50} max={150} step={1} onChange={setContrast} format={(v)=>`${v}%`} />
              <ControlRow label="Saturation" value={saturation} min={50} max={150} step={1} onChange={setSaturation} format={(v)=>`${v}%`} />
            </div>
          )}
          {activeTool === 'rotate' && (
            <div className="flex items-center gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => setRotation((r) => (r - 90 + 360) % 360)}><RotateCcw className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" onClick={() => setRotation((r) => (r + 90) % 360)}><RotateCw className="h-4 w-4" /></Button>
            </div>
          )}
          {activeTool === 'speed' && (
            <div className="mt-2">
              <ControlRow label="Speed" value={playbackRate} min={0.25} max={2} step={0.05} onChange={(val)=>{ setPlaybackRate(val); if (videoRef.current) videoRef.current.playbackRate = val; }} format={(v)=>`${v.toFixed(2)}x`} />
            </div>
          )}
          {activeTool === 'text' && (
            <div className="mt-2 space-y-3">
              <div className="flex gap-2">
                <input value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Add text" className="bg-gray-800 text-white px-2 py-1 rounded text-sm w-full" />
                <Button size="sm" onClick={() => {
                  if (!newText.trim()) return;
                  const id = Math.random().toString(36).slice(2);
                  setOverlays((arr) => [...arr, { id, text: newText.trim(), xPct: 50, yPct: 50, color: textColor, size: 16 }]);
                  const start = Math.max(trimStart, Math.min(playhead, (trimEnd || duration || DEFAULT_DURATION)));
                  const end = Math.min(start + 3, (trimEnd || duration || DEFAULT_DURATION));
                  const nextMap = { ...overlayDurations, [id]: { start, end } };
                  setOverlayDurations(nextMap);
                  sessionStorage.setItem('overlayDurations', JSON.stringify(nextMap));
                  setSelectedOverlayId(id);
                  setNewText('');
                }}>Add</Button>
              </div>
              {selectedOverlayId && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/70 w-16">Edit</span>
                  <input value={editText} onChange={(e)=> setEditText(e.target.value)} onKeyDown={(e)=> { if (e.key==='Enter') setOverlays(arr=>arr.map(o=>o.id===selectedOverlayId?{...o, text: editText}:o)); }} placeholder="Edit selected text" className="bg-gray-800 text-white px-2 py-1 rounded text-sm w-full" />
                  <Button size="sm" variant="outline" onClick={()=> setOverlays(arr=>arr.map(o=>o.id===selectedOverlayId?{...o, text: editText}:o))}>Update</Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/70 w-16">Color</span>
                <input type="color" value={textColor} onChange={(e)=> setTextColor(e.target.value)} className="h-7 w-10 bg-transparent" />
                <div className="flex gap-2">
                  {['#ffffff','#ff4757','#2ed573','#1e90ff','#f1c40f','#8e44ad','#000000'].map(c => (
                    <button key={c} aria-label={`color ${c}`} onClick={()=> setTextColor(c)} className="h-6 w-6 rounded" style={{ backgroundColor: c, border: '1px solid rgba(255,255,255,0.2)' }} />
                  ))}
                </div>
                <Button size="sm" variant="outline" disabled={!selectedOverlayId} onClick={() => {
                  if (!selectedOverlayId) return;
                  setOverlays((arr) => arr.map(o => o.id === selectedOverlayId ? { ...o, color: textColor } : o));
                }}>Apply to selected</Button>
              </div>
            </div>
          )}
          {activeTool === 'sound' && (
            <div className="mt-2 text-xs">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => router.push('/create/music')}>Change Music</Button>
            </div>
          )}
          {/* Timeline */
          <Timeline
            duration={duration || 0}
            playhead={playhead}
            trimStart={trimStart}
            trimEnd={trimEnd || duration || DEFAULT_DURATION}
            overlays={overlaysAsClips}
            hasMusic={hasMusic}
            audioStart={0}
            audioEnd={trimEnd || duration || DEFAULT_DURATION}
            videoSegments={clips.map(clip => ({ start: clip.start, end: clip.end }))}
            layout="left"
            onChangePlayhead={setPlayhead}
            onChangeTrim={(s, e) => { setTrimStart(s); setTrimEnd(e); }}
            onChangeOverlay={(id, s, e) => {
              const map = { ...overlayDurations };
              map[id] = { start: s, end: e };
              setOverlayDurations(map);
              sessionStorage.setItem('overlayDurations', JSON.stringify(map));
            }}
            onChangeAudio={(s, e) => {
              const start = Math.max(0, Math.min(s, (trimEnd || duration || DEFAULT_DURATION) - 0.1));
              const end = Math.max(start + 0.1, Math.min(e, (trimEnd || duration || DEFAULT_DURATION)));
              if (audioRef.current) audioRef.current.currentTime = start;
            }}
            onAddVideoAt={async (t) => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'video/*,image/*';
              input.multiple = true;
              input.onchange = async () => {
                const files = Array.from(input.files || []);
                if (files.length === 0) return;
                
                const newClips: MediaClip[] = [];
                let currentTime = t;
                
                for (const file of files) {
                  const key = await saveBlob(file.type.startsWith('video/') ? 'video' : 'image', file);
                  const rec = await loadBlobUrl(key);
                  if (rec?.url) {
                    const clipDuration = file.type.startsWith('image/') ? DEFAULT_DURATION : DEFAULT_DURATION;
                    newClips.push({
                      id: key,
                      url: rec.url,
                      kind: file.type.startsWith('video/') ? 'video' : 'image',
                      duration: clipDuration,
                      start: currentTime,
                      end: currentTime + clipDuration
                    });
                    currentTime += clipDuration;
                  }
                }
                
                // Insert new clips at time t
                const updatedClips = [...clips];
                let insertIndex = clips.findIndex(clip => clip.end > t);
                if (insertIndex === -1) insertIndex = clips.length;
                
                // Adjust timing of clips after insertion point
                const timeShift = newClips.reduce((sum, clip) => sum + clip.duration, 0);
                for (let i = insertIndex; i < updatedClips.length; i++) {
                  updatedClips[i].start += timeShift;
                  updatedClips[i].end += timeShift;
                }
                
                updatedClips.splice(insertIndex, 0, ...newClips);
                setClips(updatedClips);
                setDuration(updatedClips.reduce((max, clip) => Math.max(max, clip.end), 0));
                setPlayhead(t);
              };
              input.click();
            }}
            onAddTextAt={(t) => {
              const id = Math.random().toString(36).slice(2);
              setOverlays((arr) => [...arr, { id, text: 'New text', xPct: 50, yPct: 50, color: textColor, size: 16 }]);
              const start = Math.max(trimStart, Math.min(t, (trimEnd || duration || DEFAULT_DURATION)));
              const end = Math.min(start + 3, (trimEnd || duration || DEFAULT_DURATION));
              const nextMap = { ...overlayDurations, [id]: { start, end } };
              setOverlayDurations(nextMap);
              sessionStorage.setItem('overlayDurations', JSON.stringify(nextMap));
              setSelectedOverlayId(id);
            }}
            onAddAudioAt={() => router.push('/create/music')}
          />
          {/* panels removed to match provided design */}

          {/* Bottom toolbar */}
          <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 py-2 px-3 pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto max-w-md overflow-x-auto">
              <div className="min-w-[560px] grid grid-cols-9 gap-3 text-center text-[11px] text-white/90">
                <ToolbarItem label="Edit" icon={<Scissors className="h-4 w-4" />} active={activeTool==='edit'} onClick={() => setActiveTool('edit')} />
                <ToolbarItem label="Crop" icon={<CropIcon className="h-4 w-4" />} active={activeTool==='crop'} onClick={() => setActiveTool('crop')} />
                <ToolbarItem label="Adjust" icon={<SlidersHorizontal className="h-4 w-4" />} active={activeTool==='adjust'} onClick={() => setActiveTool('adjust')} />
                <ToolbarItem label="Rotate" icon={<RotateIcon className="h-4 w-4" />} active={activeTool==='rotate'} onClick={() => setActiveTool('rotate')} />
                <ToolbarItem label="Speed" icon={<Gauge className="h-4 w-4" />} active={activeTool==='speed'} onClick={() => setActiveTool('speed')} />
                <ToolbarItem label="Sound" icon={<Music className="h-4 w-4" />} active={activeTool==='sound'} onClick={() => setActiveTool('sound')} />
                <ToolbarItem label="Text" icon={<TypeIcon className="h-4 w-4" />} active={activeTool==='text'} onClick={() => setActiveTool('text')} />
                <ToolbarItem label="Effect" icon={<Sparkles className="h-4 w-4" />} active={activeTool==='effect'} onClick={() => setActiveTool('effect')} />
                <ToolbarItem label="Magic" icon={<Wand2 className="h-4 w-4" />} active={activeTool==='magic'} onClick={() => setActiveTool('magic')} />
              </div>
            </div>
            <div className="mt-2 flex justify-between max-w-md mx-auto text-xs text-white/50">
              <span />
              <span />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ToolbarItem({ label, icon, active, onClick }: { label: string; icon: ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-teal-400' : ''}`}>
      <span className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

type NumberSetter = (v: number | ((prev: number) => number)) => void;

function ControlRow({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: NumberSetter; format?: (v:number)=>string }) {
  const intervalRef = useRef<any>(null);
  const startHold = (delta: number) => {
    onChange(Number(Math.min(max, Math.max(min, (value + delta)))));
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      onChange((prev) => {
        const current = typeof prev === 'number' ? prev : value;
        const next = current + delta;
        return Number(Math.min(max, Math.max(min, next)));
      });
    }, 120);
  };
  const stopHold = () => clearInterval(intervalRef.current);
  return (
    <div className="flex items-center gap-3 bg-gray-900/60 border border-gray-800 rounded-lg p-2">
      <div className="w-28 flex items-center justify-between text-[11px] text-white/80">
        <span>{label}</span>
        <span className="ml-2 px-2 py-0.5 rounded bg-white/10 text-white/90 font-semibold">{format ? format(value) : String(value)}</span>
      </div>
      <button aria-label="decrease" className="p-1.5 rounded bg-white/10 hover:bg-white/20" onMouseDown={() => startHold(-step)} onMouseUp={stopHold} onMouseLeave={stopHold} onClick={() => onChange(Math.max(min, value - step))}><Minus className="h-3.5 w-3.5" /></button>
      <div className="flex-1">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e)=> onChange(Number(e.target.value))} className="w-full h-2 appearance-none bg-white/10 rounded accent-teal-500" />
        <div className="flex justify-between mt-1 text-[10px] text-white/60">
          <span>{format ? format(min) : String(min)}</span>
          <span>{format ? format(max) : String(max)}</span>
        </div>
      </div>
      <button aria-label="increase" className="p-1.5 rounded bg-white/10 hover:bg-white/20" onMouseDown={() => startHold(step)} onMouseUp={stopHold} onMouseLeave={stopHold} onClick={() => onChange(Math.min(max, value + step))}><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );
}


