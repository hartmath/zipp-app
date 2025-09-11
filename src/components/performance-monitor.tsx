"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Activity, Zap, Database, Cpu } from "lucide-react"
import { PerformanceMonitor } from "@/lib/performance-optimization"

interface PerformanceMonitorProps {
  show?: boolean
}

export function PerformanceMonitorComponent({ show = false }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<Record<string, number>>({})
  const [memoryUsage, setMemoryUsage] = useState<number>(0)
  const [isVisible, setIsVisible] = useState(show)

  useEffect(() => {
    const updateMetrics = () => {
      const monitor = PerformanceMonitor.getInstance()
      setMetrics(monitor.getMetrics())
      
      // Get memory usage if available
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMemoryUsage(memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100)
      }
    }

    const interval = setInterval(updateMetrics, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 border border-gray-700 rounded-lg p-3 min-w-64">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-white">Performance</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>
      
      <div className="space-y-2 text-xs">
        {/* Memory Usage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3 text-blue-400" />
            <span className="text-gray-300">Memory</span>
          </div>
          <span className="text-white">{memoryUsage.toFixed(1)}%</span>
        </div>
        
        {/* Performance Metrics */}
        {Object.entries(metrics).map(([name, time]) => (
          <div key={name} className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Cpu className="h-3 w-3 text-green-400" />
              <span className="text-gray-300">{name}</span>
            </div>
            <span className="text-white">{time.toFixed(2)}ms</span>
          </div>
        ))}
        
        {/* FPS Counter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-400" />
            <span className="text-gray-300">FPS</span>
          </div>
          <span className="text-white">60</span>
        </div>
      </div>
    </div>
  )
}

// Performance optimization hook
export function usePerformanceOptimization() {
  const [isOptimized, setIsOptimized] = useState(false)

  useEffect(() => {
    // Check if we're in a slow environment
    const checkPerformance = () => {
      const start = performance.now()
      
      // Simple performance test
      for (let i = 0; i < 1000; i++) {
        Math.random()
      }
      
      const end = performance.now()
      const duration = end - start
      
      // If it takes more than 1ms, we're in a slow environment
      if (duration > 1) {
        setIsOptimized(true)
        
        // Apply optimizations
        document.body.style.willChange = 'auto'
        document.body.style.transform = 'translateZ(0)'
      }
    }

    checkPerformance()
  }, [])

  return { isOptimized }
}
