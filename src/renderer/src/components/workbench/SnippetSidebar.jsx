import React, { useMemo, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  File,
  Plus,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Search,
  Folder,
  FolderPlus,
  Trash2,
  Edit2,
  FilePlus
} from 'lucide-react'
import SidebarHeader from '../layout/SidebarHeader'
import VirtualList from '../common/VirtualList'
import ContextMenu from '../common/ContextMenu'

const getFileIcon = (lang, title = '') => {
  const extension = title.split('.').pop()?.toLowerCase() || ''
  const name = title.toLowerCase()

  // Languages matching
  if (lang === 'javascript' || lang === 'js' || extension === 'js')
    return { icon: File, color: '#f7df1e' }
  if (lang === 'typescript' || lang === 'ts' || extension === 'ts')
    return { icon: File, color: '#007acc' }
  if (lang === 'react' || extension === 'jsx' || extension === 'tsx')
    return { icon: File, color: '#61dafb' }
  if (lang === 'css' || extension === 'css') return { icon: File, color: '#264de4' }
  if (lang === 'html' || extension === 'html') return { icon: File, color: '#e34c26' }
  if (lang === 'python' || extension === 'py') return { icon: File, color: '#3776ab' }
  if (lang === 'markdown' || lang === 'md' || extension === 'md')
    return { icon: File, color: '#519aba' }

  return { icon: File, color: '#8b949e' } // Default
}

// Tree flattening logic for VirtualList (Performance optimized)
const flattenTree = (folders, snippets, depth = 0, parentId = null) => {
  let result = []

  // Get and sort folders in this level
  const levelFolders = folders
    .filter((f) => (f.parent_id || null) === (parentId || null))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))

  levelFolders.forEach((folder) => {
    const isExpanded = folder.collapsed === 0 || folder.collapsed === false
    result.push({
      id: folder.id,
      type: 'folder',
      data: folder,
      depth,
      isExpanded
    })

    if (isExpanded) {
      result = result.concat(flattenTree(folders, snippets, depth + 1, folder.id))
    }
  })

  // Get and sort snippets in this level
  const levelSnippets = snippets
    .filter((s) => (s.folder_id || null) === (parentId || null))
    .sort((a, b) => {
      if (a.is_draft && !b.is_draft) return -1
      if (!a.is_draft && b.is_draft) return 1
      return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
    })

  levelSnippets.forEach((snippet) => {
    result.push({
      id: snippet.id,
      type: 'snippet',
      data: snippet,
      depth
    })
  })

  return result
}

