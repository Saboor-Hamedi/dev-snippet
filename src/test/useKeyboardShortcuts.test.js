import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from '../renderer/src/hook/useKeyboardShortcuts.js'

describe('useKeyboardShortcuts', () => {
  let mockHandlers

  beforeEach(() => {
    mockHandlers = {
      onSave: vi.fn(),
      onCreateSnippet: vi.fn(),
      onToggleCommandPalette: vi.fn(),
      onToggleSettings: vi.fn(),
      onCopyToClipboard: vi.fn(),
      onTogglePreview: vi.fn(),
      onRenameSnippet: vi.fn(),
      onDeleteSnippet: vi.fn(),
      onCloseEditor: vi.fn(),
      onEscapeMenusOnly: vi.fn()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('calls onSave when Ctrl+S is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers))

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
    window.dispatchEvent(event)

    expect(mockHandlers.onSave).toHaveBeenCalled()
  })

  it('calls onSave when Ctrl+Shift+S is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers))

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, shiftKey: true })
    window.dispatchEvent(event)

    expect(mockHandlers.onSave).toHaveBeenCalled()
  })

  it('calls onCreateSnippet when Ctrl+N is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers))

    const event = new KeyboardEvent('keydown', { key: 'n', ctrlKey: true })
    window.dispatchEvent(event)

    expect(mockHandlers.onCreateSnippet).toHaveBeenCalled()
  })

  it('calls onToggleCommandPalette when Ctrl+P is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers))

    const event = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true })
    window.dispatchEvent(event)

    expect(mockHandlers.onToggleCommandPalette).toHaveBeenCalled()
  })

  it('calls onToggleSettings when Ctrl+, is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers))

    const event = new KeyboardEvent('keydown', { key: ',', ctrlKey: true })
    window.dispatchEvent(event)

    expect(mockHandlers.onToggleSettings).toHaveBeenCalled()
  })

  it('calls onCopyToClipboard when Ctrl+Shift+C is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers))

    const event = new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, shiftKey: true })
    window.dispatchEvent(event)

    expect(mockHandlers.onCopyToClipboard).toHaveBeenCalled()
  })

  it('calls onRenameSnippet when Ctrl+R is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers))

    const event = new KeyboardEvent('keydown', { key: 'r', ctrlKey: true })
    window.dispatchEvent(event)

    expect(mockHandlers.onRenameSnippet).toHaveBeenCalled()
  })

  it('calls onDeleteSnippet when Ctrl+Shift+D is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers))

    const event = new KeyboardEvent('keydown', { key: 'd', ctrlKey: true, shiftKey: true })
    window.dispatchEvent(event)

    expect(mockHandlers.onDeleteSnippet).toHaveBeenCalled()
  })

  it('calls onCloseEditor when Ctrl+Shift+W is pressed', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers))

    const event = new KeyboardEvent('keydown', { key: 'w', ctrlKey: true, shiftKey: true })
    window.dispatchEvent(event)

    expect(mockHandlers.onCloseEditor).toHaveBeenCalled()
  })

  it('handles case-insensitive keys', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers))

    const event = new KeyboardEvent('keydown', { key: 'N', ctrlKey: true })
    window.dispatchEvent(event)

    expect(mockHandlers.onCreateSnippet).toHaveBeenCalled()
  })

  it('does not trigger without modifier keys', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers))

    const event = new KeyboardEvent('keydown', { key: 's' })
    window.dispatchEvent(event)

    expect(mockHandlers.onSave).not.toHaveBeenCalled()
  })

  it('supports metaKey (Cmd on Mac)', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers))

    const event = new KeyboardEvent('keydown', { key: 's', metaKey: true })
    window.dispatchEvent(event)

    expect(mockHandlers.onSave).toHaveBeenCalled()
  })

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useKeyboardShortcuts(mockHandlers))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('updates handlers when shortcuts change', () => {
    const { rerender } = renderHook(({ handlers }) => useKeyboardShortcuts(handlers), {
      initialProps: { handlers: mockHandlers }
    })

    const newOnSave = vi.fn()
    const newHandlers = { ...mockHandlers, onSave: newOnSave }

    rerender({ handlers: newHandlers })

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
    window.dispatchEvent(event)

    expect(newOnSave).toHaveBeenCalled()
    expect(mockHandlers.onSave).not.toHaveBeenCalled()
  })

  it('does not call handler if not provided', () => {
    const partialHandlers = { onSave: vi.fn() }
    renderHook(() => useKeyboardShortcuts(partialHandlers))

    const event = new KeyboardEvent('keydown', { key: 'n', ctrlKey: true })
    window.dispatchEvent(event)

    // Should not crash, just silently ignore
    expect(partialHandlers.onSave).not.toHaveBeenCalled()
  })
})
