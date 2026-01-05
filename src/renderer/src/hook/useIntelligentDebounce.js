/**
 * useIntelligentDebounce.js
 * React hook for adaptive debouncing
 * Shorter delay during typing (faster feedback), longer delay when paused
 */

import { useEffect, useRef, useState } from 'react'

export const useIntelligentDebounce = (callback, dependencies = []) => {
  const timeoutRef = useRef(null)
  const isTypingRef = useRef(false)
  const lastCallRef = useRef(0)
  const [isDebouncing, setIsDebouncing] = useState(false)

  // Typing-aware debounce: shorter during active typing, longer when paused
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsDebouncing(true)
    isTypingRef.current = true

    // Determine debounce delay based on typing state
    // - Active typing: 75ms (user is typing fast, give quick feedback)
    // - Paused typing: 250ms (user paused, safe to do heavier processing)
    const timeSinceLastChange = Date.now() - lastCallRef.current
    const isLikelyPaused = timeSinceLastChange > 200 // User paused for 200ms+
    const delay = isLikelyPaused ? 250 : 75

    timeoutRef.current = setTimeout(() => {
      callback()
      lastCallRef.current = Date.now()
      isTypingRef.current = false
      setIsDebouncing(false)
    }, delay)

    // Cleanup on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, dependencies)

  return { isDebouncing }
}

/**
 * Custom hook for aggressive debouncing with cancellation
 * Suitable for heavy operations like markdown parsing
 */
export const useWorkDebounce = (callback, delay = 150, dependencies = []) => {
  const timeoutRef = useRef(null)
  const cancelRef = useRef(false)

  useEffect(() => {
    cancelRef.current = false

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (!cancelRef.current) {
        callback()
      }
    }, delay)

    return () => {
      cancelRef.current = true
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, dependencies)

  return {
    cancel: () => {
      cancelRef.current = true
    }
  }
}
