import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
const RenameModal = ({ isOpen, item, onClose, onRename }) => {
  const [newName, setNewName] = useState(item ? item.title : '')

  // Keep local input in sync when the modal opens or the item changes
  useEffect(() => {
    if (isOpen) setNewName(item?.title || '')
  }, [isOpen, item?.title])

  if (!isOpen || !item) return null

  const handleSubmit = () => {
    if (newName.trim()) {
      onRename(newName)
    }
  }

  //

  const handleCancel = () => {
    setNewName(item?.title || '')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center bg-black/50">
      <div className="bg-white bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-small font-semibold text-slate-900 dark:text-white">
            Rename Snippet
          </h3>
          <button onClick={handleCancel} className="text-slate-300 hover:text-slate-500">
            <X size={12} />
          </button>
        </div>
        <div className="p-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') handleCancel()
            }}
            placeholder="Enter name (optionally with extension)"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={handleCancel}
              className="bg-slate-500 hover:bg-slate-400 text-white rounded text-tiny inline-flex items-center gap-2 p-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-blue-500 hover:bg-blue-400 text-white rounded text-tiny inline-flex items-center gap-2 p-2"
            >
              Rename
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RenameModal
