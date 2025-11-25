import React from 'react'
import PropTypes from 'prop-types'
import SnippetViewer from '../SnippetViewer'
import SnippetEditor from '../SnippetEditor'
import SettingsPanel from '../SettingsPanel'
import SnippetCard from '../SnippetCard'
import WelcomePage from '../WelcomePage'
import { Plus } from 'lucide-react'

const Workbench = ({
  activeView,
  selectedSnippet,
  onSave,
  onCloseSnippet,
  onCancelEditor,
  snippets,
  projects,
  onDeleteRequest,
  onNewSnippet
}) => {
  const [editingSnippet, setEditingSnippet] = React.useState(null)

  const handleEdit = (snippet) => {
    setEditingSnippet(snippet)
  }

  const handleSave = (snippet) => {
    onSave(snippet)
    setEditingSnippet(null)
  }

  const handleCancelEdit = () => {
    setEditingSnippet(null)
  }

  // Priority 1: Settings
  if (activeView === 'settings') {
    return <SettingsPanel />
  }

  // Priority 2: Editor mode (creating new snippet)
  if (activeView === 'editor') {
    return <SnippetEditor onSave={onSave} onCancel={onCancelEditor} />
  }

  // Priority 3: Editing a snippet
  if (editingSnippet) {
    return (
      <SnippetEditor
        initialSnippet={editingSnippet}
        onSave={handleSave}
        onCancel={handleCancelEdit}
      />
    )
  }

  // Priority 4: Viewing a selected snippet
  if (selectedSnippet) {
    return (
      <SnippetViewer
        snippet={selectedSnippet}
        onClose={onCloseSnippet}
        onEdit={() => handleEdit(selectedSnippet)}
      />
    )
  }

  // Priority 5: Projects view - show grid
  if (activeView === 'projects') {
    const items = projects
    return (
      <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-medium text-slate-900 dark:text-white">Projects</h1>
            <span className="text-xs text-slate-400 dark:text-slate-600">•</span>
            <p className="text-xs text-slate-500">
              {items.length} project{items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-slate-500">No projects yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 pb-6">
              {items.map((item) => (
                <SnippetCard
                  key={item.id}
                  snippet={item}
                  onRequestDelete={onDeleteRequest}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Priority 6: Snippets view - show grid or welcome
  if (activeView === 'snippets') {
    const items = snippets
    // Show snippets grid if there are snippets, otherwise show welcome page
    if (items.length > 0) {
      return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 flex items-center justify-between transition-colors duration-200">
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-medium text-slate-900 dark:text-white">Code Snippets</h1>
              <span className="text-xs text-slate-400 dark:text-slate-600">•</span>
              <p className="text-xs text-slate-500">
                {items.length} snippet{items.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Create a new snippet on the top of the page */}
            <button
              onClick={onNewSnippet}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Snippets Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 pb-6">
              {items.map((item) => (
                <SnippetCard
                  key={item.id}
                  snippet={item}
                  onRequestDelete={onDeleteRequest}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </div>
        </div>
      )
    } else {
      // Show welcome page when no snippets exist
      return (
        <div className="h-full">
          <WelcomePage onNewSnippet={onNewSnippet} />
        </div>
      )
    }
  }

  // FINAL FALLBACK: Show welcome page when activeView is undefined/null or doesn't match any condition
  return (
    <div className="h-full">
      <WelcomePage onNewSnippet={onNewSnippet} />
    </div>
  )
}

Workbench.propTypes = {
  activeView: PropTypes.string.isRequired,
  selectedSnippet: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCloseSnippet: PropTypes.func.isRequired,
  onCancelEditor: PropTypes.func,
  snippets: PropTypes.array.isRequired,
  projects: PropTypes.array.isRequired,
  onDeleteRequest: PropTypes.func.isRequired,
  onNewSnippet: PropTypes.func.isRequired
}

export default Workbench
