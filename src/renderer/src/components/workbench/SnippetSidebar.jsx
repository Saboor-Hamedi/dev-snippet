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
import Pagination from '../../hook/pagination/Pagination'
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
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
  enablePagination = true,
  // Clipboard operations
  onCopy,
  onCut,
  onPaste,
  onSelectAll,
  onDailyNote
}) => {
  const [filter, setFilter] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
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
    confirmCreation
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
    setSidebarSelected
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
      <SidebarHeader className="gap-2 z-10 relative pr-0.5">
        <div className="relative group flex-1">
          <Search
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50"
            style={{ color: 'var(--color-text-secondary)' }}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-md py-1.5 pl-8 pr-4 text-[12px] outline-none ring-1 ring-transparent focus:ring-[var(--color-accent-primary)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] placeholder:text-xtiny placeholder-[var(--color-text-secondary)] transition-all"
          />
        </div>

        {/* Action Icons - Obsidian Style */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => handleSmartCreation('snippet')}
            className="p-1 rounded opacity-60 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-all"
            title="New Snippet"
            style={{ color: 'var(--sidebar-text)' }}
          >
            <FilePlus size={16} strokeWidth={2} />
          </button>
          <button
            onClick={() => handleSmartCreation('folder')}
            className="p-1 rounded opacity-60 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-all"
            title="New Folder"
            style={{ color: 'var(--sidebar-text)' }}
          >
            <FolderPlus size={16} strokeWidth={2} />
          </button>
          <button
            onClick={() => {
              // Collapse all folders logic (mock or real)
              onSelect(null) // Deselect
              setSidebarSelected(true)
            }}
            className="p-1 rounded opacity-60 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-all"
            title="Collapse / Deselect All"
            style={{ color: 'var(--sidebar-text)' }}
          >
            <ChevronsUp size={16} strokeWidth={2} />
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
            console.debug('[SnippetSidebar] container click', { target: e.target, currentTarget: e.currentTarget })
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
          <div className="p-4 text-center opacity-50 text-xs mt-4">
            {filter ? 'No results found' : 'No snippets yet'}
          </div>
        ) : (
          <VirtualList
            ref={listRef}
            height={size.height}
            width={size.width}
            itemCount={treeItems.length}
            itemSize={isCompact ? 24 : 30}
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
              onTogglePin,
              searchQuery,
              // Creation Props
              onConfirmCreation: handleConfirmCreation,
              onCancelCreation: cancelCreation
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

      {enablePagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          className="border-t border-gray-600"
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
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func,
  enablePagination: PropTypes.bool,
  // Clipboard operations
  onCopy: PropTypes.func,
  onCut: PropTypes.func,
  onPaste: PropTypes.func,
  onSelectAll: PropTypes.func
}

export default React.memo(SnippetSidebar)
