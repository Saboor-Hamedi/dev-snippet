import { useEffect } from 'react'

export const useWikiLinks = ({
  snippets,
  handleSelectSnippet,
  createDraftSnippet,
  saveSnippet,
  setSelectedSnippet,
  navigateTo,
  showToast
}) => {
  useEffect(() => {
    const onOpenSnippet = async (e) => {
      const rawTitle = e.detail?.title
      if (!rawTitle) return

      const textTitle = rawTitle.replace(/\.md$/i, '').trim()
      const searchTitle = textTitle.toLowerCase()

      if (window.__wikiLock === searchTitle) return

      const target = snippets.find((s) => {
        const t = (s.title || '').trim().toLowerCase()
        return t === searchTitle || t === `${searchTitle}.md`
      })

      if (target) {
        handleSelectSnippet(target)
      } else {
        window.__wikiLock = searchTitle
        setTimeout(() => {
          window.__wikiLock = null
        }, 1000)

        let safeTitle = textTitle.replace(/[?*"><]/g, '')
        safeTitle = safeTitle.replace(/[:/\\|]/g, '-')
        safeTitle = safeTitle.trim()

        if (!safeTitle) safeTitle = 'Untitled Wiki Note'

        const newSnippet = createDraftSnippet(safeTitle, null, {
          initialCode: `# New Snippet ${safeTitle}\n\n`,
          skipNavigation: true,
          isDraft: false
        })

        if (newSnippet) {
          try {
            await saveSnippet(newSnippet)
            handleSelectSnippet(newSnippet)

            setTimeout(() => {
              setSelectedSnippet(newSnippet)
              navigateTo('editor')
            }, 50)

            showToast(`New Snippet "${safeTitle}"`, 'success')
          } catch (error) {
            console.error('[WikiLink] Creation failed:', error)
            showToast('Failed to save new snippet', 'error')
          }
        }
      }
    }

    window.addEventListener('app:open-snippet', onOpenSnippet)
    return () => window.removeEventListener('app:open-snippet', onOpenSnippet)
  }, [snippets, handleSelectSnippet, createDraftSnippet, saveSnippet, setSelectedSnippet, navigateTo, showToast])
}
