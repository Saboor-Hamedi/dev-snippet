import { WidgetType } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'

export class CodeBlockHeaderWidget extends WidgetType {
  constructor(lang) {
    super()
    this.lang = lang
  }
  eq(other) {
    return other.lang === this.lang
  }
  // Allow events to pass through for selection stability
  ignoreEvent(e) {
    if (e.type === 'mousedown' || e.type === 'click') return false
    return true
  }
  toDOM(view) {
    const wrap = document.createElement('div')
    wrap.className = 'cm-code-block-header'
    // Ensure flex layout for proper positioning
    wrap.style.display = 'flex'
    wrap.style.alignItems = 'center'
    wrap.style.justifyContent = 'space-between'

    // Language label FIRST (on the left)
    const langSpan = document.createElement('span')
    langSpan.textContent = (this.lang || 'code').toUpperCase()
    wrap.appendChild(langSpan)

    // Copy button SECOND (on the right)
    const copyBtn = document.createElement('button')
    copyBtn.className = 'cm-code-copy-btn'
    copyBtn.textContent = 'Copy'
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      const pos = view.posAtDOM(wrap)
      if (pos < 0) return
      const node = syntaxTree(view.state).resolveInner(pos, 1)
      let fn = node
      while (fn && fn.name !== 'FencedCode') fn = fn.parent
      if (fn) {
        const code = view.state.doc
          .sliceString(fn.from, fn.to)
          .replace(/^```\w*\n?/, '')
          .replace(/\n?```$/, '')
        navigator.clipboard.writeText(code).then(() => {
          copyBtn.textContent = 'Copied!'
          setTimeout(() => (copyBtn.textContent = 'Copy'), 2000)
        })
      }
    })
    wrap.appendChild(copyBtn)

    return wrap
  }
}
