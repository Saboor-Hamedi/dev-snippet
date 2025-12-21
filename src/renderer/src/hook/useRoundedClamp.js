import { useMemo } from 'react'

export const clamp = (value, min, max) => {
  const num = Number(value)
  if (Number.isNaN(num)) return min
  return Math.max(min, Math.min(max, num))
}

export const roundTo = (value, precision = 1) => {
  const num = Number(value)
  if (Number.isNaN(num)) return 0
  const factor = Math.pow(10, precision)
  return Math.round(num * factor) / factor
}

export const useRoundedClamp = (value, precision = 1, min = 0, max = 100) => {
  return useMemo(() => {
    const rounded = roundTo(value, precision)
    return clamp(rounded, min, max)
  }, [value, precision, min, max])
}
