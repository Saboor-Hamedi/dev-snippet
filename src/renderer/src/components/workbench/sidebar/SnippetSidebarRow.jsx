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
  Inbox
} from 'lucide-react'

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
  // Code Files -> FileCode Icon
  if (lang === 'javascript' || lang === 'js' || extension === 'js')
    return { icon: FileCode, color: '#f7df1e' }
  if (lang === 'typescript' || lang === 'ts' || extension === 'ts')
    return { icon: FileCode, color: '#007acc' }
  if (lang === 'react' || extension === 'jsx' || extension === 'tsx')
    return { icon: FileCode, color: '#61dafb' }
  if (lang === 'css' || extension === 'css') return { icon: FileCode, color: '#264de4' }
  if (lang === 'html' || extension === 'html') return { icon: FileCode, color: '#e34c26' }
  if (lang === 'python' || extension === 'py') return { icon: FileCode, color: '#3776ab' }

  // Markdown -> FileText Icon
  if (lang === 'markdown' || lang === 'md' || extension === 'md' || isMd)
    return { icon: FileText, color: '#519aba' }

  // Fallback
  return { icon: File, color: 'var(--sidebar-icon-color)' }
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
        // Polish: Indent 16px. +24px base offset.
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

// --- Indentation Guides (Obsidian Style: Strict Lines) ---
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
  // Always call hooks at the top level
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

    // Create a custom ghost drag image
    const ghost = document.createElement('div')
    ghost.style.position = 'absolute'
    ghost.style.top = '-1000px'
    ghost.style.left = '-1000px'
    ghost.style.padding = '4px 8px' // Tighter padding
    ghost.style.background = 'var(--color-bg-secondary)'
    ghost.style.border = '1px solid var(--color-accent-primary)'
    ghost.style.borderRadius = '6px'
    ghost.style.width = 'auto' // Auto width
    ghost.style.maxWidth = '250px' // Cap width
    ghost.style.zIndex = '9999'
    ghost.style.display = 'flex'
    ghost.style.alignItems = 'center'
    ghost.style.gap = '6px'
    ghost.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
    ghost.style.pointerEvents = 'none'

    // Icon
    const iconDiv = document.createElement('div')
    iconDiv.innerHTML =
      type === 'folder'
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>'
    iconDiv.style.opacity = '0.8'
    ghost.appendChild(iconDiv)

    // Text
    const textSpan = document.createElement('span')
    textSpan.innerText =
      selectedIds.length > 1
        ? `${selectedIds.length} items`
        : itemData.name || itemData.title || 'Untitled'

    textSpan.style.color = 'var(--color-text-primary)'
    textSpan.style.fontSize = '12px' // Explicit 12px
    textSpan.style.fontWeight = '500'
    textSpan.style.whiteSpace = 'nowrap'
    textSpan.style.overflow = 'hidden'
    textSpan.style.textOverflow = 'ellipsis'
    ghost.appendChild(textSpan)

    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 10, 10) // Offset slightly

    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  const handleDragOver = (e) => {
    if (type === 'folder') {
      e.preventDefault()
      e.stopPropagation() // Important: Stop bubbling to Sidebar container
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
        // For folders: select the folder AND toggle expand/collapse
        newSelection = [itemData.id]
        onSelectFolder(itemData.id)
        onToggleFolder(itemData.id, !item.isExpanded)
      }
    }

    lastSelectedIdRef.current = itemData.id
    onSelectionChange(newSelection)
  }

  // --- Render Folder ---
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
        onKeyDown={(e) => handleItemKeyDown(e, index, itemData)}
        onContextMenu={(e) => onContextMenu(e, 'folder', itemData)}
      >
        <IndentGuides depth={depth} />
        <div
          className={`group flex items-center gap-[4px] w-full h-full select-none border-none outline-none focus:outline-none transition-all duration-150 pr-2 relative rounded-[4px] ${
            isDragOver // Drag Over takes priority
              ? 'bg-[var(--color-accent-primary)] bg-opacity-20'
              : isSelected
                ? 'bg-[var(--selected-bg)]'
                : 'hover:bg-white/[0.02] focus:bg-[var(--selected-bg)]'
          }`}
          style={{
            color: isSelected ? 'var(--selected-text)' : 'var(--sidebar-header-text)',
            // Folder hover
            // Layout Polish: Indent=16px. Base=8px.
            paddingLeft: `${depth * 16 + 8}px`,
            width: 'calc(100% - 8px)',
            margin: '0 4px',
            backgroundColor: isDragOver ? undefined : isSelected ? 'var(--selected-bg)' : undefined
          }}
        >
          {/* Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFolder(itemData.id, !itemData.collapsed)
            }}
            className={`flex-shrink-0 flex items-center justify-center rounded transition-all duration-200 w-4 h-4 ${
              isSelected
                ? 'bg-white/10 hover:bg-white/20'
                : 'opacity-40 hover:opacity-100 hover:bg-[var(--color-accent-primary)]/10'
            }`}
          >
            <ChevronRight
              size={isCompact ? 10 : 12} // Smaller chevron
              strokeWidth={2}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
              style={{ color: isSelected ? 'var(--selected-text)' : 'inherit' }}
            />
          </button>

          {/* Icon */}
          <div
            className="flex-shrink-0 flex items-center justify-center opacity-70 group-hover:opacity-100 px-0.5"
            style={{
              color: isSelected
                ? 'var(--selected-text)'
                : itemData.name === '📥 Inbox'
                  ? '#818cf8'
                  : 'var(--sidebar-icon-color)' // Default Folder Color
            }}
          >
            {itemData.name === '📥 Inbox' ? (
              <Inbox size={isCompact ? 13 : 14} strokeWidth={2.5} />
            ) : // Dynamic Icon
            isOpen ? (
              <FolderOpen size={isCompact ? 13 : 14} strokeWidth={2} />
            ) : (
              <Folder size={isCompact ? 13 : 14} strokeWidth={2} />
            )}
          </div>

          {/* Name */}
          <span
            title={itemData.name}
            className={`flex-1 min-w-0 text-left truncate font-medium text-[12px] opacity-80 group-hover:opacity-100 pl-1 select-none ${itemData.name === '📥 Inbox' ? 'text-indigo-400 font-bold' : ''}`}
          >
            {itemData.name}
          </span>
        </div>
      </div>
    )
  }

  // --- Render Snippet ---
  const isSelected =
    selectedIds.includes(itemData.id) || (selectedSnippet?.id === itemData.id && !selectedFolderId)
  const { icon: Icon, color } = getFileIcon(itemData.language, itemData.title)

  // Check if this item matches the current search query
  const isSearchMatch =
    searchQuery &&
    searchQuery.trim() &&
    (itemData.title || '').toLowerCase().includes(searchQuery.toLowerCase().trim())

  // Determine icon color: Monochrome by default, Color on Hover/Selected
  const finalIconColor = isSelected || isSearchMatch ? color : 'var(--sidebar-icon-color)' // Force gray

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
        className={`flex items-center gap-[4px] w-full h-full select-none border-none outline-none focus:outline-none pr-2 relative ${
          isCompact ? 'text-[11px]' : 'text-[12px]'
        } ${
          isSelected
            ? 'bg-[var(--selected-bg)]'
            : isSearchMatch
              ? 'bg-[var(--color-accent-primary)]/10 hover:bg-[var(--color-accent-primary)]/15'
              : 'hover:bg-white/[0.02] focus:bg-[var(--selected-bg)]'
        } rounded-[4px]`}
        style={{
          backgroundColor: isSelected
            ? 'var(--selected-bg)'
            : isSearchMatch
              ? 'rgba(var(--color-accent-primary-rgb), 0.1)'
              : undefined,
          color: isSelected ? 'var(--selected-text)' : 'var(--sidebar-text)',
          // Layout Polish: Indent=16px. Base=8px. + 16px (Chevron skip) = 24px.
          paddingLeft: `${depth * 16 + 24}px`,
          width: 'calc(100% - 8px)',
          margin: '0 4px'
        }}
        tabIndex={0}
      >
        <div
          className={`flex-shrink-0 flex items-center justify-center px-0.5 transition-colors duration-200 ${
            !isSelected
              ? 'opacity-60 group-hover/row:opacity-100 group-hover/row:text-[color:var(--element-color)]'
              : ''
          }`}
          style={{
            '--element-color': color,
            color: isSelected ? 'inherit' : 'var(--sidebar-icon-color)' // Default gray
          }}
        >
          {/* Apply hover color via CSS variable hack or js logic above */}
          <Icon
            size={isCompact ? 13 : 14}
            strokeWidth={1.5}
            style={{
              color: isSelected ? 'inherit' : undefined // Let wrapper handle color or hover
            }}
            // On hover, we want the original color. React inline styles are tricky for hover.
            // So we use the wrapper's css var approach or simple conditional if we want strict JS control.
            // Since we want strict Obsidian feel, gray is best. Hover color is a nice bonus.
          />
        </div>

        {/* We need a specific hover effect for the icon to turn color. 
            The wrapper has group-hover/row. We can use that. 
            Actually, let's keep it simple: Gray by default. Colored if selected. 
        */}

        <span
          title={itemData.title || 'Untitled'}
          className="flex-1 min-w-0 text-left truncate font-normal opacity-80 group-hover/row:opacity-100 normal-case pl-1"
        >
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
