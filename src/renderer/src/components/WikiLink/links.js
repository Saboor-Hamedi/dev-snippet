import { Decoration, ViewPlugin, hoverTooltip, EditorView } from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import { sortDecorations } from '../CodeEditor/engine/utils'
import { EditorMode, editorModeField, activeLinesField } from '../CodeEditor/engine/state'
import { useSidebarStore } from '../../store/useSidebarStore'
import { markdownToHtml } from '../../utils/markdownParser'

const hideMarkerDeco = Decoration.mark({ class: 'cm-marker-hidden' })
const resolvedWikiLinkDeco = Decoration.mark({ class: 'cm-wikilink cm-wiki-link-resolved' })
const unresolvedWikiLinkDeco = Decoration.mark({ class: 'cm-wikilink cm-wiki-link-unresolved' })
const mentionDeco = Decoration.mark({ class: 'cm-mention' })
const hashtagDeco = Decoration.mark({ class: 'cm-hashtag' })

// -----------------------------------------------------------------------------
// 1. Unified WikiLink Selection Helper
// -----------------------------------------------------------------------------
const findWikiLinkAt = (text, pos, from) => {
  const wikiRegex = /\[\[([^\]\n]+)\]\]/g
  let match
  while ((match = wikiRegex.exec(text)) !== null) {
    const mStart = from + match.index
    const mEnd = mStart + match[0].length
    if (pos >= mStart && pos <= mEnd) {
      return { start: mStart, end: mEnd, title: match[1].trim() }
    }
  }
  return null
}

// -----------------------------------------------------------------------------
// 2. The Tooltip Extension (Integrated)
// -----------------------------------------------------------------------------
export const wikiLinkTooltip = hoverTooltip(async (view, pos) => {
  const { from, text: lineText } = view.state.doc.lineAt(pos)
  const link = findWikiLinkAt(lineText, pos, from)
  if (!link) return null

  const { snippetIndex } = useSidebarStore.getState()
  const norm = link.title.toLowerCase()
  const cached = snippetIndex[norm] || snippetIndex[`${norm}.md`] || snippetIndex[norm.replace(/\.md$/, '')]

  if (!cached) {
    // Dead Link Tooltip
    return {
      pos: link.start,
      end: link.end,
      create: () => {
        const dom = document.createElement('div')
        dom.className = 'cm-link-preview-tooltip'
        dom.innerHTML = `<div class="preview-container-inner" style="cursor: pointer; padding: 12px 16px;">
          ✨ Click to create <b>"${link.title}"</b>
        </div>`
        dom.onclick = (e) => {
          e.preventDefault()
          e.stopPropagation()
          window.dispatchEvent(new CustomEvent('app:open-snippet', { detail: { title: link.title } }))
        }
        return { dom, offset: { x: 0, y: 5 } }
      }
    }
  }

  // Existing Link Tooltip logic
  return {
    pos: link.start,
    end: link.end,
    create: (v) => {
      const container = document.createElement('div')
      container.className = 'cm-link-preview-tooltip'
      container.innerHTML = `<div class="preview-container-inner">
        <div class="preview-header" style="cursor: pointer;">
          <span class="preview-title-text">${link.title}</span>
          <span class="preview-open-indicator" style="font-size: 0.75em; opacity: 0.5;">(Open)</span>
        </div>
        <div class="preview-body">
          <div class="preview-loading">Loading preview...</div>
        </div>
      </div>`
      
      const header = container.querySelector('.preview-header')
      header.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        window.dispatchEvent(new CustomEvent('app:open-snippet', { detail: { title: link.title } }))
      }

      // Prevent editor from stealing focus on mousedown
      container.onmousedown = (e) => e.stopPropagation()
      
      // Async load content
      window.api.invoke('db:getSnippetById', cached.id).then(async (snippet) => {
        if (!snippet) return
        const body = container.querySelector('.preview-body')
        try {
          const rawCode = snippet.code || ''
          const truncatedCode = rawCode.length > 800 ? rawCode.substring(0, 800) + '...' : rawCode
          const html = await markdownToHtml(truncatedCode, { renderMetadata: false })
          body.innerHTML = html + '<div class="preview-fade-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; height: 40px; background: linear-gradient(transparent, var(--color-tooltip-bg, #1e1e1e)); pointer-events: none;"></div>'
        } catch (e) {
          body.textContent = (snippet.code || '').substring(0, 150) + '...'
        }
      })

      return { dom: container, offset: { x: 0, y: 5 } }
    }
  }
}, { hoverTime: 300 })

