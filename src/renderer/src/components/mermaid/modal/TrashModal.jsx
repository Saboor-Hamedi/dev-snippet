import React, { useMemo, useState, useRef, useLayoutEffect, useEffect } from 'react'
import PropTypes from 'prop-types'
import { File, Trash2, RotateCcw, Search, Folder, X, Trash } from 'lucide-react'
import VirtualList from '../../common/VirtualList'
import ContextMenu from '../../common/ContextMenu'
import UniversalModal from '../../universal/UniversalModal'

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
        className="flex items-center gap-3 px-3 w-full text-left h-full text-sm select-none rounded-xl hover:bg-[var(--color-bg-tertiary)] transition-all relative border border-transparent hover:border-[var(--color-border)]"
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu(e, item)
        }}
      >
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-bg-tertiary)] transition-all group-hover:bg-[var(--color-bg-secondary)]"
          style={{ color }}
        >
          <Icon size={16} strokeWidth={2} />
        </div>

        <span className="flex-1 min-w-0 truncate font-medium text-[13px] text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
          {item.title || item.name || 'Untitled'}
        </span>

        {/* Floating Action Buttons */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all pr-1 transform translate-x-2 group-hover:translate-x-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.currentTarget.blur()
              onRestore(item.id)
            }}
            className="w-7 h-7 flex items-center justify-center hover:bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded-lg transition-colors"
            title="Restore"
          >
            <RotateCcw size={14} strokeWidth={2} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.currentTarget.blur()
              onPermanentDelete(item.id)
            }}
            className="w-7 h-7 flex items-center justify-center hover:bg-[var(--color-error)]/10 text-[var(--color-error)] rounded-lg transition-colors"
            title="Delete Forever"
          >
            <Trash2 size={14} strokeWidth={2} />
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

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Recycle Bin"
      width="450px"
      height="60vh"
      footer={
        items.length > 0 && (
          <div className="flex justify-end w-full">
            <button
              onClick={(e) => {
                e.currentTarget.blur()
                handleEmptyTrash()
              }}
              className="h-8 px-4 text-[12px] font-bold bg-[var(--color-error)] text-white hover:opacity-90 rounded-lg transition-all flex items-center gap-2"
            >
              <Trash2 size={14} strokeWidth={2.5} />
              Empty Trash
            </button>
          </div>
        )
      }
    >
      <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
        {/* Search - Compact */}
        <div className="px-6 py-3 border-b border-[var(--color-border)]">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)] group-focus-within:text-[var(--color-accent-primary)] transition-colors" />
            <input
              type="text"
              placeholder={`Search ${items.length} deleted items...`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full h-9 rounded-xl pl-10 pr-4 text-[13px] outline-none border border-[var(--color-border)] focus:border-[var(--color-accent-primary)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-tertiary)] shadow-inner"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative" ref={parentRef}>
          {filteredItems.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 opacity-20 select-none">
              <Trash size={64} strokeWidth={1} className="mb-4" />
              <span className="text-[14px] font-medium tracking-wide">No items found in trash</span>
            </div>
          ) : (
            <div className="p-3 h-full">
              <VirtualList
                height={size.height - 24}
                width={size.width - 24}
                itemCount={filteredItems.length}
                itemSize={42}
                itemData={{
                  items: filteredItems,
                  onRestore: (id) => {
                    onRestore(id)
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
    </UniversalModal>
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
