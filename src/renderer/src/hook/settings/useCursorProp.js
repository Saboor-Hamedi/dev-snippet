/**
 * useCursorProp.js
 * Manages editor cursor/caret settings (width, color, style, animations)
 * DRY & SOLID: Centralized state via useSettings
 */
import { useSettings } from '../useSettingsContext'
import { useEffect } from 'react'
import { clamp } from '../useRoundedClamp'
export const DEFAULT_CURSOR_WIDTH = 3
export const MIN_CURSOR_WIDTH = 1
export const MAX_CURSOR_WIDTH = 10
export const DEFAULT_CURSOR_COLOR = '#58a6ff'
export const DEFAULT_CURSOR_SHAPE = 'bar'
export const DEFAULT_ACTIVE_LINE_BG = 'rgba(88, 166, 255, 0.1)'
export const DEFAULT_ACTIVE_LINE_BORDER = 0
export const DEFAULT_ACTIVE_LINE_GUTTER_BORDER = 0
export const DEFAULT_SHADOW_BOX_COLOR = '#58a6ff'
export const DEFAULT_BLINKING_SPEED = 500
export const MIN_BLINKING_SPEED = 50
export const MAX_BLINKING_SPEED = 5000
export const ALLOWED_CURSOR_SHAPES = ['bar', 'block', 'underline']

export const useCursorProp = () => {
  const { getSetting, updateSetting } = useSettings()

  // 1. Get values from the new 'cursor' namespace
  const rawCursorWidth = getSetting('cursor.cursorWidth') ?? DEFAULT_CURSOR_WIDTH
  const cursorWidth = clamp(rawCursorWidth, MIN_CURSOR_WIDTH, MAX_CURSOR_WIDTH)
  const cursorColor = getSetting('cursor.cursorColor') ?? DEFAULT_CURSOR_COLOR
  const rawCursorShape = getSetting('cursor.cursorShape') || 'bar'
  const cursorShape = ALLOWED_CURSOR_SHAPES.includes(rawCursorShape) ? rawCursorShape : 'bar'
  const rawBlinking = getSetting('cursor.cursorBlinking')
  // Force a clean boolean to prevent "string trap" logic bugs
  const cursorBlinking = rawBlinking !== false && rawBlinking !== 'false'

  const rawBlinkingSpeed = getSetting('cursor.cursorBlinkingSpeed') ?? DEFAULT_BLINKING_SPEED
  const cursorBlinkingSpeed = clamp(
    Number(rawBlinkingSpeed),
    MIN_BLINKING_SPEED,
    MAX_BLINKING_SPEED
  )
  const cursorSelectionBg = getSetting('cursor.cursorSelectionBg') ?? '#58a6ff33'
  const cursorActiveLineBg = getSetting('cursor.cursorActiveLineBg') ?? DEFAULT_ACTIVE_LINE_BG
  const rawActiveLineBorder =
    getSetting('cursor.cursorActiveLineBorder') ?? DEFAULT_ACTIVE_LINE_BORDER
  const cursorActiveLineBorder = clamp(rawActiveLineBorder, 0, 10)
  const rawActiveLineGutterBorder =
    getSetting('cursor.cursorActiveLineGutterBorder') ?? DEFAULT_ACTIVE_LINE_GUTTER_BORDER
  const cursorActiveLineGutterBorder = clamp(rawActiveLineGutterBorder, 0, 10)
  const cursorShadowBoxColor = getSetting('cursor.cursorShadowBoxColor') ?? DEFAULT_SHADOW_BOX_COLOR

  // 2. Setters
  const setCursorWidth = (value) => updateSetting('cursor.cursorWidth', value)
  const setCursorColor = (value) => updateSetting('cursor.cursorColor', value)
  const setCursorShape = (value) => updateSetting('cursor.cursorShape', value)
  const setCursorBlinking = (value) => updateSetting('cursor.cursorBlinking', !!value)
  const setCursorBlinkingSpeed = (value) => updateSetting('cursor.cursorBlinkingSpeed', value)
  const setCursorSelectionBg = (value) => updateSetting('cursor.cursorSelectionBg', value)
  const setCursorActiveLineBg = (value) => updateSetting('cursor.cursorActiveLineBg', value)
  const setCursorActiveLineBorder = (value) => updateSetting('cursor.cursorActiveLineBorder', value)
  const setCursorActiveLineGutterBorder = (value) =>
    updateSetting('cursor.cursorActiveLineGutterBorder', value)
  const setCursorShadowBoxColor = (value) => updateSetting('cursor.cursorShadowBoxColor', value)

  // 3. GLOBAL APPLICATION (SOLID)
  // Apply settings to CSS variables for global consistency
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      root.style.setProperty('--caret-width', `${cursorWidth}px`)
      root.style.setProperty('--caret-color', cursorColor)
      root.style.setProperty('--caret-shape', cursorShape)
      root.style.setProperty('--cursor-blinking', cursorBlinking ? 'true' : 'false')
      root.style.setProperty('--cursor-blinking-speed', `${cursorBlinkingSpeed}ms`)
      root.style.setProperty('--selection-background', cursorSelectionBg)
      root.style.setProperty('--active-line-border-width', `${cursorActiveLineBorder}px`)
      root.style.setProperty(
        '--active-line-gutter-border-width',
        `${cursorActiveLineGutterBorder}px`
      )
      root.style.setProperty('--active-line-bg', cursorActiveLineBg)
      root.style.setProperty('--shadow-box-bg', cursorShadowBoxColor)
    }
  }, [
    cursorWidth,
    cursorColor,
    cursorShape,
    cursorBlinking,
    cursorBlinkingSpeed,
    cursorSelectionBg,
    cursorActiveLineBorder,
    cursorActiveLineGutterBorder,
    cursorActiveLineBg,
    cursorShadowBoxColor
  ])

  return {
    cursorWidth,
    setCursorWidth,
    cursorColor,
    setCursorColor,
    cursorShape,
    setCursorShape,
    cursorBlinking,
    setCursorBlinking,
    cursorBlinkingSpeed,
    setCursorBlinkingSpeed,
    cursorSelectionBg,
    setCursorSelectionBg,
    cursorActiveLineBorder,
    setCursorActiveLineBorder,
    cursorActiveLineGutterBorder,
    setCursorActiveLineGutterBorder,
    cursorActiveLineBg,
    setCursorActiveLineBg,
    cursorShadowBoxColor,
    setCursorShadowBoxColor
  }
}

export default useCursorProp