const Row = ({ index, style, data }) => {
  const {
    treeItems,
    selectedSnippet,
    selectedFolderId,
    selectedIds = [],
    onSelect,
    onSelectFolder,
    onSelectionChange,
    handleItemKeyDown,
    isCompact,
    onToggleFolder,
    onNew,
    onMoveSnippet,
    onMoveFolder,
    onContextMenu,
    lastSelectedIdRef
  } = data

  const item = treeItems[index]
  if (!item) return null

  const { type, data: itemData, depth } = item
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragStart = (e) => {
    let dragIds = [itemData.id]
    let dragTypes = [type]

    if (selectedIds.includes(itemData.id)) {
      dragIds = selectedIds
      dragTypes = selectedIds.map((id) => {
        const found = treeItems.find((i) => i.id === id)
        return found ? found.type : 'snippet'
      })
    }

    e.dataTransfer.setData('sourceIds', JSON.stringify(dragIds))
    e.dataTransfer.setData('sourceTypes', JSON.stringify(dragTypes))
    e.dataTransfer.effectAllowed = 'move'

    const dragImg = new Image()
    dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(dragImg, 0, 0)
  }

  const handleDragOver = (e) => {
    if (type === 'folder') {
      e.preventDefault()
      setIsDragOver(true)
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDrop = (e) => {
    if (type === 'folder') {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      try {
        const sourceIds = JSON.parse(e.dataTransfer.getData('sourceIds') || '[]')
        const sourceTypes = JSON.parse(e.dataTransfer.getData('sourceTypes') || '[]')
        if (sourceIds.includes(itemData.id)) return
        const snippetIds = sourceIds.filter((_, idx) => sourceTypes[idx] === 'snippet')
        const folderIds = sourceIds.filter((_, idx) => sourceTypes[idx] === 'folder')
        if (snippetIds.length > 0) onMoveSnippet(snippetIds, itemData.id)
        if (folderIds.length > 0) onMoveFolder(folderIds, itemData.id)
      } catch (err) {
        console.error('Drop error:', err)
      }
    }
  }

  const handleItemClick = (e) => {
    let newSelection = []
    if (e.shiftKey && lastSelectedIdRef.current) {
      const lastIndex = treeItems.findIndex((i) => i.id === lastSelectedIdRef.current)
      const currentIndex = index
      if (lastIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex)
        const end = Math.max(lastIndex, currentIndex)
        newSelection = [...selectedIds]
        for (let i = start; i <= end; i++) {
          const itemId = treeItems[i].id
          if (!newSelection.includes(itemId)) newSelection.push(itemId)
        }
      }
    } else if (e.ctrlKey || e.metaKey) {
      newSelection = selectedIds.includes(itemData.id)
        ? selectedIds.filter((id) => id !== itemData.id)
        : [...selectedIds, itemData.id]
    } else {
      newSelection = [itemData.id]
      if (type === 'snippet') onSelect(itemData)
      else onSelectFolder(itemData.id)
    }
    lastSelectedIdRef.current = itemData.id
    onSelectionChange(newSelection)
  }

  if (type === 'folder') {
    const isSelected = selectedIds.includes(itemData.id) || selectedFolderId === itemData.id
    return (
      <div
        id={`sidebar-item-${index}`}
        className="outline-none focus:outline-none"
        style={style}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        tabIndex={0}
        onClick={handleItemClick}
        onKeyDown={(e) => handleItemKeyDown(e, index, itemData)}
        onContextMenu={(e) => onContextMenu(e, 'folder', itemData)}
      >
        <div
          className={`group flex items-center gap-[3px] w-full h-full select-none border-none outline-none focus:outline-none transition-all duration-150 pr-2 ${
            isSelected ? 'bg-[var(--selected-bg)]' : ''
          } ${
            isDragOver
              ? 'bg-[var(--selected-bg)] border border-[var(--color-accent-primary)]/30 rounded-sm'
              : isSelected
                ? ''
                : 'hover:bg-white/5'
          }`}
          style={{
            color: isSelected ? 'var(--selected-text)' : 'var(--sidebar-header-text)',
            paddingLeft: `${depth * 12 + 6}px`
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFolder(itemData.id, !itemData.collapsed)
            }}
            className="flex-shrink-0 flex items-center justify-center opacity-70 group-hover:opacity-100 hover:bg-white/10 rounded"
          >
            {itemData.collapsed ? (
              <ChevronRight size={isCompact ? 12 : 14} strokeWidth={2.5} />
            ) : (
              <ChevronDown size={isCompact ? 12 : 14} strokeWidth={2.5} />
            )}
          </button>
          <div className="flex-shrink-0 flex items-center justify-center text-amber-400 opacity-80 group-hover:opacity-100">
            <Folder size={isCompact ? 13 : 15} strokeWidth={1.5} />
          </div>
          <span className="flex-1 min-w-0 text-left truncate font-medium text-[12px] opacity-80 group-hover:opacity-100 pl-0.5">
            {itemData.name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNew(null, itemData.id)
            }}
            className="hidden group-hover:flex items-center justify-center p-0.5 rounded hover:bg-white/20 opacity-60 hover:opacity-100"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    )
  }

  const isSelected =
    selectedIds.includes(itemData.id) || (selectedSnippet?.id === itemData.id && !selectedFolderId)
  const { icon: Icon, color } = getFileIcon(itemData.language, itemData.title)

  return (
    <div style={style}>
      <button
        id={`sidebar-item-${index}`}
        draggable
        onDragStart={handleDragStart}
        onClick={handleItemClick}
        onKeyDown={(e) => handleItemKeyDown(e, index, itemData)}
        onContextMenu={(e) => onContextMenu(e, 'snippet', itemData)}
        className={`group flex items-center gap-[3px] w-full h-full select-none border-none outline-none focus:outline-none pr-2 ${
          isCompact ? 'text-xs' : 'text-sm'
        } ${isSelected ? '' : 'hover:bg-white/[0.03]'}`}
        style={{
          backgroundColor: isSelected ? 'var(--selected-bg)' : 'transparent',
          color: isSelected ? 'var(--selected-text)' : 'var(--sidebar-text)',
          paddingLeft: `${depth * 12 + 26}px`
        }}
        tabIndex={0}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center opacity-80 group-hover:opacity-100"
          style={{ color: isSelected ? 'inherit' : color }}
        >
          <Icon size={isCompact ? 13 : 15} strokeWidth={1.5} />
        </div>
        {/* TODO: Add snippet language */}
        <span className="flex-1 min-w-0 text-left truncate font-light opacity-90 group-hover:opacity-100 normal-case pl-0.5">
          {itemData.title || 'Untitled'}
        </span>
      </button>
    </div>
  )
}

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
  selectedFolderId,
  onSelectFolder,
  onRenameSnippet,
  onRenameFolder,
  onDeleteFolder,
  onDeleteSnippet,
  onDeleteBulk,
  selectedIds = [],
  onSelectionChange,
  isOpen,
  onToggle,
  isCompact = false
}) => {
  const [filter, setFilter] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const lastSelectedIdRef = React.useRef(null)
  const inputRef = React.useRef(null)
  const listRef = React.useRef(null)

  const treeItems = useMemo(() => {
    return flattenTree(folders, snippets)
  }, [snippets, folders])

  // Debounced Search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) onSearch(filter)
    }, 300)
    return () => clearTimeout(timer)
  }, [filter, onSearch])

  const handleSelectionInternal = useCallback(
    (e, id, type) => {
      let newSelection = []
      if (e.shiftKey && lastSelectedIdRef.current) {
        const lastIndex = treeItems.findIndex((i) => i.id === lastSelectedIdRef.current)
        const currentIndex = treeItems.findIndex((i) => i.id === id)
        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex)
          const end = Math.max(lastIndex, currentIndex)
          newSelection = [...selectedIds]
          for (let i = start; i <= end; i++) {
            const itemId = treeItems[i].id
            if (!newSelection.includes(itemId)) newSelection.push(itemId)
          }
        }
      } else if (e.ctrlKey || e.metaKey) {
        newSelection = selectedIds.includes(id)
          ? selectedIds.filter((sid) => sid !== id)
          : [...selectedIds, id]
      } else {
        newSelection = [id]
        if (type === 'snippet') {
          const snippet = snippets.find((s) => s.id === id)
          if (snippet) onSelect(snippet)
        } else {
          onSelectFolder(id)
        }
      }
      lastSelectedIdRef.current = id
      onSelectionChange(newSelection)
    },
    [treeItems, selectedIds, onSelectionChange, onSelect, onSelectFolder, snippets]
  )

  const handleContextMenu = (e, type, itemData) => {
    e.preventDefault()
    e.stopPropagation()

    if (itemData && !selectedIds.includes(itemData.id)) {
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
          { label: 'New Snippet', icon: FilePlus, onClick: () => onNew(null, itemData.id) },
          {
            label: 'New Subfolder',
            icon: FolderPlus,
            onClick: () => onNewFolder({ parentId: itemData.id })
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
          label: 'Rename',
          icon: Edit2,
          onClick: () => onRenameSnippet(itemData)
        })
      }
    } else {
      menuItems.push(
        { label: 'New Snippet', icon: FilePlus, onClick: () => onNew() },
        { label: 'New Folder', icon: FolderPlus, onClick: () => onNewFolder() }
      )
    }

    setContextMenu({ x: e.clientX, y: e.clientY, items: menuItems })
  }

  const handleItemKeyDown = (e, index) => {
    if (e.key === 'ArrowDown' && index < treeItems.length - 1) {
      e.preventDefault()
      const next = treeItems[index + 1]
      handleSelectionInternal(e, next.id, next.type)
      listRef.current?.scrollToItem(index + 1)
      setTimeout(() => document.getElementById(`sidebar-item-${index + 1}`)?.focus(), 10)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (index === 0) inputRef.current?.focus()
      else {
        const prev = treeItems[index - 1]
        handleSelectionInternal(e, prev.id, prev.type)
        listRef.current?.scrollToItem(index - 1)
        setTimeout(() => document.getElementById(`sidebar-item-${index - 1}`)?.focus(), 10)
      }
    } else if (e.key === 'Enter') {
      const item = treeItems[index]
      if (item.type === 'folder') onToggleFolder(item.id, !item.data.collapsed)
      else onSelect(item.data)
    }
  }

  // Resize Observer
  const parentRef = React.useRef(null)
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
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectionChange([])
            lastSelectedIdRef.current = null
          }
        }}
        onContextMenu={(e) => {
          if (e.target === e.currentTarget) handleContextMenu(e, 'background', null)
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
              lastSelectedIdRef
            }}
          >
            {Row}
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
  selectedIds: PropTypes.array,
  onSelectionChange: PropTypes.func,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func,
  isCompact: PropTypes.bool
}

export default React.memo(SnippetSidebar)
