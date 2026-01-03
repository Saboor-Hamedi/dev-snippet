import { WidgetType, EditorView } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { EditorMode, editorModeField } from '../state'
import { getComputedColor, showSourceModal } from '../utils'

/**
 * MermaidWidget - The definitive, "Close the case" implementation.
 * Features:
 * 1. Robust Identity: Prevents DOM destruction during edits.
 * 2. Visual Persistence: Zero-latency theme switching using alternate theme placeholders.
 * 3. Anti-Jump: Height locking and smooth transitions for layout shifts.
 * 4. Isolation: Double-buffered rendering to prevent Mermaid layout flashes in the main UI.
 */
const widgetMetadata = new Map() // Stores last known height/SVG per code

const getThemeState = () => {
  const t = document.documentElement.getAttribute('data-theme')
  if (t) return !['polaris', 'minimal-gray'].includes(t)
  return document.body.classList.contains('dark')
}

export class MermaidWidget extends WidgetType {
  constructor(code, mode, from, to) {
    super()
    this.code = code
    this.mode = mode
    this.from = from
    this.to = to
    this.zoom = 1
    this.panX = 0
    this.panY = 0
  }

  eq(other) {
    // Keep the same node as long as we are in the same visual mode.
    return other.mode === this.mode
  }

  ignoreEvent() {
    return true
  }

  updateDOM(dom) {
    const isDark = getThemeState()
    const themeChanged = dom.dataset.isDark !== (isDark ? 'true' : 'false')

    // If neither code nor theme changed, do nothing.
    if (dom.dataset.code === this.code && !themeChanged) return true

    const svgContainer = dom.querySelector('.cm-mermaid-svg-container')

    // 1. HEIGHT LOCK: If theme changed, we MUST keep the current SVG and height
    // until the new one is ready. Otherwise, it collapses to 0 and re-expands.
    if (themeChanged && svgContainer && svgContainer.offsetHeight > 0) {
      dom.style.minHeight = `${svgContainer.offsetHeight}px`
      svgContainer.classList.add('cm-mermaid-switching-theme')
    }

    dom.dataset.code = this.code
    dom.dataset.isDark = isDark ? 'true' : 'false'

    // 2. CACHE CHECK: If we have the target theme in cache, swap immediately.
    const cacheKey = `${this.code}::${isDark ? 'dark' : 'light'}`
    const meta = widgetMetadata.get(cacheKey)

    if (meta?.svg && svgContainer) {
      svgContainer.innerHTML = meta.svg
      svgContainer.classList.remove('cm-mermaid-switching-theme')
      dom.style.minHeight = '' // Sync release
      return true
    }

    // 3. ASYNC RENDER: If no cache, trigger a new render.
    this.startDebouncedRender(dom, this.code)
    return true
  }

  destroy(dom) {
    if (dom._debounceTimer) clearTimeout(dom._debounceTimer)
    dom._isDestroyed = true
  }

