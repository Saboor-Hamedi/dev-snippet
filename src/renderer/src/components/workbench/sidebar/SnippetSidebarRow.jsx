import React, { useState } from 'react'
import { File, Plus, ChevronDown, ChevronRight, Folder, Pin } from 'lucide-react'

// Helper to highlight matching text
const HighlightText = ({ text, highlight }) => {
  if (!highlight || !highlight.trim()) return <span>{text}</span>
  // Support multi-term highlighting (e.g. "react hook" highlights both)
  const terms = highlight
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

  if (terms.length === 0) return <span>{text}</span>

  const regex = new RegExp(`(${terms.join('|')})`, 'gi')
  const parts = text.split(regex)
  return (
    <span className="opacity-100">
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span
            key={`match-${i}`}
            className="text-[var(--color-accent-primary)] font-bold decoration-[var(--color-accent-primary)]/30"
          >
            {part}
          </span>
        ) : (
          <span key={`text-${i}`}>{part}</span>
        )
      )}
    </span>
  )
}

// Helper to get file icon
const getFileIcon = (lang, title = '') => {
  let cleanTitle = (title || '').toLowerCase()
  let isMd = false

  // Handle .md masking (e.g. script.js.md -> detect js)
  if (cleanTitle.endsWith('.md')) {
    const temp = cleanTitle.slice(0, -3)
    if (temp.includes('.')) {
      cleanTitle = temp // It's a code file masked as md
    } else {
      isMd = true // It's actually a markdown file
    }
  }

  const extension = cleanTitle.split('.').pop() || ''

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
  if (lang === 'markdown' || lang === 'md' || extension === 'md' || isMd)
    return { icon: File, color: '#519aba' }

  return { icon: File, color: 'var(--sidebar-icon-color)' } // Default
}

const CreationInputRow = ({ style, depth, itemData, onConfirm, onCancel, isCompact }) => {
  const isFolder = itemData.type === 'folder'
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      if (inputRef.current.value.trim()) {
        onConfirm(inputRef.current.value.trim(), itemData.type, itemData.parentId)
      } else {
        onCancel()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onCancel()
    }
  }

  return (
    <div style={style} className="pr-2">
      <div
        className="flex items-center w-full h-full pl-0 select-none"
        style={{ paddingLeft: `${depth * 12 + 26}px` }}
      >
        <div className="flex-1 flex items-center gap-[3px] bg-[var(--color-bg-secondary)] border border-[var(--color-accent-primary)]/50 rounded-sm h-[22px]">
          <div
            className="flex-shrink-0 flex items-center justify-center opacity-80 pl-1"
            style={{ color: 'var(--sidebar-icon-color)' }}
          >
            {isFolder ? <Folder size={isCompact ? 13 : 15} /> : <File size={isCompact ? 13 : 15} />}
          </div>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 min-w-0 bg-transparent outline-none border-none text-[12px] p-0 m-0 leading-none h-full"
            placeholder={isFolder ? 'Folder Name' : 'Snippet Name'}
            onKeyDown={handleKeyDown}
            onBlur={() => onCancel()}
          />
        </div>
      </div>
    </div>
  )
}

// --- Indentation Guides ---
const IndentGuides = ({ depth }) => {
  if (depth <= 0) return null
  return (
    <div
      className="absolute top-0 left-0 h-full pointer-events-none"
      style={{ width: depth * 12 + 6 }}
    >
      {Array.from({ length: depth }).map((_, i) => (
        <div
          key={i}
          className={`absolute top-0 bottom-0 w-[1px] ${
            i === depth - 1 
              ? 'bg-gradient-to-b from-transparent via-[var(--color-accent-primary)] to-transparent opacity-60' 
              : 'bg-gradient-to-b from-transparent via-[var(--color-border)] to-transparent opacity-30'
          }`}
          style={{ left: `${i * 12 + 12}px` }}
        />
      ))}
    </div>
  )
}

