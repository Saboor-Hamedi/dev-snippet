import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Search, Trash2, Edit2, FilePlus, FolderPlus, Pin } from 'lucide-react'
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
  enablePagination = true
}) => {
  const [filter, setFilter] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
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
    listRef
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

    if (type === 'folder') {
      menuItems.push({
        label: isMulti ? 'Delete Selected' : 'Delete',
        icon: Trash2,
        onClick: () => (isMulti ? onDeleteBulk(selectedIds) : onDeleteFolder(itemData.id)),
        danger: true
      })
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
        { label: 'New Snippet', icon: FilePlus, onClick: () => startCreation('snippet', null) },
        { label: 'New Folder', icon: FolderPlus, onClick: () => startCreation('folder', null) }
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
      <SidebarHeader className="gap-2 z-10 relative">
        <div className="relative group flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="
                w-full rounded-md py-1.5 pl-8 pr-4 
                text-[12px] 
                outline-none ring-1 ring-transparent focus:ring-[var(--color-accent-primary)] 
                transition-all
              "
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)'
            }}
          />
          <div className="absolute right-3 top-1/2 h-3 w-[1px] -translate-y-1/2 bg-[var(--color-accent-primary)] animate-pulse" />
        </div>
      </SidebarHeader>

      <div
        className="flex-1 overflow-hidden relative"
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
  enablePagination: PropTypes.bool
}

export default React.memo(SnippetSidebar)