  toDOM(view) {
    const wrap = document.createElement('div')
    wrap.className = 'cm-mermaid-widget cm-mermaid-robust'

    const isDark = getThemeState()
    wrap.dataset.code = this.code
    wrap.dataset.isDark = isDark ? 'true' : 'false'

    const cacheKey = `${this.code}::${isDark ? 'dark' : 'light'}`
    const altCacheKey = `${this.code}::${!isDark ? 'dark' : 'light'}`

    const currentMeta = widgetMetadata.get(cacheKey)
    const alternateMeta = widgetMetadata.get(altCacheKey)
    const placeholder = currentMeta?.svg || alternateMeta?.svg

    const svgContainer = document.createElement('div')
    svgContainer.className = 'cm-mermaid-svg-container'

    if (placeholder) {
      svgContainer.innerHTML = placeholder
      if (!currentMeta?.svg) svgContainer.classList.add('cm-mermaid-switching-theme')
      // If we have any metadata, use the height to prevent initial flicker
      const lastHeight = currentMeta?.height || alternateMeta?.height
      if (lastHeight) wrap.style.minHeight = `${lastHeight}px`
    } else {
      wrap.innerHTML = '<div class="cm-mermaid-loading">Generating schematic...</div>'
    }
    wrap.appendChild(svgContainer)

    const getFreshPos = () => {
      try {
        const pos = view.posAtDOM(wrap)
        if (pos !== null && pos >= 0) {
          const node = syntaxTree(view.state).resolveInner(pos, 1)
          let fn = node
          while (fn && fn.name !== 'FencedCode') fn = fn.parent
          if (fn) return { from: fn.from, to: fn.to }
        }
      } catch (e) {}
      return { from: this.from, to: this.to }
    }

    // Interaction
    let isDragging = false
    let startX, startY
    svgContainer.onmousedown = (e) => {
      if (this.zoom > 1 || wrap.style.position === 'fixed') {
        isDragging = true
        startX = e.clientX - this.panX
        startY = e.clientY - this.panY
        svgContainer.style.cursor = 'grabbing'
        e.preventDefault()
      }
    }
    const onMove = (e) => {
      if (!isDragging) return
      this.panX = e.clientX - startX
      this.panY = e.clientY - startY
      const svg = svgContainer.querySelector('svg')
      if (svg) svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', () => {
      isDragging = false
      svgContainer.style.cursor = this.zoom > 1 ? 'grab' : 'default'
    })

    const toolbar = document.createElement('div')
    toolbar.className = 'cm-mermaid-toolbar'
    const btnSource = document.createElement('button')
    btnSource.className = 'cm-mermaid-tool-btn'
    btnSource.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>'
    btnSource.onclick = (e) => {
      e.stopPropagation()
      const { from, to } = getFreshPos()
      showSourceModal(view, from, to, this.code)
    }
    if (view.state.field(editorModeField) !== EditorMode.READING) toolbar.appendChild(btnSource)
    wrap.appendChild(toolbar)

    const runRender = async (codeOverride) => {
      if (!wrap || wrap._isDestroyed || !wrap.isConnected) return

      const code = codeOverride || wrap.dataset.code
      const dark = getThemeState()
      const key = `${code}::${dark ? 'dark' : 'light'}`

      try {
        const mermaidModule = await import('mermaid')
        const mermaid = mermaidModule.default || mermaidModule

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'loose',
          fontFamily: getComputedColor('--editor-font-family', '"JetBrains Mono"'),
          themeVariables: {
            primaryColor: getComputedColor('--color-bg-secondary', '#ffffff'),
            primaryTextColor: getComputedColor('--color-text-primary', '#000000'),
            primaryBorderColor: getComputedColor('--color-border', '#333333'),
            lineColor: getComputedColor('--color-text-secondary', '#333333'),
            mainBkg: getComputedColor('--color-bg-primary', '#ffffff'),
            fontSize: '14px'
          }
        })

        const renderId = 'm-' + Math.random().toString(36).substr(2, 9)
        const { svg } = await mermaid.render(renderId, code)

        if (svg && !wrap._isDestroyed) {
          svgContainer.innerHTML = svg
          svgContainer.classList.remove('cm-mermaid-switching-theme')

          // Capture for metadata
          const h = svgContainer.offsetHeight
          widgetMetadata.set(key, { svg, height: h })

          // Smoothly release height lock
          wrap.style.minHeight = ''
          const loading = wrap.querySelector('.cm-mermaid-loading')
          if (loading) loading.remove()

          if (view?.requestMeasure) view.requestMeasure()
        }
      } catch (err) {
        console.warn('Mermaid render failure:', err)
      }
    }

    wrap.runRender = runRender
    if (!currentMeta?.svg) setTimeout(runRender, 0)

    return wrap
  }

  startDebouncedRender(container, newCode) {
    if (container._debounceTimer) clearTimeout(container._debounceTimer)
    container._debounceTimer = setTimeout(() => {
      if (container.runRender) container.runRender(newCode)
    }, 100)
  }
}