const SnippetSidebarRow = ({ index, style, data }) => {
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
    lastSelectedIdRef,
    onTogglePin,
    searchQuery,
    onConfirmCreation,
    onCancelCreation
  } = data

  const item = treeItems[index]
  if (!item) return null

  const { type, data: itemData, depth } = item
  const [isDragOver, setIsDragOver] = useState(false)

  // --- Creation Input ---
  if (type === 'creation_input') {
    return (
      <CreationInputRow
        style={style}
        depth={depth}
        itemData={itemData}
        onConfirm={onConfirmCreation}
        onCancel={onCancelCreation}
        isCompact={isCompact}
      />
    )
  }

  // --- Drag and Drop Handlers (Scoped to Row) ---
  const handleDragStart = (e) => {
    let dragIds = [itemData.id]
    let dragTypes = [type]

    // If dragging a selected item, drag ALL selected items
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

    // Create a ghost drag image (transparent)
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

        // Prevent dropping onto itself selection
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

  // --- Click Logic ---
  const handleItemClick = (e) => {
    let newSelection = []

    // Check Shift Key (Range)
    if (e.shiftKey && lastSelectedIdRef.current) {
      const lastIndex = treeItems.findIndex((i) => i.id === lastSelectedIdRef.current)
      const currentIndex = index

      if (lastIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex)
        const end = Math.max(lastIndex, currentIndex)
        newSelection = [...selectedIds] // Keep existing? Or replace? Standard is replace range.

        // Populate range
        for (let i = start; i <= end; i++) {
          const itemId = treeItems[i].id
          if (!newSelection.includes(itemId)) newSelection.push(itemId)
        }
      }
    }
    // Check Ctrl/Cmd Key (Toggle)
    else if (e.ctrlKey || e.metaKey) {
      newSelection = selectedIds.includes(itemData.id)
        ? selectedIds.filter((id) => id !== itemData.id)
        : [...selectedIds, itemData.id]
    }
    // Single Click (Select One)
    else {
      if (type === 'snippet') {
        newSelection = [itemData.id]
        onSelect(itemData)
      } else {
        // For folders: toggle expand/collapse on normal click (don't select)
        onToggleFolder(itemData.id, !item.isExpanded)
      }
    }

    lastSelectedIdRef.current = itemData.id
    onSelectionChange(newSelection)
  }

  // --- Render Folder ---
  if (type === 'folder') {
    const isSelected = selectedIds.includes(itemData.id) || selectedFolderId === itemData.id
    return (
      <div
        id={`sidebar-item-${index}`}
        className="outline-none focus:outline-none relative"
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
        <IndentGuides depth={depth} />
        <div
          className={`group flex items-center gap-[3px] w-full h-full select-none border-none outline-none focus:outline-none transition-all duration-150 pr-2 relative ${
            isSelected ? 'bg-[var(--selected-bg)]' : ''
          } ${
            isDragOver
              ? 'bg-[var(--selected-bg)] border border-[var(--color-accent-primary)]/30 rounded-sm'
              : isSelected
                ? ''
                : 'hover:bg-white/5 focus:bg-[var(--selected-bg)]'
          }`}
          style={{
            color: isSelected ? 'var(--selected-text)' : 'var(--sidebar-header-text)',
            paddingLeft: `${depth * 12 + 6}px`,
            borderLeft: isSelected
              ? '2px solid var(--color-accent-primary)'
              : '2px solid transparent',
            borderRadius: isSelected ? '4px' : '0'
          }}
        >
          {/* Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFolder(itemData.id, !itemData.collapsed)
            }}
            className="flex-shrink-0 flex items-center justify-center opacity-60 group-hover:opacity-100 hover:bg-[var(--color-accent-primary)]/20 rounded transition-all duration-200 w-4 h-4"
          >
            <ChevronRight
              size={isCompact ? 12 : 14}
              strokeWidth={2}
              className={`transition-transform duration-200 ${itemData.collapsed ? '' : 'rotate-90'}`}
              style={{ color: isSelected ? 'var(--selected-text)' : 'var(--sidebar-icon-color)' }}
            />
          </button>

          {/* Icon */}
          <div
            className="flex-shrink-0 flex items-center justify-center opacity-80 group-hover:opacity-100"
            style={{ color: isSelected ? 'var(--selected-text)' : 'var(--sidebar-icon-color)' }}
          >
            <Folder size={isCompact ? 13 : 15} strokeWidth={2} />
          </div>

          {/* Name */}
          <span className="flex-1 min-w-0 text-left truncate font-semibold text-[12px] opacity-90 group-hover:opacity-100 pl-1">
            {itemData.name}
          </span>

          {/* Quick Action (Add) */}
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

  // --- Render Snippet ---
  const isSelected =
    selectedIds.includes(itemData.id) || (selectedSnippet?.id === itemData.id && !selectedFolderId)
  const { icon: Icon, color } = getFileIcon(itemData.language, itemData.title)

  // Check if this item matches the current search query
  const isSearchMatch = searchQuery && searchQuery.trim() && 
    (itemData.title || '').toLowerCase().includes(searchQuery.toLowerCase().trim())

  return (
    <div style={style} className="relative group/row">
      <IndentGuides depth={depth} />
      <button
        id={`sidebar-item-${index}`}
        draggable
        onDragStart={handleDragStart}
        onClick={handleItemClick}
        onKeyDown={(e) => handleItemKeyDown(e, index, itemData)}
        onContextMenu={(e) => onContextMenu(e, 'snippet', itemData)}
        className={`flex items-center gap-[3px] w-full h-full select-none border-none outline-none focus:outline-none pr-2 relative ${
          isCompact ? 'text-xs' : 'text-sm'
        } ${
          isSelected 
            ? 'bg-[var(--selected-bg)]' 
            : isSearchMatch
              ? 'bg-[var(--color-accent-primary)]/10 hover:bg-[var(--color-accent-primary)]/15'
              : 'hover:bg-white/[0.03] focus:bg-[var(--selected-bg)]'
        }`}
        style={{
          backgroundColor: isSelected 
            ? 'var(--selected-bg)' 
            : isSearchMatch
              ? 'rgba(var(--color-accent-primary-rgb), 0.1)'
              : 'transparent',
          color: isSelected ? 'var(--selected-text)' : 'var(--sidebar-text)',
          paddingLeft: depth === 0 ? '2px' : `${depth * 10 + 6}px`,
          borderLeft: isSelected ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
          borderRadius: isSelected ? '3px' : '0'
        }}
        tabIndex={0}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center opacity-80 group-hover/row:opacity-100"
          style={{ color: isSelected ? 'inherit' : color }}
        >
          <Icon size={isCompact ? 13 : 15} strokeWidth={1.5} />
        </div>
        <span className="flex-1 min-w-0 text-left truncate font-normal opacity-90 group-hover/row:opacity-100 normal-case pl-1">
          <HighlightText text={itemData.title || 'Untitled'} highlight={searchQuery} />
        </span>
        {itemData.is_pinned === 1 && (
          <div
            className="flex-shrink-0 flex items-center justify-center text-[var(--color-accent-primary)] opacity-80"
            title="Pinned"
          >
            <Pin size={10} className="fill-current rotate-45" />
          </div>
        )}
      </button>
    </div>
  )
}

export default React.memo(SnippetSidebarRow)
