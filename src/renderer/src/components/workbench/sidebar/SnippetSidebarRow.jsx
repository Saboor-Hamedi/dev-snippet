import React, { useState } from 'react'
import {
  File,
  FileCode,
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Pin,
  Inbox,
  Star,
  Calendar
} from 'lucide-react'

import { getFileIcon, getFolderIcon } from '../../../utils/iconUtils'
import { getBaseTitle, isDateTitle } from '../../../utils/snippetUtils'
import { useSidebarStore } from '../../../store/useSidebarStore'

const UnsavedDot = React.memo(() => (
  <div
    className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] flex-shrink-0 animate-pulse border border-amber-300/30"
    title="Modified (Unsaved Changes)"
  />
))

// Helper to highlight matching text
const HighlightText = ({ text, highlight }) => {
  if (!highlight || !highlight.trim()) return <span>{text}</span>
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
          <span key={`match-${i}`} className="text-[var(--color-accent-primary)] font-bold">
            {part}
          </span>
        ) : (
          <span key={`text-${i}`}>{part}</span>
        )
      )}
    </span>
  )
}

const PinnedHeaderRow = ({ style, data, togglePinned }) => {
  const isCollapsed = data ? data.collapsed : false
  return (
    <div style={style} className="select-none outline-none focus:outline-none relative">
      <div
        className="group flex items-center gap-[6px] w-full h-full pr-2 relative rounded-[6px] cursor-pointer"
        style={{
          marginLeft: '4px',
          width: 'calc(100% - 8px)',
          backgroundColor: isCollapsed ? 'transparent' : 'var(--color-bg-tertiary)',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--color-border)'
        }}
        onClick={(e) => {
          e.stopPropagation()
          togglePinned()
        }}
      >
        <button
          className="flex-shrink-0 flex items-center justify-center rounded w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            togglePinned()
          }}
        >
          <ChevronRight
            size={12}
            className={`transition-transform duration-300 ${!isCollapsed ? 'rotate-90' : ''}`}
          />
        </button>
        <div
          className="flex-shrink-0 opacity-80 group-hover:opacity-100 px-0.5"
          style={{ color: 'var(--color-accent-primary)' }}
        >
          <Pin size={12} className="fill-current" />
        </div>
        <span
          className="flex-1 truncate font-bold text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-90 pl-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Pinned
        </span>
      </div>
    </div>
  )
}

const CreationInputRow = ({
  style,
  depth,
  itemData,
  onConfirm,
  onCancel,
  isCompact,
  initialValue = ''
}) => {
  const isFolder = itemData.type === 'folder'
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      if (initialValue) {
        // Select base name without extension if it's a snippet
        const dotIndex = initialValue.lastIndexOf('.')
        if (dotIndex > 0 && !isFolder) {
          inputRef.current.setSelectionRange(0, dotIndex)
        } else {
          inputRef.current.select()
        }
      }
    }
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      const raw = inputRef.current.value

      // Sanitize: Smart Logic
      let safe = raw.replace(/\.md$/i, '').trim()
      // Remove punctuation, replace separators
      safe = safe.replace(/[?*"><]/g, '')
      safe = safe.replace(/[:/\\|]/g, '-')
      safe = safe.trim()

      if (!safe) safe = isFolder ? 'Untitled Folder' : 'Untitled Snippet'

      onConfirm(safe, itemData.type, itemData.parentId)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onCancel()
    }
  }

  return (
    <div style={style} className="pr-2 z-20">
      <div
        className="flex items-center w-full h-full pl-0 select-none animate-in fade-in slide-in-from-left-2 duration-200"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <div className="flex-1 flex items-center bg-[var(--color-bg-primary)] border border-[var(--color-accent-primary)]/50 rounded-md h-[24px] shadow-lg shadow-black/20">
          <input
            ref={inputRef}
            type="text"
            defaultValue={initialValue}
            placeholder={isFolder ? 'Folder Name' : 'Snippet Name'}
            onKeyDown={handleKeyDown}
            onBlur={(e) => {
              // Wait a bit to allow click on confirm button if we add one, or handle logic
              setTimeout(() => onCancel(), 150)
            }}
            spellCheck="false"
            autoComplete="off"
            className={`flex-1 min-w-0 px-2 py-0.5 outline-none ring-0 focus:ring-0 focus:outline-none transition-none ${
              isCompact ? 'text-[11px]' : 'text-[12px]'
            }`}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary)',
              boxShadow: 'none',
              height: '100%'
            }}
          />
        </div>
      </div>
    </div>
  )
}

