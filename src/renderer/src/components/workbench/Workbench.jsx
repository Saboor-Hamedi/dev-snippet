import React from 'react'
import PropTypes from 'prop-types'
import SnippetEditor from '../SnippetEditor'
import SettingsPanel from '../SettingsPanel'
import WelcomePage from '../WelcomePage'
import ViewToolbar from '../ViewToolbar'

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
  onNewProject,
  currentContext,
  onSnippetSelect
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
    return (
      <SnippetEditor
        key="create-mode-editor"
        onSave={onSave}
        onCancel={onCancelEditor}
        onNew={onNewSnippet}
        onNewProject={onNewProject}
        activeView={currentContext}
        snippets={snippets}
        projects={projects}
        onSnippetMentionClick={onSnippetSelect}
        isCreateMode
      />
    )
  }

  // Priority 3: Editing a snippet
  if (editingSnippet) {
    return (
      <SnippetEditor
        key={editingSnippet.id}
        initialSnippet={editingSnippet}
        onSave={handleSave}
        onNew={activeView === 'projects' ? onNewProject : onNewSnippet}
        onNewProject={onNewProject}
        onCancel={handleCancelEdit}
        onDelete={onDeleteRequest}
        snippets={snippets}
        projects={projects}
        onSnippetMentionClick={onSnippetSelect}
      />
    )
  }

  // Priority 4: Viewing a selected snippet
  if (selectedSnippet) {
    return (
      <SnippetEditor
        key={selectedSnippet.id}
        initialSnippet={selectedSnippet}
        onSave={handleSave}
        onNew={activeView === 'projects' ? onNewProject : onNewSnippet}
        onNewProject={onNewProject}
        onCancel={onCloseSnippet}
        onDelete={onDeleteRequest}
        snippets={snippets}
        projects={projects}
        onSnippetMentionClick={onSnippetSelect}
      />
    )
  }

  // Priority 6: Projects view - show with toolbar
  if (activeView === 'projects') {
    return (
      <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
        <ViewToolbar
          onNew={onNewProject}
          layoutMode="editor"
          setLayoutMode={() => {}}
          previewPosition="right"
          setPreviewPosition={() => {}}
          resetSplit={() => {}}
        />
        <div className="flex-1 p-6">
          <div className="h-full w-full flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
            Select a project from the Explorer
          </div>
        </div>
      </div>
    )
  }

  // FINAL FALLBACK: Show welcome page when activeView is undefined/null or doesn't match any condition
  return (
    <div className="h-full">
      <WelcomePage
        onNewSnippet={onNewSnippet}
        onNewProject={onNewProject}
        activeView={activeView}
      />
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
  onNewProject: PropTypes.func.isRequired,
  currentContext: PropTypes.string,
  onSnippetSelect: PropTypes.func
}

export default Workbench
