import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useSidebarStore } from '../../../store/useSidebarStore'

/**
 * useSidebarLogic 
 * 
 * The central engine for the SnippetSidebar. This hook manages:
 * - Tree Geometry: Translating nested folders/snippets into a flat array for VirtualList.
 * - Selection State: Handling complex multi-select, range-select, and focus rules.
 * - Keyboard UX: VS-Code style arrow navigation and nested folder manipulation.
 * - Inline Editing: Managing creation and renaming states without jumping focus.
 */
export const useSidebarLogic = ({
  folders,
  snippets,
  onSelect,
  onToggleFolder,
  inputRef,
  listRef,
  dirtyIds = new Set()
}) => {
  const {
    selectedIds,
    setSelectedIds,
    selectedFolderId,
    setSelectedFolderId,
    setSidebarSelected,
    searchQuery,
    editingId,
    setEditingId
  } = useSidebarStore()
  
  // Track the last clicked VIRTUAL id for Shift+Click range logic
  const lastSelectedIdRef = useRef(null)
  
  // Temporary states for creation/editing UI rows
  const [createState, setCreateState] = useState(null) // { type: 'folder'|'snippet', parentId: string|null }
  
  // Internal state for the "Pinned" section visibility
  const [isPinnedCollapsed, setIsPinnedCollapsed] = useState(false)
  const togglePinned = useCallback(() => setIsPinnedCollapsed((prev) => !prev), [])

  const startRenaming = useCallback((id) => setEditingId(id), [])
  const cancelRenaming = useCallback(() => setEditingId(null), [])

  /**
   * 1. TREE FLATTENING (The Virtual List Bridge)
   * 
   * React-Window / VirtualList requires a flat array. We transform the 
   * hierarchical folder/snippet data into a single array of 'treeItems'.
   */
  const treeItems = useMemo(() => {
    // --- 🔍 SEARCH MODE: Flat list view ---
    if (searchQuery && searchQuery.trim()) {
      return snippets.map((snippet) => ({
        id: snippet.id, // During search, ID is real ID (no duplicates possible)
        type: 'snippet',
        data: { ...snippet, is_dirty: dirtyIds.has(snippet.id) },
        depth: 0,
        isEditing: editingId === snippet.id
      }))
    }

    let result = []

    // --- 📌 PINNED SECTION (Top Level) ---
    const pinnedSnippets = snippets
      .filter((s) => s.is_pinned === 1)
      .sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
      )

    if (pinnedSnippets.length > 0) {
      // Add a header row for the Pinned category
      result.push({
        id: 'PINNED_HEADER',
        type: 'pinned_header',
        depth: 0,
        label: 'Pinned',
        data: { collapsed: isPinnedCollapsed }
      })

      if (!isPinnedCollapsed) {
        // Add pinned rows with VIRTUAL IDs to avoid key collisions with the main tree
        pinnedSnippets.forEach((snippet) => {
          result.push({
            id: `pinned-${snippet.id}`, // VIRTUAL ID: Prevents double-highlight and key conflicts
            realId: snippet.id,         // Pointer to actual database ID
            type: 'pinned_snippet',
            data: { ...snippet, is_dirty: dirtyIds.has(snippet.id) },
            depth: 0.5,
            isEditing: editingId === `pinned-${snippet.id}` // Check virtual ID
          })
        })
      }
    }

    // --- 📁 MAIN FOLDER TREE ---
    
    /**
     * Recursive Snipet Counter
     * Recursively calculates how many items are within a folder for the badge UI.
     */
    const memoCounts = new Map()
    const getRecursiveSnippetCount = (fid) => {
      if (memoCounts.has(fid)) return memoCounts.get(fid)
      let total = snippets.filter((s) => (s.folder_id || null) === (fid || null)).length
      folders.forEach((f) => {
        if ((f.parent_id || null) === (fid || null)) {
          total += getRecursiveSnippetCount(f.id)
        }
      })
      memoCounts.set(fid, total)
      return total
    }

    /**
     * Flattening Core
     * Standard recursive traversal to turn folders -> tree rows.
     */
    const flatten = (currentFolders, currentSnippets, depth = 0, parentId = null) => {
      let levelResult = []

      // INJECTION POINT: Dynamic Creation Input Row
      if (createState && (createState.parentId || null) == (parentId || null)) {
        levelResult.push({
          id: 'TEMP_CREATION_INPUT',
          type: 'creation_input',
          depth,
          data: { type: createState.type, parentId }
        })
      }

      // Process Folders
      const levelFolders = currentFolders
        .filter((f) => (f.parent_id || null) == (parentId || null))
        .sort((a, b) => {
          // Keep 'Inbox' at the very top of its level
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

      // Process Snippets
      const levelSnippets = currentSnippets
        .filter((s) => (s.folder_id || null) == (parentId || null))
        .sort((a, b) => {
          // Sort Order: Pinned Items -> Drafts -> Alphabetical
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          if (a.is_draft && !b.is_draft) return -1
          if (!a.is_draft && b.is_draft) return 1
          return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
        })

      levelSnippets.forEach((snippet) => {
        levelResult.push({
          id: snippet.id, // Regular snippets use their real ID as the virtual ID
          type: 'snippet',
          data: { ...snippet, is_dirty: dirtyIds.has(snippet.id) },
          depth,
          isEditing: editingId === snippet.id
        })
      })

      return levelResult
    }

    // Initialize root-level flattening
    result = result.concat(flatten(folders, snippets, 0, null))

    // --- 🦶 SIDEBAR FOOTER ---
    // Invisible interactive space at the bottom to allow root-level clicks.
    result.push({
      id: 'SIDEBAR_FOOTER_SPACER',
      type: 'sidebar_footer',
      depth: 0,
      data: {}
    })

    return result
  }, [snippets, folders, createState, selectedFolderId, isPinnedCollapsed, dirtyIds, editingId, searchQuery])

  /**
   * 2. SELECTION ENGINE
   * 
   * Orchestrates multi-selection, virtual highlighting, and data linkage.
   * FIX: Now stores VIRTUAL IDs to prevent the "Double Highlight" bug for pinned items.
   */
  const handleSelectionInternal = useCallback(
    (e, id, type) => {
      let newSelection = []

      // SHIFT + CLICK: Range selection between last click and current click
      if (e.shiftKey && lastSelectedIdRef.current) {
        const lastIndex = treeItems.findIndex((i) => i.id === lastSelectedIdRef.current)
        const currentIndex = treeItems.findIndex((i) => i.id === id)

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex)
          const end = Math.max(lastIndex, currentIndex)
          newSelection = [...selectedIds]

          for (let i = start; i <= end; i++) {
            const rowId = treeItems[i].id
            if (!newSelection.includes(rowId)) newSelection.push(rowId)
          }
        }
      }
      // CTRL / CMD + CLICK: Individual toggle
      else if (e.ctrlKey || e.metaKey) {
        newSelection = selectedIds.includes(id)
          ? selectedIds.filter((sid) => sid !== id)
          : [...selectedIds, id]
      }
      // STANDARD CLICK: Exclusive selection
      else {
        newSelection = [id]
        
        // Link logical selection to actual data
        const item = treeItems.find((i) => i.id === id)
        const realId = item?.realId || id

        if (type === 'snippet' || type === 'pinned_snippet') {
          const snippet = snippets.find((s) => s.id === realId)
          if (snippet) onSelect(snippet)
          setSelectedFolderId(null)
        } else if (type === 'folder') {
          setSelectedFolderId(realId)
          onSelect(null)
        }
      }

      lastSelectedIdRef.current = id // Store VIRTUAL ID
      setSelectedIds(newSelection)   // Store VIRTUAL ID for visual rows
      setSidebarSelected(false)

      // Sync logical data for single selections
      if (newSelection.length === 1) {
        const virtualId = newSelection[0]
        const item = treeItems.find((i) => i.id === virtualId)
        const realId = item?.realId || virtualId

        if (type === 'snippet' || type === 'pinned_snippet') {
          const snippet = snippets.find((s) => s.id === realId)
          if (snippet) {
            onSelect(snippet)
            setSelectedFolderId(null)
          }
        } else if (type === 'folder') {
          setSelectedFolderId(realId)
          onSelect(null)
        }
      }
    },
    [treeItems, selectedIds, setSelectedIds, onSelect, setSelectedFolderId, snippets, setSidebarSelected]
  )

  /**
   * 3. KEYBOARD ENGINE
   * 
   * Provides full accessibility and power-user navigation (Arrows + Enter).
   */
  const handleItemKeyDown = useCallback(
    (e, index) => {
      const item = treeItems[index]
      if (!item) return

      const selectIndex = (i) => {
        if (i < 0 || i >= treeItems.length) return
        const target = treeItems[i]
        handleSelectionInternal(e, target.id, target.type)
        listRef.current?.scrollToItem(i)
        
        // Ensure browser focus follows selection for screen readers and tab sync
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
              onToggleFolder(item.id, false) // Open
            } else {
              selectIndex(index + 1) // Enter first child
            }
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (item.type === 'folder' && !item.data.collapsed) {
            onToggleFolder(item.id, true) // Close
          } else if (item.depth > 0) {
            // Jump focus to parent folder
            let parentIndex = -1
            for (let i = index - 1; i >= 0; i--) {
              if (treeItems[i].depth < item.depth) {
                parentIndex = i
                break
              }
            }
            if (parentIndex !== -1) selectIndex(parentIndex)
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

  /**
   * 4. SELECTION SYNC
   * 
   * Automatically scroll to the selected item if it changes from an external source 
   * (e.g. Cmd+F search or "Daily Note" command).
   */
  React.useEffect(() => {
    if (selectedIds.length === 1 && listRef.current) {
      const selectedId = selectedIds[0]
      const itemIndex = treeItems.findIndex((item) => item.id === selectedId)
      if (itemIndex !== -1) {
        listRef.current.scrollToItem(itemIndex)
      }
    }
  }, [selectedIds, treeItems])

  /**
   * 5. SMART FOCUS RECOVERY
   * 
   * If a folder is collapsed, and its child was selected, the selection 
   * should jump up to the folder itself rather than vanishing.
   */
  React.useEffect(() => {
    if (searchQuery && searchQuery.trim()) return
    if (selectedIds.length === 1) {
      const virtualId = selectedIds[0]
      const isVisible = treeItems.some((i) => i.id === virtualId)

      if (!isVisible) {
        const realId = virtualId.replace(/^pinned-/, '')
        const snippet = snippets.find((s) => s.id === realId)
        const folder = folders.find((f) => f.id === realId)
        const parentId = snippet ? snippet.folder_id : folder ? folder.parent_id : null

        if (parentId) {
          handleSelectionInternal({ shiftKey: false, ctrlKey: false }, parentId, 'folder')
        }
      }
    }
  }, [treeItems, selectedIds, snippets, folders, handleSelectionInternal, searchQuery])

  return {
    treeItems,
    lastSelectedIdRef,
    handleSelectionInternal,
    handleItemKeyDown,
    createState,
    startCreation: useCallback((type, parentId) => {
      setCreateState({ type, parentId })
      setEditingId(null) // Close any rename input
      
      // Auto-scroll to the creation input position
      // This is tricky because the item only exists AFTER the state update.
      // We rely on the VirtualList's nature and usually creators want to see it.
    }, []),
    cancelCreation: useCallback(() => setCreateState(null), []),
    confirmCreation: useCallback(() => setCreateState(null), []),
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

