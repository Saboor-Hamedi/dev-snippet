import { Decoration } from '@codemirror/view'

/**
 * safeLineAt - Safely retrieves a line object from the document for a given position.
 * Prevents "index out of range" errors by clamping the position to valid doc boundaries.
 */
export const safeLineAt = (doc, pos) => {
  if (!doc) return { number: 1, from: 0, to: 0, text: '' }
  const clamped = Math.max(0, Math.min(pos, doc.length))
  return doc.lineAt(clamped)
}

/**
 * safeLine - Retrieves a line by its 1-indexed number.
 * Clamps the input to ensures we never request a line that doesn't exist.
 */
export const safeLine = (doc, number) => {
  if (!doc) return { number: 1, from: 0, to: 0, text: '' }
  const clamped = Math.max(1, Math.min(number, doc.lines))
  return doc.line(clamped)
}

/**
 * sortDecorations - A critical utility for CodeMirror 6's RangeSet.
 *
 * CodeMirror requires all decorations added to a RangeSetBuilder to be sorted strictly
 * by their 'from' position. This function ensures that order, and also implements
 * a "side-based" priority system to decide which widgets appear first when they
 * share the same document position.
 */
export function sortDecorations(decos) {
  return decos.sort((a, b) => {
    // 1. Primary Sort: Document Position
    if (a.from !== b.from) return a.from - b.from

    // 2. Secondary Sort: startSide (internal CM property)
    if (a.deco.startSide !== undefined && b.deco.startSide !== undefined) {
      if (a.deco.startSide !== b.deco.startSide) return a.deco.startSide - b.deco.startSide
    }

    // 3. Tertiary Sort: custom priority based on widget type
    const getSide = (d) => {
      const spec = d.spec || {}
      // Give block-level replacements the highest priority (-1e9)
      if (spec.block && !spec.widget) return -1000000000
      if (spec.widget && spec.block) return spec.side || 1
      if (spec.widget) return spec.side || 0
      return spec.side || 0
    }
    return getSide(a.deco) - getSide(b.deco)
  })
}

/**
 * getComputedColor - Fetches the value of a CSS variable from the root element.
 * Useful for syncing JS-based drawing (like Mermaid) with the current theme.
 */
export const getComputedColor = (varName, fallback) => {
  if (typeof window === 'undefined') return fallback
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return val || fallback
}

// Pre-defined decoration for hiding text (e.g. hiding markdown markers)
export const hideDeco = Decoration.replace({})

// Map of header marks for varying font sizes
export const headerMarks = {
  h1: Decoration.mark({ class: 'cm-h1' }),
  h2: Decoration.mark({ class: 'cm-h2' }),
  h3: Decoration.mark({ class: 'cm-h3' }),
  h4: Decoration.mark({ class: 'cm-h4' }),
  h5: Decoration.mark({ class: 'cm-h5' }),
  h6: Decoration.mark({ class: 'cm-h6' })
}

/**
 * showSourceModal - Global dispatcher that tells the Workbench to open
 * the interactive modal for editing complex structures (Table/Mermaid).
 */
export const showSourceModal = (view, from, to, initialCode) => {
  // Flag system to prevent infinite event loops if modals open recursively
  if (window.__suppressNextSourceModal) {
    window.__suppressNextSourceModal = false
    return
  }

  window.dispatchEvent(
    new CustomEvent('app:open-source-modal', {
      detail: { view, from, to, initialCode }
    })
  )
}
