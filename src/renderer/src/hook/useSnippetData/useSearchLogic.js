import { useCallback } from 'react'

export const useSearchLogic = () => {
  const searchSnippetList = useCallback(async (query) => {
    try {
      if (!query || !query.trim()) {
        return null
      }

      if (window.api?.searchSnippets) {
        return await window.api.searchSnippets(query)
      }
      return []
    } catch (error) {
      console.error('Search failed:', error)
      return []
    }
  }, [])

  return {
    searchSnippetList
  }
}