const IndentGuides = ({ depth }) => {
  if (depth <= 0) return null
  return (
    <div
      className="absolute top-0 left-0 h-full pointer-events-none z-0"
      style={{ width: depth * 16 + 8 }}
    >
      {Array.from({ length: depth }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-[1px] bg-[var(--color-border)] opacity-30 group-hover/row:opacity-60 transition-opacity"
          style={{ left: `${i * 16 + 13}px` }}
        />
      ))}
    </div>
  )
}

const SnippetSidebarRow = ({ index, style, data }) => {
  // 1. Hooks (MUST be unconditional and always in the same order)
  const [isDragOver, setIsDragOver] = useState(false)
  const dragExpandTimerRef = React.useRef(null)

  const {
    treeItems,
    selectedSnippet,
    // selectedFolderId - from store
    // selectedIds - from store
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
    // searchQuery - from store
    onConfirmCreation,
    onCancelCreation,
    onInlineRename,
    onCancelRenaming,
    startCreation,
    // setSidebarSelected - from store
    handleSelectionInternal // Fix: Destructure this
  } = data

  const {
    selectedFolderId,
    selectedIds,
    searchQuery,
    setSidebarSelected,
    setSelectedIds,
    setSelectedFolderId
  } = useSidebarStore()

  // 2. Data Retrieval
  const item = treeItems[index]
  if (!item) return null

  const { type, data: itemData, depth } = item

  if (type === 'pinned_header') {
    return <PinnedHeaderRow style={style} data={itemData} togglePinned={data.togglePinned} />
  }

  if (type === 'section_spacer') {
    return <div style={{ ...style, height: '8px' }} className="pointer-events-none" />
  }

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

  if (type === 'sidebar_footer') {
    return (
      <div
        style={{ ...style, height: isCompact ? '24px' : '30px' }}
        className="cursor-default group/footer"
        onClick={(e) => {
          e.stopPropagation()
          setSelectedIds([])
          onSelect(null)
          setSelectedFolderId(null)
          setSidebarSelected(true)
        }}
        onContextMenu={(e) => {
          if (onContextMenu) onContextMenu(e, 'background', null)
        }}
      >
        {/* Subtle visual hint that this is a clickable space */}
        <div className="mx-1 h-full rounded-[6px] transition-colors group-hover/footer:bg-[var(--color-bg-tertiary)] opacity-30" />
      </div>
    )
  }

  const handleDragStart = (e) => {
    let dragIds = [itemData.id]
    let dragTypes = [type === 'pinned_snippet' ? 'snippet' : type]

    if (selectedIds.includes(itemData.id)) {
      dragIds = selectedIds
      dragTypes = selectedIds.map((id) => {
        const found = treeItems.find((i) => i.id === id || i.realId === id)
        return found ? (found.type === 'pinned_snippet' ? 'snippet' : found.type) : 'snippet'
      })
    }

    e.dataTransfer.setData('sourceIds', JSON.stringify(dragIds))
    e.dataTransfer.setData('sourceTypes', JSON.stringify(dragTypes))
    e.dataTransfer.effectAllowed = 'move'

    const ghost = document.createElement('div')
    ghost.style.position = 'absolute'
    ghost.style.top = '-1000px'
    ghost.style.left = '-1000px'
    ghost.style.padding = '4px 8px'
    ghost.style.background = 'var(--color-bg-secondary)'
    ghost.style.border = '1px solid var(--color-accent-primary)'
    ghost.style.borderRadius = '6px'
    ghost.style.maxWidth = '250px'
    ghost.style.display = 'flex'
    ghost.style.alignItems = 'center'
    ghost.style.gap = '6px'
    ghost.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'

    const iconDiv = document.createElement('div')
    iconDiv.innerHTML =
      type === 'folder'
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>'
    ghost.appendChild(iconDiv)

    const textSpan = document.createElement('span')
    textSpan.innerText =
      selectedIds.length > 1
        ? `${selectedIds.length} items`
        : itemData.name || itemData.title || 'Untitled'
    textSpan.style.color = 'var(--color-text-primary)'
    textSpan.style.fontSize = '12px'
    ghost.appendChild(textSpan)

    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 10, 10)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  // dragExpandTimerRef moved to top to fix hook order error

  const handleDragOver = (e) => {
    if (type === 'folder') {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(true)
      e.dataTransfer.dropEffect = 'move'

      // Auto-expand folder on drag-over after delay
      const isCurrentlyOpen = !itemData.collapsed
      if (!isCurrentlyOpen && !dragExpandTimerRef.current) {
        dragExpandTimerRef.current = setTimeout(() => {
          onToggleFolder(itemData.id, true)
        }, 400)
      }
    }
  }

  const handleDragLeave = (e) => {
    // Prevent flickering: only trigger leave if we actually left the folder row
    if (type === 'folder') {
      const rect = e.currentTarget.getBoundingClientRect()
      const { clientX, clientY } = e
      if (
        clientX <= rect.left ||
        clientX >= rect.right ||
        clientY <= rect.top ||
        clientY >= rect.bottom
      ) {
        setIsDragOver(false)
        if (dragExpandTimerRef.current) {
          clearTimeout(dragExpandTimerRef.current)
          dragExpandTimerRef.current = null
        }
      }
    }
  }

  const handleDrop = (e) => {
    if (dragExpandTimerRef.current) {
      clearTimeout(dragExpandTimerRef.current)
      dragExpandTimerRef.current = null
    }
    if (type === 'folder') {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      try {
        const sourceIds = JSON.parse(e.dataTransfer.getData('sourceIds') || '[]')
        const sourceTypes = JSON.parse(e.dataTransfer.getData('sourceTypes') || '[]')
        if (sourceIds.includes(itemData.id)) return
        const sIds = sourceIds.filter((_, idx) => sourceTypes[idx] === 'snippet')
        const fIds = sourceIds.filter((_, idx) => sourceTypes[idx] === 'folder')
        if (sIds.length > 0) onMoveSnippet(sIds, itemData.id)
        if (fIds.length > 0) onMoveFolder(fIds, itemData.id)
      } catch (err) {}
    }
  }

  const handleItemClick = (e) => {
    // Delegate to the robust logic hook which handles:
    // 1. Shift/Ctrl modifiers
    // 2. Unselecting conflicting types (snippet vs folder)
    // 3. Unselecting background (setSidebarSelected(false))
    handleSelectionInternal(e, item.id, type)
  }

  if (type === 'folder') {
    if (item.isEditing) {
      return (
        <CreationInputRow
          style={style}
          depth={depth}
          itemData={{ ...itemData, type: 'folder' }}
          onConfirm={(val) => {
            onInlineRename(itemData.id, val, 'folder')
            onCancelRenaming() // Close input immediately
          }}
          onCancel={onCancelRenaming}
          isCompact={isCompact}
          initialValue={itemData.name}
        />
      )
    }
    const isSelected = selectedIds.includes(itemData.id) || selectedFolderId === itemData.id
    const isOpen = !itemData.collapsed
    const { icon: FolderIcon, color: folderColor } = getFolderIcon(itemData.name, isOpen)

    return (
      <div
        id={`sidebar-item-${index}`}
        className="outline-none focus:outline-none relative group/row"
        style={{ ...style }}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0}
        onClick={handleItemClick}
        onKeyDown={(e) => handleItemKeyDown(e, index)}
        onContextMenu={(e) => onContextMenu(e, 'folder', itemData)}
      >
        <IndentGuides depth={depth} />
        {isSelected && (
          <div className="absolute left-1 top-1 bottom-1 w-[2px] bg-[var(--color-accent-primary)] rounded-full z-10" />
        )}
        <div
          className={`group flex items-center gap-[6px] w-full h-full select-none pr-2 relative rounded-[6px] transition-colors duration-150 ${
            isDragOver
              ? 'bg-[var(--color-accent-primary)] bg-opacity-20'
              : isSelected
                ? '' // Handled by style
                : 'hover:bg-[var(--sidebar-item-hover-bg)]'
          }`}
          style={{
            backgroundColor: isSelected ? 'var(--sidebar-item-active-bg)' : undefined,
            color: isSelected
              ? 'var(--sidebar-item-active-fg, var(--color-text-primary))'
              : 'var(--sidebar-text, var(--color-text-secondary))',
            paddingLeft: `${depth * 16 + 8}px`,
            width: 'calc(100% - 8px)',
            margin: '0 4px'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Explicitly toggle folder only (selection is separate)
              onToggleFolder(itemData.id, !itemData.collapsed)
            }}
            className={`flex-shrink-0 flex items-center justify-center rounded ${
              isSelected ? 'opacity-100' : 'opacity-40 hover:opacity-100'
            }`}
          >
            <ChevronRight
              size={isCompact ? 10 : 12}
              className={`transition-transform duration-300 ${isOpen ? 'rotate-90 text-[var(--color-accent-primary)]' : ''}`}
            />
          </button>
          <div
            className={`flex-shrink-0 px-0.5 ${isSelected ? 'text-[var(--color-accent-primary)] opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
          >
            {itemData.name === '📥 Inbox' ? (
              <Inbox size={14} className="text-[var(--color-accent-primary)]" />
            ) : (
              <FolderIcon
                size={14}
                style={{
                  color: isSelected ? 'var(--color-accent-primary)' : folderColor
                }}
              />
            )}
          </div>
          <span
            className={`flex-1 truncate text-[12px] pl-1 tracking-tight ${isSelected ? 'font-bold' : 'font-medium opacity-80 group-hover:opacity-100'}`}
          >
            {itemData.name}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                startCreation('snippet', itemData.id)
              }}
              title="New Snippet"
              className="p-1 rounded hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)] transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          {itemData.itemCount > 0 && (
            <span className="text-[10px] opacity-20 group-hover:opacity-0 pr-1 tabular-nums font-mono transition-opacity">
              {itemData.itemCount}
            </span>
          )}
        </div>
      </div>
    )
  }

  if (item.isEditing) {
    return (
      <CreationInputRow
        style={style}
        depth={depth}
        itemData={{ ...itemData, type: 'snippet' }}
        onConfirm={(val) => {
          onInlineRename(type === 'pinned_snippet' ? item.realId : itemData.id, val, 'snippet')
          onCancelRenaming() // Close input immediately
        }}
        onCancel={onCancelRenaming}
        isCompact={isCompact}
        initialValue={itemData.title}
      />
    )
  }

  const itemId = type === 'pinned_snippet' ? item.realId : itemData.id
  const isSelected =
    selectedIds.includes(itemId) || (selectedSnippet?.id === itemId && !selectedFolderId)
  const safeTitle = typeof itemData.title === 'string' ? itemData.title : ''
  const { icon: Icon, color } = getFileIcon(itemData.language, safeTitle)
  const isSearchMatch =
    searchQuery && safeTitle.toLowerCase().includes(searchQuery.toLowerCase().trim())

  const { todayStr } = data
  // Strict match for Today's Daily Note (ISO format)
  const isTodayLog = getBaseTitle(itemData.title) === todayStr

  return (
    <div style={{ ...style }} className="relative group/row">
      <IndentGuides depth={depth} />
      {isSelected && (
        <div className="absolute left-1 top-1.5 bottom-1.5 w-[2px] bg-[var(--color-accent-primary)] rounded-full z-10" />
      )}
      <button
        id={`sidebar-item-${index}`}
        data-snippet-id={itemData.id}
        draggable
        onDragStart={handleDragStart}
        onClick={handleItemClick}
        onKeyDown={(e) => handleItemKeyDown(e, index)}
        onContextMenu={(e) => onContextMenu(e, 'snippet', itemData)}
        className={`theme-exempt flex items-center gap-[6px] w-full h-full select-none pr-3 relative transition-all duration-150 ${
          isCompact ? 'text-[11px]' : 'text-[12px]'
        } ${
          isSelected
            ? '' // Handled by style
            : isSearchMatch
              ? 'bg-[var(--color-accent-primary)]/10'
              : 'hover:bg-[var(--sidebar-item-hover-bg)]'
        } rounded-[6px]`}
        style={{
          backgroundColor: isSelected ? 'var(--sidebar-item-active-bg)' : undefined,
          color: isSelected
            ? 'var(--sidebar-item-active-fg, var(--color-text-primary))'
            : 'var(--sidebar-text, var(--color-text-secondary))',
          paddingLeft: `${depth * 16 + 24}px`,
          width: 'calc(100% - 8px)',
          margin: '0 4px',
          fontFamily: 'inherit'
        }}
      >
        <div
          className={`flex-shrink-0 flex items-center justify-center px-0.5 transition-all ${
            isSelected ? 'scale-110 opacity-100' : 'opacity-50 group-hover/row:opacity-100'
          }`}
          style={{ color: isSelected ? 'var(--color-accent-primary)' : color }}
        >
          <Icon size={14} />
        </div>
        <span
          className={`flex-1 truncate pl-1 text-left flex items-center gap-2 ${
            isSelected || itemData.is_dirty
              ? 'font-bold'
              : 'font-medium opacity-80 group-hover/row:opacity-100'
          }`}
          style={{
            textShadow: itemData.is_dirty ? '0 0 12px rgba(234, 179, 8, 0.3)' : 'none'
          }}
        >
          <HighlightText text={safeTitle || 'Untitled'} highlight={searchQuery} />
          {isTodayLog && (
            <span className="text-[8px] px-1 py-0 rounded bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-primary)] font-black uppercase tracking-widest border border-[var(--color-accent-primary)]/20">
              Live
            </span>
          )}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Status Indicators, the dot */}
          {itemData.is_dirty && <UnsavedDot />}
          {!!itemData.is_draft && (
            <div
              className="w-1 h-1 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] flex-shrink-0"
              title="New (Draft)"
            />
          )}
          {itemData.is_pinned === 1 && (
            <div className="text-[var(--color-accent-primary)] opacity-80" title="Pinned">
              <Pin size={12} className="fill-current" />
            </div>
          )}
          {itemData.is_favorite === 1 && (
            <div className="text-[var(--color-accent-primary)] opacity-90" title="Favorite">
              <Star size={13} className="fill-current" />
            </div>
          )}
        </div>
      </button>
    </div>
  )
}

export default React.memo(SnippetSidebarRow)
