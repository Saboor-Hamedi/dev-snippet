import { hoverTooltip, EditorView } from '@codemirror/view'
import { markdownToHtml } from '../../../utils/markdownParser'
import mermaid from 'mermaid'

// Initialize Mermaid (compact, neutral theme matching tooltip)
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'inherit',
  themeVariables: {
    primaryColor: '#ffffff',
    primaryTextColor: '#000000',
    primaryBorderColor: '#333333',
    lineColor: '#333333',
    secondaryColor: '#f6f6f6',
    tertiaryColor: '#ffffff',
    nodeBorder: '#333333',
    clusterBkg: '#ffffff',
    clusterBorder: '#333333',
    actorBkg: '#ffffff',
    actorTextColor: '#000000',
    actorBorder: '#333333',
    actorLineColor: '#333333',
    edgeLabelBackground: '#ffffff',
    labelBackgroundColor: '#ffffff',
    fontSize: '11px' // Slightly smaller for compact tooltip
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  }
})

/**
 * Compact Link Preview Tooltip for WikiLinks ([[Link]])
 * Optimized for minimal spacing and dense content display
 */
export const linkPreviewTooltip = hoverTooltip(async (view, pos, side) => {
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

  // Pre-fetch snippet to avoid flicker and enable fast render
  const snippet = await window.api.invoke('db:getSnippetByTitle', title)
  if (!snippet) return null

  return {
    pos: start,
    end,
    create(view) {
      const container = document.createElement('div')
      container.className = 'cm-link-preview-tooltip'

      // Header: Title + Language Pill (tight layout)
      const header = document.createElement('div')
      header.className = 'preview-header'

      const titleSpan = document.createElement('span')
      titleSpan.className = 'preview-title-text'
      titleSpan.textContent = snippet.title || 'Untitled'
      header.appendChild(titleSpan)

      if (snippet.language) {
        const langPill = document.createElement('span')
        langPill.className = 'preview-lang-pill'
        langPill.textContent = snippet.language.toUpperCase()
        header.appendChild(langPill)
      }
      container.appendChild(header)

      // Body: Main content (markdown/mermaid/code)
      const body = document.createElement('div')
      body.className = 'preview-body markdown-body'

      const renderContent = async () => {
        let codeToParse = snippet.code?.trim() || ''
        const lang = (snippet.language || 'markdown').toLowerCase()

        // Auto-wrap non-markdown content in proper fences
        if (lang === 'mermaid' && !codeToParse.startsWith('```mermaid')) {
          codeToParse = '```mermaid\n' + codeToParse + '\n```'
        } else if (lang !== 'markdown' && lang !== 'md' && !/^```/.test(codeToParse)) {
          codeToParse = '```' + lang + '\n' + codeToParse + '\n```'
        }

        try {
          const rawHTML = await markdownToHtml(codeToParse, { renderMetadata: false })
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = rawHTML

          // Strip metadata/intel if present
          const intel = tempDiv.querySelector('.preview-intel')
          if (intel) intel.remove()

          const content = tempDiv.querySelector('.markdown-content') || tempDiv
          body.innerHTML = content.innerHTML
        } catch (err) {
          console.warn('Markdown render failed in tooltip:', err)
          body.textContent = codeToParse || '(empty)'
        }

        container.insertBefore(body, container.lastChild) // Insert before footer

        // Render Mermaid diagrams (if any)
        const mermaidNodes = body.querySelectorAll('.mermaid')
        if (mermaidNodes.length > 0) {
          requestAnimationFrame(async () => {
            try {
              const unprocessed = Array.from(mermaidNodes).filter(
                (node) => !node.getAttribute('data-processed')
              )
              if (unprocessed.length > 0) {
                await mermaid.run({ nodes: unprocessed })
              }
            } catch (e) {
              console.warn('Mermaid failed in tooltip:', e)
            }
          })
        }
      }

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
      container.appendChild(footer)

      // Trigger render
      renderContent()

      return { dom: container }
    }
  }
})

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
        window.dispatchEvent(new CustomEvent('app:open-snippet', { detail: { title } }))
        return true // Prevent further propagation
      }
    }
    return false
  }
})
