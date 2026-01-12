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
  dirtyIds = new Set(),
  selectedSnippet
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
     * Recursive Snippet Counter
     * Recursively calculates how many items are within a folder for the badge UI.
     * PERFORMANCE: Uses the indexed Maps for O(1) traversal.
     */
    const memoCounts = new Map()
    const getRecursiveSnippetCount = (fid, indexedF, indexedS) => {
      if (memoCounts.has(fid)) return memoCounts.get(fid)
      
      let total = (indexedS.get(fid) || []).length
      const subFolders = indexedF.get(fid) || []
      
      subFolders.forEach((f) => {
        total += getRecursiveSnippetCount(f.id, indexedF, indexedS)
      })
      
      memoCounts.set(fid, total)
      return total
    }

    /**
     * Tree Construction Logic
     * Standard recursive traversal to turn folders -> tree rows.
     * PERFORMANCE: Uses pre-indexed Maps for O(1) lookup instead of O(N) filtering.
     */
    const flatten = (
      indexedFolders,
      indexedSnippets,
      depth = 0,
      parentId = null
    ) => {
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

      // 1. Process Folders at this level (Lookup from Index)
      const levelFolders = (indexedFolders.get(parentId) || [])
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
          data: { ...folder, itemCount: getRecursiveSnippetCount(folder.id, indexedFolders, indexedSnippets) },
          depth,
          isExpanded,
          isEditing: editingId === folder.id
        })

        if (isExpanded) {
          levelResult = levelResult.concat(
            flatten(indexedFolders, indexedSnippets, depth + 1, folder.id)
          )
        }
      })

      // 2. Process Snippets at this level (Lookup from Index)
      const levelSnippets = (indexedSnippets.get(parentId) || [])
        .sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          if (a.is_draft && !b.is_draft) return -1
          if (!a.is_draft && b.is_draft) return 1
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

    // --- EXECUTION PHASE ---
    // A: Index the data for O(1) retrieval
    const indexedFolders = new Map()
    folders.forEach(f => {
      const pid = f.parent_id || null
      if (!indexedFolders.has(pid)) indexedFolders.set(pid, [])
      indexedFolders.get(pid).push(f)
    })

    const indexedSnippets = new Map()
    snippets.forEach(s => {
      const fid = s.folder_id || null
      if (!indexedSnippets.has(fid)) indexedSnippets.set(fid, [])
      indexedSnippets.get(fid).push(s)
    })

    // B: Recursively flatten using the index
    result = result.concat(flatten(indexedFolders, indexedSnippets, 0, null))

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
      const isMulti = e.shiftKey || e.ctrlKey || e.metaKey

      // SHIFT + CLICK: Range selection between last click and current click
      if (e.shiftKey && lastSelectedIdRef.current) {
        const lastIndex = treeItems.findIndex((i) => i.id === lastSelectedIdRef.current)
        const currentIndex = treeItems.findIndex((i) => i.id === id)

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex)
          const end = Math.max(lastIndex, currentIndex)
          
          // Start with existing selection if Ctrl/Cmd is held, otherwise start fresh
          newSelection = (e.ctrlKey || e.metaKey) ? [...selectedIds] : []

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
      }

      lastSelectedIdRef.current = id // Store VIRTUAL ID
      setSidebarSelected(false)

      // LOGICAL DATA SYNC:
      // If a single item is clicked (standard click), it becomes the exclusive selection.
      if (!isMulti) { 
        const item = treeItems.find((i) => i.id === id)
        const realId = item?.realId || id

        if (type === 'snippet' || type === 'pinned_snippet') {
          const snippet = snippets.find((s) => s.id === realId)
          if (snippet) onSelect(snippet)
          
          setSelectedIds([id]) // Clean exclusive selection
          setSelectedFolderId(null) // Clear folder context
        } else if (type === 'folder') {
          setSelectedFolderId(realId)
          setSelectedIds([id]) // Folder is now the specific selection
          // We don't onSelect(null) because we want to keep the editor open on the current file,
          // but the SIDEBAR will now show the folder as the active item.
        }
      } else {
        // Multi-select mode: Add/Remove from existing set
        setSelectedIds(newSelection)
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
        
        if (e.shiftKey) {
          // Range selection via keyboard
          const lastId = lastSelectedIdRef.current || treeItems[index].id
          const lastIdx = treeItems.findIndex(item => item.id === lastId)
          const start = Math.min(lastIdx, i)
          const end = Math.max(lastIdx, i)
          const newSelection = []
          for (let k = start; k <= end; k++) {
            newSelection.push(treeItems[k].id)
          }
          setSelectedIds(newSelection)
        } else {
          handleSelectionInternal(e, target.id, target.type)
        }
        
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
        case '>':
        case '.':
          e.preventDefault()
          if (item.type === 'folder') {
            const isCollapsed = item.data.collapsed === 1 || item.data.collapsed === true
            if (isCollapsed) {
              onToggleFolder(item.id, false) // Open
            } else {
              selectIndex(index + 1) // Enter first child
            }
          }
          break
        case 'ArrowLeft':
        case '<':
        case ',':
          e.preventDefault()
          const isExpanded = item.data.collapsed === 0 || item.data.collapsed === false
          if (item.type === 'folder' && isExpanded) {
            onToggleFolder(item.id, true) // Close
          } else {
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
            // Open the snippet
            onSelect(item.data)
            // VS Code behavior: Keep focus on the sidebar so you can keep navigating
            // unless the user purposefully clicks into the editor.
          }
          break
      }
    },
    [treeItems, handleSelectionInternal, listRef, inputRef, onSelect, onToggleFolder]
  )

  /**
   * 4. SELECTION SYNC
   * 
   * A: Visual Selection Sync
   * Automatically scroll to the selected item if it changes from an external source.
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
   * B: Active File Sync
   * When a snippet is opened via Welcome page, breadcrumbs, search, etc.,
   * ensure the sidebar highlights it and clears any folder focus.
   */
  React.useEffect(() => {
    if (!selectedSnippet) return
    
    // Check if the current file is already covered by the sidebar selection
    const isAlreadySelected = selectedIds.some(id => 
      id === selectedSnippet.id || id === `pinned-${selectedSnippet.id}`
    )

    if (!isAlreadySelected) {
      // Logic: If user is actively looking at a folder, don't steal focus just because
      // of a background save or small edit. But for a CHANGE in active snippet, reveal it.
      const currentSelectionIsFolder = treeItems.some(i => i.id === selectedIds[0] && i.type === 'folder')
      
      // If we don't have a selection, or if we are switching snippets, sync selection
      if (selectedIds.length === 0 || !currentSelectionIsFolder) {
        setSelectedIds([selectedSnippet.id])
        lastSelectedIdRef.current = selectedSnippet.id
      }
    }
  }, [selectedSnippet?.id]) // Only trigger on ID change (ignore content edits)

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

  /**
   * 6. ACTIVE PATH CALCULATION
   * Determines which folder ancestors of the selected item should be highlighted.
   */
  const activePath = React.useMemo(() => {
    if (selectedIds.length !== 1) return []

    const selectedId = selectedIds[0]
    const selectedItem = treeItems.find(item => item.id === selectedId)
    if (!selectedItem) return []

    const path = []
    let currentItem = selectedItem
    while (currentItem && currentItem.depth > 0) {
      // Find the parent of the current item in the treeItems array
      // A parent is an item with a depth one less than the current item, appearing before it.
      let parent = null
      for (let i = treeItems.indexOf(currentItem) - 1; i >= 0; i--) {
        if (treeItems[i].depth === currentItem.depth - 1 && treeItems[i].type === 'folder') {
          parent = treeItems[i]
          break
        }
      }

      if (parent) {
        path.unshift(parent.id) // Add parent to the beginning of the path
        currentItem = parent
      } else {
        break // No parent found, stop
      }
    }
    return path
  }, [selectedIds, treeItems])

  return {
    treeItems,
    activePath,
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

