import React from 'react'
import PropTypes from 'prop-types'
import SnippetEditor from './SnippetEditor'
import SettingsPanel from '../SettingsPanel'
import WelcomePage from '../WelcomePage'
import Header from '../layout/Header'
import SystemStatusFooter from '../SystemStatusFooter'
import SidebarTheme from '../preference/SidebarTheme'
import { File } from 'lucide-react'
import useGeneralProp from '../../hook/useGeneralProp.js'

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
  const { welcomeBg } = useGeneralProp() // Get welcome background color

  // Toggle sidebarTheme.
  const [isSidebarThemeOpen, setIsSidebarThemeOpen] = React.useState(false)
  const handleSettingsClick = () => {
    if (onOpenSettings) {
      onOpenSettings()
    }
  }
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl+B (Windows/Linux) or Cmd+B (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault() // Prevent default browser behavior (bold text etc.)
        setIsSidebarThemeOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
    // SidebarTheme here, it will everhwhere.

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
        <div className="h-full w-full flex flex-col " style={{ backgroundColor: welcomeBg }}>
          {/* Main Content Container - Max width for better reading experience on large screens */}
          <div className="flex-1 flex justify-center overflow-auto">
            {/* Original Action Block (Optional: kept as secondary/alternative actions) */}
            <div className=" p-2 m-auto flex items-center">
              <div>
                <h1 className="text-4xl font-light text-[var(--color-text-primary)] mb-1">
                  Div Snippet
                </h1>
                <p className="text-xl text-center text-[var(--color-text-secondary)] font-light opacity-80">
                  Editing evolved
                </p>
              </div>
            </div>
          </div>

          {/* Footer for Empty State */}
          <SystemStatusFooter snippets={snippets || []} />
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
    <div className="h-full flex overflow-hidden">
      {/* This is where the sidebar theme appears.  */}
      <SidebarTheme isOpen={isSidebarThemeOpen} />
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getHeaderTitle()}
          isCompact={isCompact}
          onToggleCompact={onToggleCompact}
          autosaveStatus={autosaveStatus}
        />
        <div className="flex-1 min-h-0 overflow-hidden">{renderContent()}</div>
      </div>
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
