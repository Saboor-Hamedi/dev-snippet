import { EditorView, keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'
import { syntaxTree } from '@codemirror/language'

import { EditorMode, editorModeField, setEditorMode, activeLinesField } from './state'
import { richMarkdownStateField } from './structure'
import { inlineRegexPlugin } from './links'
import { readingModeLayoutPlugin } from './layout'
import { smartKeymap } from './keymap'

export { EditorMode, setEditorMode }

/**
 * linkClickHandler - Enables Cmd/Ctrl + Click behavior for links.
 * Even when the URL is hidden by the visual engine, clicking the text
 * with the modifier key will open the destination.
 */
const linkClickHandler = EditorView.domEventHandlers({
  click(event, view) {
    if (!event.ctrlKey && !event.metaKey) return false

    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
    if (pos === null) return false

    // Traverse the syntax tree at the click position to find a Link
    let url = null
    syntaxTree(view.state).iterate({
      from: pos,
      to: pos,
      enter: (node) => {
        if (node.name === 'URL' || node.name === 'LinkTitle') {
          // If we clicked the Title or the URL part, find the sibling URL
          const parent = node.node.parent
          if (parent && parent.name === 'Link') {
            const urlNode = parent.getChild('URL')
            if (urlNode) {
              url = view.state.doc.sliceString(urlNode.from, urlNode.to)
            }
          }
        }
      }
    })

    if (url) {
      window.open(url, '_blank')
      return true
    }
  }
})

export const richMarkdownExtension = [
  inlineRegexPlugin,
  editorModeField,
  activeLinesField,
  richMarkdownStateField,
  readingModeLayoutPlugin,
  linkClickHandler,
  EditorView.editable.compute(
    [editorModeField],
    (state) => state.field(editorModeField) !== EditorMode.READING
  ),
  Prec.highest(keymap.of(smartKeymap))
]
