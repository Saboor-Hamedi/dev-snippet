import { Decoration, ViewPlugin, EditorView, WidgetType, keymap } from '@codemirror/view'
import { RangeSetBuilder, StateField, StateEffect, Prec, Transaction } from '@codemirror/state'
import { syntaxTree } from '@codemirror/language'
import mermaid from 'mermaid'
import { makeDraggable } from '../../../utils/draggable.js'

mermaid.initialize({ startOnLoad: false, theme: 'dark' })

// --- Global Editor State: Triple Mode (Obsidian-Style) ---
export const EditorMode = {
  SOURCE: 'source',
  LIVE_PREVIEW: 'live_preview',
  READING: 'reading'
}

export const setEditorMode = StateEffect.define()

export const editorModeField = StateField.define({
  create() {
    return EditorMode.LIVE_PREVIEW
  },
  update(value, tr) {
    for (let e of tr.effects) if (e.is(setEditorMode)) return e.value
    return value
  }
})

// --- Utility: Safe Document Access ---
const safeLineAt = (doc, pos) => {
  if (!doc) return { number: 1, from: 0, to: 0, text: '' }
  const clamped = Math.max(0, Math.min(pos, doc.length))
  return doc.lineAt(clamped)
}

const safeLine = (doc, number) => {
  if (!doc) return { number: 1, from: 0, to: 0, text: '' }
  const clamped = Math.max(1, Math.min(number, doc.lines))
  return doc.line(clamped)
}

// Helper to resolve CSS variables for Mermaid (which doesn't support var() strings)
const getComputedColor = (varName, fallback) => {
  if (typeof window === 'undefined') return fallback
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return val || fallback
}

// Global state to track focused table cell across re-renders (Live Typing)
let activeTableFocus = null // { row, col, from, to }

// --- 1. Utility: Robust Decoration Sorting ---

// -----------------------------------------------------------------------------
// 1. Utility: Robust Decoration Sorting
// -----------------------------------------------------------------------------
// CodeMirror decorations need to be sorted by position to be applied correctly.
// This utility sorts decorations first by their start position ('from'), and then
// by a custom 'side' priority (block widgets first, then inline widgets).
// This prevents "out of order" errors when multiple widgets occupy the same range.
function sortDecorations(decos) {
  return decos.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from
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

// --- 2. Inline Regex-based Decorations ---

const wikiLinkDeco = Decoration.mark({ class: 'cm-wikilink' })
const mentionDeco = Decoration.mark({ class: 'cm-mention' })
const hashtagDeco = Decoration.mark({ class: 'cm-hashtag' })

// -----------------------------------------------------------------------------
// 3. Widgets: Custom HTML Rendering for Markdown Elements
// -----------------------------------------------------------------------------
// These widgets replace the raw Markdown text with rich HTML representations
// (images, checkboxes, tables, etc.) to create a "Live Preview" experience.

// --- Image Widget ---
// Replaces ![alt](url) with an <img> tag.
// Note the 'eq' method: used by CodeMirror to determine if the widget needs re-rendering.
class ImageWidget extends WidgetType {
  constructor(alt, src) {
    super()
    this.alt = alt
    this.src = src
  }
  eq(other) {
    return other.src === this.src && other.alt === this.alt
  }
  toDOM() {
    const wrap = document.createElement('div')
    wrap.className = 'cm-md-image-container'
    // Prevent editor selection hijacking on click
    wrap.onmousedown = (e) => e.stopPropagation()
    const img = document.createElement('img')
    img.src = this.src
    img.alt = this.alt
    img.loading = 'lazy'
    img.className = 'cm-md-rendered-image'
    wrap.appendChild(img)
    return wrap
  }
}

// -----------------------------------------------------------------------------
// 2. Inline Regex-based Decorations (ViewPlugin)
// -----------------------------------------------------------------------------
// This plugin handles "lightweight" inline decorations that don't affect layout
// structure significantly, such as WikiLinks [[...]], @mentions, and #hashtags.
// We use a ViewPlugin here because it allows us to scan the *visible* viewport
// efficiently on every update without re-parsing the entire document's syntax tree.
const inlineRegexPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = this.getDecorations(view)
    }

    update(update) {
      // Re-calculate decorations only if the document changed or the viewport scrolled
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.getDecorations(update.view)
      }
    }

    getDecorations(view) {
      // Safety checks: Ensure we have a valid view and document state
      if (!view || !view.state || !view.state.doc) return Decoration.none
      const doc = view.state.doc
      const viewport = view.viewport

      // If viewport is invalid (e.g. during initialization), bail out
      if (!viewport || typeof viewport.from !== 'number' || typeof viewport.to !== 'number')
        return Decoration.none
      const docLen = doc.length
      if (viewport.to > docLen) return Decoration.none

      const from = viewport.from
      const to = viewport.to

      // Extract the text only for the visible viewport to stay performant
      const text = doc.sliceString(from, to)

      const collected = []

      // --- Parsing Logic: Regex Matching ---

      // 1. WikiLinks: Matches [[Page Name]]
      const wikiLinkRegex = /\[\[[^\]\n]+\]\]/g
      let match
      while ((match = wikiLinkRegex.exec(text)) !== null) {
        collected.push({
          from: from + match.index,
          to: from + match.index + match[0].length,
          deco: wikiLinkDeco
        })
      }

      // 2. Mentions: Matches @username (preceded by start of line or whitespace)
      const mentionRegex = /(?:^|\s)(@[\w]+)/g
      while ((match = mentionRegex.exec(text)) !== null) {
        const fullMatch = match[0]
        const mention = match[1]
        // Adjust index to skip the leading whitespace if present
        const start = match.index + (fullMatch.length - mention.length)
        collected.push({ from: from + start, to: from + start + mention.length, deco: mentionDeco })
      }

      // 3. Hashtags: Matches #tagname
      const hashtagRegex = /(?:^|\s)(#[\w]+)/g
      while ((match = hashtagRegex.exec(text)) !== null) {
        const fullMatch = match[0]
        const hashtag = match[1]
        const start = match.index + (fullMatch.length - hashtag.length)
        collected.push({ from: from + start, to: from + start + hashtag.length, deco: hashtagDeco })
      }

      // --- Build & Sort ---
      const builder = new RangeSetBuilder()
      // Filter out any invalid ranges (sanity check)
      const valid = collected.filter((d) => d.from >= 0 && d.to <= docLen && d.from <= d.to)

      // Use our robust sorter to ensure decorations are added in correct order
      sortDecorations(valid).forEach((d) => {
        try {
          if (builder.lastFrom <= d.from) builder.add(d.from, d.to, d.deco)
        } catch (e) {
          // Ignore overlaps that builder refuses; preventing crashes is priority
        }
      })
      return builder.finish()
    }
  },
  { decorations: (v) => v.decorations }
)

