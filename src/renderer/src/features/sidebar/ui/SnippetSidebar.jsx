import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import {
  Search,
  Trash2,
  Edit2,
  FilePlus,
  FolderPlus,
  ChevronsUp,
  Plus,
  RefreshCw,
  Inbox,
  Pin, 
  Star
} from 'lucide-react'
import {
  SidebarPane,
  SidebarHeader as PaneHeader,
  SidebarBody
} from './SidebarPane'
import VirtualList from './VirtualList'
import ContextMenu from './ContextMenu'
import SnippetSidebarRow from './SnippetSidebarRow'
import { useSidebarLogic } from '../hooks/useSidebarLogic'
import { useSidebarStore } from '../store/useSidebarStore'
import './SnippetSidebar.css'

// Constant for differentiating virtual UI rows from real data rows
const VIRTUAL_ID_PREFIX = 'pinned-'

/**
 * SnippetSidebar
 *
 * The primary navigation and management interface for the library.
 * It coordinates with useSidebarLogic to render a high-performance tree
 * that supports thousands of items via virtualization and pure JS event handling.
 *
 * Aesthetic: Industrial UI - Clean lines, high-density, sharp contrasts.
 */
const SnippetSidebar = ({
  snippets,
  folders = [],
  selectedSnippet,
  onSelect,
  onNew,
  onNewFolder,
  onSearch,
  onToggleFolder,
  onMoveSnippet,
  onMoveFolder,
  onRenameSnippet,
  onRenameFolder,
  onDeleteFolder,
  onDeleteSnippet,
  onDeleteBulk,
  onTogglePin,
  onToggleFavorite,
  isOpen,
  onToggle,
  isCompact = false,
  showToast,
  onCopy,
  onCut,
  onPaste,
  onSelectAll,
  onDailyNote,
  dirtyIds,
  onInlineRename,
  isSearching
}) => {
  // Global Sidebar State (Zustand)
  const {
    searchQuery,
    setSearchQuery,
    selectedFolderId,
    setSelectedFolderId,
    selectedIds,
    setSelectedIds,
    isSidebarSelected,
    setSidebarSelected
  } = useSidebarStore()

  // --- Local UI State ---
  const [filter, setFilter] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // DOM References
  const inputRef = React.useRef(null)
  const listRef = React.useRef(null)
  const parentRef = React.useRef(null)

  // System Context
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  /**
   * Selection Helper
   * Utility to translate VIRTUAL UI IDs (e.g. 'pinned-123') back to DATABASE IDs ('123').
   */
  const resolveRealIds = (ids) => {
    if (!ids) return []
    // Deduplicate: If same snippet is selected in both pinned and folder, we only need the ID once.
    const realSet = new Set(ids.map((id) => id.toString().replace(VIRTUAL_ID_PREFIX, '')))
    return Array.from(realSet)
  }

  // --- Logic Hook ---
  // Encapsulates flattening, keyboard navigation, and tree interaction.
  const {
    treeItems,
    lastSelectedIdRef,
    handleSelectionInternal,
    handleItemKeyDown,
    startCreation,
    cancelCreation,
    confirmCreation,
    togglePinned,
    collapseAll,
    editingId,
    startRenaming,
    cancelRenaming,
    activePath
  } = useSidebarLogic({
    folders,
    snippets,
    onSelect,
    onToggleFolder,
    inputRef,
    listRef,
    dirtyIds,
    selectedSnippet
  })

  // --- 🪄 Creation Handlers ---

  /**
   * handleConfirmCreation
   * Finalizes the inline 'New Folder' or 'New Snippet' flow.
   */
  const handleConfirmCreation = (name, type, parentId) => {
    // 🛡️ Industrial Validation
    const validNameRegex = /^[a-zA-Z0-9_][a-zA-Z0-9_\-\. ]*$/
    if (!validNameRegex.test(name)) {
      if (showToast) showToast('Invalid Name: Use alpha-numeric characters only', 'error')
      return
    }

    // 🛡️ Duplicate Collision Check
    if (type === 'snippet') {
      const normalize = (t) => (t || '').toLowerCase().trim().replace(/\.md$/, '')
      const targetBase = normalize(name)
      const duplicate = snippets.find(
        (s) => normalize(s.title) === targetBase && (s.folder_id || null) === (parentId || null)
      )
      if (duplicate) {
        if (showToast) showToast(`File "${name}" already exists here`, 'error')
        return
      }
      onNew(name, parentId)
    } else {
      const normalize = (t) => (t || '').toLowerCase().trim()
      const targetBase = normalize(name)
      const duplicate = folders.find(
        (f) => normalize(f.name) === targetBase && (f.parent_id || null) === (parentId || null)
      )
      if (duplicate) {
        if (showToast) showToast(`Folder "${name}" already exists here`, 'error')
        return
      }
      onNewFolder(name, parentId)
    }
    confirmCreation()
  }

  /**
   * handleSmartCreation
   * VS Code-style logic: Create new items adjacent to current selection.
   */
  const handleSmartCreation = (type) => {
    let targetParentId = null
    if (selectedIds.length === 1) {
      const virtualId = selectedIds[0]
      const realId = String(virtualId).replace(VIRTUAL_ID_PREFIX, '')
      
      const snippet = snippets.find((s) => String(s.id) === realId)
      if (snippet) targetParentId = snippet.folder_id || null
      else {
        const folder = folders.find((f) => String(f.id) === realId)
        if (folder) targetParentId = folder.id
      }
    } else if (selectedFolderId) {
      targetParentId = selectedFolderId
    }
    startCreation(type, targetParentId)
  }

  // --- 🪄 Global Deselection logic ---
  // When clicking outside the sidebar (e.g. editor, header), deselect the sidebar.
  React.useEffect(() => {
    const handleGlobalClick = (e) => {
      // If we clicked outside the sidebar pane
      if (parentRef.current && !parentRef.current.contains(e.target)) {
        // Only clear the 'isSidebarSelected' flag. 
        // We do NOT clear selectedIds anymore, as we want to keep the 
        // "Active File" highlighted even when focus is in the editor.
        if (isSidebarSelected) {
          setSidebarSelected(false)
        }
      }
    }
    document.addEventListener('mousedown', handleGlobalClick)
    return () => document.removeEventListener('mousedown', handleGlobalClick)
  }, [isSidebarSelected, setSidebarSelected])

  // --- 🔍 Search Sync ---
  React.useEffect(() => {
    if (!filter || !filter.trim()) {
      if (onSearch) onSearch('')
      return
    }
    const timer = setTimeout(() => {
      if (onSearch) onSearch(filter)
    }, 50)
    return () => clearTimeout(timer)
  }, [filter, onSearch])

  // --- 🖱️ Context Menu Engine ---
  const handleContextMenu = (e, type, itemData) => {
    e.preventDefault()
    e.stopPropagation()

    // Deterministic ID for selection check
    const virtualId =
      type === 'pinned_snippet' ? `${VIRTUAL_ID_PREFIX}${itemData.id}` : itemData?.id

    // Select row if not already selected
    if (type !== 'background' && itemData && !selectedIds.includes(virtualId)) {
      handleSelectionInternal({ ctrlKey: false, shiftKey: false }, virtualId, type)
    }

    const isMulti = selectedIds.length > 1
    const menuItems = []

    // 📋 Clipboard Group
    if (selectedIds.length > 0) {
      menuItems.push(
        { label: 'Cut', onClick: onCut },
        { label: 'Copy', onClick: onCopy },
        { label: 'separator' }
      )
    }

    // 📂 Folder Group
    if (type === 'folder') {
      menuItems.push({
        label: isMulti ? `Delete ${selectedIds.length} Items` : 'Delete',
        onClick: () => {
          if (isMulti) onDeleteBulk(resolveRealIds(selectedIds))
          else onDeleteFolder(itemData.id)
        },
        danger: true
      })
      menuItems.push({ label: 'Paste', onClick: onPaste })
      if (!isMulti) {
        menuItems.unshift(
          {
            label: 'New Snippet',
            onClick: () => startCreation('snippet', itemData.id)
          },
          {
            label: 'New Subfolder',
            onClick: () => startCreation('folder', itemData.id)
          },
          { label: 'separator' },
          { label: 'Rename', onClick: () => startRenaming(virtualId) }
        )
      }
    }
    // 📄 Snippet Group
    else if (type === 'snippet' || type === 'pinned_snippet') {
      menuItems.push({
        label: isMulti ? `Delete ${selectedIds.length} Items` : 'Delete',
        onClick: () => {
          if (isMulti) onDeleteBulk(resolveRealIds(selectedIds))
          else onDeleteSnippet(itemData.id)
        },
        danger: true,
        shortcut: isMulti ? '' : 'Ctrl+Shift+D'
      })
      menuItems.push({ label: 'Paste', onClick: onPaste })
      if (!isMulti) {
        menuItems.unshift({
          label: 'Rename',
          onClick: () => startRenaming(virtualId),
          shortcut: 'Ctrl+R'
        })
        menuItems.unshift({
          label: 'Open in Graph',
          onClick: () => {
            if (window.dispatchEvent) {
              window.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'g', ctrlKey: true, bubbles: true })
              )
            }
          },
          shortcut: 'Ctrl+G'
        })
        menuItems.unshift({
          label: itemData.is_favorite ? 'Unfavorite' : 'Make Favorite',
          onClick: () => onToggleFavorite && onToggleFavorite(itemData.id)
        })
        menuItems.unshift({
          label: itemData.is_pinned ? 'Unpin' : 'Pin',
          onClick: () => onTogglePin(itemData.id),
          shortcut: 'Alt+P'
        })
      }
    }
    // 🌫️ Background / Root Group
    else {
      menuItems.push(
        {
          label: 'New Snippet',
          onClick: () => startCreation('snippet', selectedFolderId || null)
        },
        {
          label: 'New Folder',
          onClick: () => startCreation('folder', selectedFolderId || null)
        },
        { label: 'separator' },
        { label: 'Paste', onClick: onPaste },
        { label: 'Select All', onClick: onSelectAll }
      )
    }

    setContextMenu({ x: e.clientX + 2, y: e.clientY + 2, items: menuItems })
  }

  // --- 📐 Responsive Engine ---
  const [containerHeight, setContainerHeight] = useState(0)
  React.useLayoutEffect(() => {
    if (!parentRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      if (entry.contentRect.height !== containerHeight) setContainerHeight(entry.contentRect.height)
    })
    ro.observe(parentRef.current)
    return () => ro.disconnect()
  }, [containerHeight])

  // --- 🎯 Auto-scroll to Creation Input (VS Code behavior) ---
  const lastCreationIdxRef = useRef(-1)
  React.useEffect(() => {
    const idx = treeItems.findIndex(item => item.type === 'creation_input')
    if (idx !== -1 && idx !== lastCreationIdxRef.current && listRef.current) {
      lastCreationIdxRef.current = idx
      listRef.current.scrollToItem(idx, 'smart')
    } else if (idx === -1) {
      lastCreationIdxRef.current = -1
    }
  }, [treeItems])

  // --- ⚙️ Memoized Item Data (VirtualList Perf) ---
  const itemData = React.useMemo(
    () => ({
      treeItems,
      selectedSnippet,
      selectedFolderId,
      selectedIds,
      onSelect,
      onSelectFolder: (id) => setSelectedFolderId(id),
      onSelectionChange: (ids) => setSelectedIds(ids),
      handleItemKeyDown,
      isCompact,
      onToggleFolder,
      onNew,
      onMoveSnippet,
      onMoveFolder,
      onContextMenu: handleContextMenu,
      lastSelectedIdRef,
      onTogglePin,
      searchQuery,
      onConfirmCreation: handleConfirmCreation,
      onCancelCreation: cancelCreation,
      editingId,
      onInlineRename,
      onCancelRenaming: cancelRenaming,
      startCreation,
      setSidebarSelected,
      handleSelectionInternal,
      todayStr,
      togglePinned,
      folders,
      activePath
    }),
    [
      treeItems,
      selectedSnippet,
      editingId,
      selectedIds,
      searchQuery,
      isCompact,
      isSidebarSelected,
      dirtyIds,
      todayStr,
      folders
    ]
  )

  return (
    <SidebarPane className="overflow-hidden">
      {/* HEADER SECTION */}
      <PaneHeader className="px-2 py-1">
        <div className="flex items-center gap-2 w-full">
          {/* SEARCH INPUT */}
          <div className="relative group flex-1 h-8 sidebar-search-container border border-white/5 bg-white/[0.02] rounded-lg overflow-hidden">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-60 group-focus-within:opacity-90 transition-opacity pointer-events-none flex items-center gap-1.5">
              {isSearching ? (
                <RefreshCw size={12} className="animate-spin text-[var(--color-accent-primary)]" />
              ) : (
                <Search size={13} />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search library..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && treeItems.length > 0) {
                  const first = treeItems[0]
                  if (first.type === 'snippet' || first.type === 'pinned_snippet') {
                    onSelect(first.data)
                  }
                } else if (e.key === 'ArrowDown' && treeItems.length > 0) {
                  e.preventDefault()
                  const firstEl = document.getElementById('sidebar-item-0')
                  firstEl?.focus()
                }
              }}
              className="w-full h-full pl-9 pr-8 text-[12px] outline-none border-none bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/40 transition-all font-medium"
            />
          </div>

          {/* ACTION BAR */}
          <div className="flex items-center gap-px shrink-0">
            <button
              onClick={() => handleSmartCreation('snippet')}
              className="h-7 w-7 flex items-center justify-center rounded-[5px] opacity-90 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-all group/btn"
              title="New Snippet"
            >
              <FilePlus
                size={14}
                strokeWidth={2.5}
                className="group-hover/btn:scale-110 transition-transform"
              />
            </button>
            <button
              onClick={() => handleSmartCreation('folder')}
              className="h-7 w-7 flex items-center justify-center rounded-[5px] opacity-90 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-all group/btn"
              title="New Folder"
            >
              <FolderPlus
                size={14}
                strokeWidth={2.5}
                className="group-hover/btn:scale-110 transition-transform"
              />
            </button>
            <button
              onClick={() => {
                collapseAll()
                setSidebarSelected(true)
              }}
              className="h-7 w-7 flex items-center justify-center rounded-[5px] opacity-90 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-all group/btn"
              title="Collapse Folders"
            >
              <ChevronsUp
                size={14}
                strokeWidth={2.5}
                className="group-hover/btn:-translate-y-0.5 transition-transform"
              />
            </button>
          </div>
        </div>
      </PaneHeader>

      {/* VIRTUALIZED BODY SECTION */}
      <SidebarBody noPadding noScroll>
        <div
          ref={parentRef}
          className="w-full h-full relative outline-none"
          style={{
            backgroundColor: isDragOver
              ? 'rgba(var(--color-accent-primary-rgb), 0.05)'
              : 'transparent',
            boxShadow: isDragOver
              ? 'inset 0 0 40px rgba(var(--color-accent-primary-rgb), 0.1), inset 0 0 0 1px var(--color-accent-primary)'
              : isSidebarSelected && selectedIds.length === 0 && !selectedFolderId
                ? 'inset 0 0 0 1px rgba(var(--color-accent-primary-rgb, 59, 130, 246), 0.08)'
                : 'none'
          }}
          tabIndex={0}
          // prettier-ignore
          onClick={(e) => {
            // Background Click Logic: Reset selection if clicking empty space
            if (e.target === e.currentTarget) {
              setSidebarSelected(true)
              setSelectedIds([])
              setSelectedFolderId(null)
              onSelect(null) // This clears selectedSnippet
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, 'background', null)}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            try {
              const ids = JSON.parse(e.dataTransfer.getData('sourceIds') || '[]')
              const types = JSON.parse(e.dataTransfer.getData('sourceTypes') || '[]')
              const sIds = ids.filter((_, i) => types[i] === 'snippet')
              const fIds = ids.filter((_, i) => types[i] === 'folder')
              if (sIds.length) onMoveSnippet(sIds, null)
              if (fIds.length) onMoveFolder(fIds, null)
            } catch (err) {}
          }}
        >
          {treeItems.length === 0 && !isSearching ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center animate-in fade-in duration-500">
              <Plus className="w-12 h-12 text-[var(--color-text-primary)] opacity-10 mb-4" />
              <p className="text-[12px] opacity-40 italic">Library is empty.</p>
            </div>
          ) : (
            <VirtualList
              ref={listRef}
              height={containerHeight}
              width="100%"
              itemCount={treeItems.length}
              itemSize={isCompact ? 24 : 32}
              overscan={15}
              itemData={itemData}
            >
              {SnippetSidebarRow}
            </VirtualList>
          )}
        </div>
      </SidebarBody>

      {/* CONTEXT MENU OVERLAY */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </SidebarPane>
  )
}

SnippetSidebar.propTypes = {
  snippets: PropTypes.array.isRequired,
  folders: PropTypes.array,
  selectedSnippet: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  onNew: PropTypes.func.isRequired,
  onNewFolder: PropTypes.func,
  onSearch: PropTypes.func,
  onToggleFolder: PropTypes.func,
  onMoveSnippet: PropTypes.func,
  onMoveFolder: PropTypes.func,
  onDeleteFolder: PropTypes.func,
  onDeleteSnippet: PropTypes.func,
  onDeleteBulk: PropTypes.func,
  onTogglePin: PropTypes.func,
  onToggleFavorite: PropTypes.func,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func,
  isCompact: PropTypes.bool,
  showToast: PropTypes.func,
  onCopy: PropTypes.func,
  onCut: PropTypes.func,
  onPaste: PropTypes.func,
  onSelectAll: PropTypes.func,
  dirtyIds: PropTypes.instanceOf(Set),
  onInlineRename: PropTypes.func,
  isSearching: PropTypes.bool
}

export default React.memo(SnippetSidebar)
