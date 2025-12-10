import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import useGutterProp, { DEFAULT_GUTTER_BG_COLOR } from '../renderer/src/hook/useGutterProp'
import { useSettings } from '../renderer/src/hook/useSettingsContext'

// 1. Mock the useSettings hook
vi.mock('../renderer/src/hook/useSettingsContext', () => ({
  useSettings: vi.fn()
}))

describe('useGutterProp', () => {
  it('should return default gutterBgColor if setting is missing', () => {
    // Setup mock to return undefined for the setting
    useSettings.mockReturnValue({
      getSetting: vi.fn().mockReturnValue(undefined), // returns undefined
      updateSetting: vi.fn()
    })

    const { result } = renderHook(() => useGutterProp())

    // It should timeout to default
    expect(result.current.gutterBgColor).toBe(DEFAULT_GUTTER_BG_COLOR)
  })

  it('should return saved gutterBgColor from settings', () => {
    // Setup mock to return a saved color
    const savedColor = '#ff0000'
    useSettings.mockReturnValue({
      getSetting: vi.fn().mockReturnValue(savedColor),
      updateSetting: vi.fn()
    })

    const { result } = renderHook(() => useGutterProp())

    expect(result.current.gutterBgColor).toBe(savedColor)
  })

  it('should call updateSetting when setting new gutterBgColor', () => {
    const updateSettingMock = vi.fn()
    useSettings.mockReturnValue({
      getSetting: vi.fn().mockReturnValue(null),
      updateSetting: updateSettingMock
    })

    const { result } = renderHook(() => useGutterProp())

    // Act: Call the setter
    const newColor = '#00ff00'
    act(() => {
      result.current.setGutterBgColor(newColor)
    })

    // Assert: Check if updateSetting was called with correct path and value
    expect(updateSettingMock).toHaveBeenCalledWith('gutter.gutterBgColor', newColor)
  })
})
