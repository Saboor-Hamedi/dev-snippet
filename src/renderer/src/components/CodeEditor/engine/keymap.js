export const smartKeymap = [
  {
    key: 'Backspace',
    run: (view) => {
      const { selection, doc } = view.state
      if (!selection.main.empty) return false
      const pos = selection.main.head
      const pairs = [
        { b: '[[', a: ']]' },
        { b: '***', a: '***' },
        { b: '```', a: '```' },
        { b: '**', a: '**' }
      ]
      for (const p of pairs) {
        if (
          pos >= p.b.length &&
          doc.sliceString(pos - p.b.length, pos) === p.b &&
          doc.sliceString(pos, pos + p.a.length) === p.a
        ) {
          view.dispatch({ changes: { from: pos - p.b.length, to: pos + p.a.length, insert: '' } })
          return true
        }
      }
      return false
    }
  },
  {
    key: '[',
    run: (v) => {
      if (!v.state.selection.main.empty) return false
      const pos = v.state.selection.main.head
      const doc = v.state.doc
      // Auto-pair WikiLinks: [| -> [[|]]
      if (pos > 0 && doc.sliceString(pos - 1, pos) === '[') {
        const nextChar = doc.sliceString(pos, pos + 1)
        if (nextChar === ']') {
          v.dispatch({
            changes: { from: pos, to: pos, insert: '[]' },
            selection: { anchor: pos + 1 }
          })
        } else {
          v.dispatch({
            changes: { from: pos, to: pos, insert: '[]]' },
            selection: { anchor: pos + 1 }
          })
        }
        return true
      }
      return false
    }
  },
  {
    key: '`',
    run: (v) => {
      if (!v.state.selection.main.empty) return false
      const pos = v.state.selection.main.head
      const doc = v.state.doc
      // Auto-pair Code Block: ``| -> ```\n|```
      if (pos >= 2 && doc.sliceString(pos - 2, pos) === '``') {
        v.dispatch({
          changes: { from: pos, to: pos, insert: '`\n\n```' },
          selection: { anchor: pos + 2 }
        })
        return true
      }
      return false
    }
  },
  {
    key: ']',
    run: (v) => {
      if (!v.state.selection.main.empty) return false
      const pos = v.state.selection.main.head
      const doc = v.state.doc
      // Overtype behavior
      if (pos < doc.length && doc.sliceString(pos, pos + 1) === ']') {
        v.dispatch({ selection: { anchor: pos + 1 } })
        return true
      }
      return false
    }
  }
]
