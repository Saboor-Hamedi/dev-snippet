import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Search,
  Trash2,
  Edit2,
  FilePlus,
  FolderPlus,
  Pin,
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
  onSelectAll
}) => {
  const [filter, setFilter] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [pendingCreationType, setPendingCreationType] = useState(null)
  const [sidebarSelected, setSidebarSelected] = useState(false)
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
            setShowLocationModal(true)
          }
        },
        {
          label: 'New Folder',
          icon: FolderPlus,
          onClick: () => {
            setPendingCreationType('folder')
            setShowLocationModal(true)
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
            className="w-full rounded-md py-1.5 pl-8 pr-4 text-[12px] outline-none ring-1 ring-transparent focus:ring-[var(--color-accent)] transition-all bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]"
            style={{
              color: 'var(--color-text-primary)'
            }}
          />
        </div>

        {/* Action Icons - Obsidian Style */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onNew(null, selectedFolderId)}
            className="p-1 rounded opacity-60 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-all"
            title="New Snippet"
            style={{ color: 'var(--sidebar-text)' }}
          >
            <FilePlus size={16} strokeWidth={2} />
          </button>
          <button
            onClick={() => onNewFolder(null, selectedFolderId)}
            className="p-1 rounded opacity-60 hover:opacity-100 hover:bg-[var(--color-bg-tertiary)] transition-all"
            title="New Folder"
            style={{ color: 'var(--sidebar-text)' }}
          >
            <FolderPlus size={16} strokeWidth={2} />
          </button>
          <button
            onClick={() => {
              // Collapse all folders logic (mock or real)
              // If we don't have a bulk action, we can trigger individual collapses or reload
              // For now, let's just refresh/deselect as a placeholder or remove if not functional.
              onSelect(null) // Deselect
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
        className={`flex-1 overflow-hidden relative ${sidebarSelected ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600' : ''}`}
        ref={parentRef}
        onClick={handleBackgroundClick}
        onContextMenu={(e) => {
          handleContextMenu(e, 'background', null)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(e) => {
          e.preventDefault()
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
          <div className="p-4 text-center opacity-50 text-xs mt-4">No results found</div>
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

      {showLocationModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowLocationModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Choose Location
            </h3>
            <div className="space-y-2">
              <button
                className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                onClick={() => {
                  startCreation(pendingCreationType, null)
                  setShowLocationModal(false)
                }}
              >
                📁 Root
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white"
                  onClick={() => {
                    startCreation(pendingCreationType, folder.id)
                    setShowLocationModal(false)
                  }}
                >
                  📁 {folder.name}
                </button>
              ))}
            </div>
          </div>
        </div>
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
