import { useState, useEffect } from 'react'

/**
 * useDebounce.js
 * A simple hook to debounce a value.
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // 0 delay means no debounce (instant update)
    if (delay === 0) {
      setDebouncedValue(value)
      return
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
