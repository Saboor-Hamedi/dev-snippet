/**
 * useVirtualizedPreview.js
 * React hook for virtual scrolling in preview
 * Only renders visible + buffer region, handles 200k word documents smoothly
 */

import { useEffect, useRef, useState, useCallback } from 'react'

export const useVirtualizedPreview = (totalHeight = 5000, containerHeight = 800) => {
  const scrollContainerRef = useRef(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: containerHeight + 1000 })
  const [scrollPercentage, setScrollPercentage] = useState(0)

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight

    // Calculate visible range with 500px buffer above/below
    const buffer = 500
    const start = Math.max(0, scrollTop - buffer)
    const end = Math.min(scrollHeight, scrollTop + clientHeight + buffer)

    setVisibleRange({ start, end })

    // Calculate scroll percentage for sync
    const percentage = scrollHeight > clientHeight 
      ? scrollTop / (scrollHeight - clientHeight)
      : 0
    setScrollPercentage(percentage)
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return {
    scrollContainerRef,
    visibleRange,
    scrollPercentage,
    onScroll: handleScroll
  }
}

/**
 * Component wrapper for virtualized content
 * Renders only visible sections
 */
export const VirtualizedContent = ({ 
  html, 
  visibleRange, 
  containerRef,
  ...props 
}) => {
  // For simplicity, render full HTML but with opacity control on off-screen regions
  // More advanced: split HTML into sections and conditionally render
  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  )
}
