/**
 * Wiki-Link Autocompletion Extension for CodeMirror 6.
 * Triggers when typing "[[" and suggests existing snippet titles.
 */

/**
 * Creates a completion source that matches text between [[ and ]]
 * @param {string[]} titles
 */
export function wikiLinkCompletionSource(titles = []) {
  return (context) => {
    // 1. Check if we have any titles to suggest
    if (!titles || !titles.length) return null

    // 2. See if there is a '[[...' before the cursor
    // We match [[ followed by any character that is NOT a ]
    const word = context.matchBefore(/\[\[[^\]]*$/)
    if (!word) return null

    // 3. Trigger autocompletion from the position after [[
    const from = word.from + 2

    // Create the options list
    const options = titles.map((title) => ({
      label: title,
      displayLabel: `${title}`,
      type: 'variable',
      boost: 100, // Priority over other completions
      apply: (view, completion, from, to) => {
        // Calculate insertion text and closing brackets
        // We look at the doc after the cursor to see if ] already exist
        const docAfter = view.state.doc.sliceString(to, to + 2)
        const needsClosing = docAfter !== ']]'

        // Final text to insert (the title)
        const insertText = completion.label + (needsClosing ? ']]' : '')

        view.dispatch({
          changes: { from, to, insert: insertText },
          selection: { anchor: from + completion.label.length + (needsClosing ? 2 : 0) },
          userEvent: 'input.complete'
        })
      }
    }))

    return {
      from,
      options,
      filter: true // CodeMirror will filter based on what's typed after [[
    }
  }
}
