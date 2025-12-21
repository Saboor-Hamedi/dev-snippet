/**
 * useCursorProp.js
 * Manages editor cursor/caret settings (width, color, style, animations)
 * DRY & SOLID: Centralized state via useSettings
 */
import { useSettings } from '../useSettingsContext'
import { useEffect } from 'react'
import { clamp } from '../useRoundedClamp'
export const DEFAULT_CURSOR_WIDTH = 3
export const DEFAULT_ACTIVE_LINE_BG = '#232731'
export const MIN_CURSOR_WIDTH = 1
export const MAX_CURSOR_WIDTH = 10
export const DEFAULT_CURSOR_COLOR = '#58a6ff'
export const DEFAULT_CURSOR_STYLE = 'bar'
export const DEFAULT_ACTIVE_LINE_BORDER_WIDTH = 0
export const DEFAULT_ACTIVE_LINE_GUTTER_BORDER_WIDTH = 0
export const DEFAULT_BLINKING_SPEED = 500
export const MIN_BLINKING_SPEED = 50
export const MAX_BLINKING_SPEED = 5000
export const ALLOWED_CURSOR_SHAPES = ['bar', 'block', 'underline']

export const useCursorProp = () => {
  const { getSetting, updateSetting } = useSettings()

  // 1. Get values from the new 'cursor' namespace
  const rawWidth = getSetting('cursor.width') ?? DEFAULT_CURSOR_WIDTH
  const width = clamp(rawWidth, MIN_CURSOR_WIDTH, MAX_CURSOR_WIDTH)
  const rawActiveLineBg = getSetting('cursor.activeLineBg') ?? DEFAULT_ACTIVE_LINE_BG
  const activeLineBg = rawActiveLineBg

  const color = getSetting('cursor.color') ?? DEFAULT_CURSOR_COLOR

  // Handle 'blank' typo from user JSON or legacy 'style' key
  let rawShape = getSetting('cursor.shape') || getSetting('cursor.style') || 'bar'
  if (rawShape === 'blank') rawShape = 'block'

  // Validate shape against allowed list
  const shape = ALLOWED_CURSOR_SHAPES.includes(rawShape) ? rawShape : DEFAULT_CURSOR_STYLE

  const blinking = getSetting('cursor.blinking') ?? true
  const rawBlinkingSpeed = getSetting('cursor.blinkingSpeed') ?? DEFAULT_BLINKING_SPEED
  const blinkingSpeed = clamp(rawBlinkingSpeed, MIN_BLINKING_SPEED, MAX_BLINKING_SPEED)
  const selectionBackground = getSetting('cursor.selectionBackground') ?? '#58a6ff33'

  const rawActiveLineBorderWidth =
    getSetting('cursor.activeLineBorderWidth') ?? DEFAULT_ACTIVE_LINE_BORDER_WIDTH
  const activeLineBorderWidth = clamp(rawActiveLineBorderWidth, 0, 10)

  const rawActiveLineGutterBorderWidth =
    getSetting('cursor.activeLineGutterBorderWidth') ?? DEFAULT_ACTIVE_LINE_GUTTER_BORDER_WIDTH
  const activeLineGutterBorderWidth = clamp(rawActiveLineGutterBorderWidth, 0, 10)

  // 2. Setters
  const setCursorWidth = (value) => {
    updateSetting('cursor.width', value)
  }

  const setCursorColor = (value) => updateSetting('cursor.color', value)
  const setCursorShape = (value) => {
    // If user selects block, save as block
    updateSetting('cursor.shape', value)
    // Clean up legacy key
    updateSetting('cursor.style', undefined)
  }
  const setCursorBlinking = (value) => updateSetting('cursor.blinking', !!value)
  const setBlinkingSpeed = (value) => {
    updateSetting('cursor.blinkingSpeed', value)
  }
  const setSelectionBackground = (value) => updateSetting('cursor.selectionBackground', value)

  const setActiveLineBorderWidth = (value) => {
    updateSetting('cursor.activeLineBorderWidth', value)
  }

  const setActiveLineGutterBorderWidth = (value) => {
    updateSetting('cursor.activeLineGutterBorderWidth', value)
  }

  // 3. GLOBAL APPLICATION (SOLID)
  // Apply settings to CSS variables for global consistency
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      root.style.setProperty('--caret-width', `${width}px`)
      root.style.setProperty('--caret-color', color)
      root.style.setProperty('--caret-shape', shape)
      root.style.setProperty('--cursor-blinking', blinking ? 'true' : 'false')
      root.style.setProperty('--cursor-blinking-speed', `${blinkingSpeed}ms`)
      root.style.setProperty('--selection-background', selectionBackground)
      root.style.setProperty('--active-line-border-width', `${activeLineBorderWidth}px`)
      root.style.setProperty(
        '--active-line-gutter-border-width',
        `${activeLineGutterBorderWidth}px`
      )
      root.style.setProperty('--active-line-bg', activeLineBg)
    }
  }, [
    width,
    color,
    shape,
    blinking,
    blinkingSpeed,
    selectionBackground,
    activeLineBorderWidth,
    activeLineGutterBorderWidth,
    activeLineBg
  ])

  return {
    width,
    setCursorWidth,
    color,
    setCursorColor,
    shape,
    setCursorShape,
    blinking,
    setCursorBlinking,
    blinkingSpeed,
    setBlinkingSpeed,
    selectionBackground,
    setSelectionBackground,
    activeLineBorderWidth,
    setActiveLineBorderWidth,
    activeLineGutterBorderWidth,
    setActiveLineGutterBorderWidth,
    activeLineBg
  }
}

export default useCursorProp
