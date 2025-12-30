import { WidgetType } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { EditorMode, editorModeField } from '../CodeEditor/engine/state'
import { showSourceModal } from '../CodeEditor/engine/utils'

/**
 * Helper: Parse a single line of a Markdown table into individual cell values.
 * Handles the stripping of leading/trailing pipes.
 */
const getCells = (l) => {
  const trimmed = l.trim()
  if (!trimmed.startsWith('|') && !trimmed.endsWith('|')) return []
  return trimmed
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((s) => s.trim())
}

/**
 * TableCreateWidget - A simple button widget that appears when the user
 * wants to insert a new table from scratch.
 */
export class TableCreateWidget extends WidgetType {
  toDOM(view) {
    const btn = document.createElement('button')
    btn.className = 'cm-md-table-create-btn'
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg> Create Table'

    btn.onclick = (e) => {
      const pos = view.posAtDOM(btn)
      // Template for a standard 3x3 GFM table
      const tableText =
        '| Column 1 | Column 2 | Column 3 |\n' +
        '| -------- | -------- | -------- |\n' +
        '|          |          |          |\n' +
        '|          |          |          |'
      view.dispatch({
        changes: { from: pos, to: pos, insert: tableText },
        selection: { anchor: pos + 2 } // Place cursor inside the first header cell
      })
    }
    return btn
  }
}

/**
 * TableWidget - The primary renderer for Markdown tables in the live editor.
 *
 * This treats a range of text as a single unit, parsing the pipes/dashes and
 * building a real HTML <table> element. This allows for superior styling (borders,
 * zebra-striping) compared to raw monospaced text.
 */
export class TableWidget extends WidgetType {
  constructor(raw, from, to, mode) {
    super()
    this.raw = raw
    this.from = from
    this.to = to
    this.mode = mode
  }

  /**
   * Equality check for performance. If the raw text or the document position
   * hasn't changed, we don't rebuild the entire table DOM.
   */
  eq(other) {
    if (other.mode !== this.mode) return false
    return other.raw === this.raw && other.from === this.from && other.to === this.to
  }

  // We handle our own click events, so CodeMirror shouldn't intercept them.
  ignoreEvent() {
    return true
  }

  /**
   * toDOM - Builds the visual table.
   */
  toDOM(view) {
    if (!this.raw) return document.createElement('div')

    // Always fetch the freshest text from the document to ensure the widget
    // stays in sync with history/undo states.
    const currentRaw =
      view && view.state && view.state.doc
        ? view.state.doc.sliceString(this.from, this.to)
        : this.raw || ''

    const lines = (currentRaw || '').trim().split('\n')
    if (lines.length < 2) return document.createElement('div')

    const table = document.createElement('table')
    table.className = 'cm-md-rendered-table'
    const tbody = document.createElement('tbody')

    // Find the separator line (| --- | --- |) to determine column alignments
    const sepLineIdx = lines.findIndex((l) => l.includes('---'))
    const sepLine = lines[sepLineIdx]
    let alignments = []
    if (sepLine) {
      alignments = getCells(sepLine).map((c) =>
        c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : 'left'
      )
    }

    /**
     * Parsing Strategy:
     * 1. Extract headers and body rows into a matrix.
     * 2. Determine column count from the header row.
     */
    const matrix = lines
      .filter((_, idx) => idx !== sepLineIdx && idx !== -1)
      .map((l) => getCells(l))

    // Build the HTML structure
    matrix.forEach((rowCells, rIdx) => {
      const tr = document.createElement('tr')
      rowCells.forEach((text, cIdx) => {
        const isHeader = rIdx === 0 && sepLineIdx !== -1
        const td = document.createElement(isHeader ? 'th' : 'td')

        // Inline editing is disabled to encourage the use of the visual table modal.
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

    const curMode = view.state.field(editorModeField)

    /**
     * Double-Click to Edit:
     * This is the bridge between the simple preview and the advanced TableEditorModal.
     * We re-resolve the table range before opening to ensure we're replacing the
     * correct part of the document.
     */
    wrap.ondblclick = (e) => {
      if (curMode === EditorMode.READING) return
      e.preventDefault()
      e.stopPropagation()

      let from = this.from
      let to = this.to
      try {
        const pos = view.posAtDOM(wrap)
        if (pos !== null && pos >= 0) {
          const node = syntaxTree(view.state).resolveInner(pos, 1)
          let fn = node
          while (fn && !['table', 'gfmtable'].includes(fn.name.toLowerCase())) fn = fn.parent
          if (fn) {
            from = fn.from
            to = fn.to
          }
        }
      } catch (err) {}

      const fresh = view.state.doc.sliceString(from, to)
      showSourceModal(view, from, to, fresh)
    }

    if (curMode !== EditorMode.READING) {
      wrap.title = 'Double-click to edit table'
      wrap.style.cursor = 'pointer'
    }

    return wrap
  }
}