// --- 3. Widgets & Block Decorations ---

class CheckboxWidget extends WidgetType {
  constructor(checked, pos) {
    super()
    this.checked = checked
    this.pos = pos
  }
  eq(other) {
    return other.checked === this.checked && other.pos === this.pos
  }
  toDOM(view) {
    const span = document.createElement('span')
    span.className = `cm-md-checkbox ${this.checked ? 'is-checked' : ''}`
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.checked = this.checked
    input.addEventListener('change', (e) => {
      const replacement = e.target.checked ? '[x]' : '[ ]'
      view.dispatch({ changes: { from: this.pos, to: this.pos + 3, insert: replacement } })
    })
    input.addEventListener('mousedown', (e) => e.stopPropagation())
    span.appendChild(input)
    return span
  }
}

class TableWidget extends WidgetType {
  constructor(raw, from, to, mode) {
    super()
    this.raw = raw
    this.from = from
    this.to = to
    this.mode = mode
  }
  eq(other) {
    // If mode changed, we MUST regenerate to update handlers/locking
    if (other.mode !== this.mode) return false

    if (activeTableFocus && activeTableFocus.from === this.from) {
      this.raw = other.raw
      return true
    }
    return other.raw === this.raw && other.from === this.from && other.to === this.to
  }
  ignoreEvent() {
    return true
  }
  toDOM(view) {
    if (!this.raw) return document.createElement('div')
    const lines = this.raw.trim().split('\n')
    if (lines.length < 2) return document.createElement('div')

    const table = document.createElement('table')
    table.className = 'cm-md-rendered-table'
    const tbody = document.createElement('tbody')

    const getCells = (l) => {
      const trimmed = l.trim()
      if (!trimmed.startsWith('|') && !trimmed.endsWith('|')) return []
      return trimmed
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((s) => s.trim())
    }

    const sepLineIdx = lines.findIndex((l) => l.includes('---'))
    const sepLine = lines[sepLineIdx]
    let alignments = []
    if (sepLine) {
      alignments = getCells(sepLine).map((c) =>
        c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : 'left'
      )
    }

    const matrix = lines.filter((_, idx) => idx !== sepLineIdx).map((l) => getCells(l))
    const headerColCount = matrix[0]?.length || 0

    let syncTimeout = null
    const dispatchUpdate = () => {
      if (syncTimeout) clearTimeout(syncTimeout)
      syncTimeout = setTimeout(() => {
        const newLines = matrix.map((rowCells) => {
          const normalized = [...rowCells]
          while (normalized.length < headerColCount) normalized.push(' ')
          if (normalized.length > headerColCount) normalized.length = headerColCount
          return '| ' + normalized.join(' | ') + ' |'
        })
        if (sepLineIdx !== -1) {
          const sepCells = getCells(sepLine)
          while (sepCells.length < headerColCount) sepCells.push('---')
          sepCells.length = headerColCount
          newLines.splice(sepLineIdx, 0, '| ' + sepCells.join(' | ') + ' |')
        }
        view.dispatch({
          changes: { from: this.from, to: this.to, insert: newLines.join('\n') },
          userEvent: 'input.table.edit',
          scrollIntoView: false
        })
      }, 600)
    }

    matrix.forEach((rowCells, rIdx) => {
      const tr = document.createElement('tr')
      rowCells.forEach((text, cIdx) => {
        const isHeader = rIdx === 0 && sepLineIdx !== -1
        const td = document.createElement(isHeader ? 'th' : 'td')
        td.contentEditable = 'true'
        td.className = 'cm-md-table-cell'
        td.textContent = text
        if (alignments[cIdx]) td.style.textAlign = alignments[cIdx]

        td.onfocus = () => {
          activeTableFocus = { row: rIdx, col: cIdx, from: this.from, to: this.to }
        }
        td.oninput = () => {
          matrix[rIdx][cIdx] = td.textContent
          dispatchUpdate()
        }
        td.onkeydown = (e) => {
          if (e.key === 'Tab') {
            e.preventDefault()
            const next = tr.children[cIdx + 1] || tr.nextElementSibling?.children[0]
            if (next) next.focus()
          } else if (e.key === 'Enter') {
            e.preventDefault()
            const nextRow = tr.nextElementSibling
            if (nextRow && nextRow.children[cIdx]) {
              nextRow.children[cIdx].focus()
            } else {
              plusBottom.click()
            }
          }
        }
        tr.appendChild(td)
      })
      tbody.appendChild(tr)
    })
    table.appendChild(tbody)

    const wrap = document.createElement('div')
    wrap.className = 'cm-md-table-rendered-wrapper'
    // Prevent block selection when clicking table padding
    wrap.onmousedown = (e) => e.stopPropagation()
    wrap.appendChild(table)

    // Mode Awareness
    const mode = view.state.field(editorModeField)
    wrap.ondblclick = (e) => {
      // Disable Source Modal in Reading Mode
      if (mode === EditorMode.READING) return

      e.preventDefault()
      e.stopPropagation()
      showSourceModal(view, this.from, this.to, this.raw.trim())
    }

    if (mode === EditorMode.READING) {
      table.querySelectorAll('[contenteditable]').forEach((c) => (c.contentEditable = 'false'))
      return wrap
    }

    const plusRight = document.createElement('div')
    plusRight.className = 'cm-md-table-edge-plus cm-md-table-plus-right'
    plusRight.innerHTML = '+'
    plusRight.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const updatedLines = lines.map((l, idx) => {
        const cells = getCells(l)
        cells.push(idx === sepLineIdx ? '---' : ' ')
        return '| ' + cells.join(' | ') + ' |'
      })
      view.dispatch({
        changes: { from: this.from, to: this.to, insert: updatedLines.join('\n') },
        userEvent: 'input.table.struct',
        selection: view.state.selection
      })
    }

