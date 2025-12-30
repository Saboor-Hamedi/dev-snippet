import { WidgetType } from '@codemirror/view'
import { EditorMode, editorModeField } from '../state'
import { showSourceModal } from '../utils'

// Helper: Parse table cells
const getCells = (l) => {
  const trimmed = l.trim()
  if (!trimmed.startsWith('|') && !trimmed.endsWith('|')) return []
  return trimmed
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((s) => s.trim())
}

// Global state for live focus tracking
let activeTableFocus = null // { row, col, from, to }

export class TableCreateWidget extends WidgetType {
  toDOM(view) {
    const btn = document.createElement('button')
    btn.className = 'cm-md-table-create-btn'
    // SVG Icon for table
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg> Create Table'

    btn.onclick = (e) => {
      // Find where we are in the document
      const pos = view.posAtDOM(btn)
      // Insert a basic 3x3 table structure with better visual organization
      const tableText =
        '| Column 1 | Column 2 | Column 3 |\n' +
        '| -------- | -------- | -------- |\n' +
        '|          |          |          |\n' +
        '|          |          |          |'
      view.dispatch({
        changes: { from: pos, to: pos, insert: tableText },
        selection: { anchor: pos + 2 } // Intelligently place cursor in the first cell
      })
    }
    return btn
  }
}

export class TableWidget extends WidgetType {
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
    // Fix: Include positions in eq to ensure refresh on shift to avoid duplication bug
    return other.raw === this.raw && other.from === this.from && other.to === this.to
  }
  ignoreEvent() {
    return true
  }
  toDOM(view) {
    if (!this.raw) return document.createElement('div')
    // Always use the current document text for this table range to avoid
    // divergence between the rendered widget and the underlying source.
    const currentRaw =
      view && view.state && view.state.doc
        ? view.state.doc.sliceString(this.from, this.to)
        : this.raw || ''
    const lines = (currentRaw || '').trim().split('\n')
    if (lines.length < 2) return document.createElement('div')

    const table = document.createElement('table')
    table.className = 'cm-md-rendered-table'
    const tbody = document.createElement('tbody')

    const sepLineIdx = lines.findIndex((l) => l.includes('---'))
    const sepLine = lines[sepLineIdx]
    let alignments = []
    if (sepLine) {
      alignments = getCells(sepLine).map((c) =>
        c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : 'left'
      )
    }

    // Only use header and row lines for matrix and col count
    const matrix = lines
      .filter((_, idx) => idx !== sepLineIdx && idx !== -1)
      .map((l) => getCells(l))
    // Use header line for col count
    const headerColCount =
      lines.length > 0 && sepLineIdx > 0 ? getCells(lines[0]).length : matrix[0]?.length || 0

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
          while (sepCells.length < headerColCount) sepCells.push('----------')
          sepCells.length = headerColCount
          newLines.splice(sepLineIdx, 0, '| ' + sepCells.join(' | ') + ' |')
        }
        view.dispatch({
          changes: { from: this.from, to: this.to, insert: newLines.join('\n') },
          userEvent: 'input.table.edit',
          scrollIntoView: false
        })
      }, 300)
    }

    matrix.forEach((rowCells, rIdx) => {
      const tr = document.createElement('tr')
      rowCells.forEach((text, cIdx) => {
        const isHeader = rIdx === 0 && sepLineIdx !== -1
        const td = document.createElement(isHeader ? 'th' : 'td')
        // DISABLE INLINE EDITING (User request: "remove these features")
        td.contentEditable = 'false'
        td.className = 'cm-md-table-cell'
        td.textContent = text
        if (alignments[cIdx]) td.style.textAlign = alignments[cIdx]
        tr.appendChild(td)
      })
      tbody.appendChild(tr)
    })
    table.appendChild(tbody)

    const wrap = document.createElement('div')
    wrap.className = 'cm-md-table-rendered-wrapper'
    wrap.appendChild(table)

    // Mode Awareness
    const mode = view.state.field(editorModeField)

    // Allow Double-Click to Edit via Modal (Existing feature, maintained)
    wrap.ondblclick = (e) => {
      if (mode === EditorMode.READING) return
      e.preventDefault()
      e.stopPropagation()
      const fresh = view.state.doc.sliceString(this.from, this.to)
      showSourceModal(view, this.from, this.to, fresh)
    }

    // Add "Edit" hint on hover
    if (mode !== EditorMode.READING) {
      wrap.title = 'Double-click to edit table'
      wrap.style.cursor = 'pointer'
    }

    return wrap
  }
}
