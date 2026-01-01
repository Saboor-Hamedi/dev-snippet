import { WidgetType, EditorView } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { EditorMode, editorModeField } from '../state'
import { getComputedColor, showSourceModal } from '../utils'

/**
 * MermaidWidget - A high-performance CodeMirror 6 widget for rendering Mermaid diagrams.
 *
 * Unlike standard text decorations, this widget replaces a fenced mermaid block with
 * a dynamic, interactive SVG diagram. It handles its own rendering, panning, and
 * zooming logic while maintaining a link back to the original source text.
 */
let mermaidInitialized = false

export class MermaidWidget extends WidgetType {
  /**
   * @param {string} code - The raw mermaid syntax to render
   * @param {string} mode - Current editor mode (Live Preview vs Reading)
   * @param {number} from - Document position where the block starts
   * @param {number} to - Document position where the block ends
   */
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

  /**
   * Equality check used by CodeMirror to determine if the widget needs a full re-render.
   * We include 'from' and 'to' to ensure that if the block shifts (e.g., text added above),
   * the widget re-syncs its event handlers with the fresh document positions.
   */
  /**
   * Equality check.
   * We now return TRUE even if code changes, so that CodeMirror preserves the DOM instance.
   * This allows us to handle updates gracefully in updateDOM() with debouncing,
   * avoiding the "destroy & recreate" flicker.
   */
  eq(other) {
    if (other.mode !== this.mode) return false
    // We allow code to be different so updateDOM can handle the transition
    return other.from === this.from && other.to === this.to
  }

  /**
   * ignoreEvent - Ensures that interactions with the Mermaid diagram (zooming, panning)
   * do not cause CodeMirror to move the cursor or selection into the code block.
   */
  ignoreEvent() {
    return true
  }

  /**
   * updateDOM called when eq() returns true.
   * We use this to trigger a "Soft Update" of the diagram without destroying the container.
   */
  updateDOM(dom) {
    // If code hasn't changed, do nothing
    if (dom.dataset.code === this.code) return true

    // Code changed! Update the data attribute
    dom.dataset.code = this.code

    // Trigger debounced render on this existing DOM node
    const container = dom
    this.startDebouncedRender(container, this.code)
    return true
  }

  /**
   * Cleanup when widget is destroyed.
   * Crucial to prevent zombie timers from triggering renders on detached nodes.
   */
  destroy(dom) {
    if (dom._debounceTimer) clearTimeout(dom._debounceTimer)
    dom._isDestroyed = true
  }

