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

/**
 * richMarkdownStateField - The "Brain" of the Rich Markdown engine.
 *
 * This StateField monitors the document and the syntax tree in real-time.
 * It identifies Markdown structures (like headings, images, and tables) and
 * replaces them with visual "Widgets" when the cursor is not active on that line.
 *
 * This creates the "what you see is what you get" experience while still
 * allowing raw text editing when you click into a specific line.
 */
export const richMarkdownStateField = StateField.define({
  create() {
    return Decoration.none
  },
  update(value, tr) {
    const { doc } = tr.state
    const mode = tr.state.field(editorModeField)
    const activeLines = tr.state.field(activeLinesField)

    // Defensive check: don't process empty docs
    if (!doc || doc.length === 0) return Decoration.none

    const collected = []

    /**
     * isRangeActive - Determines if a document range is currently being "edited".
     * If the cursor is inside this range, we hide the widget and show the raw text.
     */
    const isRangeActive = (from, to) => {
      if (mode === EditorMode.READING) return false
      // Source mode always shows raw text, hence "always active"
      if (mode === EditorMode.SOURCE) return true

      const startLine = safeLineAt(doc, from).number
      const endLine = safeLineAt(doc, to).number

      // Check if any line within the structure's physical range has a cursor
      for (let i = startLine; i <= endLine; i++) {
        if (activeLines.has(i)) return true
      }
      return false
    }

    /**
     * Tree Iteration: We walk through the syntax tree provided by @codemirror/language.
     * For every node Type, we decide if we want to add a visual decoration.
     */
    syntaxTree(tr.state).iterate({
      enter: (node) => {
        const from = node.from
        const to = node.to

        // 1. Heading Styling (Line-level)
        // We apply a CSS class to the entire line for rhythmic scaling (H1 is bigger than H6).
        if (node.name.includes('Heading')) {
          const levelMatch = node.name.match(/(\d)$/)
          const level = levelMatch ? levelMatch[1] : '1'
          const stLine = safeLineAt(doc, from)
          collected.push({
            from: stLine.from,
            to: stLine.from,
            deco: Decoration.line({ class: `cm-line-h${level}` })
          })
          return // We don't need to check children for headings
        }

        // 2. Images (Replaceable Block)
        if (node.name === 'Image') {
          const text = doc.sliceString(from, to)
          const match = text.match(/!\[(.*?)\]\((.*?)\)/)

          // Only render the image if the user isn't actively editing the alt text/URL
          if (match && !isRangeActive(from, to)) {
            collected.push({
              from: from,
              to: to,
              deco: Decoration.replace({
                widget: new ImageWidget(match[1], match[2]),
                block: true
              })
            })
            return false // Skip children to avoid rendering alt-text again
          }
        }

        // 3. Tables (Interactive Block)
        const nodeName = node.name.toLowerCase()
        if (nodeName === 'table' || nodeName === 'gfmtable') {
          if (!isRangeActive(from, to)) {
            // Render the full visual table widget
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
            // Subtle indicator that you are editing inside a table
            const rowDeco = Decoration.line({ class: 'cm-md-table-row' })
            const startN = safeLineAt(doc, from).number
            const endN = safeLineAt(doc, to).number
            for (let i = startN; i <= endN; i++) {
              const l = safeLine(doc, i)
              collected.push({ from: l.from, to: l.from, deco: rowDeco })
            }
          }
        }

        // 4. Horizontal Rule (Visual Separator)
        if (node.name === 'HorizontalRule') {
          collected.push({
            from: from,
            to: to,
            deco: Decoration.replace({ widget: new HRWidget(), block: true })
          })
        }

        // 5. Blockquote (Line-level Styling)
        if (node.name === 'Blockquote') {
          const bg = Decoration.line({ class: 'cm-blockquote-line' })
          const startN = safeLineAt(doc, from).number
          const endN = safeLineAt(doc, to).number
          for (let i = startN; i <= endN; i++) {
            const l = safeLine(doc, i)
            collected.push({ from: l.from, to: l.from, deco: bg })
          }
        }

        // 6. Mermaid & Fenced Code Blocks
        if (node.name === 'FencedCode') {
          const info = node.node.getChild('CodeInfo')
          const lang = info ? doc.sliceString(info.from, info.to).toLowerCase() : ''

          // SPECIAL HANDLING: Mermaid Diagrams
          if (lang.includes('mermaid') && !isRangeActive(from, to)) {
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
            // STANDARD CODE BLOCKS: Add background and language header
            const startLine = safeLineAt(doc, from)
            const endLine = safeLineAt(doc, to)

            // Inject the floating language header (js, py, etc.)
            if (mode !== EditorMode.READING) {
              collected.push({
                from: startLine.from,
                to: startLine.from,
                deco: Decoration.widget({
                  widget: new CodeBlockHeaderWidget(lang),
                  side: -1, // Ensure it stays above the code content
                  block: true
                })
              })
            }

            // Apply block background styling to every line in the block
            const bg = Decoration.line({ class: 'cm-code-block' })
            for (let i = startLine.number; i <= endLine.number; i++) {
              const l = safeLine(doc, i)
              collected.push({ from: l.from, to: l.from, deco: bg })
            }
          }
        }

        // 7. Paragraph-based structures like Admonitions (::: info)
        if (node.name === 'Paragraph') {
          if (doc.sliceString(from, from + 3) === ':::') {
            const text = doc.sliceString(from, to)
            if (text.startsWith(':::') && !isRangeActive(from, to)) {
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

    // Batch all decorations together and sort them by position
    // to satisfy CodeMirror's strict RangeSet ordering requirements.
    const builder = new RangeSetBuilder()
    sortDecorations(collected).forEach((d) => builder.add(d.from, d.to, d.deco))
    return builder.finish()
  },
  provide: (f) => EditorView.decorations.from(f)
})
