import React, { useState, useMemo, useCallback, useRef } from 'react'

/**
 * Custom hook to encapsulate the logic for the SnippetSidebar.
 * Handles tree flattening, selection logic, keyboard navigation, and event handlers.
 */
export const useSidebarLogic = ({
  folders,
  snippets,
  selectedIds,
  selectedFolderId,
  selectedSnippet,
  onSelect,
  onSelectFolder,
  onSelectionChange,
  onToggleFolder,
  inputRef,
  listRef
}) => {
  const lastSelectedIdRef = useRef(null)
  const [createState, setCreateState] = useState(null) // { type: 'folder'|'snippet', parentId: string|null }

  // 1. Flatten Tree Logic
  // This is a pure function that runs only when data changes.
  const treeItems = useMemo(() => {
    const flatten = (currentFolders, currentSnippets, depth = 0, parentId = null) => {
      let result = []

      // INJECTION POINT: Input Row (Top of the level)
      if (createState && (createState.parentId || null) == (parentId || null)) {
        result.push({
          id: 'TEMP_CREATION_INPUT',
          type: 'creation_input',
          depth,
          data: { type: createState.type, parentId }
        })
      }

      // Folders
      const levelFolders = currentFolders
        .filter((f) => (f.parent_id || null) == (parentId || null))
        .sort((a, b) =>
          (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
        )

      levelFolders.forEach((folder) => {
        const isExpanded = folder.collapsed === 0 || folder.collapsed === false
        result.push({
          id: folder.id,
          type: 'folder',
          data: folder,
          depth,
          isExpanded
        })

        if (isExpanded) {
          result = result.concat(flatten(currentFolders, currentSnippets, depth + 1, folder.id))
        }
      })

      // Snippets
      const levelSnippets = currentSnippets
        .filter((s) => (s.folder_id || null) == (parentId || null))
        .sort((a, b) => {
          if (a.is_draft && !b.is_draft) return -1
          if (!a.is_draft && b.is_draft) return 1
          return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
        })

      levelSnippets.forEach((snippet) => {
        result.push({
          id: snippet.id,
          type: 'snippet',
          data: snippet,
          depth
        })
      })

      return result
    }

    return flatten(folders, snippets)
  }, [snippets, folders, createState])

  const startCreation = useCallback(
    (type, parentId = null) => {
      setCreateState({ type, parentId })
      // Ensure the folder is expanded if we are creating inside it
      if (parentId && onToggleFolder) {
        const parent = folders.find((f) => f.id === parentId)
        if (parent && parent.collapsed) {
          onToggleFolder(parentId, false) // Expand
        }
      }
    },
    [folders, onToggleFolder]
  )

  const cancelCreation = useCallback(() => {
    setCreateState(null)
  }, [])

  const confirmCreation = useCallback(() => {
    setCreateState(null)
  }, [])

  // 2. Selection Logic
  // Handles Single, Multi (Ctrl), and Range (Shift) Selection
  const handleSelectionInternal = useCallback(
    (e, id, type) => {
      let newSelection = []

      // SHIFT + CLICK (Range Selection)
      if (e.shiftKey && lastSelectedIdRef.current) {
        const lastIndex = treeItems.findIndex((i) => i.id === lastSelectedIdRef.current)
        const currentIndex = treeItems.findIndex((i) => i.id === id)

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex)
          const end = Math.max(lastIndex, currentIndex)
          newSelection = [...selectedIds]

          for (let i = start; i <= end; i++) {
            const itemId = treeItems[i].id
            if (!newSelection.includes(itemId)) newSelection.push(itemId)
          }
        }
      }
      // CTRL/CMD + CLICK (Toggle Selection)
      else if (e.ctrlKey || e.metaKey) {
        newSelection = selectedIds.includes(id)
          ? selectedIds.filter((sid) => sid !== id)
          : [...selectedIds, id]
      }
      // SINGLE CLICK (Reset Selection)
      else {
        newSelection = [id]
        if (type === 'snippet') {
          const snippet = snippets.find((s) => s.id === id)
          if (snippet) onSelect(snippet)
        } else {
          onSelectFolder(id)
        }
      }

      lastSelectedIdRef.current = id
      onSelectionChange(newSelection)
    },
    [treeItems, selectedIds, onSelectionChange, onSelect, onSelectFolder, snippets]
  )

  // 3. Keyboard Navigation Logic
  // Handles Arrow Keys and Enter
  const handleItemKeyDown = useCallback(
    (e, index) => {
      if (e.key === 'ArrowDown' && index < treeItems.length - 1) {
        e.preventDefault()
        const next = treeItems[index + 1]
        handleSelectionInternal(e, next.id, next.type) // Pass the event for modifier keys support!
        listRef.current?.scrollToItem(index + 1)

        // Small timeout to allow render
        setTimeout(() => {
          const el = document.getElementById(`sidebar-item-${index + 1}`)
          if (el) el.focus()
        }, 10)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (index === 0) {
          // If at top, focus search input
          if (inputRef.current) inputRef.current.focus()
        } else {
          const prev = treeItems[index - 1]
          handleSelectionInternal(e, prev.id, prev.type)
          listRef.current?.scrollToItem(index - 1)
          setTimeout(() => {
            const el = document.getElementById(`sidebar-item-${index - 1}`)
            if (el) el.focus()
          }, 10)
        }
      } else if (e.key === 'Enter') {
        const item = treeItems[index]
        if (item.type === 'folder') {
          onToggleFolder(item.id, !item.data.collapsed)
        } else {
          onSelect(item.data)
        }
      }
    },
    [treeItems, handleSelectionInternal, listRef, inputRef, onSelect, onToggleFolder]
  )

  // 4. Background Click Handler
  // Deselects everything when clicking empty space
  const handleBackgroundClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onSelectionChange([])
        lastSelectedIdRef.current = null
      }
    },
    [onSelectionChange]
  )

  return {
    treeItems,
    lastSelectedIdRef,
    handleSelectionInternal,
    handleItemKeyDown,
    handleBackgroundClick,
    createState,
    startCreation,
    cancelCreation,
    confirmCreation
  }
}
