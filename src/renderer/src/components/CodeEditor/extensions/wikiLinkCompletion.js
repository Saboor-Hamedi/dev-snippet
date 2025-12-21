/**
 * Wiki-Link Autocompletion Extension for CodeMirror 6.
 * Triggers when typing "[[" and suggests existing snippet titles.
 */
import { autocompletion } from '@codemirror/autocomplete'

/**
 * Creates a completion source that matches text between [[ and ]]
 */
export function wikiLinkCompletionSource(titles = []) {
  return (context) => {
    // Match the text before the cursor
    const word = context.matchBefore(/\[\[[^\]]*$/)
    if (!word) return null

    // We only want to trigger if it starts with [[
    if (word.from === word.to && !context.explicit) return null

    // Extract the search term (everything after [[)
    const searchText = word.text.slice(2).toLowerCase()

    return {
      from: word.from + 2, // Start replacing after the [[
      options: titles
        .filter((title) => title.toLowerCase().includes(searchText))
        .map((title) => ({
          label: title,
          type: 'keyword',
          boost: 1,
          apply: (view, completion, from, to) => {
            const hasClosing = view.state.doc.sliceString(to, to + 2) === ']]'
            const insertPart = completion.label + (hasClosing ? '' : ']]')

            view.dispatch({
              changes: { from, to, insert: insertPart },
              selection: { anchor: from + completion.label.length + 2 },
              userEvent: 'input.complete',
              scrollIntoView: true
            })
          }
        })),
      validFor: /^[^\]]*$/
    }
  }
}

/**
 * Returns the wiki link completion extension
 */
export default function wikiLinkCompletion(titles = []) {
  return autocompletion({
    override: [wikiLinkCompletionSource(titles)]
  })
}
