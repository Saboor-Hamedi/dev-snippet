import React from 'react'
import PropTypes from 'prop-types'
import SnippetEditor from './SnippetEditor'
import SettingsPanel from '../SettingsPanel'
import WelcomePage from '../WelcomePage'
import Header from '../layout/Header'

import SidebarTheme from '../preference/SidebarTheme'
import { File } from 'lucide-react'

import SnippetSidebar from './SnippetSidebar'
import TrashSidebar from './TrashSidebar'
import ActivityBar from '../layout/activityBar/ActivityBar'
import StatusBar from '../StatusBar'
import { useModal } from './manager/ModalManager'
import SystemStatusFooter from '../SystemStatusFooter'

const Workbench = ({
  activeView,
  selectedSnippet,
  snippets,
  trash, // New
  onRestoreItem, // New
  onPermanentDeleteItem, // New
  onLoadTrash, // New
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
  hideWelcomePage,
  onSearchSnippets,
  // Lifted state props
  isSidebarOpen,
  setIsSidebarOpen,
  onRename,
  // Folder Props
  folders,
  onToggleFolder,
  onNewFolder,
  onMoveSnippet,
  onMoveFolder,
  selectedFolderId,
  onSelectFolder,
  onRenameSnippet,
  onRenameFolder,
  onDeleteFolder,
  onDeleteBulk,
  onTogglePin,
  selectedIds,
  onSelectionChange,
  settings,
  isSettingsOpen
}) => {
  const handleSave = (snippet) => {
    onSave(snippet)
  }

  // Get modal functions
  const { openDeleteModal } = useModal()

  // --- Sidebar State Management ---
  const [activeSidebarTab, setActiveSidebarTab] = React.useState('explorer')
  // const [isSidebarOpen, setIsSidebarOpen] = React.useState(true) -> Lifted to SnippetLibrary

  const handleTabChange = (tabId) => {
    if (activeSidebarTab === tabId) {
      // Toggle if clicking active tab
      setIsSidebarOpen(!isSidebarOpen)
    } else {
      // Switch tab and ensure open
      setActiveSidebarTab(tabId)
      setIsSidebarOpen(true)
    }
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
          initialSnippet={selectedSnippet}
          snippets={snippets}
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
          initialSnippet={selectedSnippet}
          snippets={snippets}
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
        <div
          className="h-full w-full flex flex-col "
          style={{ backgroundColor: 'var(--welcome-bg, #232731)' }}
        >
          {/* Main Content Container - Max width for better reading experience on large screens */}
          <div className="flex-1 flex justify-center overflow-auto">
            {/* Original Action Block - Keeping it clean */}
            <div className=" p-2 m-auto flex items-center">
              <div>
                <h1 className="text-3xl font-light text-[var(--color-text-primary)] mb-1 text-center">
                  Dev Snippet
                </h1>
                <p className="text-sm text-center text-[var(--color-text-secondary)] font-light opacity-60">
                  Your code, organized and accessible
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <WelcomePage
        onNewSnippet={onNewSnippet}
        onNewProject={() => {}}
        onOpenSettings={onOpenSettings}
        onSelectSnippet={onSelectSnippet}
        snippets={snippets || []}
        activeView={activeView}
      />
    )
  }

  return (
    <div
      className={`h-full flex flex-col overflow-hidden ${settings?.ui?.showFocusMode ? 'focus-mode-active' : ''}`}
    >
      {/* Header - Full Width */}
      {settings?.ui?.showHeader !== false && !settings?.ui?.showFocusMode && (
        <Header
          title={getHeaderTitle()}
          isTab={activeView === 'editor' || (activeView === 'snippets' && !!selectedSnippet)}
          isCompact={isCompact}
          onToggleCompact={onToggleCompact}
          autosaveStatus={autosaveStatus}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onSave={() => selectedSnippet && onSave(selectedSnippet)}
          onNewSnippet={onNewSnippet}
          onNewFolder={onNewFolder}
          onSearch={() => {
            if (activeView === 'settings' && onCloseSettings) {
              onCloseSettings()
            }
            setActiveSidebarTab('explorer')
          }}
          sidebarWidth={250}
          onRename={onRename}
          onClose={onCloseSnippet}
        />
      )}

      {/* Main Workspace (ActivityBar + Sidebar + Editor) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Activity Bar (Icons) */}
        {settings?.ui?.showActivityBar !== false && !settings?.ui?.showFocusMode && (
          <ActivityBar
            activeTab={activeSidebarTab}
            onTabChange={handleTabChange}
            onSettings={onOpenSettings}
            isSettingsOpen={isSettingsOpen}
            trashCount={trash?.length || 0}
            settings={settings}
          />
        )}

        {/* Sidebars Container (Stacking) */}
        {/* We render both but control visibility via 'isOpen' prop for animation */}

        {/* Sidebars Container (Stacking) - Unified Transition Wrapper */}
        <aside
          className="flex flex-col overflow-hidden h-full z-10 relative"
          style={{
            width: isSidebarOpen && !settings?.ui?.showFocusMode ? 250 : 0,
            backgroundColor: 'var(--sidebar-bg)',
            borderRight:
              isSidebarOpen && !settings?.ui?.showFocusMode
                ? '1px solid var(--color-border)'
                : 'none',
            transition: 'width 300ms ease-in-out, opacity 300ms ease-in-out',
            opacity: isSidebarOpen && !settings?.ui?.showFocusMode ? 1 : 0,
            willChange: 'width, opacity'
          }}
        >
          <div
            className="h-full w-full flex flex-col"
            style={{ display: activeSidebarTab === 'themes' ? 'flex' : 'none' }}
          >
            <SidebarTheme
              isOpen={true} // Child always thinks it's open, parent handles collapse
              onToggle={() => setIsSidebarOpen(false)}
            />
          </div>

          <div
            className="h-full w-full flex flex-col"
            style={{ display: activeSidebarTab === 'explorer' ? 'flex' : 'none' }}
          >
            <SnippetSidebar
              isOpen={true} // Child always thinks it's open
              snippets={snippets}
              folders={folders}
              selectedSnippet={selectedSnippet}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onNew={onNewSnippet}
              onNewFolder={onNewFolder}
              onSearch={onSearchSnippets}
              onToggleFolder={onToggleFolder}
              onMoveSnippet={onMoveSnippet}
              onMoveFolder={onMoveFolder}
              onRenameSnippet={onRenameSnippet}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onDeleteSnippet={onDeleteRequest}
              onDeleteBulk={onDeleteBulk}
              onTogglePin={onTogglePin}
              selectedIds={selectedIds}
              onSelectionChange={onSelectionChange}
              onSelect={(s) => {
                if (onSelectSnippet) onSelectSnippet(s)
              }}
              onToggle={() => setIsSidebarOpen(false)}
              isCompact={isCompact}
              showToast={showToast}
            />
          </div>

          <div
            className="h-full w-full flex flex-col"
            style={{ display: activeSidebarTab === 'trash' ? 'flex' : 'none' }}
          >
            <TrashSidebar
              items={trash}
              onRestore={onRestoreItem}
              onPermanentDelete={onPermanentDeleteItem}
              onLoadTrash={onLoadTrash}
              openDeleteModal={openDeleteModal}
            />
          </div>
        </aside>

        {/* Editor Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-[var(--editor-bg)] ${settings?.ui?.showFocusMode ? 'focus-mode-container' : ''}`}
        >
          <div
            className={`flex-1 min-h-0 overflow-hidden text-clip ${settings?.ui?.showFocusMode ? 'focus-mode-content' : ''}`}
          >
            {renderContent()}
          </div>

          {settings?.ui?.showStatusBar !== false && !settings?.ui?.showFocusMode && (
            <div className="flex-none border-t border-[var(--color-border)] bg-[var(--footer-bg)]">
              {selectedSnippet ? (
                <StatusBar
                  title={selectedSnippet?.title}
                  onSettingsClick={onOpenSettings}
                  snippets={snippets || []}
                  hideWelcomePage={hideWelcomePage}
                  onToggleWelcomePage={(val) => {
                    // Optional toggle handler
                  }}
                />
              ) : (
                <SystemStatusFooter snippets={snippets || []} />
              )}
            </div>
          )}
        </div>
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
  onSearchSnippets: PropTypes.func,
  onRename: PropTypes.func,
  onSelectSnippet: PropTypes.func,
  currentContext: PropTypes.string,
  onOpenSettings: PropTypes.func,
  onCloseSettings: PropTypes.func,
  showToast: PropTypes.func,
  hideWelcomePage: PropTypes.bool,
  folders: PropTypes.array,
  onToggleFolder: PropTypes.func,
  onNewFolder: PropTypes.func
}

export default Workbench
