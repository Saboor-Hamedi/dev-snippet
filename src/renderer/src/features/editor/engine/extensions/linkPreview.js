import { hoverTooltip, EditorView, ViewPlugin, MatchDecorator, Decoration } from '@codemirror/view'
import { markdownToHtml } from '../../utils/markdownParser'
import { useSidebarStore } from '../../store/useSidebarStore' // For instant cache lookup

// Mermaid removed

/**
 * Compact Link Preview Tooltip for WikiLinks ([[Link]])
 * Optimized for minimal spacing and dense content display
 */
export const linkPreviewTooltip = hoverTooltip(
  async (view, pos, side) => {
    const { from, text: lineText } = view.state.doc.lineAt(pos)
    const relPos = pos - from

    // Find WikiLink under cursor
    const wikiRegex = /\[\[(.*?)\]\]/g
    let match
    let start = -1
    let end = -1
    let title = ''

    while ((match = wikiRegex.exec(lineText)) !== null) {
      const mStart = match.index
      const mEnd = mStart + match[0].length
      if (relPos >= mStart && relPos <= mEnd) {
        start = from + mStart
        end = from + mEnd
        title = match[1].trim()
        break
      }
    }

    if (!title) return null

    // 1. INSTANT CACHE LOOKUP (0ms Latency)
    const { snippetIndex } = useSidebarStore.getState()
    const norm = title.trim().toLowerCase()
    const cached =
      snippetIndex[norm] || snippetIndex[`${norm}.md`] || snippetIndex[norm.replace(/\.md$/, '')]

    let snippet = null

    if (cached) {
      snippet = await window.api.invoke('db:getSnippetById', cached.id)
    } else {
      // 2. DEAD LINK -> Show "Create" Tooltip
      return {
        pos: start,
        end,
        create(view) {
          const container = document.createElement('div')
          container.className = 'cm-link-preview-tooltip'
          // Styles moved to inner or CSS, wrapper is transparent bridge

          const inner = document.createElement('div')
          inner.className = 'preview-container-inner'
          inner.style.minHeight = 'auto'
          inner.style.width = 'auto'
          inner.style.cursor = 'pointer'

          inner.innerHTML = `
            <div class="preview-header" style="justify-content:center; padding: 6px 12px; border:none; background:transparent;">
              <span class="preview-title-text" style="font-style:normal; color: var(--color-accent-primary);">
                ✨ Click to create <b>"${title}"</b>
              </span>
            </div>
          `
          container.onmousedown = (e) => {
            e.preventDefault()
            e.stopPropagation()
          }
          container.onclick = (e) => {
            e.preventDefault()
            e.stopPropagation()
            window.dispatchEvent(new CustomEvent('app:open-snippet', { detail: { title } }))
          }
          container.appendChild(inner)
          return { dom: container, offset: { x: 0, y: 0 } }
        }
      }
    }

    if (!snippet) return null

    // Pre-render HTML to avoid layout jumps during tooltip display
    let codeToParse = snippet.code?.trim() || ''
    const lang = (snippet.language || 'markdown').toLowerCase()

    // Auto-wrap non-markdown content in proper fences
    if (lang !== 'markdown' && lang !== 'md' && !/^```/.test(codeToParse)) {
      codeToParse = '```' + lang + '\n' + codeToParse + '\n```'
    }

    let initialHTML = ''
    try {
      initialHTML = await markdownToHtml(codeToParse, { renderMetadata: false })
    } catch (err) {
      initialHTML = `<div>${codeToParse}</div>`
    }

    // Pre-calculate image and diagram loading to avoid layout shifts
    const tempMeasureDiv = document.createElement('div')
    tempMeasureDiv.innerHTML = initialHTML

    // Mermaid pre-rendering removed

    // 2. Wait for regular images
    const images = Array.from(tempMeasureDiv.querySelectorAll('img'))
    if (images.length > 0) {
      await Promise.all(
        images.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve()
              else {
                img.onload = resolve
                img.onerror = resolve
                setTimeout(resolve, 1500)
              }
            })
        )
      )
    }

    return {
      pos: start,
      end,
      create(view) {
        const container = document.createElement('div')
        container.className = 'cm-link-preview-tooltip'
        // CSS handles bridge

        const inner = document.createElement('div')
        inner.className = 'preview-container-inner'

        // Header: Title + Language Pill (tight layout)
        const header = document.createElement('div')
        header.className = 'preview-header'

        const titleSpan = document.createElement('span')
        titleSpan.className = 'preview-title-text'
        titleSpan.textContent = snippet.title || 'Untitled'

        // Make title clickable to open snippet
        titleSpan.style.cursor = 'pointer'
        titleSpan.style.textDecoration = 'underline'
        titleSpan.style.userSelect = 'none' // Prevent selection
        titleSpan.title = 'Click to open snippet'

        // Prevent selection/focus on mousedown
        titleSpan.onmousedown = (e) => {
          e.preventDefault()
          e.stopPropagation()
        }

        // Trigger action on click (standard behavior)
        titleSpan.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          window.dispatchEvent(
            new CustomEvent('app:open-snippet', { detail: { title: snippet.title } })
          )
        }

        header.appendChild(titleSpan)

        if (snippet.language) {
          const langPill = document.createElement('span')
          langPill.className = 'preview-lang-pill'
          langPill.textContent = snippet.language.toUpperCase()
          header.appendChild(langPill)
        }
        inner.appendChild(header)

        // Body: Main content (markdown/mermaid/code)
        const body = document.createElement('div')
        body.className = 'preview-body markdown-body'

        // Inject pre-rendered content immediately (images + diagrams are already ready)
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = initialHTML
        const intel = tempDiv.querySelector('.preview-intel')
        if (intel) intel.remove()
        const content = tempDiv.querySelector('.markdown-content') || tempDiv
        body.innerHTML = content.innerHTML
        inner.appendChild(body)

        // Footer: Last modified (compact)
        const footer = document.createElement('div')
        footer.className = 'preview-footer'
        const dateStr = snippet.timestamp
          ? new Date(snippet.timestamp).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })
          : '—'
        footer.textContent = `Modified: ${dateStr}`
        inner.appendChild(footer)

        container.appendChild(inner)

        return { dom: container, offset: { x: 0, y: 0 } } // Zero offset, bridging via CSS
      }
    }
  },
  { hoverTime: 300 }
)

// wikiLinkPlugin REMOVED (Logic moved to links.js to prevent posBefore collisions)

/**
 * Double-click to navigate to linked snippet
 */
export const wikiLinkWarp = EditorView.domEventHandlers({
  dblclick(event, view) {
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
    if (pos === null) return false

    const { from, text } = view.state.doc.lineAt(pos)
    const relPos = pos - from

    const wikiRegex = /\[\[(.*?)\]\]/g
    let match
    while ((match = wikiRegex.exec(text)) !== null) {
      if (relPos >= match.index && relPos <= match.index + match[0].length) {
        const title = match[1].trim()

        console.debug('[WikiLink] Double click detected on:', title)
        window.dispatchEvent(new CustomEvent('app:open-snippet', { detail: { title } }))
        return true // Prevent further propagation
      }
    }
    return false
  }
})
