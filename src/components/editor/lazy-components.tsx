"use client"

import { lazy, Suspense } from "react"
import { Loader2 } from "lucide-react"

// Lazy load heavy components
export const LazyCaptionsPanel = lazy(() => import("./captions-panel").then(m => ({ default: m.CaptionsPanel })))
export const LazyBackgroundRemovalPanel = lazy(() => import("./background-removal-panel").then(m => ({ default: m.BackgroundRemovalPanel })))
export const LazyProjectManagementPanel = lazy(() => import("./project-management-panel").then(m => ({ default: m.ProjectManagementPanel })))
export const LazyAudioEffectsPanel = lazy(() => import("./audio-effects-panel").then(m => ({ default: m.AudioEffectsPanel })))
export const LazyKeyframePanel = lazy(() => import("./keyframe-panel").then(m => ({ default: m.KeyframePanel })))
export const LazyMultiTrackPanel = lazy(() => import("./multi-track-panel").then(m => ({ default: m.MultiTrackPanel })))
export const LazyGreenScreenPanel = lazy(() => import("./green-screen-panel").then(m => ({ default: m.GreenScreenPanel })))
export const LazyTextAnimationsPanel = lazy(() => import("./text-animations-panel").then(m => ({ default: m.TextAnimationsPanel })))
export const LazyColorGradingPanel = lazy(() => import("./color-grading-panel").then(m => ({ default: m.ColorGradingPanel })))

// Loading component
export function PanelLoadingFallback() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-500" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

// Wrapper component for lazy loading
export function LazyPanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PanelLoadingFallback />}>
      {children}
    </Suspense>
  )
}
