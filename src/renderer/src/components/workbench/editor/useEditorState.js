import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * useEditorState - Manages the core editor state (code, title, tags, dirty tracking)
 * 
 * This hook centralizes all state management for the snippet editor, including:
 * - Code content and dirty state tracking
 * - Title and tags management
 * - Duplicate detection
 * - Initial state synchronization
 */
export const useEditorState = ({ initialSnippet, snippets, onDirtyStateChange }) => {
  const [code, setCode] = useState(initialSnippet?.code || '')
  const [isDirty, setIsDirty] = useState(false)
  const isDiscardingRef = useRef(false)
  const skipAutosaveRef = useRef(false)

  // PERFORMANCE: Ref to block redundant dirty updates during rapid typing
  const isDirtyRef = useRef(false)
  useEffect(() => {
    isDirtyRef.current = isDirty
  }, [isDirty])

  const codeRef = useRef(initialSnippet?.code || '')

  const handleCodeChange = useCallback(
    (val) => {
      if (isDiscardingRef.current) return
      const newVal = val || ''
      if (newVal !== codeRef.current) {
        codeRef.current = newVal
        setCode(newVal)

        // Only broadcast if not already known as dirty (prevents sidebar sway/lag)
        if (!isDirtyRef.current) {
          setIsDirty(true)
          isDirtyRef.current = true // Block subsequent broadcasts

          if (initialSnippet?.id && onDirtyStateChange) {
            onDirtyStateChange(initialSnippet.id, true)
          }
        }
      }
    },
    [initialSnippet, onDirtyStateChange]
  )

  const [title, setTitle] = useState(() => {
    const t = initialSnippet?.title || ''
    return t.replace(/\.md$/i, '')
  })

  // Tags state: Managed as an array for the chip system
  const [tags, setTags] = useState(() => {
    const rawTags = initialSnippet?.tags || []
    return Array.isArray(rawTags) ? rawTags : []
  })

  const [currentTagInput, setCurrentTagInput] = useState('')

  // Detect duplicate titles
  const isDuplicate = (() => {
    if (!title) return false
    const normalized = title.trim().toLowerCase()
    return (snippets || []).some((s) => {
      // Skip self
      if (s.id === initialSnippet?.id) return false
      // Match folder scope (null/undefined treated as root)
      if ((s.folder_id || null) !== (initialSnippet?.folder_id || null)) return false

      const sTitle = (s.title || '').replace(/\.md$/i, '').trim().toLowerCase()
      return sTitle === normalized
    })
  })()

  // Sync state when snippet changes
  const lastSnippetId = useRef(initialSnippet?.id)
  useEffect(() => {
    if (!initialSnippet) return
    if (initialSnippet.id !== lastSnippetId.current) {
      setCode(initialSnippet.code || '')
      setTitle(initialSnippet.title || '')
      const rawTags = initialSnippet.tags
      let sanitizedTags = []
      if (Array.isArray(rawTags)) {
        sanitizedTags = rawTags
      } else if (typeof rawTags === 'string') {
        sanitizedTags = rawTags.split(',').filter(Boolean)
      }
      setTags(sanitizedTags.map((t) => String(t)))
      setCurrentTagInput('')
      setIsDirty(false)
      isDiscardingRef.current = false
      skipAutosaveRef.current = false
      lastSnippetId.current = initialSnippet.id
      return
    }
    if (initialSnippet.code !== undefined && code === '') {
      setCode(initialSnippet.code || '')
    }
  }, [initialSnippet])

  return {
    code,
    setCode,
    handleCodeChange,
    codeRef,
    isDirty,
    setIsDirty,
    isDirtyRef,
    isDiscardingRef,
    skipAutosaveRef,
    title,
    setTitle,
    tags,
    setTags,
    currentTagInput,
    setCurrentTagInput,
    isDuplicate
  }
}
