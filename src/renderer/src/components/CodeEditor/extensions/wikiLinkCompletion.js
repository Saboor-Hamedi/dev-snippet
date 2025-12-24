/**
 * Wiki-Link Autocompletion Extension for CodeMirror 6.
 * Triggers when typing "[[" and suggests existing snippet titles.
 */
import { autocompletion } from '@codemirror/autocomplete'

/**
 * Creates a completion source that matches text between [[ and ]]
 */
export const wikiLinkCompletionSource = (titles = []) => {
  return (context) => {
    // Search for [[ before the cursor
    const word = context.matchBefore(/\[\[[^\]]*$/)
    if (!word) return null
    if (word.from === word.to && !context.explicit) return null

    const searchText = word.text.slice(2).toLowerCase()

    // Filter titles based on searchText
    const filtered = titles.filter((t) => t.toLowerCase().includes(searchText))

    return {
      from: word.from + 2,
      options: filtered.map((title) => ({
        label: title,
        displayLabel: `[[${title}]]`,
        type: 'variable',
        boost: 99,
        apply: (view, completion, from, to) => {
          // Check if there's already a closing ]]
          const after = view.state.doc.sliceString(to, to + 2)
          const insertText = completion.label + (after === ']]' ? '' : ']]')

          view.dispatch({
            changes: { from, to, insert: insertText },
            selection: { anchor: from + completion.label.length + (after === ']]' ? 0 : 2) },
            userEvent: 'input.complete'
          })
        }
      })),
      filter: false // We handled filtering
    }
  }
}

export default function wikiLinkCompletion(titles = []) {
  return autocompletion({
    override: [wikiLinkCompletionSource(titles)],
    icons: true,
    defaultKeymap: true,
    activateOnTyping: true
  })
}
