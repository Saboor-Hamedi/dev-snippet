import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Search,
  Trash2,
  Edit2,
  FilePlus,
  FolderPlus,
  Calendar,
  Pin,
  Star,
  ChevronsUp,
  Plus,
  RefreshCw
} from 'lucide-react'
import SidebarHeader from '../layout/SidebarHeader'
import VirtualList from '../common/VirtualList'
import ContextMenu from '../common/ContextMenu'
import SnippetSidebarRow from './sidebar/SnippetSidebarRow'
import { useSidebarLogic } from './sidebar/useSidebarLogic'
import { useSidebarStore } from '../../store/useSidebarStore'

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
  // Clipboard operations
  onCopy,
  onCut,
  onPaste,
  onSelectAll,
  onDailyNote,
  dirtyIds,
  onInlineRename
}) => {
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

  const [filter, setFilter] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [showLocationModal, setShowLocationModal] = useState(false)

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [pendingCreationType, setPendingCreationType] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false) // State for root drop target visual
  const inputRef = React.useRef(null)
  const listRef = React.useRef(null)
  const parentRef = React.useRef(null)
  // --- Logic Hook ---
  const {
    treeItems,
    lastSelectedIdRef,
    handleSelectionInternal,
    handleItemKeyDown,
    handleBackgroundClick,
    startCreation,
    cancelCreation,
    confirmCreation,
    togglePinned,
    collapseAll,
    editingId,
    startRenaming,
    cancelRenaming
  } = useSidebarLogic({
    folders,
    snippets,
    selectedIds,
    selectedFolderId,
    selectedSnippet,
    onSelect,
    onToggleFolder,
    inputRef,
    listRef,
    setSidebarSelected,
    sidebarSelected: isSidebarSelected,
    dirtyIds
  })

  // --- Creation Handlers ---
  const handleConfirmCreation = (name, type, parentId) => {
    // Validation
    const validNameRegex = /^[a-zA-Z0-9_][a-zA-Z0-9_\-\. ]*$/
    if (!validNameRegex.test(name)) {
      if (showToast)
        showToast(
          'Invalid Name: Must start with Letter/Number/_ and no special symbols (@#$%)',
          'error'
        )
      return
    }

    // Client-side duplicate check to prevent overwriting
    if (type === 'snippet') {
      const normalize = (t) => (t || '').toLowerCase().trim().replace(/\.md$/, '')
      const targetBase = normalize(name)
      const duplicate = snippets.find(
        (s) => normalize(s.title) === targetBase && (s.folder_id || null) === (parentId || null)
      )

      if (duplicate) {
        if (showToast) showToast(`File "${name}" already exists`, 'error')
        return // Keep input open
      }
      onNew(name, parentId, { skipNavigation: true })
    } else {
      const normalize = (t) => (t || '').toLowerCase().trim()
      const targetBase = normalize(name)
      const duplicate = folders.find(
        (f) => normalize(f.name) === targetBase && (f.parent_id || null) === (parentId || null)
      )

      if (duplicate) {
        if (showToast) showToast(`Folder "${name}" already exists`, 'error')
        return // Keep input open
      }
      onNewFolder(name, parentId)
    }
    confirmCreation()
  }

  // --- Smart Creation Logic (VS Code Style) ---
  const handleSmartCreation = (type) => {
    let targetParentId = null

    // 1. If we have invalid selection state, default to root
    if (selectedIds.length === 1) {
      const selectedId = selectedIds[0]
      // Find the item in our tree or raw data
      const snippet = snippets.find((s) => s.id === selectedId)
      if (snippet) {
        // It's a snippet, create in same folder
        targetParentId = snippet.folder_id || null
      } else {
        const folder = folders.find((f) => f.id === selectedId)
        if (folder) {
          // It's a folder, create inside it
          targetParentId = folder.id
        }
      }
    } else if (selectedFolderId) {
      // Fallback or explicit sidebar folder selection
      targetParentId = selectedFolderId
    }

    startCreation(type, targetParentId)
  }

  // --- Debounced Search ---
  React.useEffect(() => {
    // Handle empty search immediately for better UX
    if (!filter || !filter.trim()) {
      if (onSearch) onSearch('')
      return
    }

    const timer = setTimeout(() => {
      if (onSearch) onSearch(filter)
    }, 300)
    return () => clearTimeout(timer)
  }, [filter, onSearch])

  // --- Context Menu Logic (UI specific) ---
  const handleContextMenu = (e, type, itemData) => {
    e.preventDefault()
    e.stopPropagation()

    // If right-clicking unselected item, select it first (unless background)
    if (type !== 'background' && itemData && !selectedIds.includes(itemData.id)) {
      handleSelectionInternal({ ctrlKey: false, shiftKey: false }, itemData.id, type)
    }

    const isMulti = selectedIds.length > 1
    const menuItems = []

    // Clipboard operations (always available when items are selected)
    if (selectedIds.length > 0) {
      menuItems.push(
        { label: 'Cut', icon: '✂️', onClick: onCut },
        { label: 'Copy', icon: '📋', onClick: onCopy },
        { label: 'separator' }
      )
    }

    // Paste operation (available when clipboard has items)
    // menuItems.push({ label: 'Paste', icon: '📌', onClick: onPaste })
    // menuItems.push({ label: 'separator' })

    if (type === 'folder') {
      menuItems.push({
        label: isMulti ? 'Delete Selected' : 'Delete',
        icon: Trash2,
        onClick: () => (isMulti ? onDeleteBulk(selectedIds) : onDeleteFolder(itemData.id)),
        danger: true
      })
      menuItems.push({ label: 'Paste', icon: '📌', onClick: onPaste })
      if (!isMulti) {
        menuItems.unshift(
          {
            label: 'New Snippet',
            icon: FilePlus,
            onClick: () => startCreation('snippet', itemData.id)
          },
          {
            label: 'New Subfolder',
            icon: FolderPlus,
            onClick: () => startCreation('folder', itemData.id)
          },
          { label: 'separator' },
          { label: 'Rename', icon: Edit2, onClick: () => startRenaming(itemData.id) }
        )
      }
    } else if (type === 'snippet') {
      menuItems.push({
        label: isMulti ? 'Delete Selected' : 'Delete',
        icon: Trash2,
        onClick: () => (isMulti ? onDeleteBulk(selectedIds) : onDeleteSnippet(itemData.id)),
        danger: true
      })
      menuItems.push({ label: 'Paste', icon: '📌', onClick: onPaste })
      if (!isMulti) {
        menuItems.unshift({
          label: itemData.is_pinned ? 'Unpin' : 'Pin',
          icon: Pin,
          onClick: () => onTogglePin(itemData.id)
        })
        // Favorite toggle
        menuItems.unshift({
          label: itemData.is_favorite ? 'Unfavorite' : 'Make Favorite',
          icon: Star,
          onClick: () => onToggleFavorite && onToggleFavorite(itemData.id)
        })
        menuItems.unshift({
          label: 'Rename',
          icon: Edit2,
          onClick: () => startRenaming(itemData.id)
        })
      }
    } else {
      // Background context menu
      menuItems.push(
        {
          label: 'New Snippet',
          icon: FilePlus,
          onClick: () => {
            setPendingCreationType('snippet')
            // Default to root if no specific folder is targeted
            if (selectedFolderId) {
              startCreation('snippet', selectedFolderId)
            } else {
              startCreation('snippet', null)
            }
          }
        },
        {
          label: 'New Folder',
          icon: FolderPlus,
          onClick: () => {
            setPendingCreationType('folder')
            if (selectedFolderId) {
              startCreation('folder', selectedFolderId)
            } else {
              startCreation('folder', null)
            }
          }
        },
        { label: 'separator' },
        { label: 'Paste', icon: '📌', onClick: onPaste },
        { label: 'Select All', icon: '🎯', onClick: onSelectAll }
      )
    }

    setContextMenu({ x: e.clientX, y: e.clientY, items: menuItems })
  }

  // --- External Creation Command Listener ---
  React.useEffect(() => {
    const handler = (e) => {
      const { type, parentId } = e.detail || {}
      startCreation(type || 'snippet', parentId)
    }
    window.addEventListener('app:sidebar-start-creation', handler)
    return () => window.removeEventListener('app:sidebar-start-creation', handler)
  }, [startCreation])

  // --- Resize Observer ---
  const [size, setSize] = useState({ width: 0, height: 0 })
  React.useLayoutEffect(() => {
    if (!parentRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    ro.observe(parentRef.current)
    return () => ro.disconnect()
  }, [])

  // --- Global Keyboard Shortcuts & Drag Cleanup ---
  React.useEffect(() => {
    const handleKeyDownGlobal = (e) => {
      if (e.key === 'Escape') {
        if (isSidebarSelected || isDragOver) {
          setSidebarSelected(false)
          setIsDragOver(false)
          setSelectedIds([])
          onSelect(null)
          setSelectedFolderId(null)
        }
      }
    }

    const cleanupDrag = () => {
      setIsDragOver(false)
    }

    window.addEventListener('keydown', handleKeyDownGlobal)
    window.addEventListener('drop', cleanupDrag, true)
    window.addEventListener('dragend', cleanupDrag, true)

    return () => {
      window.removeEventListener('keydown', handleKeyDownGlobal)
      window.removeEventListener('drop', cleanupDrag, true)
      window.removeEventListener('dragend', cleanupDrag, true)
    }
  }, [isSidebarSelected, isDragOver, onSelect])

  // Optimize itemData with useMemo to prevent frequent re-renders in VirtualList
  const itemData = React.useMemo(
    () => ({
      treeItems,
      selectedSnippet,
      onSelect,
      handleItemKeyDown,
      isCompact,
      onToggleFolder,
      onNew,
      onMoveSnippet,
      onMoveFolder,
      onContextMenu: handleContextMenu,
      lastSelectedIdRef,
      togglePinned,
      onTogglePin,
      onConfirmCreation: handleConfirmCreation,
      onCancelCreation: cancelCreation,
      editingId,
      onInlineRename,
      onCancelRenaming: cancelRenaming,
      startCreation,
      handleBackgroundClick,
      todayStr
    }),
    [
      treeItems,
      selectedSnippet,
      onSelect,
      handleItemKeyDown,
      isCompact,
      onToggleFolder,
      onNew,
      onMoveSnippet,
      onMoveFolder,
      // handleContextMenu is a function, if it's not memoized it will cause updates.
      // Ideally we should assume these handlers are stable or harmless to update if they are fast.
      // Given the structure, including them here is correct for correctness.
      lastSelectedIdRef, // ref, stable
      togglePinned,
      onTogglePin,
      // handleConfirmCreation, // We need to check if this is stable. It's defined inside the component so it's NOT stable unless wrapped.
      // cancelCreation, // from hook, hopefully stable
      editingId,
      onInlineRename,
      // cancelRenaming, // from hook
      startCreation,
      handleBackgroundClick,
      todayStr
    ]
  )

  return (
    <div
      className="h-full flex flex-col w-full"
      style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
    >
      <SidebarHeader className="z-10 relative pr-1 border-b border-[var(--color-border)] pb-3 pt-1 px-1">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2">
            <div className="relative group flex-1">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-70 transition-opacity text-[var(--color-text-primary)]">
                <Search size={12} />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search Snippets"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                  onSearch(e.target.value)
                }}
                className="w-full rounded-[8px] py-1.5 pl-8 pr-8 text-[12px] outline-none border border-transparent focus:border-[var(--color-accent-primary)]/30 bg-[var(--color-bg-tertiary)] hover:brightness-110 focus:brightness-125 text-[var(--color-text-primary)] placeholder:text-[11px] placeholder:opacity-30 transition-all focus:shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.1)]"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {filter ? (
                  <button
                    onClick={() => {
                      setFilter('')
                      onSearch('')
                      inputRef.current?.focus()
                    }}
                    className="p-1 rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] opacity-40 hover:opacity-100 transition-all"
                  >
                    <RefreshCw size={10} className="rotate-45" />
                  </button>
                ) : (
                  <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[9px] font-bold text-[var(--color-text-primary)] opacity-20 group-hover:opacity-40 transition-opacity">
                    <span>⌘</span>
                    <span>F</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Icons - Obsidian Style */}
            <div className="flex items-center gap-0 shrink-0">
              <button
                onClick={() => handleSmartCreation('snippet')}
                className="p-1 rounded-[4px] opacity-40 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-all group/btn"
                title="New Snippet"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <FilePlus
                  size={14}
                  strokeWidth={2.5}
                  className="group-hover/btn:scale-110 transition-transform"
                />
              </button>
              <button
                onClick={() => handleSmartCreation('folder')}
                className="p-1 rounded-[4px] opacity-40 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-all group/btn"
                title="New Folder"
                style={{ color: 'var(--color-text-primary)' }}
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
                  onSelect(null)
                  setSelectedIds([])
                  setSidebarSelected(true)
                }}
                className="p-1 rounded-[4px] opacity-40 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-all group/btn"
                title="Collapse All Folders"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <ChevronsUp
                  size={14}
                  strokeWidth={2.5}
                  className="group-hover/btn:-translate-y-0.5 transition-transform"
                />
              </button>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <div
        className={`flex-1 overflow-hidden relative outline-none`}
        style={{
          backgroundColor: isDragOver
            ? 'rgba(var(--color-accent-primary-rgb), 0.05)'
            : isSidebarSelected
              ? 'rgba(var(--color-accent-primary-rgb), 0.02)'
              : 'transparent',
          // Fix: Use box-shadow (inset) for focus border to avoid layout shifts and clipping (right side issue).
          boxShadow: isDragOver
            ? 'inset 0 0 40px rgba(var(--color-accent-primary-rgb), 0.1), inset 0 0 0 1px var(--color-accent-primary)'
            : isSidebarSelected
              ? 'inset 0 0 0 1px var(--color-accent-primary)'
              : 'none'
        }}
        ref={parentRef}
        tabIndex={0} // Allow focus
        onBlur={(e) => {
          // Restore unselect behavior when clicking outside
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setSidebarSelected(false)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            setSidebarSelected(false)
            onSelect(null)
            setSelectedIds([])
          }
        }}
        onClick={(e) => {
          // Force background selection on any click in this container
          // that hasn't been stopped by a child.

          if (e.target !== e.currentTarget && e.target.closest('[draggable]')) {
            return
          }

          setSidebarSelected(true)
          setSelectedIds([])
          onSelect(null)
          setSelectedFolderId(null)
          if (inputRef.current) inputRef.current.blur()
        }}
        onContextMenu={(e) => {
          handleContextMenu(e, 'background', null)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          if (!isDragOver) setIsDragOver(true)
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={(e) => {
          // Prevent flickering when dragging over children
          if (e.currentTarget.contains(e.relatedTarget)) return
          setIsDragOver(false)
        }}
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
        {treeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex items-center justify-center mb-6 shadow-xl shadow-black/10">
              {filter ? (
                <RefreshCw className="w-6 h-6 text-[var(--color-text-primary)] opacity-20" />
              ) : (
                <Plus className="w-6 h-6 text-[var(--color-text-primary)] opacity-20" />
              )}
            </div>
            <h3 className="text-[14px] font-bold text-[var(--color-text-primary)] opacity-90 mb-2">
              {filter ? 'No Matches Found' : 'Your Library is Empty'}
            </h3>
            <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)] opacity-50 mb-8 max-w-[200px] mx-auto">
              {filter
                ? `We couldn't find any snippets matching "${filter}".`
                : 'Start organizing your knowledge by creating your first snippet or folder.'}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-[160px]">
              {filter ? (
                <button
                  onClick={() => {
                    setFilter('')
                    onSearch('')
                  }}
                  className="w-full py-2 px-4 rounded-lg bg-[var(--color-bg-tertiary)] hover:brightness-110 text-[var(--color-text-primary)] text-[11px] font-medium transition-all border border-[var(--color-border)]"
                >
                  Clear Search
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onNew()}
                    className="w-full py-2 px-4 rounded-lg bg-[var(--color-accent-primary)] hover:opacity-90 text-[11px] font-bold text-white transition-all shadow-lg shadow-[var(--color-accent-primary)]/20"
                  >
                    Create Snippet
                  </button>
                  <button
                    onClick={() => startCreation('folder')}
                    className="w-full py-2 px-4 rounded-lg bg-[var(--color-bg-tertiary)] hover:brightness-110 text-[var(--color-text-primary)] text-[11px] font-medium transition-all border border-[var(--color-border)]"
                  >
                    New Folder
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <VirtualList
            ref={listRef}
            height={size.height}
            width={size.width}
            itemCount={treeItems.length}
            itemSize={isCompact ? 24 : 30}
            overscan={15} // Explicitly set overscan to 15
            // The GPU promotion style should be applied to the individual rows (SnippetSidebarRow),
            // not the VirtualList container itself.
            // This style is passed down to SnippetSidebarRow via itemData.
            itemData={itemData}
          >
            {SnippetSidebarRow}
          </VirtualList>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

SnippetSidebar.propTypes = {
  snippets: PropTypes.array.isRequired,
  folders: PropTypes.array,
  selectedSnippet: PropTypes.object,
  selectedFolderId: PropTypes.string,
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
  selectedIds: PropTypes.array,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func,
  isCompact: PropTypes.bool,
  showToast: PropTypes.func,
  // Clipboard operations
  onCopy: PropTypes.func,
  onCut: PropTypes.func,
  onPaste: PropTypes.func,
  onSelectAll: PropTypes.func
}

export default React.memo(SnippetSidebar)
