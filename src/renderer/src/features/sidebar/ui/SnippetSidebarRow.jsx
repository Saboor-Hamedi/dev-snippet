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
  Calendar,
  Edit2
} from 'lucide-react'

import { getFileIcon, getFolderIcon } from '../../../utils/iconUtils'
import { getBaseTitle, isDateTitle } from '../../../utils/snippetUtils'
import { useSidebarStore } from '../store/useSidebarStore'
import { getDisplayTitle } from '../../../utils/editorUtils'
import './SnippetSidebar.css'

/**
 * UnsavedDot
 * Visual indicator for "Dirty" state (unsaved changes).
 */
const UnsavedDot = React.memo(() => (
  <div
    className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.5)] flex-shrink-0 animate-pulse border border-yellow-300/30 ml-auto"
    title="Modified (Unsaved Changes)"
  />
))

/**
 * HighlightText
 * Splits text and wraps matches in a highlighted span for search results.
 */
const HighlightText = ({ text, highlight }) => {
  if (!highlight || !highlight.trim()) return <span className="truncate">{text}</span>
  const terms = highlight
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

  if (terms.length === 0) return <span className="truncate">{text}</span>

  const regex = new RegExp(`(${terms.join('|')})`, 'gi')
  const parts = text.split(regex)
  return (
    <span className="opacity-100 truncate">
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

/**
 * PinnedHeaderRow
 * The "Pinned" category header that allows collapsing the pinned section.
 */
const PinnedHeaderRow = ({ style, data, togglePinned }) => {
  const isCollapsed = data ? data.collapsed : false
  return (
    <div style={style} className="select-none outline-none focus:outline-none relative py-1">
      <div
        className="sidebar-row-inner group h-full cursor-pointer opacity-80 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          togglePinned()
        }}
      >
        <button
          className="flex-shrink-0 flex items-center justify-center rounded w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity ml-1"
        >
          <ChevronRight
            size={12}
            className={`transition-transform duration-300 ${!isCollapsed ? 'rotate-90' : ''}`}
          />
        </button>
        <div
          className="flex-shrink-0 opacity-80 group-hover:opacity-100 px-0.5 text-[var(--color-accent-primary)]"
        >
          <Pin size={12} className="fill-current" />
        </div>
        <span
          className="flex-1 truncate font-bold text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-90 pl-1 text-[var(--color-text-secondary)]"
        >
          Pinned
        </span>
      </div>
    </div>
  )
}

