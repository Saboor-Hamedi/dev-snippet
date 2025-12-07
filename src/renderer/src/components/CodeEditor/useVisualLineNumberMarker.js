// useVisualLineNumberMarker.js
// Build visual-line numbering gutter using modules provided by the caller.
// This avoids bundling/importing separate CodeMirror instances.
export function useVisualLineNumberMarker(viewModule) {
  const { ViewPlugin, gutter, GutterMarker } = viewModule

  class MultiNumberMarker extends GutterMarker {
    constructor(numbers) {
      super()
      this.numbers = numbers
    }
    toDOM() {
      const wrapper = document.createElement('div')
      wrapper.className = 'vis-line-num-wrapper'
      if (Array.isArray(this.numbers)) {
        for (let i = 0; i < this.numbers.length; i++) {
          const d = document.createElement('div')
          d.className = i === 0 ? 'vis-line-num vis-line-num-primary' : 'vis-line-num vis-line-num-sub'
          d.textContent = String(this.numbers[i])
          wrapper.appendChild(d)
        }
      } else if (typeof this.numbers === 'string') {
        wrapper.innerHTML = this.numbers
      }
      // Debug: log gutter marker creation and font-size/font-family/font-weight
      try {
        const gutterFont = window.getComputedStyle(wrapper).fontSize;
        const gutterFamily = window.getComputedStyle(wrapper).fontFamily;
        const gutterWeight = window.getComputedStyle(wrapper).fontWeight;
        const content = document.querySelector('.cm-content');
        const contentFont = content ? window.getComputedStyle(content).fontSize : 'N/A';
        const contentFamily = content ? window.getComputedStyle(content).fontFamily : 'N/A';
        const contentWeight = content ? window.getComputedStyle(content).fontWeight : 'N/A';
        console.debug('[GUTTER] Marker created:', this.numbers, {
          gutterFont, gutterFamily, gutterWeight,
          contentFont, contentFamily, contentWeight
        });
      } catch (e) {}
      return wrapper
    }
  }

  function makeNumbersArray(number, count) {
    // VS Code behavior: each visual line gets the document line number
    // If a paragraph wraps to 3 lines, all 3 get the same document line number
    return Array(count).fill(number)
  }

  const cache = new Map()

  const computeForLine = (view, line) => {
    try {
      const { from } = line
      // If this is outside the visible viewport, avoid expensive DOM reads.
      const vp = view.viewport
      if (from < vp.from || from >= vp.to) return 1

      const posInfo = view.domAtPos(from)
      let node = posInfo.node
      while (node && node !== view.dom && !node.classList?.contains?.('cm-line')) {
        node = node.parentElement
      }
      if (!node || node === view.dom) return 1

      const rects = node.getClientRects()
      if (rects && rects.length > 0) {
        return Math.max(1, rects.length)
      }

      const lineRect = node.getBoundingClientRect()
      const style = window.getComputedStyle(node)
      const parentStyle = window.getComputedStyle(view.dom)
      const lineHeightPx = parseFloat(style.lineHeight) || parseFloat(parentStyle.lineHeight) || 16
      const count = Math.max(1, Math.round(lineRect.height / Math.max(1, lineHeightPx)))
      return count
    } catch (e) {
      return 1
    }
  }

  const gutterExt = gutter({
    class: 'cm-visualLineNumbers',
    marker(view, line) {
      const start = line.from;
      let count = cache.get(start);
      let number = view.state.doc.lineAt(start).number;
      let arr = [];
      try {
        const posInfo = view.domAtPos(start);
        let node = posInfo.node;
        while (node && node !== view.dom && !node.classList?.contains?.('cm-line')) {
          node = node.parentElement;
        }
        let rects = null;
        if (node && node !== view.dom) rects = node.getClientRects();
        if (count == null) {
          count = rects && rects.length > 0 ? rects.length : computeForLine(view, line);
          cache.set(start, count);
        }
        // Defensive: always at least one marker
        const remaining = Math.max(1, (rects?.length || count));
        arr = makeNumbersArray(number, remaining);
        // Debug: log marker, rects, and scroll
        console.debug('[GUTTER] marker', {number, arr, rects, count});
      } catch (e) {
        // Defensive fallback: always show one marker
        if (count == null) {
          count = computeForLine(view, line);
          cache.set(start, count);
        }
        arr = makeNumbersArray(number, Math.max(1, count));
        console.debug('[GUTTER] fallback marker', {number, arr, count, error: e});
      }
      return new MultiNumberMarker(arr);
    }
  })

  const refresher = ViewPlugin.fromClass(class {
    constructor(view) {
      this.view = view
      this.scheduled = false
      this.handleResize = () => this.requestRefresh('resize')
      window.addEventListener('resize', this.handleResize)
      this.scroller = view.dom.querySelector('.cm-scroller') || null
      this._lastScrollTs = 0
      this.handleScroll = () => {
        const now = Date.now()
        if (now - this._lastScrollTs > 16) {
          this._lastScrollTs = now
          // Always clear cache and force redraw
          cache.clear();
          try {
            this.view.dispatch({ selection: this.view.state.selection })
          } catch (e) {
            try { this.view.requestMeasure() } catch (_) {}
          }
        }
      }
      if (this.scroller) this.scroller.addEventListener('scroll', this.handleScroll, { passive: true })
      this.mo = new MutationObserver(() => this.requestRefresh('mutation'))
      this.mo.observe(view.dom, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] })
      // Listen for zoom/font-size changes
      this._zoomObserver = new MutationObserver(() => {
        cache.clear();
        this.requestRefresh('zoom');
      })
      const content = view.dom.querySelector('.cm-content')
      if (content) this._zoomObserver.observe(content, { attributes: true, attributeFilter: ['style', 'class'] })
    }
    requestRefresh(reason) {
      if (this.scheduled) return
      this.scheduled = true
      requestAnimationFrame(() => {
        this.scheduled = false
        try {
          const vp = this.view.viewport
          for (const key of Array.from(cache.keys())) {
            if (key < vp.from || key >= vp.to) cache.delete(key)
          }
        } catch (err) {
          cache.clear()
        }
        // Debug: log refresh reason and font-size
        try {
          const gutter = this.view.dom.querySelector('.cm-gutters')
          const content = this.view.dom.querySelector('.cm-content')
          const gutterFont = gutter ? window.getComputedStyle(gutter).fontSize : 'N/A'
          const contentFont = content ? window.getComputedStyle(content).fontSize : 'N/A'
          console.debug('[GUTTER] Refresh:', reason, 'Gutter font-size:', gutterFont, 'Content font-size:', contentFont)
        } catch (e) {}
        try { this.view.requestMeasure() } catch (e) { try { this.view.dispatch({ effects: [] }) } catch (_) {} }
      })
    }
    update(update) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) this.requestRefresh('update')
    }
    destroy() {
      window.removeEventListener('resize', this.handleResize)
      if (this.scroller) this.scroller.removeEventListener('scroll', this.handleScroll)
      this.mo.disconnect()
      if (this._zoomObserver) this._zoomObserver.disconnect()
    }
  })

  return [gutterExt, refresher]
}