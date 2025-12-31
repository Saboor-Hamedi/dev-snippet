import { useCallback } from 'react'
import mermaid from 'mermaid'
import { getMermaidConfig } from '../mermaidConfig'

/**
 * useMermaidCapture - Professional hook for capturing Mermaid diagrams as high-resolution images.
 * Provides a streamlined async workflow for rendering SVGs to high-dpi PNGs.
 *
 * @param {string} fontFamily - The font family to use for diagram labels.
 */
export const useMermaidCapture = (fontFamily) => {
  const handleQuickCopyMermaid = useCallback(
    (diagramCode) => {
      // Configuration for high-quality export
      const EXPORT_PADDING = 20
      const EXPORT_SCALE = 2

      // STEP 1: Initiate Asynchronous Capture Workflow
      // We return the promise to ClipboardItem immediately to satisfy the user gesture requirement.
      const blobPromise = (async () => {
        let renderDiv = null
        try {
          // Initialize Mermaid with the 'neutral' document-style theme
          const captureConfig = getMermaidConfig(false, fontFamily)
          mermaid.initialize({
            ...captureConfig,
            startOnLoad: false
          })

          // Create an off-screen container for rendering
          const uniqueId = `mermaid-capture-${crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now()}`
          renderDiv = document.createElement('div')
          Object.assign(renderDiv.style, {
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            visibility: 'hidden'
          })
          document.body.appendChild(renderDiv)

          // Perform the actual render
          const { svg } = await mermaid.render(uniqueId, diagramCode, renderDiv)

          // STEP 2: Normalize and Prepare SVG for Rasterization
          const parser = new DOMParser()
          const svgDoc = parser.parseFromString(svg, 'image/svg+xml')
          const svgEl = svgDoc.documentElement

          // Inject explicit dimensions derived from viewBox (required for Image() rendering)
          const viewBox = svgEl.getAttribute('viewBox')
          if (viewBox) {
            const [, , vw, vh] = viewBox.split(' ').map(Number)
            svgEl.setAttribute('width', vw)
            svgEl.setAttribute('height', vh)
          }

          if (!svgEl.getAttribute('xmlns')) {
            svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
          }

          const serializedSvg = new XMLSerializer().serializeToString(svgEl)
          const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serializedSvg)}`

          // STEP 3: Convert SVG to high-res PNG via Canvas
          return await new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
              const canvas = document.createElement('canvas')
              const w = img.width || 800
              const h = img.height || 600

              // Standard high-dpi scaling
              canvas.width = (w + EXPORT_PADDING * 2) * EXPORT_SCALE
              canvas.height = (h + EXPORT_PADDING * 2) * EXPORT_SCALE

              const ctx = canvas.getContext('2d')
              ctx.scale(EXPORT_SCALE, EXPORT_SCALE)

              // Apply solid document background
              ctx.fillStyle = '#ffffff'
              ctx.fillRect(0, 0, w + EXPORT_PADDING * 2, h + EXPORT_PADDING * 2)

              // Draw diagram with padding offset
              ctx.drawImage(img, EXPORT_PADDING, EXPORT_PADDING)

              canvas.toBlob(
                (blob) => (blob ? resolve(blob) : reject(new Error('Canvas rasterization failed'))),
                'image/png'
              )
            }
            img.onerror = () => reject(new Error('SVG source failed to load into Image object'))
            img.src = dataUrl
          })
        } catch (err) {
          console.error('[Capture Engine] Failed:', err)
          throw err
        } finally {
          // Cleanup temporary rendering container
          if (renderDiv && document.body.contains(renderDiv)) {
            document.body.removeChild(renderDiv)
          }
        }
      })()

      // STEP 4: Resolve Promise into System Clipboard
      navigator.clipboard
        .write([new ClipboardItem({ 'image/png': blobPromise })])
        .then(() => {
          window.dispatchEvent(
            new CustomEvent('app:toast', {
              detail: { message: 'Diagram copied to clipboard!', type: 'success' }
            })
          )
        })
        .catch((err) => {
          console.error('[Clipboard] Failed:', err)
          window.dispatchEvent(
            new CustomEvent('app:toast', {
              detail: { message: 'Failed to access clipboard.', type: 'error' }
            })
          )
        })
    },
    [fontFamily]
  )

  return { handleQuickCopyMermaid }
}
