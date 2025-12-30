import { ViewPlugin, Decoration, EditorView } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import { syntaxTree } from '@codemirror/language'
import { EditorMode, editorModeField } from './state'
import { safeLineAt, sortDecorations, hideDeco, headerMarks } from './utils'
import { CheckboxWidget } from './widgets/CheckboxWidget'

export const richMarkdownViewPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = this.buildDecorations(view)
    }

    update(update) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        update.selectionSet ||
        update.startState.field(editorModeField) !== update.state.field(editorModeField)
      ) {
        this.decorations = this.buildDecorations(update.view)
      }
    }

    buildDecorations(view) {
      const { state } = view
      const doc = state.doc
      const selection = state.selection
      const mode = state.field(editorModeField)

      if (mode === EditorMode.SOURCE) return Decoration.none
      if (!doc || doc.length === 0) return Decoration.none

      // Active Lines for Inline Hiding (Standard Obsidian: Click line -> Reveal)
      const activeLines = new Set()
      for (const range of selection.ranges) {
        const lineStart = safeLineAt(doc, range.from).number
        const lineEnd = safeLineAt(doc, range.to).number
        for (let i = lineStart; i <= lineEnd; i++) activeLines.add(i)
      }

      const collected = []

      for (const { from, to } of view.visibleRanges) {
        syntaxTree(state).iterate({
          from,
          to,
          enter: (node) => {
            const nodeFrom = node.from
            const nodeTo = node.to
            const stLine = safeLineAt(doc, nodeFrom)

            // 1. Heading Content (Hiding Hashes)
            if (node.name.includes('Heading')) {
              const levelMatch = node.name.match(/(\d)$/)
              const level = levelMatch ? levelMatch[1] : '1'
              const lvlNum = parseInt(level)

              let contentStart = nodeFrom
              // Logic: Hide if NOT Active Line (Obsidian style)
              if (mode === EditorMode.READING || !activeLines.has(stLine.number)) {
                const text = doc.sliceString(nodeFrom, nodeTo)
                const hashMatch = text.match(/^(#{1,6}\s?)/)
                if (hashMatch) {
                  const hashLen = hashMatch[0].length

                  // Hide the Hash
                  collected.push({
                    from: nodeFrom,
                    to: nodeFrom + hashLen,
                    deco: hideDeco
                  })

                  // Add Padding to content to prevent "Jump"
                  // Hash is roughly (level + 1) chars (including space).
                  // Use a class that adds padding-left equal to those chars.
                  // We define classes .cm-pad-1, .cm-pad-2...
                  // Or we can use inline style decoration? No, classes are safer.
                  // Let's assume utils exports padding decos or we assume specific classes exist.
                  // We will define them in buildTheme.

                  const padDeco = Decoration.mark({ class: `cm-pad-h${level}` })
                  collected.push({
                    from: nodeFrom + hashLen,
                    to: nodeTo,
                    deco: padDeco
                  })

                  contentStart += hashLen
                }
              }

              if (contentStart < nodeTo) {
                collected.push({
                  from: contentStart,
                  to: nodeTo,
                  deco: headerMarks[`h${level}`]
                })
              }
            }

            // 2. Marks (Bold, Italic, Link, Code)
            if (
              ['EmphasisMark', 'StrongMark', 'StrikethroughMark', 'LinkMark', 'CodeMark'].includes(
                node.name
              )
            ) {
              // Standard Active Line Reveal
              if (mode === EditorMode.READING || !activeLines.has(stLine.number)) {
                collected.push({ from: nodeFrom, to: nodeTo, deco: hideDeco })
              }
            }

            // 3. Fenced Code Marks (Backticks)
            if (node.name === 'CodeMark') {
              if (mode === EditorMode.READING || !activeLines.has(stLine.number)) {
                collected.push({ from: nodeFrom, to: nodeTo, deco: hideDeco })
              }
            }

            // 4. Checkboxes
            if (node.name === 'TaskMarker') {
              if (mode === EditorMode.READING || !activeLines.has(stLine.number)) {
                const isChecked = doc.sliceString(nodeFrom, nodeTo).toLowerCase().includes('x')
                collected.push({
                  from: nodeFrom,
                  to: nodeTo,
                  deco: Decoration.replace({ widget: new CheckboxWidget(isChecked, nodeFrom) })
                })
              }
            }
          }
        })
      }

      const builder = new RangeSetBuilder()
      const docLen = doc.length
      const valid = collected.filter((d) => d.from >= 0 && d.to <= docLen && d.from <= d.to)
      sortDecorations(valid).forEach((d) => builder.add(d.from, d.to, d.deco))
      return builder.finish()
    }
  },
  {
    decorations: (v) => v.decorations
  }
)