  /**
   * toDOM is the heart of the widget. It builds the interactive UI inside the editor.
   */
  toDOM(view) {
    // 1. Setup Container Layout
    const wrap = document.createElement('div')
    wrap.className = 'cm-mermaid-widget'

    // Generate a unique ID for mermaid.render() to target
    const uniqueId = 'mermaid-' + Math.random().toString(36).substr(2, 9)
    wrap.id = uniqueId
    wrap.dataset.code = this.code // Track code for updates
    wrap.innerHTML = '<div class="cm-mermaid-loading">Generating schematic...</div>'

    const svgContainer = document.createElement('div')
    svgContainer.className = 'cm-mermaid-svg-container'
    wrap.appendChild(svgContainer)

    /**
     * getFreshPos - Resolves the widget's current position in the live document.
     * We don't trust 'this.from' because the document might have changed.
     * Instead, we use the syntax tree to find the EXACT boundaries of the current FencedCode block.
     * This prevents the "duplicate insertion" bug when editing.
     */
    const getFreshPos = () => {
      try {
        const pos = view.posAtDOM(wrap)
        if (pos !== null && pos >= 0) {
          const node = syntaxTree(view.state).resolveInner(pos, 1)
          let fn = node
          // Crawl up to find the parent code block node
          while (fn && fn.name !== 'FencedCode') fn = fn.parent
          if (fn) {
            return { from: fn.from, to: fn.to }
          }
          // Fallback if the tree is being recalculated
          const delta = this.to - this.from
          return { from: pos, to: pos + delta }
        }
      } catch (e) {
        console.warn('[MermaidWidget] Failed to resolve fresh position', e)
      }
      return { from: this.from, to: this.to }
    }

    // 2. Interaction Logic: Panning & Zooming
    // We only enable panning when zoomed in or in specific fullscreen-like views
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
        // High-performance transform move
        svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`
      }
    })

    window.addEventListener('mouseup', () => {
      isDragging = false
      svgContainer.style.cursor = this.zoom > 1 ? 'grab' : 'default'
    })

    // 3. Toolbar Construction
    const toolbar = document.createElement('div')
    toolbar.className = 'cm-mermaid-toolbar'

    // "View Source" Button - Triggers the interactive DiagramEditorModal
    const btnSource = document.createElement('button')
    btnSource.className = 'cm-mermaid-tool-btn'
    btnSource.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>'
    btnSource.title = 'Edit Diagram'
    btnSource.onclick = (e) => {
      e.stopPropagation()
      const { from, to } = getFreshPos()
      showSourceModal(view, from, to, this.code)
    }

    const zoomIn = document.createElement('button')
    zoomIn.className = 'cm-mermaid-tool-btn'
    zoomIn.textContent = '+'
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
    reset.textContent = 'Reset'
    reset.onclick = (e) => {
      e.stopPropagation()
      this.zoom = 1
      this.panX = 0
      this.panY = 0
      const svg = svgContainer.querySelector('svg')
      if (svg) svg.style.transform = `translate(0,0) scale(1)`
      svgContainer.style.cursor = 'default'
    }

    // Modal editing is hidden in Reading mode for a cleaner look
    const curMode = view.state.field(editorModeField)
    if (curMode !== EditorMode.READING) {
      toolbar.appendChild(btnSource)
    }

    toolbar.appendChild(zoomIn)
    toolbar.appendChild(reset)
    wrap.appendChild(toolbar)

    /**
     * runRender - Handles the async Mermaid generation.
     * It waits for the element to be attached to the DOM so that CSS variables
     * (for colors/fonts) are correctly resolved before rendering.
     */
    const runRender = async (codeOverride, retryCount = 0) => {
      try {
        const container = wrap
        const codeToRender = codeOverride !== undefined ? codeOverride : this.code

        // Safety: If widget was destroyed, stop immediately
        if (!container || container._isDestroyed) return

        if (!container.isConnected) {
          // Retry for ~1 second (20 * 50ms)
          if (retryCount < 20) {
            setTimeout(() => runRender(codeToRender, retryCount + 1), 50)
          }
          return
        }

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
            flowchart: {
              useMaxWidth: true,
              htmlLabels: true,
              curve: 'basis'
            }
          })
          mermaidInitialized = true
        }

        // Perform the actual render
        const { svg } = await mermaid.render(uniqueId + '-svg', codeToRender)

        const loading = container.querySelector('.cm-mermaid-loading')
        if (loading) loading.remove()

        const target = container.querySelector('.cm-mermaid-svg-container')
        if (target) {
          target.innerHTML = svg
        }

        // Notify CodeMirror that the widget height might have changed
        if (view && typeof view.requestMeasure === 'function') {
          view.requestMeasure()
        }
      } catch (err) {
        const loading = wrap.querySelector('.cm-mermaid-loading')
        if (loading) {
          loading.textContent = 'Mermaid Error: ' + err.message
          loading.style.color = 'var(--color-error)'
        }
      }
    }

    // Attach to DOM for external updates
    wrap.runRender = runRender

    // Defer the heavy rendering work to the next tick to keep the UI snappy
    setTimeout(runRender, 0)

    return wrap
  }

  /**
   * Helper to trigger a delayed render on the container.
   * We store the timer on the DOM element to persist across widget refreshes.
   */
  startDebouncedRender(container, newCode) {
    if (container._debounceTimer) {
      clearTimeout(container._debounceTimer)
    }

    container._debounceTimer = setTimeout(() => {
      if (container.runRender) {
        container.runRender(newCode)
      }
    }, 300) // 300ms debounce
  }
}
