import { WidgetType } from '@codemirror/view'

export class AdmonitionWidget extends WidgetType {
  constructor(type, title, content) {
    super()
    this.type = type
    this.title = title
    this.content = content
  }
  eq(other) {
    return other.type === this.type && other.title === this.title && other.content === this.content
  }
  toDOM() {
    const wrap = document.createElement('div')
    wrap.className = `cm-admonition cm-admonition-${this.type.toLowerCase()}`
    // allow native selection behavior

    const header = document.createElement('div')
    header.className = 'cm-admonition-header'
    header.innerHTML = `<span class="cm-admonition-icon"></span><span class="cm-admonition-title">${this.title || this.type.toUpperCase()}</span>`
    wrap.appendChild(header)
    const body = document.createElement('div')
    body.className = 'cm-admonition-body'
    body.textContent = this.content
    wrap.appendChild(body)
    return wrap
  }
}
