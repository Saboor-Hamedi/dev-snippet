import React from 'react'
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../renderer/src/config/settingsManager.js', async () => {
  const { DEFAULT_SETTINGS } = await vi.importActual('../renderer/src/config/defaultSettings.js')

  const clone = () => structuredClone(DEFAULT_SETTINGS)
  let settingsState = clone()
  const listeners = new Set()

  const getValue = (path) => {
    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), settingsState)
  }

  const setValue = (path, value) => {
    const keys = path.split('.')
    const lastKey = keys.pop()
    let target = settingsState
    for (const key of keys) {
      if (typeof target[key] !== 'object' || target[key] === null) {
        target[key] = {}
      }
      target = target[key]
    }
    target[lastKey] = value
  }

  const notify = () => {
    const snapshot = structuredClone(settingsState)
    listeners.forEach((cb) => {
      try {
        cb(snapshot)
      } catch {}
    })
  }

  const api = {
    getAll: vi.fn(() => structuredClone(settingsState)),
    get: vi.fn((path) => getValue(path)),
    set: vi.fn(async (path, value) => {
      setValue(path, value)
      notify()
    }),
    replace: vi.fn(async (next) => {
      settingsState = structuredClone(next)
      notify()
    }),
    reset: vi.fn(async () => {
      settingsState = clone()
      notify()
    }),
    subscribe: vi.fn((cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    }),
    __resetMock: () => {
      settingsState = clone()
      api.getAll.mockClear()
      api.get.mockClear()
      api.set.mockClear()
    }
  }

  return { default: api }
})

import settingsManager from '../renderer/src/config/settingsManager.js'
import { SettingsProvider, useZoomLevel, useEditorZoomLevel } from '../renderer/src/hook/useSettingsContext.jsx'

const wrapper = ({ children }) => <SettingsProvider>{children}</SettingsProvider>

describe('zoom hooks', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    settingsManager.__resetMock()
    window.api = {
      setZoom: vi.fn(() => Promise.resolve())
    }
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('updates global zoom level, applies CSS, and persists to settings', async () => {
    let hook
    await act(async () => {
      hook = renderHook(() => useZoomLevel(), { wrapper })
      await Promise.resolve()
    })

    const { result } = hook

    window.api.setZoom.mockClear()

    act(() => {
      const [, setZoom] = result.current
      setZoom(1.5)
    })

    expect(window.api.setZoom).toHaveBeenCalledWith(1.5)
    expect(document.documentElement.style.getPropertyValue('--zoom-level')).toBe('1.5')

    await act(async () => {
      vi.advanceTimersByTime(1000)
      await Promise.resolve()
    })

    expect(settingsManager.set).toHaveBeenCalledWith('editor.zoomLevel', 1.5)
  })

  it('updates editor zoom level without touching window zoom and persists font scaling', async () => {
    let hook
    await act(async () => {
      hook = renderHook(() => useEditorZoomLevel(), { wrapper })
      await Promise.resolve()
    })

    const { result } = hook

    window.api.setZoom.mockClear()

    act(() => {
      const [, setEditorZoom] = result.current
      setEditorZoom(1.5)
    })

    expect(window.api.setZoom).not.toHaveBeenCalled()
    expect(document.documentElement.style.getPropertyValue('--editor-font-size')).toBe('1.125rem')

    await act(async () => {
      vi.advanceTimersByTime(1000)
      await Promise.resolve()
    })

    expect(settingsManager.set).toHaveBeenCalledWith('editor.fontZoom', 1.5)
  })
})
