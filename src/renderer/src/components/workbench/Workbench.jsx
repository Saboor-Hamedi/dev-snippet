import React from 'react'
import PropTypes from 'prop-types'
import SnippetEditor from './SnippetEditor'
import SettingsPanel from '../SettingsPanel'
import WelcomePage from '../WelcomePage'
import Header from '../layout/Header'
import SystemStatusFooter from '../SystemStatusFooter'
import { File } from 'lucide-react'

const Workbench = ({
  activeView,
  selectedSnippet,
  snippets,
  showPreview,
  onTogglePreview,
  onSave,
  onCloseSnippet,
  onCancelEditor,
  onDeleteRequest,
  onNewSnippet,
  onSelectSnippet,
  currentContext,
  onOpenSettings,
  onCloseSettings,
  isCompact,
  onToggleCompact,
  autosaveStatus,
  onAutosave,
  showToast,
  hideWelcomePage
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
          showPreview={showPreview}
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
          showPreview={showPreview}
        />
      )
    }

    // FINAL FALLBACK: Welcome page or Empty State
    if (hideWelcomePage) {
      return (
        <div className="h-full w-full flex justify-center py-20 px-4 overflow-auto">
          {/* Main Content Container - Max width for better reading experience on large screens */}
          <div className="max-w-4xl w-full">
            {/* Header Section */}
            <div className="flex items-center mb-10 border-b border-[var(--color-border)] pb-6">
              {/* Large Icon/Logo */}
              <div className="mr-6 p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                <File size={56} className="text-[var(--color-text-primary)]" />
              </div>
              <div>
                {/* Main Title - Larger than before */}
                <h1 className="text-3xl font-bold mb-1 text-[var(--color-text-primary)]">
                  Welcome to Dev Snippet
                </h1>
                {/* Sub-Title / Description */}
                <p className="text-base text-[var(--color-text-secondary)]">
                  Select a snippet or get started by creating a new one.
                </p>
              </div>
            </div>

            {/* Action Grid Section (VS Code Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Snippet Action Card: Create New */}
              <div className="bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-secondary-hover)] p-6 rounded-lg border border-[var(--color-border)] transition duration-200 cursor-pointer shadow-md">
                <h2 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
                  Start Coding
                </h2>
                <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
                  Create a fresh, empty snippet to begin writing code or notes.
                </p>
                <p className="text-xs font-mono text-[var(--color-text-secondary)]">
                  Shortcut:
                  <kbd className="bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded ml-2 border border-[var(--color-border)] shadow-sm">
                    Ctrl + N
                  </kbd>
                </p>
              </div>

              {/* Snippet Action Card: Search */}
              <div className="bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-secondary-hover)] p-6 rounded-lg border border-[var(--color-border)] transition duration-200 cursor-pointer shadow-md">
                <h2 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
                  Quick Search
                </h2>
                <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
                  Instantly find and open existing snippets by name.
                </p>
                <p className="text-xs font-mono text-[var(--color-text-secondary)]">
                  Shortcut:
                  <kbd className="bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded ml-2 border border-[var(--color-border)] shadow-sm">
                    Ctrl + P
                  </kbd>
                </p>
              </div>
            </div>

            {/* Original Action Block (Optional: kept as secondary/alternative actions) */}
            <div className="mt-10 text-center text-sm text-[var(--color-text-tertiary)]">
              <h3 className="text-lg font-medium mb-3 text-[var(--color-text-secondary)]">
                Additional Actions
              </h3>
              {/* You can add more links/actions here */}
              <p className="hover:text-[var(--color-text-primary)] cursor-pointer">
                View Documentation
              </p>
            </div>
          </div>

          {/* Footer for Empty State - Moved outside the main content container but still absolutely positioned */}
          <div className="absolute bottom-0 left-0 right-0">
            <SystemStatusFooter snippets={snippets || []} />
          </div>
        </div>
      )
    }

    return (
      <WelcomePage
        onNewSnippet={onNewSnippet}
        onNewProject={() => {
          /* TODO: Implement project creation */
        }}
        onOpenSettings={onOpenSettings}
        onSelectSnippet={onSelectSnippet}
        snippets={snippets || []}
        activeView={activeView}
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      <Header
        title={getHeaderTitle()}
        isCompact={isCompact}
        onToggleCompact={onToggleCompact}
        autosaveStatus={autosaveStatus}
      />
      <div className="flex-1 min-h-0 overflow-hidden">{renderContent()}</div>
    </div>
  )
}

Workbench.propTypes = {
  activeView: PropTypes.string.isRequired,
  selectedSnippet: PropTypes.object,
  snippets: PropTypes.array,
  onSave: PropTypes.func.isRequired,
  onCloseSnippet: PropTypes.func.isRequired,
  onCancelEditor: PropTypes.func,
  onDeleteRequest: PropTypes.func.isRequired,
  onNewSnippet: PropTypes.func.isRequired,
  onSelectSnippet: PropTypes.func,
  currentContext: PropTypes.string,
  onOpenSettings: PropTypes.func,
  onCloseSettings: PropTypes.func,
  showToast: PropTypes.func,
  hideWelcomePage: PropTypes.bool
}

export default Workbench
