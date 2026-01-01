import { useCallback } from 'react'

export const useSearchLogic = (setSnippets) => {
  const searchSnippetList = useCallback(
    async (query) => {
      try {
        if (!query || !query.trim()) {
          // Reset to default view (Recent 100)
          if (window.api?.getSnippets) {
            const recents = await window.api.getSnippets({
              metadataOnly: true,
              limit: 100,
              offset: 0
            })
            setSnippets(recents || [])
          }
          return
        }

        if (window.api?.searchSnippets) {
          const results = await window.api.searchSnippets(query)
          setSnippets(results || [])
        }
      } catch (error) {
        console.error('Search failed:', error)
      }
    },
    [setSnippets]
  )

  return {
    searchSnippetList
  }
}
