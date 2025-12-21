import React from 'react'
import { Scissors, Copy, Clipboard, MousePointer, Trash2 } from 'lucide-react'

const ContextMenu = ({ x, y, onClose, onCut, onCopy, onPaste, onSelectAll, onDelete }) => {
  return (
    <div className="fixed inset-0 z-[200]" onClick={onClose}>
      <div
        className="absolute rounded-lg shadow-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white backdrop-blur-sm"
        style={{ left: x, top: y, minWidth: 180 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={onCut}
        >
          <Scissors size={12} /> Cut
        </button>
        <button
          className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={onCopy}
        >
          <Copy size={12} /> Copy
        </button>
        <button
          className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={onPaste}
        >
          <Clipboard size={12} /> Paste
        </button>
        <button
          className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={onSelectAll}
        >
          <MousePointer size={12} /> Select All
        </button>
        <div className="border-t border-slate-200 dark:border-slate-700" />
        <button
          className="w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
          onClick={onDelete}
        >
          <Trash2 size={12} /> Delete Snippet
        </button>
      </div>
    </div>
  )
}

export default React.memo(ContextMenu)
