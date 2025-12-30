import { WidgetType, EditorView } from '@codemirror/view'
import { EditorMode, editorModeField } from '../state'
import { getComputedColor, showSourceModal } from '../utils'

// Global flag to track initialization to prevent duplicate calls if strict
let mermaidInitialized = false

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
    if (other.mode !== this.mode) return false
    // Do not include from/to in eq for Mermaid to avoid expensive re-renders on every scroll/shift
    return other.code === this.code
  }
  toDOM(view) {
    const wrap = document.createElement('div')
    wrap.className = 'cm-mermaid-widget'
    const uniqueId = 'mermaid-' + Math.random().toString(36).substr(2, 9)
    wrap.id = uniqueId
    wrap.innerHTML = '<div class="cm-mermaid-loading">Generating schematic...</div>'

    const svgContainer = document.createElement('div')
    svgContainer.className = 'cm-mermaid-svg-container'
    wrap.appendChild(svgContainer)

    // Update local from/to from current doc position if shifted while widget was alive
    // This prevents "show source" opening the wrong range if text was added above it.
    const getFreshPos = () => {
      try {
        const pos = view.posAtDOM(wrap)
        if (pos !== null) {
          const delta = this.to - this.from
          return { from: pos, to: pos + delta }
        }
      } catch (e) {}
      return { from: this.from, to: this.to }
    }

    // Panning Logic
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

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return
      this.panX = e.clientX - startX
      this.panY = e.clientY - startY
      const svg = svgContainer.querySelector('svg')
      if (svg) {
        svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`
      }
    })

    window.addEventListener('mouseup', () => {
      isDragging = false
      svgContainer.style.cursor = this.zoom > 1 ? 'grab' : 'default'
    })

    // Toolbar (Always visible for Zoom/Reset, but partially hidden in Reading)
    const toolbar = document.createElement('div')
    toolbar.className = 'cm-mermaid-toolbar'

    const btnSource = document.createElement('button')
    btnSource.className = 'cm-mermaid-tool-btn'
    btnSource.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>'
    btnSource.title = 'View Source'
    btnSource.onclick = (e) => {
      e.stopPropagation()
      const { from, to } = getFreshPos()
      showSourceModal(view, from, to, this.code)
    }

    const zoomIn = document.createElement('button')
    zoomIn.className = 'cm-mermaid-tool-btn'
    zoomIn.innerHTML = '+'
    zoomIn.onclick = (e) => {
      e.stopPropagation()
      this.zoom += 0.2
      const svg = svgContainer.querySelector('svg')
      if (svg) {
        svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`
        svgContainer.style.cursor = 'grab'
      }
    }

    const reset = document.createElement('button')
    reset.className = 'cm-mermaid-tool-btn'
    reset.innerHTML = 'Reset'
    reset.onclick = (e) => {
      e.stopPropagation()
      this.zoom = 1
      this.panX = 0
      this.panY = 0
      const svg = svgContainer.querySelector('svg')
      if (svg) svg.style.transform = `translate(0,0) scale(1)`
      svgContainer.style.cursor = 'default'
    }

    // Only add Source button in non-Reading modes
    const mode = view.state.field(editorModeField)
    if (mode !== EditorMode.READING) {
      toolbar.appendChild(btnSource)
    }

    // Always add Zoom/Reset tools
    toolbar.appendChild(zoomIn)
    toolbar.appendChild(reset)
    wrap.appendChild(toolbar)

    // Capture state synchronously before entering async timeout
    // Defensive check for facet and EditorView.dark to prevent CM6 internals crash
    let isDark = true
    try {
      if (view && view.state && view.state.facet && EditorView.dark) {
        isDark = view.state.facet(EditorView.dark)
      } else {
        isDark = document.documentElement.classList.contains('dark')
      }
    } catch (e) {
      isDark = document.documentElement.classList.contains('dark')
    }

    const runRender = async () => {
      try {
        // Use the closure 'wrap' directly instead of getElementById
        const container = wrap
        if (!container) return

        // Wait for attachment to DOM to ensure styles/variables work
        if (!container.isConnected) {
          setTimeout(runRender, 50)
          return
        }

        // Dynamically import mermaid to handle load errors gracefully
        const mermaidModule = await import('mermaid')
        const mermaid = mermaidModule.default || mermaidModule

        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'neutral',
            securityLevel: 'loose',
            fontFamily: getComputedColor('--editor-font-family', '"JetBrains Mono"'),
            themeVariables: {
              primaryColor: '#ffffff',
              primaryTextColor: '#000000',
              primaryBorderColor: '#333333',
              lineColor: '#333333',
              secondaryColor: '#f4f4f4',
              tertiaryColor: '#fff',
              nodeBorder: '#333333',
              clusterBkg: '#ffffff',
              clusterBorder: '#333333',
              actorBkg: '#ffffff',
              actorTextColor: '#000000',
              actorBorder: '#333333',
              actorLineColor: '#333333',
              edgeLabelBackground: '#ffffff',
              labelBackgroundColor: '#ffffff',
              fontSize: '16px'
            },
            er: {
              fill: '#ffffff',
              stroke: '#333333'
            },
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis'
            }
          })
          mermaidInitialized = true
        }

        const { svg } = await mermaid.render(uniqueId + '-svg', this.code)

        const loading = container.querySelector('.cm-mermaid-loading')
        if (loading) loading.remove()

        const target = container.querySelector('.cm-mermaid-svg-container')
        if (target) {
          target.innerHTML = svg
        }
        if (view && typeof view.requestMeasure === 'function') {
          view.requestMeasure()
        }
      } catch (err) {
        // Use wrap from closure
        const loading = wrap.querySelector('.cm-mermaid-loading')
        if (loading) {
          loading.textContent = 'Mermaid Error: ' + err.message
          loading.style.color = 'var(--color-error)'
          // If fetch failed
          if (err.message && err.message.includes('fetch')) {
            loading.textContent = 'Mermaid failed to load. Please restart the app.'
          }
        }
      }
    }

    // Defer render
    setTimeout(runRender, 0)

    return wrap
  }
}
