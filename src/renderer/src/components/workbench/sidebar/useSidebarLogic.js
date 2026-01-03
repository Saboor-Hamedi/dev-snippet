import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useSidebarStore } from '../../../store/useSidebarStore'

/**
 * Custom hook to encapsulate the logic for the SnippetSidebar.
 * Handles tree flattening, selection logic, keyboard navigation, and event handlers.
 */
export const useSidebarLogic = ({
  folders,
  snippets,
  onSelect,
  // onSelectFolder, // Handled by store
  // onSelectionChange, // Handled by store
  onToggleFolder,
  inputRef,
  listRef,
  dirtyIds = new Set()
}) => {
  const { selectedIds, setSelectedIds, selectedFolderId, setSelectedFolderId, setSidebarSelected } =
    useSidebarStore()
  const lastSelectedIdRef = useRef(null)
  const [createState, setCreateState] = useState(null) // { type: 'folder'|'snippet', parentId: string|null }
  const [editingId, setEditingId] = useState(null)
  const [isPinnedCollapsed, setIsPinnedCollapsed] = useState(false)
  const togglePinned = useCallback(() => setIsPinnedCollapsed((prev) => !prev), [])

  const startRenaming = useCallback((id) => setEditingId(id), [])
  const cancelRenaming = useCallback(() => setEditingId(null), [])

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
        label: 'Pinned',
        data: { collapsed: isPinnedCollapsed }
      })

      if (!isPinnedCollapsed) {
        pinnedSnippets.forEach((snippet) => {
          result.push({
            id: `pinned-${snippet.id}`, // Unique ID for virtual row
            realId: snippet.id, // Reference to actual snippet
            type: 'pinned_snippet',
            data: snippet,
            depth: 0.5, // Subtle indent
            isEditing: editingId === snippet.id
          })
        })
      }
    }

    // 2. MAIN FOLDER TREE
    // PRE-CALCULATION: Build a map of snippet counts per folder in O(n)
    // This avoids recursive lookups inside the O(n) tree traversal.
    const folderCounts = new Map()

    // First pass: Count snippets directly in each folder
    snippets.forEach((s) => {
      const fid = s.folder_id || 'root'
      folderCounts.set(fid, (folderCounts.get(fid) || 0) + 1)
    })

    // Second pass: Propagate counts up the folder hierarchy (folders are already loaded)
    const getDeepCount = (fid) => {
      let total = folderCounts.get(fid) || 0
      const children = folders.filter(
        (f) => (f.parent_id || null) === (fid === 'root' ? null : fid)
      )
      children.forEach((c) => {
        total += getDeepCount(c.id)
      })
      return total
    }

    // MEMOIZED COUNTING:
    // We compute this once for the metadata, but we'll use a direct lookup for tree render.
    const memoCounts = new Map()
    const getRecursiveSnippetCount = (fid) => {
      if (memoCounts.has(fid)) return memoCounts.get(fid)

      // Count direct snippets
      let total = snippets.filter((s) => (s.folder_id || null) === (fid || null)).length

      // Traverse direct children
      folders.forEach((f) => {
        if ((f.parent_id || null) === (fid || null)) {
          total += getRecursiveSnippetCount(f.id)
        }
      })

      memoCounts.set(fid, total)
      return total
    }

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
          data: { ...folder, itemCount: getRecursiveSnippetCount(folder.id) },
          depth,
          isExpanded,
          isEditing: editingId === folder.id
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
          data: { ...snippet, is_dirty: dirtyIds.has(snippet.id) },
          depth,
          isEditing: editingId === snippet.id
        })
      })

      return levelResult
    }

    result = result.concat(flatten(folders, snippets, 0, null))

    // 3. SIDEBAR FOOTER (Dead Space for Root Interaction)
    // This allows users to click at the bottom of a long list to deselect/target root.
    result.push({
      id: 'SIDEBAR_FOOTER_SPACER',
      type: 'sidebar_footer',
      depth: 0,
      data: {}
    })

    return result
  }, [snippets, folders, createState, selectedFolderId, isPinnedCollapsed, dirtyIds, editingId])

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
          setSelectedFolderId(targetId)
        }
      }

      lastSelectedIdRef.current = id // Store the VIRTUAL id for range navigation
      setSelectedIds(newSelection)
      setSidebarSelected(false)

      // Handle Single Selection Specifics
      if (newSelection.length === 1) {
        const targetId = newSelection[0]
        if (type === 'snippet' || type === 'pinned_snippet') {
          const snippet = snippets.find((s) => s.id === targetId)
          if (snippet) {
            onSelect(snippet)
            setSelectedFolderId(null) // Ensure folder is unselected
          }
        } else {
          setSelectedFolderId(targetId)
          onSelect(null) // Ensure snippet is unselected
        }
      }
    },
    [
      treeItems,
      selectedIds,
      setSelectedIds,
      onSelect,
      setSelectedFolderId,
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
        setSelectedIds([])
        onSelect(null) // Clear snippet
        setSelectedFolderId(null) // Clear folder selection -> target ROOT
        lastSelectedIdRef.current = null
        setSidebarSelected(true)
      }
    },
    [setSelectedIds, onSelect, setSelectedFolderId, setSidebarSelected]
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
    confirmCreation,
    togglePinned,
    collapseAll: useCallback(() => {
      folders.forEach((f) => {
        if (f.collapsed === 0 || f.collapsed === false) {
          onToggleFolder(f.id, true)
        }
      })
    }, [folders, onToggleFolder]),
    editingId,
    startRenaming,
    cancelRenaming
  }
}