/**
 * CreationInputRow
 * Floating input field for naming new folders or snippets.
 */
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
        // Smart Selection: Select filename but skip extension
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

      // Industrial Sanitization
      let safe = raw.replace(/\.md$/i, '').trim()
      safe = safe.replace(/[?*"><]/g, '') // Remove illegal chars
      safe = safe.replace(/[:/\\|]/g, '-') // Swap separators for dashes
      safe = safe.trim()

      if (!safe) safe = isFolder ? 'Untitled Folder' : 'Untitled'
      onConfirm(safe, itemData.type, itemData.parentId)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onCancel()
    }
  }

  return (
    <div style={style} className="z-20 py-0.5 pl-2">
      <div
        className="flex items-center w-full h-full select-none animate-in fade-in slide-in-from-left-2 duration-200"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        <div className="flex-1 flex items-center bg-[var(--color-bg-primary)] h-[24px] rounded-md ring-1 ring-[var(--color-accent-primary)]/40 shadow-xl overflow-hidden mr-3">
          <div className="flex-shrink-0 flex items-center justify-center px-1.5 opacity-40">
            {isFolder ? <ChevronRight size={10} /> : <File size={10} />}
          </div>
          <input
            ref={inputRef}
            type="text"
            defaultValue={initialValue}
            placeholder={isFolder ? 'Folder Name' : 'Snippet Name'}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => onCancel(), 150)}
            spellCheck="false"
            autoComplete="off"
            className="flex-1 min-w-0 px-0 py-0 outline-none ring-0 focus:ring-0 focus:outline-none border-none bg-transparent text-[var(--color-text-primary)] text-[12px]"
            style={{
              height: '100%',
              border: 'none',
              outline: 'none'
            }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * IndentGuides
 * Renders vertical lines to help identify the parent/child folder hierarchy.
 */
const IndentGuides = ({ depth, activePath = [] }) => {
  if (depth <= 0) return null
  return (
    <div
      className="absolute top-0 left-0 h-full pointer-events-none z-0"
      style={{ width: depth * 16 + 8 }}
    >
      {Array.from({ length: depth }).map((_, i) => {
        const isActive = activePath.includes(i)
        return (
          <div
            key={i}
            className={`absolute top-0 bottom-0 w-[1px] bg-[var(--color-border)] transition-all duration-200 ${
              isActive 
                ? 'opacity-40' 
                : 'opacity-10 group-hover/row:opacity-20'
            }`}
            style={{ 
              left: `${i * 16 + 18}px`,
              boxShadow: isActive ? '0 0 4px rgba(var(--color-accent-primary-rgb, 59, 130, 246), 0.3)' : 'none'
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * SnippetSidebarRow
 */
const SnippetSidebarRow = ({ index, style, data }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const dragExpandTimerRef = React.useRef(null)

  const {
    treeItems,
    selectedSnippet,
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
    onConfirmCreation,
    onCancelCreation,
    onInlineRename,
    onCancelRenaming,
    startCreation,
    handleSelectionInternal,
    todayStr,
    folders,
    activePath
  } = data

  const {
    selectedFolderId,
    selectedIds,
    searchQuery,
    setSidebarSelected
  } = useSidebarStore()

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
        style={{ ...style, minHeight: '200px' }}
        className="cursor-default group/footer relative"
        onClick={(e) => {
          e.stopPropagation()
          onSelectionChange([])
          onSelect(null)
          onSelectFolder(null)
          setSidebarSelected(true)
        }}
        onContextMenu={(e) => onContextMenu && onContextMenu(e, 'background', null)}
      >
        <div className="absolute inset-x-2 inset-y-0 rounded-lg transition-colors group-hover/footer:bg-[var(--color-bg-tertiary)]/20" />
      </div>
    )
  }

  // --- DRAG & DROP LOGIC ---
  const handleDragStart = (e) => {
    let dragIds = [itemData.id]
    let dragTypes = [type === 'pinned_snippet' ? 'snippet' : type]
    if (selectedIds.includes(item.id)) {
      dragIds = selectedIds.map(sid => sid.replace(/^pinned-/, ''))
      dragTypes = selectedIds.map(id => {
        const found = treeItems.find(i => i.id === id)
        return found ? (found.type === 'pinned_snippet' ? 'snippet' : found.type) : 'snippet'
      })
    }
    e.dataTransfer.setData('sourceIds', JSON.stringify(dragIds))
    e.dataTransfer.setData('sourceTypes', JSON.stringify(dragTypes))
    e.dataTransfer.effectAllowed = 'move'
    const ghost = document.createElement('div')
    ghost.style.cssText = 'position:absolute;top:-1000px;left:-1000px;padding:4px 8px;background:var(--color-bg-secondary);border:1px solid var(--color-accent-primary);border-radius:6px;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:999999;'
    ghost.innerHTML = `<span>${dragIds.length > 1 ? `${dragIds.length} items` : (itemData.name || itemData.title)}</span>`
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 10, 10)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  const handleDragOver = (e) => {
    if (type === 'folder') {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(true)
      const isCurrentlyOpen = !itemData.collapsed
      if (!isCurrentlyOpen && !dragExpandTimerRef.current) {
        dragExpandTimerRef.current = setTimeout(() => onToggleFolder(itemData.id, true), 400)
      }
    }
  }

  const handleDragLeave = (e) => {
    if (type === 'folder') {
      const rect = e.currentTarget.getBoundingClientRect()
      const { clientX, clientY } = e
      if (clientX <= rect.left || clientX >= rect.right || clientY <= rect.top || clientY >= rect.bottom) {
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
      const isDescendant = (movingId, targetId) => {
        let curr = targetId
        while (curr) {
          const folder = folders.find((f) => f.id === curr)
          if (!folder) break
          if (folder.parent_id === movingId) return true
          curr = folder.parent_id
        }
        return false
      }
      try {
        const sourceIds = JSON.parse(e.dataTransfer.getData('sourceIds') || '[]')
        const sourceTypes = JSON.parse(e.dataTransfer.getData('sourceTypes') || '[]')
        if (sourceIds.includes(itemData.id)) return
        const sIds = sourceIds.filter((_, idx) => sourceTypes[idx] === 'snippet')
        const fIds = sourceIds.filter((_, idx) => sourceTypes[idx] === 'folder')
        const illegalMove = fIds.some((fId) => isDescendant(fId, itemData.id))
        if (illegalMove) return
        if (sIds.length > 0) onMoveSnippet(sIds, itemData.id)
        if (fIds.length > 0) onMoveFolder(fIds, itemData.id)
      } catch (err) {}
    }
  }

  const handleItemClick = (e) => {
    handleSelectionInternal(e, item.id, type)
  }

  // --- RENDER: FOLDER ROW ---
  if (type === 'folder') {
    if (item.isEditing) {
      return (
        <CreationInputRow
          style={style}
          depth={depth}
          itemData={{ ...itemData, type: 'folder' }}
          onConfirm={(val) => {
            onInlineRename(itemData.id, val, 'folder')
            onCancelRenaming()
          }}
          onCancel={onCancelRenaming}
          isCompact={isCompact}
          initialValue={itemData.name}
        />
      )
    }
    const isHighlight = selectedIds.includes(item.id)
    const isOpen = !itemData.collapsed
    const { icon: FolderIcon, color: folderColor } = getFolderIcon(itemData.name, isOpen)
    return (
      <div
        id={`sidebar-item-${index}`}
        className="outline-none focus:outline-none relative group/row py-0.5"
        style={{ ...style }}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0}
        onClick={handleItemClick}
        onKeyDown={(e) => handleItemKeyDown(e, index)}
        onContextMenu={(e) => onContextMenu(e, type, itemData)}
      >
        <IndentGuides depth={depth} activePath={activePath} />
        <div
          className={`sidebar-row-inner group h-full select-none transition-all duration-75 ${isHighlight ? 'is-selected' : ''} ${isDragOver ? 'drop-target-magnetic animate-pulse ring-1 ring-[var(--color-accent-primary)]/50' : ''}`}
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFolder(itemData.id, !itemData.collapsed)
            }}
            className={`flex-shrink-0 flex items-center justify-center rounded w-5 h-5 ml-1 transition-opacity ${isHighlight ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
          >
            <ChevronRight
              size={isCompact ? 11 : 13}
              className={`transition-transform duration-300 ${isOpen ? 'rotate-90 text-[var(--color-accent-primary)]' : ''}`}
            />
          </button>
          <div className="flex-shrink-0 px-0.5 ml-0.5">
            {itemData.name === '📥 Inbox' ? (
              <Inbox size={14} className={isHighlight ? 'text-white' : 'text-[var(--color-accent-primary)]'} />
            ) : (
              <FolderIcon size={14} style={{ color: isHighlight ? '#fff' : folderColor }} />
            )}
          </div>
          <span className={`flex-1 truncate text-[12.5px] pl-1 tracking-tight ${isHighlight ? 'font-bold' : 'font-medium opacity-85'}`}>
            {itemData.name}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
            <button
               onClick={(e) => { e.stopPropagation(); startCreation('snippet', itemData.id); }}
               className="p-1 rounded hover:bg-white/20 text-inherit transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          {itemData.itemCount > 0 && !isHighlight && (
            <span className="text-[10px] opacity-30 group-hover:opacity-0 pr-1 tabular-nums font-mono transition-opacity">
              {itemData.itemCount}
            </span>
          )}
        </div>
      </div>
    )
  }

  // --- RENDER: SNIPPET ROW ---
  if (item.isEditing) {
    return (
      <CreationInputRow
        style={style}
        depth={depth}
        itemData={{ ...itemData, type: 'snippet' }}
        onConfirm={(val) => {
          onInlineRename(type === 'pinned_snippet' ? item.realId : itemData.id, val, 'snippet')
          onCancelRenaming()
        }}
        onCancel={onCancelRenaming}
        isCompact={isCompact}
        initialValue={itemData.title}
      />
    )
  }
  const itemId = type === 'pinned_snippet' ? item.realId : itemData.id
  const isSelected = selectedIds.includes(item.id)
  const safeTitle = typeof itemData.title === 'string' ? itemData.title : ''
  const { icon: Icon, color } = getFileIcon(itemData.language, safeTitle)
  const isTodayLog = getBaseTitle(itemData.title) === todayStr
  return (
    <div style={{ ...style }} className="relative group/row py-0.5">
      <IndentGuides depth={depth} activePath={activePath} />
      <button
        id={`sidebar-item-${index}`}
        data-snippet-id={itemId}
        draggable
        onDragStart={handleDragStart}
        onClick={handleItemClick}
        onKeyDown={(e) => handleItemKeyDown(e, index)}
        onContextMenu={(e) => onContextMenu(e, type, itemData)}
        className={`sidebar-row-inner theme-exempt group select-none outline-none focus:outline-none relative transition-all duration-75 ${isSelected ? 'is-selected' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 24}px` }}
      >
        <div
          className={`flex-shrink-0 flex items-center justify-center transition-all sidebar-item-icon ${isSelected ? 'scale-110 opacity-100' : 'opacity-60 group-hover/row:opacity-100'}`}
          style={{ color: isSelected ? '#fff' : color }}
        >
          <Icon size={14} />
        </div>
        <span className={`flex-1 truncate pl-1 text-left flex items-center gap-2 text-[12.5px] ${isSelected || itemData.is_dirty ? 'font-bold' : 'font-medium opacity-85'}`}>
          <HighlightText text={getDisplayTitle(safeTitle)} highlight={searchQuery} />
          {isTodayLog && (
            <span className={`text-[8px] px-1 py-0 rounded font-black uppercase tracking-widest border ${isSelected ? 'bg-white/20 border-white/20 text-white' : 'bg-[var(--color-accent-primary)]/20 border-[var(--color-accent-primary)]/20 text-[var(--color-accent-primary)]'}`}>
              Today
            </span>
          )}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0 pr-1">
          {itemData.is_dirty && <UnsavedDot />}
          {itemData.is_pinned === 1 && (
            <div className={isSelected ? 'text-white' : 'text-[var(--color-accent-primary)] opacity-80'}>
              <Pin size={12} className="fill-current" />
            </div>
          )}
          {itemData.is_favorite === 1 && (
            <div className={isSelected ? 'text-white' : 'text-[var(--color-accent-primary)] opacity-90'}>
              <Star size={13} className="fill-current" />
            </div>
          )}
        </div>
      </button>
    </div>
  )
}

export default React.memo(SnippetSidebarRow)
