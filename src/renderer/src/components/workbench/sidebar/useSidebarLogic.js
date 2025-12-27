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
  onSelect,
  onSelectFolder,
  onSelectionChange,
  onToggleFolder,
  inputRef,
  listRef,
  setSidebarSelected
}) => {
  const lastSelectedIdRef = useRef(null)
  const [createState, setCreateState] = useState(null) // { type: 'folder'|'snippet', parentId: string|null }

  // 1. Flatten Tree Logic
  // This is a pure function that runs only when data changes.
  const treeItems = useMemo(() => {
    // Always show the full tree from root
    let result = []

    // 1. PINNED SECTION (Top Level)
    const pinnedSnippets = snippets
      .filter((s) => s.is_pinned === 1)
      .sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
      )

    if (pinnedSnippets.length > 0) {
      result.push({
        id: 'PINNED_HEADER',
        type: 'pinned_header',
        depth: 0,
        label: 'Pinned'
      })
      pinnedSnippets.forEach((snippet) => {
        result.push({
          id: `pinned-${snippet.id}`, // Unique ID for virtual row
          realId: snippet.id, // Reference to actual snippet
          type: 'pinned_snippet',
          data: snippet,
          depth: 0.5 // Subtle indent
        })
      })

      // Add a subtle spacer after the pinned section
      result.push({
        id: 'SECTION_SPACER',
        type: 'section_spacer',
        depth: 0
      })
    }

    // 2. MAIN FOLDER TREE
    const flatten = (currentFolders, currentSnippets, depth = 0, parentId = null) => {
      let levelResult = []

      // INJECTION POINT: Input Row (Top of the level)
      if (createState && (createState.parentId || null) == (parentId || null)) {
        levelResult.push({
          id: 'TEMP_CREATION_INPUT',
          type: 'creation_input',
          depth,
          data: { type: createState.type, parentId }
        })
      }

      // Folders
      const levelFolders = currentFolders
        .filter((f) => (f.parent_id || null) == (parentId || null))
        .sort((a, b) => {
          if (a.name === '📥 Inbox') return -1
          if (b.name === '📥 Inbox') return 1
          return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
        })

      levelFolders.forEach((folder) => {
        const isExpanded = folder.collapsed === 0 || folder.collapsed === false
        levelResult.push({
          id: folder.id,
          type: 'folder',
          data: folder,
          depth,
          isExpanded
        })

        if (isExpanded) {
          levelResult = levelResult.concat(
            flatten(currentFolders, currentSnippets, depth + 1, folder.id)
          )
        }
      })

      // Snippets
      const levelSnippets = currentSnippets
        .filter((s) => (s.folder_id || null) == (parentId || null))
        .sort((a, b) => {
          // Priority 1: Pinned
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1

          // Priority 2: Drafts
          if (a.is_draft && !b.is_draft) return -1
          if (!a.is_draft && b.is_draft) return 1

          // Fallback: Title
          return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
        })

      levelSnippets.forEach((snippet) => {
        levelResult.push({
          id: snippet.id,
          type: 'snippet',
          data: snippet,
          depth
        })
      })

      return levelResult
    }

    result = result.concat(flatten(folders, snippets, 0, null))

    return result
  }, [snippets, folders, createState, selectedFolderId])

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
            const row = treeItems[i]
            const targetId = row.realId || row.id
            if (!newSelection.includes(targetId)) newSelection.push(targetId)
          }
        }
      }
      // CTRL/CMD + CLICK (Toggle Selection)
      else if (e.ctrlKey || e.metaKey) {
        const item = treeItems.find((i) => i.id === id)
        const targetId = item?.realId || id
        newSelection = selectedIds.includes(targetId)
          ? selectedIds.filter((sid) => sid !== targetId)
          : [...selectedIds, targetId]
      }
      // SINGLE CLICK (Reset Selection)
      else {
        const item = treeItems.find((i) => i.id === id)
        const targetId = item?.realId || id

        newSelection = [targetId]
        if (type === 'snippet' || type === 'pinned_snippet') {
          const snippet = snippets.find((s) => s.id === targetId)
          if (snippet) onSelect(snippet)
        } else {
          onSelectFolder(targetId)
        }
      }

      lastSelectedIdRef.current = id // Store the VIRTUAL id for range navigation
      onSelectionChange(newSelection)
      setSidebarSelected(false)
    },
    [
      treeItems,
      selectedIds,
      onSelectionChange,
      onSelect,
      onSelectFolder,
      snippets,
      setSidebarSelected
    ]
  )

  // 3. Keyboard Navigation Logic
  // Handles Arrow Keys and Enter
  // 3. Keyboard Navigation Logic
  // Handles Arrow Keys (Tree Traversal) and Enter
  const handleItemKeyDown = useCallback(
    (e, index) => {
      const item = treeItems[index]
      if (!item) return

      // Helper to select an item by index
      const selectIndex = (i) => {
        if (i < 0 || i >= treeItems.length) return
        const target = treeItems[i]
        // Pass fake event to avoid modifier logic during simple nav, OR keep it?
        // Usually arrow navigation resets selection unless Shift is held.
        // handleSelectionInternal uses e.shiftKey.
        handleSelectionInternal(e, target.id, target.type)
        listRef.current?.scrollToItem(i)
        setTimeout(() => {
          const el = document.getElementById(`sidebar-item-${i}`)
          if (el) el.focus()
        }, 10)
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          selectIndex(index + 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          if (index === 0) {
            inputRef.current?.focus()
          } else {
            selectIndex(index - 1)
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (item.type === 'folder') {
            if (item.data.collapsed) {
              onToggleFolder(item.id, false) // Expand
            } else {
              selectIndex(index + 1) // Focus first child
            }
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (item.type === 'folder' && !item.data.collapsed) {
            onToggleFolder(item.id, true) // Collapse
          } else {
            // Jump to Parent
            if (item.depth > 0) {
              let parentIndex = -1
              for (let i = index - 1; i >= 0; i--) {
                if (treeItems[i].depth < item.depth) {
                  parentIndex = i
                  break
                }
              }
              if (parentIndex !== -1) selectIndex(parentIndex)
            }
          }
          break
        case 'Enter':
          e.preventDefault()
          if (item.type === 'folder') {
            onToggleFolder(item.id, !item.data.collapsed)
          } else {
            onSelect(item.data)
          }
          break
      }
    },
    [treeItems, handleSelectionInternal, listRef, inputRef, onSelect, onToggleFolder]
  )

  // 4. Auto-scroll to selected item when selection changes externally
  React.useEffect(() => {
    if (selectedIds.length === 1 && listRef.current) {
      const selectedId = selectedIds[0]
      const itemIndex = treeItems.findIndex((item) => item.id === selectedId)
      if (itemIndex !== -1) {
        listRef.current.scrollToItem(itemIndex)
      }
    }
  }, [selectedIds, treeItems])

  // 5. Semantic Selection Recovery (Collapse -> Select Parent)
  React.useEffect(() => {
    // If we have a selection that is NOT in the treeItems (visible),
    // visual focus is lost. We should select the parent folder.
    if (selectedIds.length === 1) {
      const selectedId = selectedIds[0]
      const isVisible = treeItems.some((i) => i.id === selectedId)

      if (!isVisible) {
        // Find the item in raw data to get parent
        const snippet = snippets.find((s) => s.id === selectedId)
        const folder = folders.find((f) => f.id === selectedId)
        const parentId = snippet ? snippet.folder_id : folder ? folder.parent_id : null

        if (parentId) {
          // Select the parent folder
          // Check if parent is visible? It should be if we just collapsed it.
          handleSelectionInternal({ shiftKey: false, ctrlKey: false }, parentId, 'folder')
        } else {
          // Verify if we are at root? If hidden at root (impossible usually unless filtered), do nothing.
        }
      }
    }
  }, [treeItems, selectedIds, snippets, folders, handleSelectionInternal])

  // 5. Background Click Handler
  const handleBackgroundClick = useCallback(
    (e) => {
      // Only if we clicked directly on the container (virtual list container)
      if (e.target === e.currentTarget || e.target.classList.contains('virtual-list-container')) {
        onSelectionChange([])
        onSelect(null) // Clear snippet
        onSelectFolder(null) // Clear folder selection -> target ROOT
        lastSelectedIdRef.current = null
        setSidebarSelected(true)
      }
    },
    [onSelectionChange, onSelect, onSelectFolder, setSidebarSelected]
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
