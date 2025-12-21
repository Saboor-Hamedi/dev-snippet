import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import useGutterProp, {
  DEFAULT_GUTTER_BG_COLOR,
  DEFAULT_GUTTER_BORDER_COLOR,
  DEFAULT_GUTTER_BORDER_WIDTH,
  MIN_GUTTER_BORDER_WIDTH,
  MAX_GUTTER_BORDER_WIDTH
} from '../renderer/src/hook/useGutterProp'
import { useSettings } from '../renderer/src/hook/useSettingsContext'

// Mock the useSettings hook
vi.mock('../renderer/src/hook/useSettingsContext', () => ({
  useSettings: vi.fn()
}))

// Mock the useRoundedClamp exports directly if needed,
// but since we are testing logic inside useGutterProp, we rely on the real implementation
// of clamp/roundTo imported by the hook.
// If unit testing purely useGutterProp, we want to ensure the logic *inside* it works.

describe('useGutterProp', () => {
  // --- Gutter Background Color ---
  it('should return default gutterBgColor if setting is missing', () => {
    useSettings.mockReturnValue({
      getSetting: vi.fn().mockReturnValue(undefined),
      updateSetting: vi.fn()
    })

    const { result } = renderHook(() => useGutterProp())
    expect(result.current.gutterBgColor).toBe(DEFAULT_GUTTER_BG_COLOR)
  })

  it('should return saved gutterBgColor from settings', () => {
    const savedColor = '#ff0000'
    useSettings.mockReturnValue({
      // Mock getSetting to return saved value for bgcolor
      getSetting: vi.fn((key) => {
        if (key === 'gutter.gutterBgColor') return savedColor
        return undefined
      }),
      updateSetting: vi.fn()
    })

    const { result } = renderHook(() => useGutterProp())
    expect(result.current.gutterBgColor).toBe(savedColor)
  })

  it('should update gutterBgColor', () => {
    const updateSettingMock = vi.fn()
    useSettings.mockReturnValue({
      getSetting: vi.fn(() => undefined),
      updateSetting: updateSettingMock
    })

    const { result } = renderHook(() => useGutterProp())
    const newColor = '#00ff00'

    act(() => {
      result.current.setGutterBgColor(newColor)
    })

    expect(updateSettingMock).toHaveBeenCalledWith('gutter.gutterBgColor', newColor)
  })

  // --- Gutter Border Color ---
  it('should return default gutterBorderColor if setting is missing', () => {
    useSettings.mockReturnValue({
      getSetting: vi.fn().mockReturnValue(undefined),
      updateSetting: vi.fn()
    })

    const { result } = renderHook(() => useGutterProp())
    expect(result.current.gutterBorderColor).toBe(DEFAULT_GUTTER_BORDER_COLOR)
  })

  it('should update gutterBorderColor', () => {
    const updateSettingMock = vi.fn()
    useSettings.mockReturnValue({
      getSetting: vi.fn(() => undefined),
      updateSetting: updateSettingMock
    })

    const { result } = renderHook(() => useGutterProp())
    const newBorderColor = '#121212'

    act(() => {
      result.current.setGutterBorderColor(newBorderColor)
    })

    expect(updateSettingMock).toHaveBeenCalledWith('gutter.gutterBorderColor', newBorderColor)
  })

  // --- Gutter Border Width (Clamping & Rounding) ---
  it('should return default gutterBorderWidth if setting is missing', () => {
    useSettings.mockReturnValue({
      getSetting: vi.fn().mockReturnValue(undefined),
      updateSetting: vi.fn()
    })

    const { result } = renderHook(() => useGutterProp())
    expect(result.current.gutterBorderWidth).toBe(DEFAULT_GUTTER_BORDER_WIDTH)
  })

  it('should clamp gutterBorderWidth to MIN if value is too low', () => {
    const lowValue = MIN_GUTTER_BORDER_WIDTH - 1
    useSettings.mockReturnValue({
      getSetting: vi.fn((key) => {
        if (key === 'gutter.gutterBorderWidth') return lowValue
        return undefined
      }),
      updateSetting: vi.fn()
    })

    const { result } = renderHook(() => useGutterProp())
    // Should be clamped to MIN
    expect(result.current.gutterBorderWidth).toBe(MIN_GUTTER_BORDER_WIDTH)
  })

  it('should clamp gutterBorderWidth to MAX if value is too high', () => {
    const highValue = MAX_GUTTER_BORDER_WIDTH + 10
    useSettings.mockReturnValue({
      getSetting: vi.fn((key) => {
        if (key === 'gutter.gutterBorderWidth') return highValue
        return undefined
      }),
      updateSetting: vi.fn()
    })

    const { result } = renderHook(() => useGutterProp())
    // Should be clamped to MAX
    expect(result.current.gutterBorderWidth).toBe(MAX_GUTTER_BORDER_WIDTH)
  })

  it('should round gutterBorderWidth to 1 decimal place', () => {
    const rawValue = 2.456
    const expected = 2.5 // rounded to 1 decimal

    useSettings.mockReturnValue({
      getSetting: vi.fn((key) => {
        if (key === 'gutter.gutterBorderWidth') return rawValue
        return undefined
      }),
      updateSetting: vi.fn()
    })

    const { result } = renderHook(() => useGutterProp())
    expect(result.current.gutterBorderWidth).toBe(expected)
  })

  it('should update gutterBorderWidth with clamped and rounded value', () => {
    const updateSettingMock = vi.fn()
    useSettings.mockReturnValue({
      getSetting: vi.fn(() => undefined),
      updateSetting: updateSettingMock
    })

    const { result } = renderHook(() => useGutterProp())

    // Try setting a value that needs clamping and rounding
    // e.g. 6.345 -> rounded to 6.3 -> clamped to MAX (5)
    // Actually MAX is 5.
    // Let's try inside range but needs rounding: 3.456 -> 3.5
    const inputVal = 3.456
    const expectedVal = 3.5

    act(() => {
      result.current.setGutterBorderWidth(inputVal)
    })
    expect(updateSettingMock).toHaveBeenCalledWith('gutter.gutterBorderWidth', expectedVal)

    // Test Clamping Max
    act(() => {
      result.current.setGutterBorderWidth(10)
    })
    expect(updateSettingMock).toHaveBeenCalledWith(
      'gutter.gutterBorderWidth',
      MAX_GUTTER_BORDER_WIDTH
    )

    // Test Clamping Min
    act(() => {
      result.current.setGutterBorderWidth(0)
    })
    expect(updateSettingMock).toHaveBeenCalledWith(
      'gutter.gutterBorderWidth',
      MIN_GUTTER_BORDER_WIDTH
    )
  })
})
