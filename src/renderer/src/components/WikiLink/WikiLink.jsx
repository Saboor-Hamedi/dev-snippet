import { useRef, useEffect, useMemo } from 'react'
import useDebounce from '../../hook/useDebounce'
import { useWikiLinks } from './useWikiLinks'

/**
 * WikiLink: Standalone component to manage WikiLink logic and State.
 * This component handles:
 * 1. Debouncing snippet metadata for stability.
 * 2. Providing stable callback proxies to the extension.
 * 3. Notifying the parent when extensions are ready/updated.
 */
const WikiLink = ({ 
  snippets, 
  onSave, 
  showToast, 
  handleNav, 
  onExtensionsReady 
}) => {
  // --- STABLE CALLBACK PROXIES ---
  const propsRef = useRef({ onSave, showToast, handleNav })
  useEffect(() => {
    propsRef.current = { onSave, showToast, handleNav }
  }, [onSave, showToast, handleNav])

  // --- METADATA MANAGEMENT ---
  const snippetMetadata = useMemo(() => {
    return (snippets || []).map(s => ({ 
      id: s.id, 
      title: s.title,
      description: s.description || '',
      tags: s.tags || []
    }))
  }, [snippets])

  // Debounce to prevent rapid extension reconfiguration
  const debouncedMetadata = useDebounce(snippetMetadata, 300)
  const metadataString = JSON.stringify(debouncedMetadata)
  const refinedSnippets = useMemo(() => debouncedMetadata, [metadataString])

  // --- EXTENSION INITIALIZATION ---
  const rawExtensions = useWikiLinks({ 
    snippets: refinedSnippets,
    handleSelectSnippet: (s) => propsRef.current.handleNav?.(s?.id || s),
    showToast: (m, o) => propsRef.current.showToast?.(m, o),
    setSelectedSnippet: (s) => propsRef.current.handleNav?.(s?.id || s), 
    navigateTo: (id) => propsRef.current.handleNav?.(id), 
    saveSnippet: (s) => propsRef.current.onSave?.(s), 
    enableAutocomplete: true,
    createDraftSnippet: (title) => {
       window.dispatchEvent(new CustomEvent('app:create-draft', { detail: { title } }))
       return { title, id: Date.now().toString(), content: '' }
    }
  })

  // Final stable array
  const extensions = useMemo(() => {
    return Array.isArray(rawExtensions) ? rawExtensions.filter(Boolean) : []
  }, [rawExtensions])

  // Notify parent
  useEffect(() => {
    if (onExtensionsReady) {
      onExtensionsReady(extensions)
    }
  }, [extensions, onExtensionsReady])

  return null // Pure logic component
}

export default WikiLink
