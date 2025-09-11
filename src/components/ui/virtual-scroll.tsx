"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useVirtualScrolling } from "@/lib/performance-optimization"

interface VirtualScrollProps {
  items: any[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: any, index: number) => React.ReactNode
  overscan?: number
  className?: string
}

export function VirtualScroll({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ""
}: VirtualScrollProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { visibleItems, totalHeight, offsetY } = useVirtualScrolling(
    items,
    itemHeight,
    containerHeight,
    overscan
  )

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={item.id || index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Virtual scroll hook for custom implementations
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )
  
  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  )
  
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    startIndex,
    endIndex
  }
}

// Virtual scroll for timeline
export function VirtualTimelineScroll({
  items,
  itemHeight = 60,
  containerHeight = 300,
  renderItem,
  className = ""
}: Omit<VirtualScrollProps, 'itemHeight' | 'containerHeight'> & {
  itemHeight?: number
  containerHeight?: number
}) {
  return (
    <VirtualScroll
      items={items}
      itemHeight={itemHeight}
      containerHeight={containerHeight}
      renderItem={renderItem}
      className={`timeline-scroll ${className}`}
    />
  )
}

// Virtual scroll for media grid
export function VirtualMediaGrid({
  items,
  itemHeight = 120,
  containerHeight = 400,
  renderItem,
  className = ""
}: Omit<VirtualScrollProps, 'itemHeight' | 'containerHeight'> & {
  itemHeight?: number
  containerHeight?: number
}) {
  return (
    <VirtualScroll
      items={items}
      itemHeight={itemHeight}
      containerHeight={containerHeight}
      renderItem={renderItem}
      className={`media-grid-scroll ${className}`}
    />
  )
}
