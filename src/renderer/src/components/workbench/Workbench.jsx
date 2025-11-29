import React from 'react'
import PropTypes from 'prop-types'
import SidebarHeader from '../layout/SidebarHeader'
import SnippetEditor from '../SnippetEditor'
import SettingsPanel from '../SettingsPanel'
import SnippetCard from '../SnippetCard'
import WelcomePage from '../WelcomePage'

const Workbench = ({
  activeView,
  selectedSnippet,
  onSave,
  onCloseSnippet,
  onCancelEditor,
  snippets,
  projects,
  onDeleteRequest,
  onNewSnippet,
  onNewProject
}) => {
  const [editingSnippet, setEditingSnippet] = React.useState(null)

  // Handle Edit
  const handleEdit = (snippet) => {
    setEditingSnippet(snippet)
  }

  // Handle Save
  const handleSave = (snippet) => {
    onSave(snippet)
    setEditingSnippet(null)
  }

  // Handle Cancel Edit
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
      <SnippetEditor
        initialSnippet={selectedSnippet}
        onSave={handleSave}
        onCancel={onCloseSnippet}
      />
    )
  }

  // Priority 6: Projects view - show grid
  if (activeView === 'projects') {
    const items = projects
    return (
      <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
        {/* Project: This is the project header  */}

        <SidebarHeader
          title="Projects"
          count={items.length}
          itemLabel="Project"
          onAction={onNewProject}
        />

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
  onNewSnippet: PropTypes.func.isRequired,
  onNewProject: PropTypes.func.isRequired
}

export default Workbench
