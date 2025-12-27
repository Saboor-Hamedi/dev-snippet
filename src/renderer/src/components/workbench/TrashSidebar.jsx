import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { File, Trash2, RotateCcw, Search, Folder } from 'lucide-react'
import SidebarHeader from '../layout/SidebarHeader'
import VirtualList from '../common/VirtualList'
import ContextMenu from '../common/ContextMenu'

const getFileIcon = (type) => {
  if (type === 'folder') return { icon: Folder, color: '#facc15' } // Yellow for folder
  return { icon: File, color: '#9CA3AF' } // Gray for trash snippet
}

const Row = ({ index, style, data }) => {
  const { items, onRestore, onPermanentDelete, onContextMenu } = data
  const item = items[index]

  const { icon: Icon, color } = getFileIcon(item.type)

  return (
    <div style={style} className=" group">
      <div
        className="flex items-center gap-2 px-2 w-full text-left h-full text-sm select-none rounded hover:bg-white/5 transition-colors relative"
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu(e, item)
        }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity"
          style={{ color }}
        >
          <Icon size={14} strokeWidth={1.5} />
        </div>

        <span className="flex-1 min-w-0 truncate font-light opacity-50 decoration-slate-600 group-hover:opacity-90 transition-opacity normal-case">
          {item.title || item.name || 'Untitled'}
        </span>

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
  const [contextMenu, setContextMenu] = useState(null)

  const filteredItems = useMemo(() => {
    if (!filter) return items
    return items.filter((i) =>
      (i.title || i.name || '').toLowerCase().includes(filter.toLowerCase())
    )
  }, [items, filter])

  // Load trash on mount
  React.useEffect(() => {
    if (onLoadTrash) onLoadTrash()
  }, [])

  // Context menu handler
  const handleContextMenu = (e, item) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item
    })
  }

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
            className="w-full rounded-md py-1.5 pl-8 pr-4 text-[12px] outline-none ring-1 ring-transparent focus:ring-[var(--color-accent-primary)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] placeholder:text-xtiny placeholder-[var(--color-text-secondary)] transition-all"
          />
          <div className="absolute right-3 top-1/2 h-3 w-[1px] -translate-y-1/2 bg-cyan-500 animate-pulse" />
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
            itemData={{
              items: filteredItems,
              onRestore,
              onPermanentDelete,
              onContextMenu: handleContextMenu
            }}
          >
            {Row}
          </VirtualList>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            {
              label: 'Restore',
              icon: RotateCcw,
              onClick: () => onRestore(contextMenu.item.id)
            },
            {
              label: 'Delete Forever',
              icon: Trash2,
              danger: true,
              onClick: () => onPermanentDelete(contextMenu.item.id)
            }
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
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
