import { StateField, RangeSetBuilder } from '@codemirror/state'
import { Decoration, EditorView } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { EditorMode, editorModeField, activeLinesField } from './state'
import { safeLineAt, safeLine, sortDecorations } from './utils'

// Specialized UI Widgets
import { TableWidget } from '../../table/TableWidget'
import { ImageWidget } from './widgets/ImageWidget'
import { HRWidget } from './widgets/HRWidget'
import { MermaidWidget } from './widgets/MermaidWidget'
import { AdmonitionWidget } from './widgets/AdmonitionWidget'
import { CodeBlockHeaderWidget } from './widgets/HeaderWidget'
import { CheckboxWidget } from './widgets/CheckboxWidget'

// Decoration for hiding text while keeping its footprint perfectly stable
const hideMarkerDeco = Decoration.mark({ class: 'cm-marker-hidden' })

/**
 * richMarkdownStateField - The Unified Markdown Engine.
 *
 * This engine is tuned for "Zero-Jump" transitions between modes.
 * It ensures font metrics remain identical across states.
 */
export const richMarkdownStateField = StateField.define({
  create() {
    return Decoration.none
  },
  update(value, tr) {
    const { state } = tr
    const doc = state.doc
    const mode = state.field(editorModeField)
    const activeLines = state.field(activeLinesField)

    if (!doc || doc.length === 0) return Decoration.none

    const collected = []
    const lineDecos = new Map()

    /**
     * isRangeActive - Determines if markers should be REVEALED.
     * In SOURCE mode, we reveal everything (return true).
     */
    const isRangeActive = (from, to) => {
      if (mode === EditorMode.SOURCE) return true
      if (mode === EditorMode.READING) return false

      const startLine = safeLineAt(doc, from).number
      const endLine = safeLineAt(doc, to).number
      for (let i = startLine; i <= endLine; i++) {
        if (activeLines.has(i)) return true
      }
      return false
    }

    syntaxTree(state).iterate({
      enter: (node) => {
        const from = node.from
        const to = node.to

        // 1. Headings (APPLIED IN ALL MODES for size parity)
        if (node.name.includes('Heading')) {
          const levelMatch = node.name.match(/(\d)$/)
          const level = levelMatch ? levelMatch[1] : '1'
          const lineNum = safeLineAt(doc, from).number
          if (!lineDecos.has(lineNum)) {
            lineDecos.set(lineNum, Decoration.line({ class: `cm-line-h${level}` }))
          }
        }

        // --- WIDGETS (DISABLED IN SOURCE MODE to prevent measurement loops) ---
        if (mode !== EditorMode.SOURCE) {
          // 2. Images
          if (node.name === 'Image') {
            const text = doc.sliceString(from, to)
            const match = text.match(/!\[(.*?)\]\((.*?)\)/)
            if (match && !isRangeActive(from, to)) {
              collected.push({
                from,
                to,
                deco: Decoration.replace({
                  widget: new ImageWidget(match[1], match[2]),
                  block: true
                })
              })
              return false
            }
          }

          // 3. Tables
          const nodeName = node.name.toLowerCase()
          if (nodeName === 'table' || nodeName === 'gfmtable') {
            if (!isRangeActive(from, to)) {
              collected.push({
                from,
                to,
                deco: Decoration.replace({
                  widget: new TableWidget(doc.sliceString(from, to), from, to, mode),
                  block: true
                })
              })
              return false
            } else {
              const startLN = safeLineAt(doc, from).number
              const endLN = safeLineAt(doc, to).number
              for (let i = startLN; i <= endLN; i++) {
                if (!lineDecos.has(i)) {
                  lineDecos.set(i, Decoration.line({ class: 'cm-md-table-row' }))
                }
              }
            }
          }

          // 4. HR Rules
          if (node.name === 'HorizontalRule' && !isRangeActive(from, to)) {
            collected.push({
              from,
              to,
              deco: Decoration.replace({ widget: new HRWidget(), block: true })
            })
            return false
          }

          // 5. Blockquotes
          if (node.name === 'Blockquote') {
            const startLN = safeLineAt(doc, from).number
            const endLN = safeLineAt(doc, to).number
            for (let i = startLN; i <= endLN; i++) {
              if (!lineDecos.has(i)) {
                lineDecos.set(i, Decoration.line({ class: 'cm-blockquote-line' }))
              }
            }
          }

          // 6. Code Blocks & Mermaid
          if (node.name === 'FencedCode') {
            const info = node.node.getChild('CodeInfo')
            const lang = info ? doc.sliceString(info.from, info.to).toLowerCase() : ''
            if (lang.includes('mermaid') && !isRangeActive(from, to)) {
              const code = doc
                .sliceString(from, to)
                .replace(/^```mermaid\s*/, '')
                .replace(/```$/, '')
                .trim()
              if (code) {
                collected.push({
                  from,
                  to,
                  deco: Decoration.replace({
                    widget: new MermaidWidget(code, mode, from, to),
                    block: true
                  })
                })
                return false
              }
            } else {
              const startLine = safeLineAt(doc, from)
              const endLine = safeLineAt(doc, to)
              if (mode !== EditorMode.READING) {
                collected.push({
                  from: startLine.from,
                  to: startLine.from,
                  deco: Decoration.widget({
                    widget: new CodeBlockHeaderWidget(lang),
                    side: -1,
                    block: true
                  })
                })
              }
              for (let i = startLine.number; i <= endLine.number; i++) {
                if (!lineDecos.has(i)) {
                  lineDecos.set(i, Decoration.line({ class: 'cm-code-block' }))
                }
              }
            }
          }

          // 7. Admonitions
          if (node.name === 'Paragraph') {
            if (doc.sliceString(from, from + 3) === ':::') {
              const text = doc.sliceString(from, to)
              if (text.startsWith(':::') && !isRangeActive(from, to)) {
                const lines = text.split('\n')
                const firstLine = lines[0].replace(/^:::\s*/, '')
                const [type, ...titleParts] = firstLine.split(' ')
                collected.push({
                  from,
                  to,
                  deco: Decoration.replace({
                    widget: new AdmonitionWidget(
                      type,
                      titleParts.join(' '),
                      lines.slice(1, -1).join('\n')
                    ),
                    block: true
                  })
                })
                return false
              }
            }
          }

          // 8. Task Lists
          if (node.name === 'TaskMarker') {
            const isChecked =
              doc.sliceString(from, to).includes('x') || doc.sliceString(from, to).includes('X')
            if (!isRangeActive(from, to)) {
              collected.push({
                from,
                to,
                deco: Decoration.replace({
                  widget: new CheckboxWidget(isChecked, from),
                  block: false
                })
              })
              return false
            }
          }
        }

        // 9. Marker Hiding (The "Obsidian" Effect)
        // Note: isRangeActive accounts for mode. In SOURCE mode it reveals symbols.
        const isMarker =
          node.name.includes('Mark') ||
          node.name.includes('Marker') ||
          node.name.includes('Delimiter') ||
          node.name === 'URL' ||
          node.name === 'LinkTitle'
        const isException = node.name === 'ListMark' || node.name === 'TaskMarker'

        if (isMarker && !isException && !isRangeActive(from, to)) {
          collected.push({ from, to, deco: hideMarkerDeco })
        }
      }
    })

    // Batch lines
    for (const [lineNum, deco] of lineDecos) {
      const l = safeLine(doc, lineNum)
      collected.push({ from: l.from, to: l.from, deco })
    }

    const builder = new RangeSetBuilder()
    sortDecorations(collected).forEach((d) => builder.add(d.from, d.to, d.deco))
    return builder.finish()
  },
  provide: (f) => EditorView.decorations.from(f)
})
