import React from 'react'
import PropTypes from 'prop-types'
import SnippetEditor from './SnippetEditor'
import SettingsPanel from '../SettingsPanel'
import WelcomePage from '../WelcomePage'
import Header from '../layout/Header'

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
  onCloseSettings,
  isCompact,
  onToggleCompact,
  autosaveStatus,
  onAutosave,
  showToast
}) => {
  const handleSave = (snippet) => {
    onSave(snippet)
  }

  const handleSettingsClick = () => {
    if (onOpenSettings) {
      onOpenSettings()
    }
  }

  // Determine header title based on current view
  const getHeaderTitle = () => {
    switch (activeView) {
      case 'editor':
        return selectedSnippet?.title || 'New Snippet'
      case 'snippets':
        return selectedSnippet?.title || 'Quick Snippets'
      case 'welcome':
        return 'Welcome'
      case 'settings':
        return 'Settings'
      default:
        return 'Quick Snippets'
    }
  }

  const renderContent = () => {
    // Priority 0: Settings
    if (activeView === 'settings') {
      return <SettingsPanel onClose={onCloseSettings} />
    }

    // Priority 1: Editor mode (creating new snippet)
    if (activeView === 'editor') {
      return (
        <SnippetEditor
          key={selectedSnippet?.id || 'create-mode-editor'}
          initialSnippet={selectedSnippet}
          onSave={onSave}
          onCancel={onCancelEditor}
          onNew={onNewSnippet}
          activeView={currentContext}
          isCreateMode
          onSettingsClick={handleSettingsClick}
          isCompact={isCompact}
          onToggleCompact={onToggleCompact}
          onAutosave={onAutosave}
          showToast={showToast}
        />
      )
    }

    // Viewing a selected snippet
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
          isCompact={isCompact}
          onToggleCompact={onToggleCompact}
          onAutosave={onAutosave}
          showToast={showToast}
        />
      )
    }

    // FINAL FALLBACK: Welcome page
    return <WelcomePage onNewSnippet={onNewSnippet} activeView={activeView} />
  }

  return (
    <div className="h-full flex flex-col">
      <Header title={getHeaderTitle()} isCompact={isCompact} onToggleCompact={onToggleCompact} autosaveStatus={autosaveStatus} />
      <div className="flex-1 min-h-0 overflow-hidden">
        {renderContent()}
      </div>
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
  ,
  showToast: PropTypes.func
}

export default Workbench
