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
    input.addEventListener('change', (e) => {
      const replacement = e.target.checked ? '[x]' : '[ ]'
      view.dispatch({ changes: { from: this.pos, to: this.pos + 3, insert: replacement } })
    })
    input.addEventListener('mousedown', (e) => e.stopPropagation())
    span.appendChild(input)
    return span
  }
}
