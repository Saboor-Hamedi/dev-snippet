import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { File, Trash2, RotateCcw, Search } from 'lucide-react'
import SidebarHeader from '../layout/SidebarHeader'

const getFileIcon = () => {
  return { icon: File, color: '#9CA3AF' } // Gray for trash
}

// Virtual List (Reuse logic or keep simple for trash if list is small, but let's be consistent)
const VirtualList = React.forwardRef(
  ({ height, width, itemCount, itemSize, itemData, children: Row }, ref) => {
    const containerRef = React.useRef(null)
    const [scrollTop, setScrollTop] = React.useState(0)

    React.useImperativeHandle(ref, () => ({
      scrollToItem: (index) => {
        if (containerRef.current) {
          const itemTop = index * itemSize
          containerRef.current.scrollTop = itemTop
        }
      }
    }))

    const visibleCount = Math.ceil(height / itemSize)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemSize) - 2)
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
  const { items, onRestore, onPermanentDelete } = data
  const item = items[index]

  const { icon: Icon } = getFileIcon(item.language, item.title)

  return (
    <div style={style} className=" group">
      <div className="flex items-center gap-2 px-2 w-full text-left h-full text-sm select-none rounded hover:bg-white/5 transition-colors relative">
        <div className="flex-shrink-0 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
          <Icon size={14} strokeWidth={1.5} />
        </div>

        <span className="flex-1 min-w-0 truncate font-light opacity-50 decoration-slate-600 group-hover:opacity-90 transition-opacity">
          {item.title || 'Untitled'}
        </span>

        {/* Floating Action Buttons */}
        {/* Floating Action Buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRestore(item.id)
            }}
            className="p-1 hover:bg-emerald-500/20 text-emerald-500 rounded transition-colors"
            title="Restore Snippet"
          >
            <RotateCcw size={14} strokeWidth={1.5} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPermanentDelete(item.id)
            }}
            className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
            title="Permanently Delete"
          >
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

const TrashSidebar = ({ items, onRestore, onPermanentDelete, onLoadTrash, openDeleteModal }) => {
  const [filter, setFilter] = useState('')
  const filteredItems = useMemo(() => {
    if (!filter) return items
    return items.filter((i) => (i.title || '').toLowerCase().includes(filter.toLowerCase()))
  }, [items, filter])

  // Load trash on mount
  React.useEffect(() => {
    if (onLoadTrash) onLoadTrash()
  }, [])

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

  // Handle Empty Trash
  const handleEmptyTrash = () => {
    if (filteredItems.length === 0) return

    // Use the delete modal with a special message for emptying trash
    if (openDeleteModal) {
      openDeleteModal('empty-trash', async () => {
        // Delete all items in parallel for better performance
        if (onPermanentDelete) {
          try {
            await Promise.all(
              filteredItems.map((item) => Promise.resolve(onPermanentDelete(item.id)))
            )
          } catch (error) {
            console.error('Failed to empty trash:', error)
          }
        }
      })
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
      <SidebarHeader className="gap-2 z-10 relative">
        <div className="relative group flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search trash..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="
                 theme-exempt
                 w-full rounded-md bg-[#161b22] py-1.5 pl-8 pr-4 
                 text-[12px] text-white placeholder-gray-600 
                 outline-none ring-1 ring-transparent focus:ring-red-900/50 
                 transition-all
               "
          />
        </div>
      </SidebarHeader>

      <div className="px-4 py-2 text-xs flex justify-between items-center border-b border-white/5">
        <span className="text-gray-400 font-medium">
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
        </span>
        {filteredItems.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="text-xs text-red-500/70 hover:text-red-500 hover:bg-red-500/10 px-2 py-1 rounded transition-colors flex items-center gap-1.5"
            title="Empty Trash"
          >
            <Trash2 size={12} strokeWidth={1.5} />
            <span>Empty</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative mt-2 " ref={parentRef}>
        {filteredItems.length === 0 ? (
          <div className="p-4 flex flex-col items-center mt-4 opacity-50 select-none">
            <span className="text-xs">Trash is empty</span>
          </div>
        ) : (
          <VirtualList
            height={size.height}
            width={size.width}
            itemCount={filteredItems.length}
            itemSize={32}
            itemData={{ items: filteredItems, onRestore, onPermanentDelete }}
          >
            {Row}
          </VirtualList>
        )}
      </div>
    </div>
  )
}

TrashSidebar.propTypes = {
  items: PropTypes.array,
  onRestore: PropTypes.func,
  onPermanentDelete: PropTypes.func,
  onLoadTrash: PropTypes.func
}

export default TrashSidebar
