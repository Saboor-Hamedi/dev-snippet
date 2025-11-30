import React from 'react'
import PropTypes from 'prop-types'
import { Plus } from 'lucide-react'

const ViewToolbar = ({ onNew }) => {
  return (
    <div className="flex items-center justify-end gap-2 px-2 py-2 flex-shrink-0">
      {onNew && (
        <button
          onClick={() => onNew()}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-[#333] dark:text-slate-200"
          title="New"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

ViewToolbar.propTypes = {
  onNew: PropTypes.func
}

export default ViewToolbar
