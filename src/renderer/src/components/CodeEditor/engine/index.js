import { EditorView, keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'

import { EditorMode, editorModeField, setEditorMode } from './state'
import { richMarkdownStateField } from './structure'
import { richMarkdownViewPlugin } from './inline'
import { inlineRegexPlugin } from './links'
import { readingModeLayoutPlugin } from './layout'
import { smartKeymap } from './keymap'

export { EditorMode, setEditorMode }

export const richMarkdownExtension = [
  inlineRegexPlugin,
  editorModeField,
  richMarkdownStateField,
  richMarkdownViewPlugin,
  readingModeLayoutPlugin,
  EditorView.editable.compute(
    [editorModeField],
    (state) => state.field(editorModeField) !== EditorMode.READING
  ),
  Prec.highest(keymap.of(smartKeymap))
]
