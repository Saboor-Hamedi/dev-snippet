import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import UniversalModal from './universal/UniversalModal'

const CreateProjectModal = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('javascript')

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTitle('')
      setDescription('')
      setLanguage('javascript')
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    // Include description as code for now, or empty string
    onSave({ title, code: description || '', language })
    setTitle('')
    setDescription('')
    setLanguage('javascript')
    onClose()
  }

  return (
    <UniversalModal isOpen={isOpen} onClose={onClose} title="Create New Project" width="450px">
      <form onSubmit={handleSubmit} className="p-4">
        <div className="space-y-3">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="My Awesome Project"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none h-20"
              placeholder="Brief description of the project..."
            />
          </div>

          {/* Primary Language */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Primary Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus size={12} />
            Create Project
          </button>
        </div>
      </form>
    </UniversalModal>
  )
}

export default CreateProjectModal
