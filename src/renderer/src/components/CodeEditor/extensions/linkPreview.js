import { hoverTooltip, EditorView } from '@codemirror/view'
import { markdownToHtml } from '../../../utils/markdownParser'
import mermaid from 'mermaid'

// Initialize Mermaid for the main window tooltips
// Initialize Mermaid for the main window tooltips (Synced with Editor's Neutral Style)
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
    fontSize: '14px'
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  }
})

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

  // PRE-FETCH DATA before tooltip is created to know content size
  const snippet = await window.api.invoke('db:getSnippetByTitle', title)

  return {
    pos: start,
    end,
    create(view) {
      const container = document.createElement('div')
      container.className = 'cm-link-preview-tooltip'

      if (!snippet) {
        const errorEl = document.createElement('div')
        errorEl.className = 'cm-link-preview-loading'
        errorEl.textContent = 'Link not found'
        container.appendChild(errorEl)
        return { dom: container }
      }

      // Render content immediately since we have the data
      const render = async () => {
        // Handle Snippet Language: Wrap Mermaid/Code for consistent header behavior
        let codeToParse = snippet.code || ''
        const lang = (snippet.language || 'markdown').toLowerCase()

        if (lang === 'mermaid' && !codeToParse.includes('```mermaid')) {
          codeToParse = `\`\`\`mermaid\n${codeToParse}\n\`\`\``
        } else if (lang !== 'markdown' && lang !== 'md' && !codeToParse.includes('```')) {
          codeToParse = `\`\`\`${lang}\n${codeToParse}\n\`\`\``
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

        // 2. Body Preview
        const body = document.createElement('div')
        body.className = 'preview-body markdown-body'

        try {
          const rawHTML = await markdownToHtml(codeToParse, { renderMetadata: false })
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = rawHTML
          const intel = tempDiv.querySelector('.preview-intel')
          if (intel) intel.remove()
          const contentDiv = tempDiv.querySelector('.markdown-content')
          body.innerHTML = contentDiv ? contentDiv.innerHTML : tempDiv.innerHTML
        } catch (e) {
          body.textContent = snippet.code || ''
        }

        container.appendChild(body)

        // 3. Trigger Mermaid if nodes exist
        const mermaidNodes = body.querySelectorAll('.mermaid')
        if (mermaidNodes.length > 0) {
          // Delay to ensure DOM is attached for SVG measurement
          requestAnimationFrame(async () => {
            try {
              // Only run on nodes that haven't been processed
              const unprocessed = Array.from(mermaidNodes).filter(
                (n) => !n.getAttribute('data-processed')
              )
              if (unprocessed.length > 0) {
                await mermaid.run({
                  nodes: unprocessed
                })
              }
            } catch (e) {
              console.warn('Mermaid render error in tooltip (ignoring):', e)
            }
          })
        }

        // 4. Footer
        const footer = document.createElement('div')
        footer.className = 'preview-footer'
        const dateStr = snippet.timestamp ? new Date(snippet.timestamp).toLocaleDateString() : ''
        footer.textContent = `Last modified: ${dateStr}`
        container.appendChild(footer)
      }

      render()
      return { dom: container }
    }
  }
})

/**
 * DOUBLE-CLICK WARP ENGINE
 * Listens for double-clicks in the editor and jumps to linked snippets if valid.
 */
/**
 * DOUBLE-CLICK WARP ENGINE
 * Listens for double-clicks in the editor and jumps to linked snippets if valid.
 */
export const wikiLinkWarp = EditorView.domEventHandlers({
  dblclick(event, view) {
    const coords = { x: event.clientX, y: event.clientY }
    const pos = view.posAtCoords(coords)
    if (pos === null) return false

    const { from, text } = view.state.doc.lineAt(pos)
    const relPos = pos - from

    const wikiRegex = /\[\[(.*?)\]\]/g
    let match
    while ((match = wikiRegex.exec(text)) !== null) {
      if (relPos >= match.index && relPos <= match.index + match[0].length) {
        const title = match[1]
        window.dispatchEvent(new CustomEvent('app:open-snippet', { detail: { title } }))
        return true
      }
    }
    return false
  }
})
