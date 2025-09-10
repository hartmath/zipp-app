"use client";

import * as React from "react";

type OverlayClip = { id: string; text: string; start: number; end: number; color: string };

export function Timeline({
  duration,
  playhead,
  trimStart,
  trimEnd,
  overlays,
  hasMusic,
  audioStart,
  audioEnd,
  videoSegments,
  onChangePlayhead,
  onChangeTrim,
  onChangeOverlay,
  onChangeAudio,
  onAddVideoAt,
  onAddTextAt,
  onAddAudioAt,
  layout = 'stack',
}: {
  duration: number;
  playhead: number;
  trimStart: number;
  trimEnd: number;
  overlays: OverlayClip[];
  hasMusic?: boolean;
  audioStart?: number;
  audioEnd?: number;
  videoSegments?: { start: number; end: number }[];
  onChangePlayhead: (t: number) => void;
  onChangeTrim: (start: number, end: number) => void;
  onChangeOverlay?: (id: string, start: number, end: number) => void;
  onChangeAudio?: (start: number, end: number) => void;
  onAddVideoAt?: (t: number) => void;
  onAddTextAt?: (t: number) => void;
  onAddAudioAt?: (t: number) => void;
  layout?: 'stack' | 'left';
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [drag, setDrag] = React.useState<null | { kind: "playhead" | "start" | "end" | "audioStart" | "audioEnd" | { id: string; edge: "left" | "right" | "move"; length?: number }; startX: number; base: number }>(null);

  const pxPerSec = 40; // simple scale
  const leftOffsetPx = layout === 'left' ? 56 + 8 : 0; // label column + gap
  const width = leftOffsetPx + Math.max(240, duration * pxPerSec);

  const clamp = (v: number) => Math.max(0, Math.min(duration, v));

  const toTime = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? clientX - rect.left - leftOffsetPx : 0;
    return clamp(x / pxPerSec);
  };

  const onDown = (e: React.MouseEvent, kind: "playhead" | "start" | "end") => {
    e.preventDefault();
    const base = kind === "playhead" ? playhead : kind === "start" ? trimStart : trimEnd;
    setDrag({ kind, startX: e.clientX, base });
  };

  const onOverlayDown = (e: React.MouseEvent, id: string, edge: "left" | "right" | "move") => {
    e.preventDefault();
    const clip = overlays.find((o) => o.id === id);
    if (!clip) return;
    const base = edge === "left" ? clip.start : edge === "right" ? clip.end : clip.start;
    const length = clip.end - clip.start;
    setDrag({ kind: { id, edge, length }, startX: e.clientX, base });
  };

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag) return;
      const dx = (e.clientX - drag.startX) / pxPerSec;
      const next = clamp(drag.base + dx);
      if (drag.kind === "playhead") {
        onChangePlayhead(next);
      } else if (drag.kind === "start") {
        onChangeTrim(Math.min(next, trimEnd - 0.1), trimEnd);
      } else if (drag.kind === "end") {
        onChangeTrim(trimStart, Math.max(next, trimStart + 0.1));
      } else if (drag.kind === "audioStart" && onChangeAudio) {
        const end = typeof audioEnd === 'number' ? audioEnd : duration;
        onChangeAudio(Math.min(next, end - 0.1), end);
      } else if (drag.kind === "audioEnd" && onChangeAudio) {
        const start = typeof audioStart === 'number' ? audioStart : 0;
        onChangeAudio(start, Math.max(next, start + 0.1));
      } else if (typeof drag.kind === "object" && onChangeOverlay) {
        const { id, edge } = drag.kind;
        const clip = overlays.find((o) => o.id === id);
        if (!clip) return;
        if (edge === "left") onChangeOverlay(id, Math.min(next, clip.end - 0.1), clip.end);
        else if (edge === "right") onChangeOverlay(id, clip.start, Math.max(next, clip.start + 0.1));
        else if (edge === "move") {
          const len = drag.kind.length ?? (clip.end - clip.start);
          const start = clamp(next);
          const end = clamp(start + len);
          // keep within [0,duration]
          if (end > duration) {
            const diff = end - duration;
            onChangeOverlay(id, start - diff, duration);
          } else {
            onChangeOverlay(id, start, end);
          }
        }
      }
    };
    const onUp = () => setDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [drag, onChangePlayhead, onChangeTrim, overlays, trimEnd, trimStart, duration]);

  const rows = [
    {
      key: 'video',
      label: 'Video',
      color: 'bg-yellow-500',
      content: (
        <div className="relative h-7 bg-gray-800/40 rounded mb-2" onDoubleClick={(e) => onAddVideoAt && onAddVideoAt(toTime(e.clientX))}>
          {onAddVideoAt && (
            <button
              type="button"
              className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white z-20 border border-white/20"
              onClick={(e) => { e.stopPropagation(); onAddVideoAt(playhead); }}
            >
              Add Video
            </button>
          )}
          {(videoSegments && videoSegments.length > 0 ? videoSegments : [{ start: trimStart, end: trimEnd }]).map((seg, idx) => (
            <div key={idx} className="absolute top-0 bottom-0 bg-yellow-500/70 rounded" style={{ left: seg.start * pxPerSec, width: Math.max(2, (seg.end - seg.start) * pxPerSec) }} />
          ))}
          <Handle x={trimStart * pxPerSec} onMouseDown={(e) => onDown(e, "start")} />
          <Handle x={trimEnd * pxPerSec} onMouseDown={(e) => onDown(e, "end")} />
        </div>
      )
    },
    {
      key: 'text',
      label: 'Text',
      color: 'bg-green-500',
      content: (
        <div className="relative h-7 bg-gray-800/40 rounded mb-2" onDoubleClick={(e) => onAddTextAt && onAddTextAt(toTime(e.clientX))}>
          {onAddTextAt && (
            <button
              type="button"
              className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white z-20 border border-white/20"
              onClick={(e) => { e.stopPropagation(); onAddTextAt(playhead); }}
            >
              Add Text
            </button>
          )}
          {overlays.map((o) => (
            <div key={o.id} className="absolute top-1/2 -translate-y-1/2 h-4 rounded bg-green-500/80 cursor-grab active:cursor-grabbing" style={{ left: o.start * pxPerSec, width: Math.max(8, (o.end - o.start) * pxPerSec) }} onMouseDown={(e) => onOverlayDown(e, o.id, "move")}>
              <div className="absolute -left-1 top-0 bottom-0 w-2 cursor-ew-resize" onMouseDown={(e) => onOverlayDown(e, o.id, "left")} />
              <div className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize" onMouseDown={(e) => onOverlayDown(e, o.id, "right")} />
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'sound',
      label: 'Sound',
      color: 'bg-purple-500',
      content: (
        <div className="relative h-7 bg-gray-800/40 rounded mb-4" onDoubleClick={(e) => onAddAudioAt && onAddAudioAt(toTime(e.clientX))}>
          {onAddAudioAt && (
            <button
              type="button"
              className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white z-20 border border-white/20"
              onClick={(e) => { e.stopPropagation(); onAddAudioAt(playhead); }}
            >
              Add Music
            </button>
          )}
          {hasMusic && (
            <>
              <div className="absolute top-1/2 -translate-y-1/2 h-4 rounded bg-purple-500/80" style={{ left: (audioStart ?? 0) * pxPerSec, width: Math.max(8, ((audioEnd ?? duration) - (audioStart ?? 0)) * pxPerSec) }} />
              <div className="absolute -left-1 top-0 bottom-0 w-2 cursor-ew-resize" style={{ left: (audioStart ?? 0) * pxPerSec }} onMouseDown={(e) => setDrag({ kind: "audioStart", startX: e.clientX, base: (audioStart ?? 0) })} />
              <div className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize" style={{ left: (audioEnd ?? duration) * pxPerSec }} onMouseDown={(e) => setDrag({ kind: "audioEnd", startX: e.clientX, base: (audioEnd ?? duration) })} />
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="w-full overflow-x-auto select-none">
      <div className="min-w-full">
        <div className="bg-black/50 rounded-md border border-gray-800 p-2">
          <div className="relative" ref={containerRef} onClick={(e) => onChangePlayhead(toTime(e.clientX))}>
            <div className="relative" style={{ width }}>
              <div className="h-6 relative">
                {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                  <div key={i} className="absolute top-0 h-full text-[10px] text-white/60" style={{ left: leftOffsetPx + i * pxPerSec }}>
                    <div className="w-px h-3 bg-white/30" />
                    <div className="-translate-x-1/2 mt-1">{i}s</div>
                  </div>
                ))}
              </div>

              {layout === 'left' ? (
                <div className="grid grid-cols-[56px_1fr] gap-2">
                  {rows.map((r) => (
                    <React.Fragment key={r.key}>
                      <div className="flex items-center text-[10px] text-white/70"><span className={`inline-block h-2 w-2 rounded ${r.color} mr-2`} />{r.label}</div>
                      {r.content}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div>
                  {rows.map((r) => (
                    <React.Fragment key={r.key}>
                      <TrackLabel label={r.label} color={r.color} />
                      {r.content}
                    </React.Fragment>
                  ))}
                </div>
              )}

              <div className="absolute top-0 bottom-0 w-px bg-white" style={{ left: leftOffsetPx + playhead * pxPerSec }} onMouseDown={(e) => onDown(e, "playhead")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Handle({ x, onMouseDown }: { x: number; onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <div className="absolute top-0 -translate-x-1/2 -translate-y-1/4 h-8 w-2 bg-white rounded cursor-ew-resize" style={{ left: x }} onMouseDown={onMouseDown} />
  );
}

function TrackLabel({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-white/70 mb-1">
      <span className={`inline-block h-2 w-2 rounded ${color}`} />
      <span>{label}</span>
    </div>
  );
}


