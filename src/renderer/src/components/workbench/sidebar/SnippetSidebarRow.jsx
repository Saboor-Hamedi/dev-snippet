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

import { getBaseTitle, isDateTitle } from '../../../utils/snippetUtils'

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
  const safeTitle = typeof title === 'string' ? title : ''
  let cleanTitle = safeTitle.toLowerCase()
  let isMd = false

  if (cleanTitle.endsWith('.md')) {
    const temp = cleanTitle.slice(0, -3)
    if (temp.includes('.')) {
      cleanTitle = temp
    } else {
      isMd = true
    }
  }

  const extension = cleanTitle.split('.').pop() || ''

  // Daily Note Detection (ISO or String dates)
  if (isDateTitle(cleanTitle)) return { icon: Calendar, color: '#818cf8' } // Indigo for journals

  if (lang === 'javascript' || lang === 'js' || extension === 'js')
    return { icon: FileCode, color: '#f7df1e' }
  if (lang === 'typescript' || lang === 'ts' || extension === 'ts')
    return { icon: FileCode, color: '#007acc' }
  if (lang === 'react' || extension === 'jsx' || extension === 'tsx')
    return { icon: FileCode, color: '#61dafb' }
  if (lang === 'css' || extension === 'css') return { icon: FileCode, color: '#264de4' }
  if (lang === 'html' || extension === 'html') return { icon: FileCode, color: '#e34c26' }
  if (lang === 'python' || extension === 'py') return { icon: FileCode, color: '#3776ab' }

  if (lang === 'markdown' || lang === 'md' || extension === 'md' || isMd)
    return { icon: FileText, color: '#519aba' }

  return { icon: File, color: 'var(--sidebar-icon-color)' }
}