    const plusBottom = document.createElement('div')
    plusBottom.className = 'cm-md-table-edge-plus cm-md-table-plus-bottom'
    plusBottom.innerHTML = '+'
    plusBottom.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const currentCols = getCells(lines[0]).length
      const newRow = '| ' + Array(currentCols).fill(' ').join(' | ') + ' |'
      const updatedTable = [...lines, newRow].join('\n')
      view.dispatch({
        changes: { from: this.from, to: this.to, insert: updatedTable },
        userEvent: 'input.table.struct',
        selection: view.state.selection
      })
    }

    const toolbar = document.createElement('div')
    toolbar.className = 'cm-md-table-toolbar'
    const btnSource = document.createElement('button')
    btnSource.className = 'cm-md-table-btn cm-md-table-source-btn'
    btnSource.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>'
    btnSource.title = 'View Source'
    btnSource.onclick = (e) => {
      e.stopPropagation()
      showSourceModal(view, this.from, this.to, this.raw.trim())
    }
    toolbar.appendChild(btnSource)

    wrap.appendChild(plusRight)
    wrap.appendChild(plusBottom)
    wrap.appendChild(toolbar)

    if (activeTableFocus && activeTableFocus.from === this.from) {
      setTimeout(() => {
        try {
          const r = tbody.children[activeTableFocus.row]
          const c = r?.children[activeTableFocus.col]
          if (c && c.isConnected && document.activeElement !== c) {
            c.focus({ preventScroll: true })
            const sel = window.getSelection()
            if (sel) {
              sel.selectAllChildren(c)
              sel.collapseToEnd()
            }
          }
        } catch (err) {}
      }, 0)
    }

    return wrap
  }
}

