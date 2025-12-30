import { hoverTooltip } from '@codemirror/view'
import { markdownToHtml } from '../../../utils/markdownParser'

/**
 * Creates a hover tooltip for WikiLinks ([[Link]]) and potentially standard links.
 * It fetches the snippet content via IPC and renders a mini-preview.
 */
export const linkPreviewTooltip = hoverTooltip(async (view, pos, side) => {
  // 1. Identify if we are hovering over a WikiLink or Link
  const { from, text } = view.state.doc.lineAt(pos)
  let start = -1
  let end = -1
  let title = ''

  const lineText = text
  const relPos = pos - from

  const wikiRegex = /\[\[(.*?)\]\]/g
  let match
  while ((match = wikiRegex.exec(lineText)) !== null) {
    const mStart = match.index
    const mEnd = match.index + match[0].length
    if (relPos >= mStart && relPos <= mEnd) {
      start = from + mStart
      end = from + mEnd
      title = match[1]
      break
    }
  }

  if (!title) return null

  return {
    pos: start,
    end,
    // Removed 'above: true' to allow dynamic positioning (Top/Bottom) based on space
    create(view) {
      const container = document.createElement('div')
      container.className = 'cm-link-preview-tooltip'

      // Loading State
      const loadingEl = document.createElement('div')
      loadingEl.className = 'cm-link-preview-loading'
      loadingEl.textContent = 'Loading...'
      container.appendChild(loadingEl)

      window.api
        .invoke('db:getSnippetByTitle', title)
        .then(async (snippet) => {
          container.innerHTML = ''

          if (!snippet) {
            const errorEl = document.createElement('div')
            errorEl.className = 'cm-link-preview-loading'
            errorEl.textContent = 'Link not found'
            container.appendChild(errorEl)
            return
          }

          // 1. Header Row
          const header = document.createElement('div')
          header.className = 'preview-header'

          const titleSpan = document.createElement('span')
          titleSpan.className = 'preview-title-text'
          titleSpan.textContent = snippet.title || 'Untitled'
          header.appendChild(titleSpan)

          if (snippet.language) {
            const langPill = document.createElement('span')
            langPill.className = 'preview-lang-pill'
            langPill.textContent = snippet.language
            header.appendChild(langPill)
          }
          container.appendChild(header)

          // 2. Body Preview (RENDERED MARKDOWN)
          const body = document.createElement('div')
          body.className = 'preview-body'

          try {
            // Render HTML using the shared parser
            const rawHTML = await markdownToHtml(snippet.code || '', { renderMetadata: false })

            // Create a temp div to strip the 'is-ltr/is-rtl' wrapper and 'preview-intel'
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = rawHTML

            // Remove the intel header if present
            const intel = tempDiv.querySelector('.preview-intel')
            if (intel) intel.remove()

            // Get the cleaned content
            // We look for .markdown-content, if not found (unexpected), use innerHTML
            const contentDiv = tempDiv.querySelector('.markdown-content')
            body.innerHTML = contentDiv ? contentDiv.innerHTML : tempDiv.innerHTML
          } catch (e) {
            console.error('Preview render failed', e)
            body.textContent = snippet.code || ''
          }

          container.appendChild(body)

          // 3. Footer
          const footer = document.createElement('div')
          footer.className = 'preview-footer'
          const dateStr = snippet.timestamp ? new Date(snippet.timestamp).toLocaleDateString() : ''
          footer.textContent = `Last modified: ${dateStr}`
          container.appendChild(footer)
        })
        .catch((err) => {
          container.innerHTML = ''
          const errorEl = document.createElement('div')
          errorEl.className = 'cm-link-preview-loading'
          errorEl.textContent = 'Error loading'
          container.appendChild(errorEl)
          console.error(err)
        })

      return { dom: container }
    }
  }
})