const PinnedHeaderRow = ({ style, data, togglePinned }) => {
  const isCollapsed = data ? data.collapsed : false
  return (
    <div style={style} className="select-none outline-none focus:outline-none relative">
      <div
        className="group flex items-center gap-[4px] w-full h-full pr-2 relative rounded-[4px] hover:bg-white/[0.02] cursor-pointer"
        style={{ paddingLeft: '8px', width: 'calc(100% - 8px)', margin: '0 4px' }}
        onClick={(e) => {
          e.stopPropagation()
          togglePinned()
        }}
      >
        <button
          className="flex-shrink-0 flex items-center justify-center rounded w-4 h-4 opacity-40 hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation()
            togglePinned()
          }}
        >
          <ChevronRight
            size={12}
            className={`transition-transform duration-200 ${!isCollapsed ? 'rotate-90' : ''}`}
          />
        </button>
        <div
          className="flex-shrink-0 opacity-70 group-hover:opacity-100 px-0.5"
          style={{ color: 'var(--color-accent-primary)' }}
        >
          <Pin size={14} className="fill-current" />
        </div>
        <span
          className="flex-1 truncate font-medium text-[12px] opacity-80 group-hover:opacity-100 pl-1"
          style={{ color: 'var(--sidebar-header-text)' }}
        >
          Pinned
        </span>
      </div>
    </div>
  )
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
        style={{ paddingLeft: `${depth * 16 + 24}px` }}
      >
        <div className="flex-1 flex items-center bg-[var(--color-bg-secondary)] border border-[var(--color-accent-primary)]/50 rounded-sm h-[22px]">
          <input
            ref={inputRef}
            type="text"
            placeholder={isFolder ? 'Folder Name' : 'Snippet Name'}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              e.target.style.backgroundColor = 'var(--color-bg-primary)'
              e.target.style.borderColor = 'var(--color-accent-primary)'
            }}
            onBlur={(e) => {
              e.target.style.backgroundColor = 'var(--color-bg-secondary)'
              e.target.style.borderColor = 'var(--color-border)'
              onCancel()
            }}
            spellCheck="false"
            autoComplete="off"
            className={`flex-1 min-w-0 rounded-[5px] px-2 py-0.5 outline-none border border-[var(--color-border)] ring-0 focus:ring-0 focus:outline-none transition-none ${
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
      className="absolute top-0 left-0 h-full pointer-events-none"
      style={{ width: depth * 16 + 8 }}
    >
      {Array.from({ length: depth }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0 bottom-0 w-[1px] bg-[var(--color-border)] opacity-30"
          style={{ left: `${i * 16 + 12}px` }}
        />
      ))}
    </div>
  )
}

const SnippetSidebarRow = ({ index, style, data }) => {
  const [isDragOver, setIsDragOver] = useState(false)

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

  const handleDragOver = (e) => {
    if (type === 'folder') {
      e.preventDefault()
      e.stopPropagation()
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
        const sIds = sourceIds.filter((_, idx) => sourceTypes[idx] === 'snippet')
        const fIds = sourceIds.filter((_, idx) => sourceTypes[idx] === 'folder')
        if (sIds.length > 0) onMoveSnippet(sIds, itemData.id)
        if (fIds.length > 0) onMoveFolder(fIds, itemData.id)
      } catch (err) {}
    }
  }

  const handleItemClick = (e) => {
    let newSelection = []
    const itemId = type === 'pinned_snippet' ? item.realId : itemData.id

    if (e.shiftKey && lastSelectedIdRef.current) {
      const lastIndex = treeItems.findIndex((i) => i.id === lastSelectedIdRef.current)
      if (lastIndex !== -1) {
        const start = Math.min(lastIndex, index)
        const end = Math.max(lastIndex, index)
        newSelection = [...selectedIds]
        for (let i = start; i <= end; i++) {
          const id = treeItems[i].type === 'pinned_snippet' ? treeItems[i].realId : treeItems[i].id
          if (!newSelection.includes(id)) newSelection.push(id)
        }
      }
    } else if (e.ctrlKey || e.metaKey) {
      newSelection = selectedIds.includes(itemId)
        ? selectedIds.filter((id) => id !== itemId)
        : [...selectedIds, itemId]
    } else {
      newSelection = [itemId]
      if (type === 'snippet' || type === 'pinned_snippet') {
        onSelect(itemData)
      } else {
        onSelectFolder(itemId)
        onToggleFolder(itemId, !item.isExpanded)
      }
    }

    lastSelectedIdRef.current = treeItems[index].id
    onSelectionChange(newSelection)
  }

  if (type === 'folder') {
    const isSelected = selectedIds.includes(itemData.id) || selectedFolderId === itemData.id
    const isOpen = !itemData.collapsed

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
        onKeyDown={(e) => handleItemKeyDown(e, index)}
        onContextMenu={(e) => onContextMenu(e, 'folder', itemData)}
      >
        <IndentGuides depth={depth} />
        <div
          className={`group flex items-center gap-[4px] w-full h-full select-none transition-all duration-150 pr-2 relative rounded-[4px] ${
            isDragOver
              ? 'bg-[var(--color-accent-primary)] bg-opacity-20'
              : isSelected
                ? 'bg-[var(--selected-bg)]'
                : 'hover:bg-white/[0.02]'
          }`}
          style={{
            color: isSelected ? 'var(--selected-text)' : 'var(--sidebar-header-text)',
            paddingLeft: `${depth * 16 + 8}px`,
            width: 'calc(100% - 8px)',
            margin: '0 4px'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFolder(itemData.id, !itemData.collapsed)
            }}
            className={`flex-shrink-0 flex items-center justify-center rounded w-4 h-4 ${
              isSelected ? 'bg-white/10' : 'opacity-40 hover:opacity-100'
            }`}
          >
            <ChevronRight
              size={isCompact ? 10 : 12}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
            />
          </button>
          <div className="flex-shrink-0 opacity-70 group-hover:opacity-100 px-0.5">
            {itemData.name === '📥 Inbox' ? (
              <Inbox size={14} className="text-indigo-400" />
            ) : isOpen ? (
              <FolderOpen size={14} />
            ) : (
              <Folder size={14} />
            )}
          </div>
          <span className="flex-1 truncate font-medium text-[12px] opacity-80 group-hover:opacity-100 pl-1">
            {itemData.name}
          </span>
        </div>
      </div>
    )
  }

  const itemId = type === 'pinned_snippet' ? item.realId : itemData.id
  const isSelected =
    selectedIds.includes(itemId) || (selectedSnippet?.id === itemId && !selectedFolderId)
  const safeTitle = typeof itemData.title === 'string' ? itemData.title : ''
  const { icon: Icon, color } = getFileIcon(itemData.language, safeTitle)
  const isSearchMatch =
    searchQuery && safeTitle.toLowerCase().includes(searchQuery.toLowerCase().trim())

  const todayStr = new Date().toISOString().split('T')[0]
  // Strict match for Today's Daily Note (ISO format)
  const isTodayLog = getBaseTitle(itemData.title) === todayStr

  return (
    <div style={style} className="relative group/row">
      <IndentGuides depth={depth} />
      <button
        id={`sidebar-item-${index}`}
        data-snippet-id={itemData.id}
        draggable
        onClick={handleItemClick}
        onKeyDown={(e) => handleItemKeyDown(e, index)}
        onContextMenu={(e) => onContextMenu(e, 'snippet', itemData)}
        className={`flex items-center gap-[4px] w-full h-full select-none pr-2 relative ${
          isCompact ? 'text-[11px]' : 'text-[12px]'
        } ${
          isSelected
            ? 'bg-[var(--selected-bg)]'
            : isSearchMatch
              ? 'bg-[var(--color-accent-primary)]/10'
              : 'hover:bg-white/[0.02]'
        } rounded-[4px]`}
        style={{
          color: isSelected ? 'var(--selected-text)' : 'var(--sidebar-text)',
          paddingLeft: `${depth * 16 + 24}px`,
          width: 'calc(100% - 8px)',
          margin: '0 4px'
        }}
      >
        <div
          className={`flex-shrink-0 flex items-center justify-center px-0.5 ${
            !isSelected ? 'opacity-60' : ''
          }`}
          style={{ color: isSelected ? 'inherit' : color }}
        >
          <Icon size={14} />
        </div>
        <span className="flex-1 truncate opacity-80 group-hover/row:opacity-100 pl-1 text-left flex items-center gap-2">
          <HighlightText text={safeTitle || 'Untitled'} highlight={searchQuery} />
          {isTodayLog && (
            <span className="text-[8px] px-1 py-0 rounded bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] font-bold uppercase tracking-tighter animate-pulse">
              Today
            </span>
          )}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Status Indicators (Proposed DevSnippet Evolution Feature) */}
          {!!itemData.is_modified && (
            <div
              className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)] flex-shrink-0"
              title="Modified (Unsaved Changes)"
            />
          )}
          {!!itemData.is_draft && (
            <div
              className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)] flex-shrink-0"
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
