"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Scissors, ImageIcon, Type, Sparkles, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { loadBlobUrl, saveBlob } from '@/lib/media-store';
import { useToast } from '@/hooks/use-toast';

type MediaKind = 'image' | 'video';

export default function EditPage() {
  const router = useRouter();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<MediaKind | null>(null);
  const [caption, setCaption] = useState('');

  // Trim state (in seconds)
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  // Filters
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const videoStyle = useMemo(() => ({
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
  }), [brightness, contrast, saturation]);

  useEffect(() => {
    // Prefer IndexedDB saved media
    const key = sessionStorage.getItem('mediaKey');
    const kind = sessionStorage.getItem('mediaKind') as MediaKind | null;
    const fallbackImage = sessionStorage.getItem('capturedImage');
    const fallbackVideo = sessionStorage.getItem('capturedVideo');
    (async () => {
      try {
        if (key) {
          const rec = await loadBlobUrl(key);
          if (rec?.url) {
            setMediaUrl(rec.url);
            setMediaKind(rec.kind as MediaKind);
            setLoading(false);
            return;
          }
        }
        if (fallbackImage) {
          setMediaUrl(fallbackImage);
          setMediaKind('image');
          setLoading(false);
          return;
        }
        if (fallbackVideo) {
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

  const onLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const d = Math.max(0, Math.floor(videoRef.current.duration || 0));
      setDuration(d);
      setTrimStart(0);
      setTrimEnd(d);
    }
  }, []);

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
      ctx.drawImage(img, 0, 0);
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
    (ctx as any).filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  }, [brightness, contrast, saturation]);

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

  return (
    <div className="flex h-full w-full flex-col bg-black text-white">
      <header className="flex items-center justify-between p-3 border-b border-gray-800">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-sm font-semibold">Edit your {mediaKind || 'media'}</h1>
        <div className="w-9" />
      </header>

      <main className="flex-1 grid grid-rows-[1fr_auto]">
        <div className="relative min-h-0">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {mediaKind === 'image' && mediaUrl && (
            <div className="relative h-full w-full">
              <Image src={mediaUrl} alt="Edit" fill className="object-contain" style={videoStyle as any} />
            </div>
          )}
          {mediaKind === 'video' && mediaUrl && (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="h-full w-full object-contain"
              controls
              onLoadedMetadata={onLoadedMetadata}
              style={videoStyle as any}
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Tools */}
        <div className="border-t border-gray-800 p-3 space-y-3 bg-black/60">
          <div className="flex items-center gap-2 text-xs">
            <Scissors className="h-4 w-4" />
            <span className="font-semibold">Trim</span>
          </div>
          {mediaKind === 'video' ? (
            <div className="space-y-2">
              <div className="text-[10px] text-white/70">Start: {trimStart}s • End: {trimEnd || duration}s</div>
              <Slider value={[trimStart]} min={0} max={duration} step={1} onValueChange={(v) => setTrimStart(v[0] || 0)} />
              <Slider value={[trimEnd || duration]} min={0} max={duration} step={1} onValueChange={(v) => setTrimEnd(v[0] || duration)} />
              <Button variant="outline" size="sm" onClick={() => { setTrimStart(0); setTrimEnd(duration); }}>Reset</Button>
            </div>
          ) : (
            <div className="text-xs text-white/60">Trim available for videos.</div>
          )}

          <div className="flex items-center gap-2 text-xs mt-2">
            <ImageIcon className="h-4 w-4" />
            <span className="font-semibold">Filters</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-white/70">Brightness</div>
              <Slider value={[brightness]} min={50} max={150} onValueChange={(v) => setBrightness(v[0] || 100)} />
            </div>
            <div>
              <div className="text=[10px] text-white/70">Contrast</div>
              <Slider value={[contrast]} min={50} max={150} onValueChange={(v) => setContrast(v[0] || 100)} />
            </div>
            <div>
              <div className="text-[10px] text-white/70">Saturation</div>
              <Slider value={[saturation]} min={50} max={150} onValueChange={(v) => setSaturation(v[0] || 100)} />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs mt-2">
            <Type className="h-4 w-4" />
            <span className="font-semibold">Captions</span>
          </div>
          <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption…" className="h-16" />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>Back</Button>
            <Button onClick={handleNext} className="bg-teal-600 hover:bg-teal-700">Next</Button>
          </div>
        </div>
      </main>
    </div>
  );
}


