import { ViewPlugin, EditorView } from '@codemirror/view'

/**
 * 1. CUSTOM CURSOR STYLES
 * Handles shape (bar/block/underline) and blinking.
 * Replaces the old "smoothCursor" with a standard performant implementation.
 */
export const cursorStyles = EditorView.theme({
  // Global blinking killswitch inside the theme
  '&[data-cursor-blinking="false"] .cm-cursor': {
    animation: 'none !important',
    opacity: '1 !important'
  },
  /* 2. SHAPE (Style) */
  /* Bar Style - uses border-left */
  '.cm-editor-container[data-caret-shape="bar"] & .cm-cursor': {
    borderLeftColor: 'var(--caret-color) !important',
    borderLeftWidth: 'var(--caret-width, 2px) !important',
    borderLeftStyle: 'solid !important',
    backgroundColor: 'transparent !important',
    width: '0 !important'
  },

  /* Block Style - full width block */
  '.cm-editor-container[data-caret-shape="block"] & .cm-cursor': {
    width: '1ch !important',
    height: '1em !important',
    lineHeight: '1em !important',
    display: 'inline-block !important',
    verticalAlign: 'text-bottom !important',
    backgroundColor: 'var(--caret-color) !important',
    opacity: '0.6 !important',
    borderLeft: 'none !important'
  },

  /* Underline Style - bottom border */
  '.cm-editor-container[data-caret-shape="underline"] & .cm-cursor': {
    width: '1ch !important',
    backgroundColor: 'transparent !important',
    borderLeft: 'none !important',
    borderBottom: 'var(--caret-width, 2px) solid var(--caret-color) !important',
    marginBottom: '-2px'
  }
})

// Legacy alias to prevent import errors if buildExtensions imports smoothCursor
export const smoothCursor = cursorStyles

/**
 * 2. PREMIUM SELECTION & FOCUS
 * Rounded selections and active line glow
 */
export const beautySelection = EditorView.theme({
  '.cm-selectionBackground': {
    backgroundColor: 'var(--selection-background, rgba(88, 166, 255, 0.2)) !important',
    borderRadius: '2px'
  },
  // Active-line visuals are intentionally omitted here to avoid conflicts
  // with centralized editor theming and the selection watcher rules in
  // `CodeEditor.css` and `buildTheme.js`. Keep only selection styling.
})

/**
 * 3. INTELLIGENT SELECTION WATCHER
 * Hides the active line highlight when text is being selected (VS Code Standard)
 */
export const selectionWatcher = ViewPlugin.fromClass(
  class {
    constructor(view) {
      // Set initial state
      const hasSelection = !view.state.selection.main.empty
      view.dom.setAttribute('data-has-selection', hasSelection ? 'true' : 'false')
    }

    update(update) {
      if (update.selectionSet || update.docChanged) {
        const hasSelection = !update.state.selection.main.empty
        // Apply data attribute for robust CSS targeting
        update.view.dom.setAttribute('data-has-selection', hasSelection ? 'true' : 'false')
      }
    }
  }
)

/**
 * 3. TACTILE AUDIO FEEDBACK (Synthesized)
 * High-performance, zero-latency "mechanical" sounds without external files
 */
let audioCtx = null

const playTick = (type = 'default') => {
  if (typeof window === 'undefined') return
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioCtx.state === 'suspended') audioCtx.resume()

    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    const now = audioCtx.currentTime

    let freq = 120
    if (type === 'space') freq = 90
    if (type === 'enter') freq = 70

    osc.frequency.setValueAtTime(freq + Math.random() * 20, now)

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.03, now + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)

    osc.type = 'sine'
    osc.connect(gain)
    gain.connect(audioCtx.destination)

    osc.start(now)
    osc.stop(now + 0.05)
  } catch (e) {}
}

export const tactileTyping = ViewPlugin.fromClass(
  class {
    update(update) {
      if (update.docChanged) {
        const lastTx = update.transactions[update.transactions.length - 1]
        // Only play sound for real user input
        if (lastTx?.annotation(EditorView.inputSource) !== undefined) {
          playTick('default')
        }
      }
    }
  }
)

/**
 * MASTER PREMIUM BUNDLE
 */
export const premiumTypingBundle = [cursorStyles, beautySelection, tactileTyping, selectionWatcher]