class AdmonitionWidget extends WidgetType {
  constructor(type, title, content) {
    super()
    this.type = type
    this.title = title
    this.content = content
  }
  eq(other) {
    return other.type === this.type && other.title === this.title && other.content === this.content
  }
  toDOM() {
    const wrap = document.createElement('div')
    wrap.className = `cm-admonition cm-admonition-${this.type.toLowerCase()}`
    // Prevent editor from hijacking clicks inside the admonition (fixes cursor jumping)
    wrap.onmousedown = (e) => e.stopPropagation()

    const header = document.createElement('div')
    header.className = 'cm-admonition-header'
    header.innerHTML = `<span class="cm-admonition-icon"></span><span class="cm-admonition-title">${this.title || this.type.toUpperCase()}</span>`
    wrap.appendChild(header)
    const body = document.createElement('div')
    body.className = 'cm-admonition-body'
    body.textContent = this.content
    wrap.appendChild(body)
    return wrap
  }
}

class HRWidget extends WidgetType {
  toDOM() {
    const hr = document.createElement('hr')
    hr.className = 'cm-md-hr'
    return hr
  }
}

// --- Table Creator Widget ---
// A helper button that appears on empty lines to quickly insert a standard table template.
// This improves discoverability of table features.
class TableCreateWidget extends WidgetType {
  toDOM(view) {
    const btn = document.createElement('button')
    btn.className = 'cm-md-table-create-btn'
    // SVG Icon for table
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg> Create Table'

    btn.onclick = (e) => {
      // Find where we are in the document
      const pos = view.posAtDOM(btn)
      // Insert a basic 2x2 table structure
      const tableText = '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |'
      view.dispatch({
        changes: { from: pos, to: pos, insert: tableText },
        selection: { anchor: pos + 2 } // Intelligently place cursor in the first cell
      })
    }
    return btn
  }
}

class CodeBlockHeaderWidget extends WidgetType {
  constructor(lang) {
    super()
    this.lang = lang
  }
  eq(other) {
    return other.lang === this.lang
  }
  toDOM(view) {
    const wrap = document.createElement('div')
    wrap.className = 'cm-code-block-header'
    const langSpan = document.createElement('span')
    langSpan.textContent = (this.lang || 'code').toUpperCase()
    wrap.appendChild(langSpan)
    const copyBtn = document.createElement('button')
    copyBtn.className = 'cm-code-copy-btn'
    copyBtn.textContent = 'Copy'
    copyBtn.addEventListener('click', (e) => {
      const pos = view.posAtDOM(wrap)
      if (pos < 0) return
      const node = syntaxTree(view.state).resolveInner(pos, 1)
      let fn = node
      while (fn && fn.name !== 'FencedCode') fn = fn.parent
      if (fn) {
        const code = view.state.doc
          .sliceString(fn.from, fn.to)
          .replace(/^```\w*\n?/, '')
          .replace(/\n?```$/, '')
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.textContent = 'Copied!'
          setTimeout(() => (copyBtn.textContent = 'Copy'), 2000)
        })
      }
    })
    wrap.appendChild(copyBtn)
    return wrap
  }
}

class MermaidWidget extends WidgetType {
  constructor(code, mode) {
    super()
    this.code = code
    this.mode = mode
    this.zoom = 1
    this.panX = 0
    this.panY = 0
  }
  eq(other) {
    if (other.mode !== this.mode) return false
    return other.code === this.code
  }
  toDOM(view) {
    const wrap = document.createElement('div')
    wrap.className = 'cm-mermaid-widget'
    const uniqueId = 'mermaid-' + Math.random().toString(36).substr(2, 9)
    wrap.id = uniqueId
    wrap.innerHTML = '<div class="cm-mermaid-loading">Generating schematic...</div>'

    const svgContainer = document.createElement('div')
    svgContainer.className = 'cm-mermaid-svg-container'
    wrap.appendChild(svgContainer)

    // Panning Logic
    let isDragging = false
    let startX, startY

    svgContainer.onmousedown = (e) => {
      if (this.zoom > 1 || wrap.style.position === 'fixed') {
        isDragging = true
        startX = e.clientX - this.panX
        startY = e.clientY - this.panY
        svgContainer.style.cursor = 'grabbing'
        e.preventDefault()
      }
    }

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return
      this.panX = e.clientX - startX
      this.panY = e.clientY - startY
      const svg = svgContainer.querySelector('svg')
      if (svg) {
        svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`
      }
    })

    window.addEventListener('mouseup', () => {
      isDragging = false
      svgContainer.style.cursor = this.zoom > 1 ? 'grab' : 'default'
    })

    // Toolbar (Always visible for Zoom/Reset, but partially hidden in Reading)
    const toolbar = document.createElement('div')
    toolbar.className = 'cm-mermaid-toolbar'

    const btnSource = document.createElement('button')
    btnSource.className = 'cm-mermaid-tool-btn'
    btnSource.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>'
    btnSource.title = 'View Source'
    btnSource.onclick = (e) => {
      e.stopPropagation()
      showSourceModal(view, this.from, this.to, this.code)
    }

    const zoomIn = document.createElement('button')
    zoomIn.className = 'cm-mermaid-tool-btn'
    zoomIn.innerHTML = '+'
    zoomIn.onclick = (e) => {
      e.stopPropagation()
      this.zoom += 0.2
      const svg = svgContainer.querySelector('svg')
      if (svg) {
        svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`
        svgContainer.style.cursor = 'grab'
      }
    }

