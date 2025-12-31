import React, { useMemo, useState, useRef, useLayoutEffect, useEffect } from 'react'
import PropTypes from 'prop-types'
import { File, Trash2, RotateCcw, Search, Folder, X, Trash } from 'lucide-react'
import VirtualList from '../../common/VirtualList'
import ContextMenu from '../../common/ContextMenu'

const getFileIcon = (type) => {
  if (type === 'folder') return { icon: Folder, color: '#facc15' }
  return { icon: File, color: '#9CA3AF' }
}

const Row = ({ index, style, data }) => {
  const { items, onRestore, onPermanentDelete, onContextMenu } = data
  const item = items[index]

  const { icon: Icon, color } = getFileIcon(item.type)

  return (
    <div style={style} className="group">
      <div
        className="flex items-center gap-2 px-2 w-full text-left h-full text-sm select-none rounded-[4px] hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors relative"
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

        <span className="flex-1 min-w-0 truncate font-light opacity-60 decoration-slate-600 group-hover:opacity-90 transition-opacity normal-case text-[13px] text-slate-700 dark:text-slate-300">
          {item.title || item.name || 'Untitled'}
        </span>

        {/* Floating Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRestore(item.id)
            }}
            className="p-1 hover:bg-emerald-500/10 text-emerald-500 rounded transition-colors"
            title="Restore"
          >
            <RotateCcw size={14} strokeWidth={1.5} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPermanentDelete(item.id)
            }}
            className="p-1 hover:bg-red-500/10 text-red-500 rounded transition-colors"
            title="Delete Forever"
          >
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

const TrashModal = ({
  isOpen,
  onClose,
  items,
  onRestore,
  onPermanentDelete,
  onLoadTrash,
  openDeleteModal
}) => {
  const [filter, setFilter] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const parentRef = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  const filteredItems = useMemo(() => {
    if (!filter) return items
    return items.filter((i) =>
      (i.title || i.name || '').toLowerCase().includes(filter.toLowerCase())
    )
  }, [items, filter])

  useEffect(() => {
    if (isOpen && onLoadTrash) onLoadTrash()
  }, [isOpen, onLoadTrash])

  useLayoutEffect(() => {
    if (!parentRef.current || !isOpen) return
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
  }, [isOpen])

  const handleEmptyTrash = () => {
    if (filteredItems.length === 0) return
    if (openDeleteModal) {
      openDeleteModal('empty-trash', async () => {
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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center px-4 overflow-hidden"
      onMouseDown={onClose}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" />

      {/* Modal Container */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white/95 dark:bg-[#0d1117]/95 rounded-[5px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border-none overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        style={{ height: '70vh' }}
      >
        {/* Header - Seamless Compact Design */}
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0 cursor-default">
              <Trash size={15} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                Recycle Bin
              </h3>
              <p className="text-[10px] text-slate-500 leading-tight opacity-80">
                {items.length} item{items.length !== 1 ? 's' : ''} in trash
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="h-6 px-3 text-[10px] font-medium bg-red-500 text-white hover:bg-red-600 rounded-[3px] transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 size={11} strokeWidth={2} />
                Empty Trash
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[3px] text-slate-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Search - Compact */}
        <div className="px-3 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--color-accent-primary)] transition-colors" />
            <input
              type="text"
              placeholder="Search deleted items..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full h-7 rounded-[4px] pl-8 pr-3 text-[12px] outline-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-[var(--color-accent-primary)] bg-white dark:bg-black/20 text-slate-800 dark:text-slate-100 transition-all placeholder:text-[11px]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative" ref={parentRef}>
          {filteredItems.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 opacity-40 select-none">
              <Trash size={48} strokeWidth={1} className="mb-4" />
              <span className="text-[13px]">No items found in trash</span>
            </div>
          ) : (
            <div className="p-2 h-full">
              <VirtualList
                height={size.height - 16}
                width={size.width - 16}
                itemCount={filteredItems.length}
                itemSize={36}
                itemData={{
                  items: filteredItems,
                  onRestore: (id) => {
                    onRestore(id)
                    // If moving to modal, we might want to keep it open or close it
                  },
                  onPermanentDelete,
                  onContextMenu: (e, item) => {
                    setContextMenu({ x: e.clientX, y: e.clientY, item })
                  }
                }}
              >
                {Row}
              </VirtualList>
            </div>
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
    </div>
  )
}

TrashModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  items: PropTypes.array,
  onRestore: PropTypes.func,
  onPermanentDelete: PropTypes.func,
  onLoadTrash: PropTypes.func,
  openDeleteModal: PropTypes.func
}

export default TrashModal
