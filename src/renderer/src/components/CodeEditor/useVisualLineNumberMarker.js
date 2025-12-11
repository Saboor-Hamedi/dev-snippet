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
    eq(other) {
      if (this.numbers === other.numbers) return true
      if (Array.isArray(this.numbers) && Array.isArray(other.numbers)) {
        return (
          this.numbers.length === other.numbers.length &&
          this.numbers.every((n, i) => n === other.numbers[i])
        )
      }
      return this.numbers == other.numbers
    }
    toDOM() {
      const wrapper = document.createElement('div')
      wrapper.className = 'vis-line-num-wrapper'
      const nums = Array.isArray(this.numbers) ? this.numbers : [this.numbers]

      for (let i = 0; i < nums.length; i++) {
        const d = document.createElement('div')
        d.className =
          i === 0 ? 'vis-line-num vis-line-num-primary' : 'vis-line-num vis-line-num-sub'
        d.textContent = String(nums[i])
        wrapper.appendChild(d)
      }
      return wrapper
    }
  }

  // Map<pos, count>
  const cache = new Map()

  const measurePlugin = ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.view = view
        this.requestMeasure()
      }

      update(update) {
        if (update.docChanged || update.viewportChanged || update.geometryChanged) {
          this.requestMeasure()
        }
      }

      requestMeasure() {
        // Use requestMeasure to safely access DOM
        try {
          this.view.requestMeasure({
            read: (view) => {
              const vp = view.viewport
              let changed = false

              // Iterate over visible logical lines
              for (let pos = vp.from; pos < vp.to; ) {
                const line = view.state.doc.lineAt(pos)
                const start = line.from

                try {
                  // Determine visual line count
                  let count = 1
                  // Safe DOM access check
                  try {
                    const posInfo = view.domAtPos(start)
                    let node = posInfo.node
                    // Walk up to find the line element
                    while (node && node !== view.dom && !node.classList?.contains?.('cm-line')) {
                      node = node.parentElement
                    }

                    if (node && node !== view.dom) {
                      const style = window.getComputedStyle(node)
                      const parentStyle = window.getComputedStyle(view.dom)
                      const lh =
                        parseFloat(style.lineHeight) || parseFloat(parentStyle.lineHeight) || 16
                      const rect = node.getBoundingClientRect()
                      // Calculate how many lines fit in the height
                      count = Math.max(1, Math.round(rect.height / lh))
                    }
                  } catch (err) {
                    // domAtPos might throw if view is in inconsistent state
                    count = 1
                  }

                  if (cache.get(start) !== count) {
                    cache.set(start, count)
                    changed = true
                  }
                } catch (e) {
                  // General safety catch
                }

                pos = line.to + 1
              }
              return changed
            },
            write: (changed, view) => {
              if (changed) {
                // Determine if we need to force a full redraw.
                // Using requestMeasure recursively in write phase is safer than dispatch.
                // However, getting the gutter to update might require a transaction.
                // Let's try to just let the ViewPlugin lifecycle handle it, or use a safer dispatch.
                // Actually, cache update alone won't trigger gutter redraw.
                // We need to invalidate the gutter.
                // A safe way is to dispatch a no-op effect or rely on the fact that geometry changes
                // often trigger another measure pass.
                // The crash 'destructure property tile of undefined' usually means
                // we are messing with the view during a delicate phase.
                // Let's TRY delaying the dispatch to next tick.
                setTimeout(() => {
                  try {
                    if (!view.isDestroyed) view.dispatch([])
                  } catch (e) {}
                }, 0)
              }
            }
          })
        } catch (e) {
          // Ignore measure request errors
        }
      }

      destroy() {
        cache.clear()
      }
    }
  )

  const gutterExt = gutter({
    class: 'cm-visualLineNumbers',
    marker(view, line) {
      // Gutter marker simply reads from cache
      // Default to 1 if not yet measured
      const count = cache.get(line.from) || 1
      const arr = Array(count).fill(line.number)
      return new MultiNumberMarker(arr)
    }
  })

  return [gutterExt, measurePlugin]
}