    const reset = document.createElement('button')
    reset.className = 'cm-mermaid-tool-btn'
    reset.innerHTML = 'Reset'
    reset.onclick = (e) => {
      e.stopPropagation()
      this.zoom = 1
      this.panX = 0
      this.panY = 0
      const svg = svgContainer.querySelector('svg')
      if (svg) svg.style.transform = `translate(0,0) scale(1)`
      svgContainer.style.cursor = 'default'
    }

    // Only add Source button in non-Reading modes
    const mode = view.state.field(editorModeField)
    if (mode !== EditorMode.READING) {
      toolbar.appendChild(btnSource)
    }

    // Always add Zoom/Reset tools
    toolbar.appendChild(zoomIn)
    toolbar.appendChild(reset)
    wrap.appendChild(toolbar)

    // Capture state synchronously before entering async timeout
    // Defensive check for facet and EditorView.dark to prevent CM6 internals crash
    let isDark = true
    try {
      if (view && view.state && view.state.facet && EditorView.dark) {
        isDark = view.state.facet(EditorView.dark)
      } else {
        isDark = document.documentElement.classList.contains('dark')
      }
    } catch (e) {
      isDark = document.documentElement.classList.contains('dark')
    }

    const runRender = async () => {
      try {
        // Use the closure 'wrap' directly instead of getElementById
        const container = wrap
        if (!container) return

        // Wait for attachment to DOM to ensure styles/variables work
        if (!container.isConnected) {
          setTimeout(runRender, 50)
          return
        }

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'loose',
          fontFamily: getComputedColor('--editor-font-family', '"JetBrains Mono"'),
          themeVariables: isDark
            ? {
                primaryColor: getComputedColor('--color-bg-tertiary', '#1e1e1e'),
                primaryTextColor: getComputedColor('--color-text-primary', '#ffffff'),
                primaryBorderColor: getComputedColor('--color-accent-primary', '#58a6ff'),
                lineColor: getComputedColor('--color-text-secondary', '#8b949e'),
                secondaryColor: getComputedColor('--color-bg-secondary', '#0d1117'),
                tertiaryColor: getComputedColor('--color-bg-primary', '#0d1117'),
                mainBkg: getComputedColor('--color-bg-primary', '#0d1117'),
                nodeBorder: getComputedColor('--color-accent-primary', '#58a6ff'),
                clusterBkg: getComputedColor('--color-bg-secondary', '#0d1117'),
                titleColor: getComputedColor('--color-text-primary', '#ffffff'),
                edgeLabelBackground: getComputedColor('--color-bg-tertiary', '#1e1e1e'),
                nodeTextColor: getComputedColor('--color-text-primary', '#ffffff')
              }
            : {
                primaryColor: '#f1f5f9',
                primaryTextColor: '#0f172a',
                primaryBorderColor: '#3b82f6',
                lineColor: '#64748b',
                secondaryColor: '#f8fafc',
                tertiaryColor: '#ffffff',
                mainBkg: '#ffffff',
                nodeBorder: '#3b82f6',
                clusterBkg: '#f1f5f9',
                titleColor: '#0f172a',
                edgeLabelBackground: '#f1f5f9',
                nodeTextColor: '#0f172a'
              }
        })

        const { svg } = await mermaid.render(uniqueId + '-svg', this.code)

        const loading = container.querySelector('.cm-mermaid-loading')
        if (loading) loading.remove()

        const target = container.querySelector('.cm-mermaid-svg-container')
        if (target) {
          target.innerHTML = svg
        }
        if (view && typeof view.requestMeasure === 'function') {
          view.requestMeasure()
        }
      } catch (e) {
        console.error('[Mermaid Widget] Render failed:', e)
        const container = wrap // Closure
        if (container) {
          container.innerHTML = `<div style="color:var(--color-danger, #f85149); font-size: 0.8em; padding: 10px;">
            <strong>Mermaid Error:</strong><br/>
            <pre style="font-size: 0.9em; margin-top: 5px; white-space: pre-wrap;">${e.message || 'Check syntax'}</pre>
          </div>`
        }
      }
    }

    // Always delay slightly to ensure DOM insertion/Layout for CSS variables
    setTimeout(runRender, 50)
    return wrap
  }
}

// --- 4. The Unified State Field ---

const headerMarks = {
  h1: Decoration.mark({ class: 'cm-md-h1' }),
  h2: Decoration.mark({ class: 'cm-md-h2' }),
  h3: Decoration.mark({ class: 'cm-md-h3' }),
  h4: Decoration.mark({ class: 'cm-md-h4' }),
  h5: Decoration.mark({ class: 'cm-md-h5' }),
  h6: Decoration.mark({ class: 'cm-md-h6' })
}
const hideDeco = Decoration.replace({})

