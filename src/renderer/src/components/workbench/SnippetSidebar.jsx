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
  RefreshCw
} from 'lucide-react'
import SidebarHeader from '../layout/SidebarHeader'
import VirtualList from '../common/VirtualList'
import ContextMenu from '../common/ContextMenu'
import SnippetSidebarRow from './sidebar/SnippetSidebarRow'
import { useSidebarLogic } from './sidebar/useSidebarLogic'

const SnippetSidebar = ({
  snippets,
  folders = [],
  selectedSnippet,
  onSelect,
  onNew,
  onNewFolder,
  onSearch,
  searchQuery,
  onToggleFolder,
  onMoveSnippet,
  onMoveFolder,
  selectedFolderId,
  onSelectFolder,
  onRenameSnippet,
  onRenameFolder,
  onDeleteFolder,
  onDeleteSnippet,
  onDeleteBulk,
  onTogglePin,
  onToggleFavorite,
  selectedIds = [],
  onSelectionChange,
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
  dirtyIds
}) => {
  const [filter, setFilter] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [showLocationModal, setShowLocationModal] = useState(false)

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [pendingCreationType, setPendingCreationType] = useState(null)
  const [sidebarSelected, setSidebarSelected] = useState(false)
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
    togglePinned
  } = useSidebarLogic({
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
    listRef,
    setSidebarSelected,
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
          { label: 'Rename', icon: Edit2, onClick: () => onRenameFolder(itemData) }
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
          onClick: () => onRenameSnippet(itemData)
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

  // --- Global Drag Cleanup ---
  React.useEffect(() => {
    // Ensure dragged visuals are cleared no matter where the drop happens
    const cleanup = () => {
      setIsDragOver(false)
    }
    // Use capture phase to catch events even if propagation is stopped by children
    window.addEventListener('drop', cleanup, true)
    window.addEventListener('dragend', cleanup, true)
    return () => {
      window.removeEventListener('drop', cleanup, true)
      window.removeEventListener('dragend', cleanup, true)
    }
  }, [])

  return (
    <div
      className="h-full flex flex-col w-full"
      style={{ backgroundColor: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}
    >
      <SidebarHeader className="gap-2 z-10 relative pr-1 border-b border-white/[0.03] pb-2">
        <div className="relative group flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Snippets..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-[8px] py-1.5 px-3 text-[12px] outline-none border border-transparent focus:border-[var(--color-accent-primary)]/30 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.08] text-[var(--color-text-primary)] placeholder:text-[11px] placeholder:opacity-40 transition-all focus:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.1)]"
          />
        </div>
        {/* Action Icons - Obsidian Style */}
        <div className="flex items-center gap-0.5 bg-white/[0.03] p-0.5 rounded-[8px] border border-white/[0.03]">
          <button
            onClick={() => handleSmartCreation('snippet')}
            className="p-1.5 rounded-[6px] opacity-40 hover:opacity-100 hover:bg-white/[0.08] transition-all"
            title="New Snippet"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <FilePlus size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => handleSmartCreation('folder')}
            className="p-1.5 rounded-[6px] opacity-40 hover:opacity-100 hover:bg-white/[0.08] transition-all"
            title="New Folder"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <FolderPlus size={14} strokeWidth={2.5} />
          </button>
          <div className="w-[1px] h-3 bg-white/[0.05] mx-0.5" />
          <button
            onClick={() => {
              onSelect(null)
              setSidebarSelected(true)
            }}
            className="p-1.5 rounded-[6px] opacity-40 hover:opacity-100 hover:bg-white/[0.08] transition-all"
            title="Collapse / Deselect All"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <ChevronsUp size={14} strokeWidth={2.5} />
          </button>
        </div>
      </SidebarHeader>

      <div
        className={`flex-1 overflow-hidden relative transition-colors duration-200 outline-none`}
        style={{
          backgroundColor: isDragOver
            ? 'rgba(0, 0, 0, 0.04)'
            : sidebarSelected
              ? 'rgba(0, 0, 0, 0.02)'
              : 'transparent',
          // Fix: Use box-shadow (inset) for focus border to avoid layout shifts and clipping (right side issue).
          boxShadow: isDragOver
            ? 'inset 0 0 0 1px var(--color-accent-primary)'
            : sidebarSelected
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
            onSelectionChange([])
          }
        }}
        onClick={(e) => {
          // Force background selection on any click in this container
          // that hasn't been stopped by a child.
          try {
            console.debug('[SnippetSidebar] container click', {
              target: e.target,
              currentTarget: e.currentTarget
            })
          } catch (err) {}

          if (e.target !== e.currentTarget && e.target.closest('[draggable]')) {
            return
          }

          setSidebarSelected(true)
          onSelectionChange([])
          onSelect(null)
          onSelectFolder(null)
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
            <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-4">
              <RefreshCw className="w-5 h-5 opacity-20" />
            </div>
            <h3 className="text-[13px] font-bold text-[var(--color-text-primary)] opacity-80 mb-1">
              {filter ? 'No Matches Found' : 'Initialize Library'}
            </h3>
            <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)] opacity-40">
              {filter
                ? `No snippets match "${filter}". Try a different keyword.`
                : 'Start organizing your knowledge by creating your first snippet or folder.'}
            </p>
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
            itemData={{
              treeItems,
              selectedSnippet,
              selectedFolderId,
              selectedIds,
              onSelect,
              onSelectFolder,
              onSelectionChange,
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
              searchQuery,
              // Creation Props
              onConfirmCreation: handleConfirmCreation,
              onCancelCreation: cancelCreation,
              todayStr
            }}
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
  onSelectFolder: PropTypes.func,
  onSelect: PropTypes.func.isRequired,
  onNew: PropTypes.func.isRequired,
  onNewFolder: PropTypes.func,
  onSearch: PropTypes.func,
  onToggleFolder: PropTypes.func,
  onMoveSnippet: PropTypes.func,
  onMoveFolder: PropTypes.func,
  onRenameSnippet: PropTypes.func,
  onRenameFolder: PropTypes.func,
  onDeleteFolder: PropTypes.func,
  onDeleteSnippet: PropTypes.func,
  onDeleteBulk: PropTypes.func,
  onTogglePin: PropTypes.func,
  onToggleFavorite: PropTypes.func,
  selectedIds: PropTypes.array,
  onSelectionChange: PropTypes.func,
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
