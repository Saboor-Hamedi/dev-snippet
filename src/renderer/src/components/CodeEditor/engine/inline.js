import { ViewPlugin, Decoration, EditorView } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import { syntaxTree } from '@codemirror/language'
import { EditorMode, editorModeField, activeLinesField } from './state'
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
      const activeLines = state.field(activeLinesField)
      const mode = state.field(editorModeField)

      //   Read mode

      // Reading Mode & Live Preview: Hide Markdown markers for immersive experience
      if (!doc || doc.length === 0) return Decoration.none

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
              if (
                mode === EditorMode.READING ||
                (mode === EditorMode.LIVE_PREVIEW && !activeLines.has(stLine.number))
              ) {
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

                  // Only add padding in Live Preview to prevent jump when focusing.
                  // In Reading Mode, we don't need it as there's no editing.
                  if (mode === EditorMode.LIVE_PREVIEW) {
                    const padDeco = Decoration.mark({ class: `cm-pad-h${level}` })
                    collected.push({
                      from: nodeFrom + hashLen,
                      to: nodeTo,
                      deco: padDeco
                    })
                  }

                  contentStart += hashLen
                }
              }

              if (nodeFrom < nodeTo) {
                collected.push({
                  from: nodeFrom,
                  to: nodeTo,
                  deco: headerMarks[`h${level}`]
                })
              }
            }

            // 2. Inline Code Styling
            if (node.name === 'InlineCode') {
              collected.push({
                from: nodeFrom,
                to: nodeTo,
                deco: Decoration.mark({ class: 'cm-inline-code' })
              })
            }

            // 3. Mark Hiding (Reading Mode / Live Preview)
            const isMark = [
              'EmphasisMark',
              'StrongMark',
              'StrikethroughMark',
              'LinkMark',
              'CodeMark',
              'ListMark'
            ].includes(node.name)

            if (isMark) {
              if (
                mode === EditorMode.READING ||
                (mode === EditorMode.LIVE_PREVIEW && !activeLines.has(stLine.number))
              ) {
                collected.push({ from: nodeFrom, to: nodeTo, deco: hideDeco })
              }
            }

            // 4. Checkboxes
            if (node.name === 'TaskMarker') {
              if (
                mode === EditorMode.READING ||
                (mode === EditorMode.LIVE_PREVIEW && !activeLines.has(stLine.number))
              ) {
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
