import { useEffect, useRef } from 'react'
import { SHORTCUT_DEFINITIONS } from './shortcuts'

const KEYDOWN_MATCHERS = SHORTCUT_DEFINITIONS.flatMap((shortcut) =>
  (shortcut.matchers || []).map((matcher) => ({
    shortcut,
    ...matcher,
    type: matcher.type || 'keydown',
    handlerKey: matcher.handlerKey || shortcut.handlerKey
  }))
).filter((matcher) => matcher.type === 'keydown')

export const useKeyboardShortcuts = (shortcuts) => {
  const shortcutsRef = useRef(shortcuts)

  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  useEffect(() => {
    const handleKeyDown = (event) => {
      // SHIELD: If a modal is open, we disable global background shortcuts
      // to prevent things like 'Ctrl+R' (Rename) firing while reading documentation.
      // We allow Escape so the 'onEscapeMenusOnly' handler can still close the modal.
      // SHIELD: Updated to allow shortcuts in Flow Mode (.flow-ghost-modal)
      if (document.querySelector('.universal-modal:not(.flow-ghost-modal)') && event.key !== 'Escape') {
        return
      }

      for (const matcher of KEYDOWN_MATCHERS) {
        if (!matcher.when || !matcher.handlerKey) continue
        const handler = shortcutsRef.current[matcher.handlerKey]
        if (typeof handler !== 'function') continue
        const isMatch = matcher.when(event)
        if (!isMatch) continue

        const args = matcher.getArgs ? matcher.getArgs(event) : []
        let handlerResult
        try {
          handlerResult = handler(...args)
        } catch (error) {
          if (matcher.shortcut?.logErrors) {
            console.error(`❌ Error in ${matcher.handlerKey}:`, error)
          }
        }

        const shouldPrevent =
          typeof matcher.preventDefault === 'function'
            ? matcher.preventDefault(event, handlerResult)
            : matcher.preventDefault !== false

        if (shouldPrevent) {
          try {
            event.preventDefault()
          } catch {}
        }

        const shouldStopPropagation =
          typeof matcher.stopPropagation === 'function'
            ? matcher.stopPropagation(event, handlerResult)
            : matcher.stopPropagation === true

        if (shouldStopPropagation) {
          try {
            event.stopPropagation()
          } catch {}
        }

        const shouldStopImmediate =
          typeof matcher.stopImmediatePropagation === 'function'
            ? matcher.stopImmediatePropagation(event, handlerResult)
            : matcher.stopImmediatePropagation === true

        if (shouldStopImmediate && typeof event.stopImmediatePropagation === 'function') {
          event.stopImmediatePropagation()
        }

        return
      }
    }

    // VS Code-style smooth wheel zoom
    let wheelAccumulator = 0
    const WHEEL_THRESHOLD = 12 // Reduced threshold for much higher sensitivity

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        wheelAccumulator += e.deltaY
        if (Math.abs(wheelAccumulator) >= WHEEL_THRESHOLD) {
          if (wheelAccumulator > 0) {
            // Mouse Wheel Down -> Zoom Out
            if (shortcutsRef.current.onEditorZoomOut) shortcutsRef.current.onEditorZoomOut()
            else if (shortcutsRef.current.onZoomOut) shortcutsRef.current.onZoomOut()
          } else {
            // Mouse Wheel Up -> Zoom In
            if (shortcutsRef.current.onEditorZoomIn) shortcutsRef.current.onEditorZoomIn()
            else if (shortcutsRef.current.onZoomIn) shortcutsRef.current.onZoomIn()
          }
          wheelAccumulator = 0
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('wheel', handleWheel, { capture: true })
    }
  }, [])
}
