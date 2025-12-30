import { WidgetType } from '@codemirror/view'

export class CheckboxWidget extends WidgetType {
  constructor(checked, pos) {
    super()
    this.checked = checked
    this.pos = pos
  }
  eq(other) {
    return other.checked === this.checked && other.pos === this.pos
  }
  toDOM(view) {
    const span = document.createElement('span')
    span.className = `cm-md-checkbox ${this.checked ? 'is-checked' : ''}`

    const input = document.createElement('input')
    input.type = 'checkbox'
    input.checked = this.checked
    input.className = 'cm-checkbox-input'

    // Add a custom checkmark element if checked
    if (this.checked) {
      const checkmark = document.createElement('span')
      checkmark.className = 'cm-checkbox-check'
      checkmark.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      span.appendChild(checkmark)
    }

    input.addEventListener('change', (e) => {
      const replacement = e.target.checked ? '[x]' : '[ ]'
      view.dispatch({ changes: { from: this.pos, to: this.pos + 3, insert: replacement } })
    })

    input.addEventListener('mousedown', (e) => e.stopPropagation())
    span.appendChild(input)
    return span
  }
}