// -----------------------------------------------------------------------------
// 4. The Unified State Field (The Core Logic)
// -----------------------------------------------------------------------------
// This StateField produces the bulk of the decorations. It iterates over the
// document's Syntax Tree (provided by Lezer/CodeMirror language package) and
// replaces recognized Markdown structures (Headers, Images, Tables) with our
// custom widgets or styles.

const richMarkdownField = StateField.define({
  create() {
    return Decoration.none
  },

  update(value, tr) {
    // Optimization: If nothing meaningful changed (no doc change, no selection change like mode switch),
    // just map the existing decorations forward to the new positions.
    const modeChanged = tr.effects.some((e) => e.is(setEditorMode))
    if (
      !tr.docChanged &&
      !tr.selection &&
      !tr.effects.some((e) => e.is(StateEffect.reconfigure)) &&
      !modeChanged
    ) {
      try {
        return value.map(tr.changes)
      } catch (e) {
        return Decoration.none
      }
    }
    const { doc, selection } = tr.state
    // Check the current Editor Mode (Source, Live Preview, Reading)
    const mode = tr.state.field(editorModeField)

    if (!doc || doc.length === 0) return Decoration.none

    // Determine the 'Active Line' (where the cursor is).
    // In Live Preview, we usually want to reveal the raw source of the active line
    // so the user can edit it, while keeping other lines rendered as rich preview.
    let head = selection.main.head
    if (head > doc.length) head = doc.length
    if (head < 0) head = 0
    const activeLineNumber = safeLineAt(doc, head).number

    const collected = []

    // Helper: Add Table Creator to empty lines at the end of selection or on empty file
    if (mode !== EditorMode.READING && doc.lineAt(head).text.trim() === '') {
      collected.push({
        from: head,
        to: head,
        deco: Decoration.widget({
          widget: new TableCreateWidget(),
          side: 1,
          block: true
        })
      })
    }

    try {
      syntaxTree(tr.state).iterate({
        from: 0,
        to: doc.length,
        enter: (node) => {
          const from = node.from
          const to = node.to
          if (from > doc.length || to > doc.length) return

          // Headers (ATX and Setext support)
          if (node.name.includes('Heading')) {
            const levelMatch = node.name.match(/(\d)$/)
            const level = levelMatch ? levelMatch[1] : '1'
            // Use MARK decoration on the text range, avoiding overlap with hidden hashes
            let contentStart = from

            // Hide hashes in Reading/Live(inactive)
            if (
              mode !== EditorMode.SOURCE &&
              (mode === EditorMode.READING || safeLineAt(doc, from).number !== activeLineNumber)
            ) {
              const text = doc.sliceString(from, to)
              const hashMatch = text.match(/^(#{1,6}\s?)/)
              if (hashMatch) {
                const hashLen = hashMatch[0].length
                collected.push({
                  from: from,
                  to: from + hashLen,
                  deco: hideDeco
                })
                contentStart += hashLen
              }
            }

            if (contentStart < to) {
              collected.push({
                from: contentStart,
                to: to,
                deco: headerMarks[`h${level}`]
              })
            }
          }
          // Images ![alt](url)
          if (node.name === 'Image') {
            const text = doc.sliceString(from, to)
            const match = text.match(/!\[(.*?)\]\((.*?)\)/)
            if (
              match &&
              (mode === EditorMode.READING || safeLineAt(doc, from).number !== activeLineNumber)
            ) {
              collected.push({
                from: from,
                to: to,
                deco: Decoration.replace({
                  widget: new ImageWidget(match[1], match[2]),
                  block: true
                })
              })
              return false
            }
          }
          // Marks
          if (
            ['EmphasisMark', 'StrongMark', 'StrikethroughMark', 'LinkMark', 'CodeMark'].includes(
              node.name
            )
          ) {
            // ONLY hide marks in Live/Read modes
            if (
              mode !== EditorMode.SOURCE &&
              (mode === EditorMode.READING || safeLineAt(doc, from).number !== activeLineNumber)
            ) {
              collected.push({ from: from, to: to, deco: hideDeco })
            }
          }
          // Checkboxes
          if (node.name === 'TaskMarker') {
            const isReadingOrPreview =
              mode === EditorMode.READING ||
              (mode === EditorMode.LIVE_PREVIEW &&
                safeLineAt(doc, from).number !== activeLineNumber)
            if (isReadingOrPreview) {
              const isChecked = doc.sliceString(from, to).toLowerCase().includes('x')
              collected.push({
                from: from,
                to: to,
                deco: Decoration.replace({ widget: new CheckboxWidget(isChecked, from) })
              })
            }
          }
          // Tables (GFM and generic support)
          const nodeName = node.name.toLowerCase()
          if (nodeName === 'table' || nodeName === 'gfmtable') {
            const userEvent = tr.annotation(Transaction.userEvent) || ''
            const isStructural = userEvent.includes('table.')

            // If the user selects the WHOLE table block, show source (NOT in Reading mode)
            const isFullySelected =
              mode !== EditorMode.READING &&
              tr.state.selection.ranges.some((r) => r.from <= from && r.to >= to)

            // Otherwise, ALWAYS show the spreadsheet widget because it's editable
            // BUT: In Source Mode, we keep it as raw text to prevent the jump/structural change
            if (mode !== EditorMode.SOURCE && (!isFullySelected || isStructural)) {
              collected.push({
                from: from,
                to: to,
                deco: Decoration.replace({
                  widget: new TableWidget(doc.sliceString(from, to), from, to, mode),
                  block: true
                })
              })
              return false
            } else {
              // Only enters raw MD if the user explicitly highlights the entire block
              const rowDeco = Decoration.line({ class: 'cm-md-table-row' })
              const startN = safeLineAt(doc, from).number
              const endN = safeLineAt(doc, to).number
              for (let i = startN; i <= endN; i++) {
                const l = safeLine(doc, i)
                collected.push({ from: l.from, to: l.from, deco: rowDeco })
              }
            }
          }
          // Admonitions (Callouts) - ::: type title \n content \n :::
          if (node.name === 'Paragraph') {
            const text = doc.sliceString(from, to)
            if (text.startsWith(':::')) {
              const lines = text.split('\n')
              const firstLine = lines[0].replace(/^:::\s*/, '')
              const [type, ...titleParts] = firstLine.split(' ')
              const content = lines.slice(1, -1).join('\n')
              if (mode !== EditorMode.SOURCE) {
                collected.push({
                  from: from,
                  to: to,
                  deco: Decoration.replace({
                    widget: new AdmonitionWidget(type, titleParts.join(' '), content),
                    block: true
                  })
                })
              }
            }
          }

          // Horizontal Rule
          if (node.name === 'HorizontalRule' && mode !== EditorMode.SOURCE) {
            collected.push({
              from: from,
              to: to,
              deco: Decoration.replace({ widget: new HRWidget(), block: true })
            })
          }

          // Blockquote Style
          if (node.name === 'Blockquote') {
            const bg = Decoration.line({ class: 'cm-blockquote-line' })
            const startN = safeLineAt(doc, from).number
            const endN = safeLineAt(doc, to).number
            for (let i = startN; i <= endN; i++) {
              const l = safeLine(doc, i)
              collected.push({ from: l.from, to: l.from, deco: bg })
            }
          }

          // Fenced Code
          if (node.name === 'FencedCode') {
            const userEvent = tr.annotation(Transaction.userEvent) || ''
            const isStructural = userEvent.includes('table.')
            const isSelected =
              mode !== EditorMode.READING &&
              !isStructural &&
              tr.state.selection.ranges.some((r) => r.to >= from && r.from <= to)

            const info = node.node.getChild('CodeInfo')
            const lang = info ? doc.sliceString(info.from, info.to).toLowerCase() : ''
            const startLine = safeLineAt(doc, from)
            const endLine = safeLineAt(doc, to)

            const isMermaid = lang.includes('mermaid') && !isSelected && mode !== EditorMode.SOURCE
            if (isMermaid) {
              const code = doc
                .sliceString(from, to)
                .replace(/^```mermaid\s*/, '')
                .replace(/```$/, '')
                .trim()
              if (code) {
                // Missing brace fixed here
                collected.push({
                  from: from,
                  to: to,
                  deco: Decoration.replace({ widget: new MermaidWidget(code, mode), block: true })
                })
                return false
              }
            } else {
              // Header Widget
              collected.push({
                from: startLine.from,
                to: startLine.from,
                deco: Decoration.widget({
                  widget: new CodeBlockHeaderWidget(lang),
                  side: -1,
                  block: true
                })
              })
              // Background
              const bg = Decoration.line({ class: 'cm-code-block' })
              for (let i = startLine.number; i <= endLine.number; i++) {
                const l = safeLine(doc, i)
                collected.push({ from: l.from, to: l.from, deco: bg })
              }
              // Hide markers
              if (!isSelected && mode !== EditorMode.SOURCE)
                node.node
                  .getChildren('CodeMark')
                  .forEach((m) => collected.push({ from: m.from, to: m.to, deco: hideDeco }))
            }
            return false
          }
        }
      })
    } catch (e) {
      console.warn('[RichMarkdown] Iteration failed:', e)
    }

    const builder = new RangeSetBuilder()
    const docLen = doc.length
    // Sanitize decorations for the current document length
    const valid = collected.filter((d) => d.from >= 0 && d.to <= docLen && d.from <= d.to)

    sortDecorations(valid).forEach((d) => {
      try {
        if (builder.lastFrom <= d.from) {
          builder.add(d.from, d.to, d.deco)
        }
      } catch (e) {}
    })
    return builder.finish()
  },
  provide: (f) => EditorView.decorations.from(f)
})

// --- 5. Floating Source Modal Helper ---
// Now Decoupled: Dispatches to React Universal Modal system
const showSourceModal = (view, from, to, initialCode) => {
  window.dispatchEvent(
    new CustomEvent('app:open-source-modal', {
      detail: { view, from, to, initialCode }
    })
  )
}

const smartKeymap = [
  {
    key: 'Backspace',
    run: (view) => {
      const { selection, doc } = view.state
      if (!selection.main.empty) return false
      const pos = selection.main.head
      const pairs = [
        { b: '[[', a: ']]' },
        { b: '***', a: '***' },
        { b: '```', a: '```' },
        { b: '**', a: '**' }
      ]
      for (const p of pairs) {
        if (
          pos >= p.b.length &&
          doc.sliceString(pos - p.b.length, pos) === p.b &&
          doc.sliceString(pos, pos + p.a.length) === p.a
        ) {
          view.dispatch({ changes: { from: pos - p.b.length, to: pos + p.a.length, insert: '' } })
          return true
        }
      }
      return false
    }
  },
  {
    key: '[',
    run: (v) => {
      if (!v.state.selection.main.empty) return false
      const pos = v.state.selection.main.head
      const doc = v.state.doc
      // Auto-pair WikiLinks: [| -> [[|]]
      if (pos > 0 && doc.sliceString(pos - 1, pos) === '[') {
        const nextChar = doc.sliceString(pos, pos + 1)
        // If we are already inside [], e.g. [|]
        if (nextChar === ']') {
          // Insert [] inside. Result: [[|]]
          v.dispatch({
            changes: { from: pos, to: pos, insert: '[]' },
            selection: { anchor: pos + 1 }
          })
        } else {
          // New WikiLink from scratch: [| -> [[|]]
          v.dispatch({
            changes: { from: pos, to: pos, insert: '[]]' },
            selection: { anchor: pos + 1 }
          })
        }
        return true
      }
      return false
    }
  },
  {
    key: '`',
    run: (v) => {
      if (!v.state.selection.main.empty) return false
      const pos = v.state.selection.main.head
      const doc = v.state.doc
      // Auto-pair Code Block: ``| -> ```\n|```
      if (pos >= 2 && doc.sliceString(pos - 2, pos) === '``') {
        v.dispatch({
          changes: { from: pos, to: pos, insert: '`\n\n```' },
          selection: { anchor: pos + 2 } // Cursor on the newline
        })
        return true
      }
      return false
    }
  },
  {
    key: ']',
    run: (v) => {
      if (!v.state.selection.main.empty) return false
      const pos = v.state.selection.main.head
      const doc = v.state.doc
      // Overtype behavior: if typing ']' and next char is ']', just move cursor
      if (pos < doc.length && doc.sliceString(pos, pos + 1) === ']') {
        v.dispatch({ selection: { anchor: pos + 1 } })
        return true
      }
      return false
    }
  }
]

// --- 6. (DEPRECATED) Floating Mode Switcher UI ---
// Moved to SnippetEditor.jsx to prevent CM6 reconciliation crashes (lastChild error)

// --- 7. Layout Polish Plugin ---
const readingModeLayoutPlugin = ViewPlugin.fromClass(
  class {
    update(update) {
      if (update.startState.field(editorModeField) !== update.state.field(editorModeField)) {
        const mode = update.state.field(editorModeField)
        update.view.dom.classList.toggle('cm-reading-mode', mode === EditorMode.READING)
        update.view.dom.classList.toggle('cm-live-preview-mode', mode === EditorMode.LIVE_PREVIEW)
        update.view.dom.classList.toggle('cm-source-mode', mode === EditorMode.SOURCE)

        // Broadcast to React header
        window.dispatchEvent(new CustomEvent('app:mode-changed', { detail: { mode } }))
      }
    }
    constructor(view) {
      // Listen for header clicks
      this.listener = (e) => {
        if (e.detail?.mode) {
          view.dispatch({ effects: setEditorMode.of(e.detail.mode) })
        }
      }
      window.addEventListener('app:set-editor-mode', this.listener)
      // Initial broadcast
      const mode = view.state.field(editorModeField)
      window.dispatchEvent(new CustomEvent('app:mode-changed', { detail: { mode } }))
    }
    destroy() {
      window.removeEventListener('app:set-editor-mode', this.listener)
    }
  }
)

export const richMarkdownExtension = [
  inlineRegexPlugin,
  editorModeField,
  richMarkdownField,
  readingModeLayoutPlugin,
  EditorView.editable.compute(
    [editorModeField],
    (state) => state.field(editorModeField) !== EditorMode.READING
  ),
  Prec.highest(keymap.of(smartKeymap))
]
