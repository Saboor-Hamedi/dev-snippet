import { Decoration } from '@codemirror/view'

// Helper to access doc safely
export const safeLineAt = (doc, pos) => {
  if (!doc) return { number: 1, from: 0, to: 0, text: '' }
  const clamped = Math.max(0, Math.min(pos, doc.length))
  return doc.lineAt(clamped)
}

export const safeLine = (doc, number) => {
  if (!doc) return { number: 1, from: 0, to: 0, text: '' }
  const clamped = Math.max(1, Math.min(number, doc.lines))
  return doc.line(clamped)
}

// Utility: Robust Decoration and Widget Sorting
export function sortDecorations(decos) {
  return decos.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from
    if (a.deco.startSide !== undefined && b.deco.startSide !== undefined) {
      if (a.deco.startSide !== b.deco.startSide) return a.deco.startSide - b.deco.startSide
    }
    const getSide = (d) => {
      const spec = d.spec || {}
      // Prioritize block widgets that replace content (-1000000000 ensures they come first)
      if (spec.block && !spec.widget) return -1000000000
      if (spec.widget && spec.block) return spec.side || 1
      if (spec.widget) return spec.side || 0
      return spec.side || 0
    }
    return getSide(a.deco) - getSide(b.deco)
  })
}

// CSS Variable helper
export const getComputedColor = (varName, fallback) => {
  if (typeof window === 'undefined') return fallback
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return val || fallback
}

// Common Decorations
export const hideDeco = Decoration.replace({})

// Header Mark Decorations (Font Size Hierarchy)
// Note: We use dynamic access in the loop, so we export an object map.
export const headerMarks = {
  h1: Decoration.mark({ class: 'cm-h1' }),
  h2: Decoration.mark({ class: 'cm-h2' }),
  h3: Decoration.mark({ class: 'cm-h3' }),
  h4: Decoration.mark({ class: 'cm-h4' }),
  h5: Decoration.mark({ class: 'cm-h5' }),
  h6: Decoration.mark({ class: 'cm-h6' })
}

// Modal Dispatch Helper
export const showSourceModal = (view, from, to, initialCode) => {
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