// -----------------------------------------------------------------------------
// 3. Inline Regex-based Decorations (ViewPlugin)
// -----------------------------------------------------------------------------
export const inlineRegexPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = this.getDecorations(view)
    }

    update(update) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.getDecorations(update.view)
      }
    }

    getDecorations(view) {
      const doc = view?.state?.doc
      if (!doc) return Decoration.none
      
      const viewport = view.viewport
      if (!viewport) return Decoration.none

      try {
        const from = viewport.from
        const to = viewport.to
        const docLen = doc.length
        
        const text = doc.sliceString(from, to)
        const collected = []
        const claimedRanges = [] // Ranges already decorated by high-priority items
        const { snippetIndex } = useSidebarStore.getState()

        // 1. WikiLinks (Highest Priority)
        const wikiLinkRegex = /\[\[([^\]\n]+)\]\]/g
        const mode = view.state.field(editorModeField)
        const activeLines = view.state.field(activeLinesField)
        let match
        while ((match = wikiLinkRegex.exec(text)) !== null) {
          const start = from + match.index
          const end = from + match.index + match[0].length
          const content = match[1].trim()

          const norm = content.toLowerCase()
          const exists = !!(snippetIndex[norm] || snippetIndex[`${norm}.md`] || snippetIndex[norm.replace(/\.md$/, '')])
          const linkDeco = exists ? resolvedWikiLinkDeco : unresolvedWikiLinkDeco

          let isRevealed = mode === EditorMode.SOURCE
          if (mode === EditorMode.LIVE_PREVIEW) {
            const lineNum = doc.lineAt(start).number
            if (activeLines.has(lineNum)) isRevealed = true
          }

          if (isRevealed || mode === EditorMode.SOURCE) {
            collected.push({ from: start, to: end, deco: linkDeco })
          } else {
            // NATIVE HIDING: Use Decoration.replace instead of .mark for markers
            // This is significantly more stable for CodeMirror's position engine
            collected.push({ from: start, to: start + 2, deco: Decoration.replace({}) })
            collected.push({ from: start + 2, to: end - 2, deco: linkDeco })
            collected.push({ from: end - 2, to: end, deco: Decoration.replace({}) })
          }
          claimedRanges.push({ from: start, to: end })
        }

        // Helper to check for overlaps
        const isClaimed = (s, e) => claimedRanges.some(r => s < r.to && e > r.from)

        // 2. Mentions
        const mentionRegex = /(?:^|\s)(@[\w]+)/g
        while ((match = mentionRegex.exec(text)) !== null) {
          const start = from + match.index + (match[0].length - match[1].length)
          const end = start + match[1].length
          if (!isClaimed(start, end)) {
            collected.push({ from: start, to: end, deco: mentionDeco })
            claimedRanges.push({ from: start, to: end })
          }
        }

        // 3. Hashtags
        const hashtagRegex = /(?:^|\s)(#[\w]+)/g
        while ((match = hashtagRegex.exec(text)) !== null) {
          const start = from + match.index + (match[0].length - match[1].length)
          const end = start + match[1].length
          if (!isClaimed(start, end)) {
            collected.push({ from: start, to: end, deco: hashtagDeco })
            claimedRanges.push({ from: start, to: end })
          }
        }

        const builder = new RangeSetBuilder()
        const valid = collected.filter((d) => d.from >= 0 && d.to <= docLen && d.from < d.to)

        sortDecorations(valid).forEach((d) => {
          try {
            if (builder.lastFrom <= d.from) {
              const safeFrom = Math.max(d.from, builder.lastTo)
              if (safeFrom < d.to) builder.add(safeFrom, d.to, d.deco)
            }
          } catch (e) {}
        })
        return builder.finish()
      } catch (err) {
        console.error('[WikiLink] Internal decoration error:', err)
        return Decoration.none
      }
    }
  },
  { decorations: (v) => v.decorations }
)

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
