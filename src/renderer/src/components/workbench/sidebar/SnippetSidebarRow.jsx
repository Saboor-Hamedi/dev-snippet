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

// Optimized Dot Component
const UnsavedDot = React.memo(() => (
  <div
    className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,1)] flex-shrink-0 animate-pulse border border-yellow-200/20"
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
          <span key={`match-${i}`} className="text-white/60 font-bold">
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
  if (isDateTitle(cleanTitle)) return { icon: Calendar, color: '#818cf8' } // Classic Journal Color

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
        className="group flex items-center gap-[6px] w-full h-full pr-2 relative rounded-[6px] transition-all duration-200 cursor-pointer"
        style={{
          marginLeft: '4px',
          width: 'calc(100% - 8px)',
          backgroundColor: isCollapsed ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.05)'
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
          className="absolute top-0 bottom-0 w-[1px] bg-white opacity-10"
          style={{ left: `${i * 16 + 13}px` }}
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
        className="outline-none focus:outline-none relative animate-in fade-in slide-in-from-left-2 duration-500 fill-mode-backwards"
        style={{ ...style, animationDelay: `${Math.min(index * 15, 300)}ms` }}
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
        {isSelected && (
          <div className="absolute left-1 top-1 bottom-1 w-[2px] bg-[var(--color-accent-primary)] rounded-full z-10" />
        )}
        <div
          className={`group flex items-center gap-[6px] w-full h-full select-none transition-all duration-200 pr-2 relative rounded-[6px] ${
            isDragOver
              ? 'bg-[var(--color-accent-primary)] bg-opacity-20'
              : isSelected
                ? 'bg-white/[0.06] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
                : 'hover:bg-white/[0.03]'
          }`}
          style={{
            color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
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
            className={`flex-shrink-0 flex items-center justify-center rounded transition-all ${
              isSelected ? 'opacity-100' : 'opacity-40 hover:opacity-100'
            }`}
          >
            <ChevronRight
              size={isCompact ? 10 : 12}
              className={`transition-transform duration-300 ${isOpen ? 'rotate-90 text-[var(--color-accent-primary)]' : ''}`}
            />
          </button>
          <div
            className={`flex-shrink-0 px-0.5 transition-colors ${isSelected ? 'text-[var(--color-accent-primary)] opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
          >
            {itemData.name === '📥 Inbox' ? (
              <Inbox size={14} className="text-indigo-400" />
            ) : isOpen ? (
              <FolderOpen size={14} />
            ) : (
              <Folder size={14} />
            )}
          </div>
          <span
            className={`flex-1 truncate text-[12px] pl-1 tracking-tight ${isSelected ? 'font-bold' : 'font-medium opacity-80 group-hover:opacity-100'}`}
          >
            {itemData.name}
          </span>
          {itemData.itemCount > 0 && (
            <span className="text-[10px] opacity-20 group-hover:opacity-50 pr-1 tabular-nums font-mono">
              {itemData.itemCount}
            </span>
          )}
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

  const { todayStr } = data
  // Strict match for Today's Daily Note (ISO format)
  const isTodayLog = getBaseTitle(itemData.title) === todayStr

  return (
    <div
      style={{ ...style, animationDelay: `${Math.min(index * 15, 300)}ms` }}
      className="relative group/row animate-in fade-in slide-in-from-left-2 duration-500 fill-mode-backwards"
    >
      <IndentGuides depth={depth} />
      {isSelected && (
        <div className="absolute left-1 top-1.5 bottom-1.5 w-[2px] bg-[var(--color-accent-primary)] rounded-full z-10" />
      )}
      <button
        id={`sidebar-item-${index}`}
        data-snippet-id={itemData.id}
        draggable
        onClick={handleItemClick}
        onKeyDown={(e) => handleItemKeyDown(e, index)}
        onContextMenu={(e) => onContextMenu(e, 'snippet', itemData)}
        className={`flex items-center gap-[6px] w-full h-full select-none pr-3 relative transition-all duration-150 ${
          isCompact ? 'text-[11px]' : 'text-[12px]'
        } ${
          isSelected
            ? 'bg-white/[0.06] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]'
            : isSearchMatch
              ? 'bg-[var(--color-accent-primary)]/5 border-l-2 border-[var(--color-accent-primary)]'
              : 'hover:bg-white/[0.03]'
        } rounded-[6px]`}
        style={{
          color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
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
            isSelected || itemData.is_modified
              ? 'font-bold'
              : 'font-medium opacity-80 group-hover/row:opacity-100'
          }`}
          style={{
            textShadow: itemData.is_modified ? '0 0 12px rgba(234, 179, 8, 0.3)' : 'none'
          }}
        >
          <HighlightText text={safeTitle || 'Untitled'} highlight={searchQuery} />
          {isTodayLog && (
            <span className="text-[8px] px-1 py-0 rounded bg-indigo-500/20 text-indigo-400 font-black uppercase tracking-widest border border-indigo-500/20">
              Live
            </span>
          )}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Status Indicators, the dot */}
          {(itemData.is_modified || itemData.is_dirty) && <UnsavedDot />}
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
