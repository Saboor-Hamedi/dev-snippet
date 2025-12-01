import React from 'react'
import PropTypes from 'prop-types'
import SnippetEditor from '../SnippetEditor'
import SettingsPanel from '../SettingsPanel'
import WelcomePage from '../WelcomePage'

const Workbench = ({
  activeView,
  selectedSnippet,
  onSave,
  onCloseSnippet,
  onCancelEditor,
  onDeleteRequest,
  onNewSnippet,
  currentContext,
  onOpenSettings,
  onCloseSettings
}) => {
  const handleSave = (snippet) => {
    onSave(snippet)
  }

  const handleSettingsClick = () => {
    if (onOpenSettings) {
      onOpenSettings()
    }
  }

  // Priority 0: Settings
  if (activeView === 'settings') {
    console.log('Rendering SettingsPanel')
    return <SettingsPanel onClose={onCloseSettings} />
  }

  // Priority 1: Editor mode (creating new snippet)
  if (activeView === 'editor') {
    return (
      <SnippetEditor
        key="create-mode-editor"
        onSave={onSave}
        onCancel={onCancelEditor}
        onNew={onNewSnippet}
        activeView={currentContext}
        isCreateMode
        onSettingsClick={handleSettingsClick}
      />
    )
  }

  // Editing mode handled via selectedSnippet and activeView

  // Priority 4: Viewing a selected snippet
  if (selectedSnippet) {
    return (
      <SnippetEditor
        key={selectedSnippet.id}
        initialSnippet={selectedSnippet}
        onSave={handleSave}
        onNew={onNewSnippet}
        onCancel={onCloseSnippet}
        onDelete={onDeleteRequest}
        onSettingsClick={handleSettingsClick}
      />
    )
  }

  // FINAL FALLBACK: Show welcome page when activeView is undefined/null or doesn't match any condition
  return (
    <div className="h-full">
      <WelcomePage onNewSnippet={onNewSnippet} activeView={activeView} />
    </div>
  )
}

Workbench.propTypes = {
  activeView: PropTypes.string.isRequired,
  selectedSnippet: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCloseSnippet: PropTypes.func.isRequired,
  onCancelEditor: PropTypes.func,
  onDeleteRequest: PropTypes.func.isRequired,
  onNewSnippet: PropTypes.func.isRequired,
  currentContext: PropTypes.string
}

export default Workbench
