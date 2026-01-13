import { WidgetType } from '@codemirror/view'

export class ImageWidget extends WidgetType {
  constructor(alt, src) {
    super()
    this.alt = alt
    this.src = src
  }
  eq(other) {
    return other.src === this.src && other.alt === this.alt
  }
  toDOM() {
    const wrap = document.createElement('div')
    wrap.className = 'cm-md-image-container'
    // allow native selection behavior
    const img = document.createElement('img')
    img.src = this.src
    img.alt = this.alt
    img.loading = 'lazy'
    img.className = 'cm-md-rendered-image'
    wrap.appendChild(img)
    return wrap
  }
}
