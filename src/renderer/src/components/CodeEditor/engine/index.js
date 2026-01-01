import { EditorView, keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'
import { syntaxTree } from '@codemirror/language'

import { EditorMode, editorModeField, setEditorMode, activeLinesField } from './state'
import { richMarkdownStateField } from './structure'
import { inlineRegexPlugin } from './links'
import { readingModeLayoutPlugin } from './layout'
import { smartKeymap } from './keymap'
import { assetExtensions } from './assets'

export { EditorMode, setEditorMode }

/**
 * linkClickHandler - Enables interactive behavior for links.
 */
const linkClickHandler = EditorView.domEventHandlers({
  click(event, view) {
    const isReading = view.state.field(editorModeField) === EditorMode.READING
    // In edit mode, require Ctrl/Cmd to prevent accidental navigation while typing
    if (!isReading && !event.ctrlKey && !event.metaKey) return false

    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
    if (pos === null) return false

    // 1. Check for WikiLinks (custom class-based detection)
    const target = event.target
    // Traverse up slightly in case we clicked an inner span (though unlikely with CM)
    const linkNode = target.closest('.cm-wikilink')

    if (linkNode) {
      const text = linkNode.textContent.replace(/^\[\[/, '').replace(/\]\]$/, '').trim()
      if (text) {
        // Prevent default cursor/selection change if we are navigating
        event.preventDefault()
        window.parent.postMessage({ type: 'app:open-snippet', title: text }, '*')
        return true
      }
    }

    // 2. Check for standard GFM Links
    let url = null
    syntaxTree(view.state).iterate({
      from: pos,
      to: pos,
      enter: (node) => {
        if (node.name === 'URL' || node.name === 'LinkTitle' || node.name === 'Link') {
          const parent = node.name === 'Link' ? node.node : node.node.parent
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
      if (url.startsWith('http')) {
        window.parent.postMessage({ type: 'app:open-external', url }, '*')
      } else {
        window.open(url, '_blank')
      }
      return true
    }

    return false
  }
})

export const richMarkdownExtension = [
  inlineRegexPlugin,
  editorModeField,
  activeLinesField,
  richMarkdownStateField,
  readingModeLayoutPlugin,
  linkClickHandler,
  assetExtensions, // Asset Manager (Paste/Drop)
  EditorView.editable.compute(
    [editorModeField],
    (state) => state.field(editorModeField) !== EditorMode.READING
  ),
  Prec.highest(keymap.of(smartKeymap))
]
