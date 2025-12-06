// Build visual-line numbering gutter using modules provided by the caller.
// This avoids bundling/importing separate CodeMirror instances.
export function useVisualLineNumberMarker(viewModule) {
  // This module is kept for possible future use but currently unused
  // when visual-line numbering is disabled to avoid CodeMirror instance conflicts.
  const { ViewPlugin, gutter, GutterMarker } = viewModule

  class MultiNumberMarker extends GutterMarker {
    constructor(numbersHtml) {
      super()
      this.numbersHtml = numbersHtml
    }
    toDOM() {
      const wrapper = document.createElement('div')
      wrapper.className = 'vis-line-num-wrapper'
      wrapper.innerHTML = this.numbersHtml
      return wrapper
    }
  }

  function makeNumbersHtml(number, count) {
    let html = ''
    for (let i = 0; i < count; i++) {
      const num = number + i
      const cls = i === 0 ? 'vis-line-num vis-line-num-primary' : 'vis-line-num vis-line-num-sub'
      html += `<div class="${cls}">${num}</div>`
    }
    return html
  }

  const cache = new Map()

  const computeForLine = (view, line) => {
    try {
      const { from } = line
      const posInfo = view.domAtPos(from)
      let node = posInfo.node
      while (node && node !== view.dom && !node.classList?.contains?.('cm-line')) {
        node = node.parentElement
      }
      if (!node || node === view.dom) return 1
      const lineRect = node.getBoundingClientRect()
      const style = window.getComputedStyle(node)
      const lineHeightPx = parseFloat(style.lineHeight) || parseFloat(getComputedStyle(view.dom).lineHeight) || 16
      const count = Math.max(1, Math.round(lineRect.height / Math.max(1, lineHeightPx)))
      return count
    } catch (e) {
      return 1
    }
  }

  const gutterExt = gutterFactory({
    class: 'cm-visualLineNumbers',
    marker(view, line) {
      const start = line.from
      let count = cache.get(start)
      if (count == null) {
        count = computeForLine(view, line)
        cache.set(start, count)
      }
      const number = view.state.doc.lineAt(start).number
      const html = makeNumbersHtml(number, count)
      return new MultiNumberMarker(html)
    }
  })

  const refresher = ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.view = view
        this.scheduled = false
        this.handleResize = () => this.requestRefresh()
        window.addEventListener('resize', this.handleResize)
        this.mo = new MutationObserver(() => this.requestRefresh())
        this.mo.observe(view.dom, {
          attributes: true,
          subtree: true,
          attributeFilter: ['style', 'class']
        })
      }
      requestRefresh() {
        if (this.scheduled) return
        this.scheduled = true
        requestAnimationFrame(() => {
          this.scheduled = false
          cache.clear()
          this.view.dispatch({ effects: [] })
        })
      }
      update(update) {
        if (update.docChanged || update.viewportChanged) this.requestRefresh()
      }
      destroy() {
        window.removeEventListener('resize', this.handleResize)
        this.mo.disconnect()
      }
    }
  )

  return [gutterExt, refresher]
}