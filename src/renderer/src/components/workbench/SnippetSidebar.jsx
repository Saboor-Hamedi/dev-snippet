import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { File, Plus, MoreHorizontal, ChevronDown, Search, PanelLeftClose } from 'lucide-react'
import SidebarHeader from '../layout/SidebarHeader'

// Helper to get Icon and Color (Markdown only)
const getFileIcon = () => {
  return { icon: File, color: '#519aba' } // Blue
}

// Custom Virtual List to avoid bundler/CJS issues with react-window
const VirtualList = React.forwardRef(
  ({ height, width, itemCount, itemSize, itemData, children: Row }, ref) => {
    const containerRef = React.useRef(null)
    const [scrollTop, setScrollTop] = React.useState(0)

    React.useImperativeHandle(ref, () => ({
      scrollToItem: (index) => {
        if (containerRef.current) {
          const itemTop = index * itemSize
          const itemBottom = itemTop + itemSize
          // Current view bounds
          const viewTop = containerRef.current.scrollTop
          const viewBottom = viewTop + height

          // Scroll Logic: "Scroll Into View"
          if (itemTop < viewTop) {
            // Item is above view -> align to top
            containerRef.current.scrollTop = itemTop
            setScrollTop(itemTop)
          } else if (itemBottom > viewBottom) {
            // Item is below view -> align to bottom
            containerRef.current.scrollTop = itemBottom - height
            setScrollTop(itemBottom - height)
          }
          // Else: Item is fully visible, do nothing
        }
      }
    }))

    const visibleCount = Math.ceil(height / itemSize)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemSize) - 2) // Overscan
    const endIndex = Math.min(itemCount - 1, startIndex + visibleCount + 4)

    const items = []
    for (let i = startIndex; i <= endIndex; i++) {
      items.push(
        <Row
          key={i}
          index={i}
          style={{
            position: 'absolute',
            top: i * itemSize,
            left: 0,
            width: '100%',
            height: itemSize
          }}
          data={itemData}
        />
      )
    }

    return (
      <div
        ref={containerRef}
        style={{ height, width, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className="custom-scrollbar"
      >
        <div style={{ height: itemCount * itemSize, width: '100%' }}>{items}</div>
      </div>
    )
  }
)

const Row = ({ index, style, data }) => {
  const { snippets, selectedSnippet, onSelect, handleItemKeyDown } = data
  const snippet = snippets[index]
  const isSelected = selectedSnippet?.id === snippet.id

  const { icon: Icon, color } = getFileIcon(snippet.language, snippet.title)

  return (
    <div style={style}>
      <button
        id={`snippet-item-${index}`}
        onClick={() => onSelect(snippet)}
        onKeyDown={(e) => handleItemKeyDown(e, index, snippet)}
        className={`
          group flex items-center gap-2 px-3 w-full text-left h-full
          text-sm select-none
          border-none outline-none
          ${isSelected ? '' : 'hover:opacity-100'}
        `}
        style={{
          backgroundColor: isSelected ? 'var(--selected-bg)' : 'transparent',
          color: isSelected ? 'var(--selected-text)' : 'var(--sidebar-text)'
        }}
        tabIndex={0}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center opacity-80 group-hover:opacity-100"
          style={{ color: isSelected ? 'inherit' : color }}
        >
          <Icon size={15} strokeWidth={1.5} />
        </div>
        <span className="flex-1 min-w-0 truncate font-light opacity-90 group-hover:opacity-100">
          {snippet.title || 'Untitled'}
        </span>
      </button>
    </div>
  )
}

const SnippetSidebar = ({
  snippets,
  selectedSnippet,
  onSelect,
  onNew,
  onSearch,
  isOpen, // kept for prop compatibility, though unsed in styling now
  onToggle,
  width = 250
}) => {
  const [filter, setFilter] = React.useState('')
  const inputRef = React.useRef(null)
  const listRef = React.useRef(null)

  // Debounced Search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) onSearch(filter)
    }, 300)
    return () => clearTimeout(timer)
  }, [filter, onSearch])

  // Resize Observer
  const parentRef = React.useRef(null)
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useLayoutEffect(() => {
    if (!parentRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })
    resizeObserver.observe(parentRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown' && snippets.length > 0) {
      e.preventDefault()
      e.stopPropagation()
      const firstSnippet = snippets[0]
      onSelect(firstSnippet) // Select immediately
      listRef.current?.scrollToItem(0)
      requestAnimationFrame(() => {
        document.getElementById('snippet-item-0')?.focus({ preventScroll: true })
      })
    }
  }

  const handleItemKeyDown = (e, index, snippet) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (index < snippets.length - 1) {
        const nextSnippet = snippets[index + 1]
        onSelect(nextSnippet) // Select immediately
        listRef.current?.scrollToItem(index + 1)
        requestAnimationFrame(() => {
          document.getElementById(`snippet-item-${index + 1}`)?.focus({ preventScroll: true })
        })
      }
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (index === 0) {
        // If moving back to input, maybe deselection isn't needed?
        // Typically keep last selection or just focus input.
        // User didn't ask to deselect, so just focus input.
        inputRef.current?.focus({ preventScroll: true })
      } else {
        const prevSnippet = snippets[index - 1]
        onSelect(prevSnippet) // Select immediately
        listRef.current?.scrollToItem(index - 1)
        requestAnimationFrame(() => {
          document.getElementById(`snippet-item-${index - 1}`)?.focus({ preventScroll: true })
        })
      }
    }
    if (e.key === 'Enter') {
      onSelect(snippet)
    }
  }

  return (
    <div
      className="h-full flex flex-col w-full"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--sidebar-text)'
      }}
    >
      {/* Search Bar Area - Compact & Clean */}
      <SidebarHeader className="gap-2 z-10 relative">
        <div className="relative group flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search snippets..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="
                theme-exempt
                w-full rounded-md bg-[#161b22] py-1.5 pl-8 pr-4 
                text-[12px] text-white placeholder-gray-600 
                outline-none ring-1 ring-transparent focus:ring-cyan-500 
                transition-all
              "
          />
          <div className="absolute right-3 top-1/2 h-3 w-[1px] -translate-y-1/2 bg-cyan-500 animate-pulse" />
        </div>
      </SidebarHeader>

      {/* Snippet List (Virtual) */}
      <div className="flex-1 overflow-hidden relative" ref={parentRef}>
        {snippets.length === 0 ? (
          <div className="p-4 flex flex-col items-center mt-4 opacity-50 select-none">
            <span className="text-xs">No snippets found</span>
          </div>
        ) : (
          <VirtualList
            ref={listRef}
            height={size.height}
            width={size.width}
            itemCount={snippets.length}
            itemSize={32} // Increased for better spacing
            itemData={{ snippets, selectedSnippet, onSelect, handleItemKeyDown }}
          >
            {Row}
          </VirtualList>
        )}
      </div>
    </div>
  )
}

SnippetSidebar.propTypes = {
  snippets: PropTypes.array.isRequired,
  selectedSnippet: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  onNew: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func,
  width: PropTypes.number
}

export default React.memo(SnippetSidebar)
