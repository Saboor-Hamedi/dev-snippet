import { StateField, RangeSetBuilder } from '@codemirror/state'
import { Decoration, EditorView } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { EditorMode, editorModeField } from './state'
import { safeLineAt, safeLine, sortDecorations } from './utils'

// Widgets
import { TableWidget } from './widgets/TableWidget'
import { ImageWidget } from './widgets/ImageWidget'
import { HRWidget } from './widgets/HRWidget'
import { MermaidWidget } from './widgets/MermaidWidget'
import { AdmonitionWidget } from './widgets/AdmonitionWidget'
import { CodeBlockHeaderWidget } from './widgets/HeaderWidget'

export const richMarkdownStateField = StateField.define({
  create() {
    return Decoration.none
  },
  update(value, tr) {
    const { doc, selection } = tr.state
    const mode = tr.state.field(editorModeField)

    // Source Mode: No block widgets
    if (mode === EditorMode.SOURCE) return Decoration.none
    if (!doc || doc.length === 0) return Decoration.none

    const collected = []

    // Iteration (Full Document - Required for Block State)
    syntaxTree(tr.state).iterate({
      enter: (node) => {
        const from = node.from
        const to = node.to

        // 1. Heading LINES (Structure)
        if (node.name.includes('Heading')) {
          const levelMatch = node.name.match(/(\d)$/)
          const level = levelMatch ? levelMatch[1] : '1'
          const stLine = safeLineAt(doc, from)
          collected.push({
            from: stLine.from,
            to: stLine.from,
            deco: Decoration.line({ class: `cm-line-h${level}` })
          })
          return
        }

        // 2. Images (Block)
        if (node.name === 'Image') {
          const text = doc.sliceString(from, to)
          const match = text.match(/!\[(.*?)\]\((.*?)\)/)
          const stLine = safeLineAt(doc, from)
          // Active line check
          const isActiveLine = selection.ranges.some((r) => {
            const l = safeLineAt(doc, r.from)
            return l.number === stLine.number
          })

          if (match && (mode === EditorMode.READING || !isActiveLine)) {
            collected.push({
              from: from,
              to: to,
              deco: Decoration.replace({
                widget: new ImageWidget(match[1], match[2]),
                block: true
              })
            })
            return false // Skip children
          }
        }

        // 3. Tables (Block)
        const nodeName = node.name.toLowerCase()
        if (nodeName === 'table' || nodeName === 'gfmtable') {
          // Revert: Only reveal if fully selected (Standard Obsidian-like behavior to prevent jumps)
          const isFullySelected =
            mode !== EditorMode.READING &&
            selection.ranges.some((r) => r.from <= from && r.to >= to)

          if (!isFullySelected) {
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
            // Row Styling
            const rowDeco = Decoration.line({ class: 'cm-md-table-row' })
            const startN = safeLineAt(doc, from).number
            const endN = safeLineAt(doc, to).number
            for (let i = startN; i <= endN; i++) {
              const l = safeLine(doc, i)
              collected.push({ from: l.from, to: l.from, deco: rowDeco })
            }
          }
        }

        // 4. Horizontal Rule (Block)
        if (node.name === 'HorizontalRule') {
          collected.push({
            from: from,
            to: to,
            deco: Decoration.replace({ widget: new HRWidget(), block: true })
          })
        }

        // 5. Blockquote (Line)
        if (node.name === 'Blockquote') {
          const bg = Decoration.line({ class: 'cm-blockquote-line' })
          const startN = safeLineAt(doc, from).number
          const endN = safeLineAt(doc, to).number
          for (let i = startN; i <= endN; i++) {
            const l = safeLine(doc, i)
            collected.push({ from: l.from, to: l.from, deco: bg })
          }
        }

        // 6. Mermaid / Fenced Code (Block)
        if (node.name === 'FencedCode') {
          // Revert: Only reveal if fully selected or explicitly targeted.
          // Overlap cause jumps. Use Engulfing logic.
          const isSelected =
            mode !== EditorMode.READING &&
            selection.ranges.some((r) => r.from <= from && r.to >= to)

          const info = node.node.getChild('CodeInfo')
          const lang = info ? doc.sliceString(info.from, info.to).toLowerCase() : ''

          if (lang.includes('mermaid') && !isSelected) {
            const code = doc
              .sliceString(from, to)
              .replace(/^```mermaid\s*/, '')
              .replace(/```$/, '')
              .trim()
            if (code) {
              collected.push({
                from: from,
                to: to,
                deco: Decoration.replace({
                  widget: new MermaidWidget(code, mode, from, to),
                  block: true
                })
              })
              return false
            }
          } else {
            // Code Block Styling (Header + Background)
            const startLine = safeLineAt(doc, from)
            const endLine = safeLineAt(doc, to)

            // Header
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
          }
        }

        // 7. Admonitions (Paragraph check)
        if (node.name === 'Paragraph') {
          if (doc.sliceString(from, from + 3) === ':::') {
            const isSelected =
              mode !== EditorMode.READING &&
              selection.ranges.some((r) => r.from <= from && r.to >= to)

            const text = doc.sliceString(from, to)
            if (text.startsWith(':::') && !isSelected) {
              const lines = text.split('\n')
              const firstLine = lines[0].replace(/^:::\s*/, '')
              const [type, ...titleParts] = firstLine.split(' ')
              const content = lines.slice(1, -1).join('\n')
              collected.push({
                from: from,
                to: to,
                deco: Decoration.replace({
                  widget: new AdmonitionWidget(type, titleParts.join(' '), content),
                  block: true
                })
              })
              return false
            }
          }
        }
      }
    })

    const builder = new RangeSetBuilder()
    sortDecorations(collected).forEach((d) => builder.add(d.from, d.to, d.deco))
    return builder.finish()
  },
  provide: (f) => EditorView.decorations.from(f)
})
