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
  const lastBroadcastedTitleRef = useRef('') // GUARD: Prevent recursive title sync loops

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
  const userHasManuallyNamed = useRef(false)

  useEffect(() => {
    if (!initialSnippet) return
    if (initialSnippet.id !== lastSnippetId.current) {
      const t = initialSnippet.title || 'Untitled'
      const cleanTitle = t.replace(/\.md$/i, '')
      setTitle(cleanTitle)
      lastBroadcastedTitleRef.current = cleanTitle
      
      const rawTags = initialSnippet.tags
      let sanitizedTags = []
      if (Array.isArray(rawTags)) {
        sanitizedTags = rawTags
      } else if (typeof rawTags === 'string') {
        sanitizedTags = rawTags.split(',').filter(Boolean)
      }
      setTags(sanitizedTags.map((t) => String(t)))
      
      setCode(initialSnippet.code || '')
      setCurrentTagInput('')
      setIsDirty(false)
      isDiscardingRef.current = false
      skipAutosaveRef.current = false
      lastSnippetId.current = initialSnippet.id
      userHasManuallyNamed.current = false
      return
    }
    // Deep sync code if it matches the current id but code is empty (newly loaded/switched)
    if (initialSnippet.code !== undefined && code === '') {
      setCode(initialSnippet.code || '')
    }
  }, [initialSnippet, code])

  // --- EXTERNAL METADATA SYNC ---
  // Sync title and tags if initialSnippet (prop) changes while ID is same (e.g. after Save/Rename)
  useEffect(() => {
    if (!initialSnippet || !lastSnippetId.current || initialSnippet.id !== lastSnippetId.current) return

    const extTitle = (initialSnippet.title || '').replace(/\.md$/i, '').trim()
    const internalTitle = (title || '').trim()

    // Logic for title sync
    if (extTitle && extTitle !== internalTitle) {
      setTitle(extTitle)
      lastBroadcastedTitleRef.current = extTitle
    }

    // Logic for tags sync
    const extTagsStr = JSON.stringify(initialSnippet.tags || [])
    const intTagsStr = JSON.stringify(tags || [])
    if (extTagsStr !== intTagsStr) {
      setTags(initialSnippet.tags || [])
    }
  }, [initialSnippet?.title, initialSnippet?.tags])

  // --- SMART NAMING ENGINE ---
  // Restores the feature where the first line of a new snippet becomes its title (up to 40 chars)
  useEffect(() => {
    // Only auto-name if it's a new draft AND the user hasn't manually typed a title
    if (!initialSnippet?.is_draft || userHasManuallyNamed.current) return

    const trimmedCode = (code || '').trim()
    if (!trimmedCode) {
      // If code is cleared and user hasn't named it, reset to Untitled
      if (title !== 'Untitled' && !userHasManuallyNamed.current) {
        setTitle('Untitled')
      }
      return
    }

    // Extract first line and strip markdown headers
    let firstLine = trimmedCode.split('\n')[0].trim()
    firstLine = firstLine.replace(/^#+\s*/, '') // Remove #, ##, etc.
    
    if (firstLine) {
      const smartTitle = firstLine.substring(0, 40).trim()
      if (smartTitle && smartTitle !== title) {
        // CRITICAL: Call the RAW state setter to avoid setting userHasManuallyNamed flag
        setTitle(smartTitle)
        
        // --- LIVE SYNC BROADCAST ---
        // Only broadcast if it's a real change and NOT what we already sent to avoid recursion
        if (smartTitle !== lastBroadcastedTitleRef.current) {
          lastBroadcastedTitleRef.current = smartTitle
          window.dispatchEvent(
            new CustomEvent('app:draft-title-updated', {
              detail: { id: initialSnippet?.id, title: smartTitle }
            })
          )
        }
      }
    }
  }, [code, initialSnippet?.is_draft, title, initialSnippet?.id])

  const titleDebounceRef = useRef(null)

  const handleManualTitleChange = useCallback((val) => {
    userHasManuallyNamed.current = true
    setTitle(val) // Immediate local update
    
    // Debounce the global broadcast to prevent double-rendering (Local + Parent)
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current)
    
    titleDebounceRef.current = setTimeout(() => {
      if (val !== lastBroadcastedTitleRef.current) {
        lastBroadcastedTitleRef.current = val
        window.dispatchEvent(
          new CustomEvent('app:draft-title-updated', {
            detail: { id: initialSnippet?.id, title: val }
          })
        )
      }
    }, 50)
  }, [setTitle, initialSnippet?.id])

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
    setTitle: handleManualTitleChange, // Use the wrapped version
    tags,
    setTags,
    currentTagInput,
    setCurrentTagInput,
    isDuplicate
  }
}
