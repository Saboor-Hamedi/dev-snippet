import { ViewPlugin, EditorView } from '@codemirror/view'

/**
 * 1. CUSTOM CURSOR STYLES
 * Handles shape (bar/block/underline) and blinking.
 * Replaces the old "smoothCursor" with a standard performant implementation.
 */
export const cursorStyles = EditorView.theme({
  /* 1. VISIBILITY (Blinking) */
  '&[data-cursor-blinking="true"] .cm-cursor': {
    animation: 'cm-cursor-blink 1s steps(1) infinite !important'
  },

  /* 2. SHAPE (Style) */
  /* Bar Style - uses border-left */
  '&[data-caret-shape="bar"] .cm-cursor': {
    borderLeftColor: 'var(--caret-color) !important',
    borderLeftWidth: 'var(--caret-width, 2px) !important',
    borderLeftStyle: 'solid !important',
    backgroundColor: 'transparent !important',
    width: '0 !important'
  },

  /* Block Style - full width block */
  '&[data-caret-shape="block"] .cm-cursor': {
    width: '1ch !important',
    backgroundColor: 'var(--caret-color) !important',
    opacity: '0.6 !important',
    borderLeft: 'none !important'
  },

  /* Underline Style - bottom border */
  '&[data-caret-shape="underline"] .cm-cursor': {
    width: '1ch !important',
    backgroundColor: 'transparent !important',
    borderLeft: 'none !important',
    borderBottom: 'var(--caret-width, 2px) solid var(--caret-color) !important',
    marginBottom: '-2px'
  },

  /* Animation Keyframes */
  '@keyframes cm-cursor-blink': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0 }
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
  '.cm-activeLine': {
    backgroundColor: 'rgba(88, 166, 255, 0.03) !important',
    borderLeftWidth: 'var(--active-line-border-width, 0px) !important',
    borderLeftColor: 'var(--caret-color) !important',
    borderLeftStyle: 'solid !important',
    boxShadow: 'inset 10px 0 20px -15px var(--caret-color)',
    position: 'relative'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(88, 166, 255, 0.05) !important',
    color: 'var(--caret-color) !important',
    borderLeftWidth: 'var(--active-line-gutter-border-width, 0px) !important',
    borderLeftColor: 'var(--caret-color) !important',
    borderLeftStyle: 'solid !important',
    transition: 'all 0.2s ease'
  }
})

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
export const premiumTypingBundle = [cursorStyles, beautySelection, tactileTyping]
