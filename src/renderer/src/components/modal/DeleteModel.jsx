import PropTypes from 'prop-types'
import { Trash } from 'lucide-react'
import React, { useEffect, useRef } from 'react'
const DeleteModel = ({ isOpen, onClose, onConfirm, snippetTitle }) => {
  const deleteBtnRef = useRef(null)

  useEffect(() => {
    if (isOpen && deleteBtnRef.current) {
      // focus the delete button when modal opens
      deleteBtnRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'Enter') onConfirm()
      }}
      tabIndex={-1}
    >
      <div
        className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
              {/* icons */}
            </div>
            <div className="flex-1">
              <h3 className="text-medium font-semibold text-white mb-2">Confirm Deletion</h3>
              <p className="text-slate-300 text-xsmall">
                Are you sure you want to delete{snippetTitle ? ' the snippet ' : ' this snippet '}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={onClose}
              className="bg-slate-500 hover:bg-slate-400 text-white rounded text-tiny inline-flex items-center gap-2 p-2"
            >
              Cancel
            </button>
            <button
              ref={deleteBtnRef}
              onClick={onConfirm}
              className="bg-red-500 hover:bg-red-400 text-white rounded
                focus:outline-none focus:ring-none
               text-tiny inline-flex items-center gap-2 p-2"
            >
              <Trash size={12} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

DeleteModel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  snippetTitle: PropTypes.string
}

export default DeleteModel
