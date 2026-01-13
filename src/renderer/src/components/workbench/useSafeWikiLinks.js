import { useMemo } from 'react'
import { Decoration, ViewPlugin, MatchDecorator } from '@codemirror/view'

/**
 * A robust, crash-free replacement for the legacy WikiLinks extension.
 * Handles:
 * 1. Visual Decoration (Blue/Red links) via specific CSS classes.
 * 2. Click Navigation (Resolved links).
 * 3. Draft Creation (Unresolved links).
 * 4. Tooltips (Native browser tooltips for maximum stability).
 * 
 * Bypasses the 'linkPreview.js' complexity to avoid 'RangeError: posBefore'.
 */
export const useSafeWikiLinks = ({ snippets, handleSelectSnippet, createDraftSnippet }) => {
  
  return useMemo(() => {
    // fast lookup for existence check
    const existingTitles = new Set((snippets || []).map(s => (s.title || '').toLowerCase()))
    const snippetMap = new Map((snippets || []).map(s => [(s.title || '').toLowerCase(), s.id]))

    const wikiLinkDecorator = new MatchDecorator({
      regexp: /\[\[([^\]]+)\]\]/g,
      decoration: (match) => {
        const rawContent = match[1]
        // Parse [[Title|Alias]] format
        const sections = rawContent.split('|')
        const linkTitle = sections[0].trim()
        const displayLabel = sections[1]?.trim() || linkTitle
        
        const exists = existingTitles.has(linkTitle.toLowerCase())
        
        // Use the exact standard classes likely used by the theme
        const className = exists 
          ? 'cm-wiki-link cm-wiki-link-resolved text-[var(--color-accent-primary)] cursor-pointer hover:underline' 
          : 'cm-wiki-link cm-wiki-link-unresolved text-red-400 cursor-pointer hover:underline opacity-80'

        return Decoration.mark({
          tagName: 'span',
          class: className,
          attributes: {
            title: exists ? `Go to: ${linkTitle}` : `Create note: ${linkTitle}`,
            'data-link-target': linkTitle,
            'data-link-exists': exists.toString()
          }
        })
      }
    })

    const wikiLinkPlugin = ViewPlugin.fromClass(
      class {
        constructor(view) {
          this.decorations = wikiLinkDecorator.createDeco(view)
        }
        update(update) {
          if (update.docChanged || update.viewportChanged) {
            this.decorations = wikiLinkDecorator.createDeco(update.view)
          }
        }
      },
      {
        decorations: (v) => v.decorations,
        eventHandlers: {
          mousedown: (e) => {
            // Use mousedown to prevent default cursor placement if clicking a link
            const target = e.target
            if (target.matches('.cm-wiki-link')) {
              e.preventDefault() // Stop cursor tracking
              e.stopPropagation()
              
              const title = target.getAttribute('data-link-target')
              const exists = target.getAttribute('data-link-exists') === 'true'
              
              if (exists) {
                const id = snippetMap.get(title.toLowerCase())
                if (id && handleSelectSnippet) {
                  handleSelectSnippet(id)
                }
              } else {
                if (createDraftSnippet) {
                  createDraftSnippet(title)
                }
              }
            }
          }
        }
      }
    )

    return [wikiLinkPlugin]
  }, [snippets, handleSelectSnippet, createDraftSnippet])
}
