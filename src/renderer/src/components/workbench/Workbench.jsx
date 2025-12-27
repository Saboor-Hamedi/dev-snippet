import React from 'react'
import PropTypes from 'prop-types'
import SnippetEditor from './SnippetEditor'
import SettingsPanel from '../SettingsPanel'
import WelcomePage from '../WelcomePage'
import { Header } from '../layout/Header'

import SidebarTheme from '../preference/SidebarTheme'
import SnippetSidebar from './SnippetSidebar'
import TrashSidebar from './TrashSidebar'
import ActivityBar from '../layout/activityBar/ActivityBar'
import { useStatusBar as StatusBar, SystemStatusFooter } from '../layout/StatusBar/useStatusBar'
import { useModal } from './manager/ModalContext'
import FlowStatusBadge from '../FlowMode/FlowStatusBadge'
import FlowPreview from '../FlowMode/FlowPreview'
import '../FlowMode/FlowMode.css'
import LivePreview from '../livepreview/LivePreview'
import { useTheme } from '../../hook/useTheme'

const Workbench = ({
  activeView,
  selectedSnippet,
  snippets,
  allSnippets,
  trash,
  onRestoreItem,
  onPermanentDeleteItem,
  onLoadTrash,
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
  searchQuery,
  isSidebarOpen,
  setIsSidebarOpen,
  onRename,
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
  isSettingsOpen,
  currentPage,
  totalPages,
  onPageChange,
  enablePagination,
  // Clipboard operations
  onCopy,
  onCut,
  onPaste,
  onSelectAll
}) => {
  const { currentTheme } = useTheme()
  const handleSave = (snippet) => {
    onSave(snippet)
  }

  const { openDeleteModal } = useModal()
  const [activeSidebarTab, setActiveSidebarTab] = React.useState('explorer')
  const [showFlowPreview, setShowFlowPreview] = React.useState(false)

  const handleTabChange = (tabId) => {
    if (activeSidebarTab === tabId) {
      setIsSidebarOpen(!isSidebarOpen)
    } else {
      setActiveSidebarTab(tabId)
      setIsSidebarOpen(true)
    }
  }

  const handleSettingsClick = () => {
    if (onOpenSettings) {
      onOpenSettings()
    }
  }

  const handleCloseSnippet = () => {
    onCloseSnippet()
    // Explicitly deselect in sidebar when closing
    if (onSelectionChange) onSelectionChange([])
    if (onSelectSnippet) onSelectSnippet(null)
  }

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
    if (activeView === 'settings') {
      return <SettingsPanel onClose={onCloseSettings} />
    }

    if (activeView === 'editor') {
      return (
        <SnippetEditor
          initialSnippet={selectedSnippet}
          snippets={allSnippets || snippets}
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

    if (selectedSnippet) {
      return (
        <SnippetEditor
          initialSnippet={selectedSnippet}
          snippets={allSnippets || snippets}
          onSave={handleSave}
          onNew={onNewSnippet}
          onCancel={handleCloseSnippet}
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

    if (hideWelcomePage) {
      return (
        <div
          className="h-full w-full flex flex-col "
          style={{ backgroundColor: 'var(--welcome-bg, #232731)' }}
        >
          <div className="flex-1 flex justify-center overflow-auto">
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
        snippets={allSnippets || snippets || []}
        activeView={activeView}
      />
    )
  }

  const showFlowMode = settings?.ui?.showFlowMode

  return (
    <div
      className={`h-full flex flex-col overflow-hidden transition-colors duration-300 ${
        showFlowMode ? 'flow-mode-active' : ''
      }`}
    >
      {/* Header */}
      {settings?.ui?.showHeader !== false && !showFlowMode && (
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
          onClose={handleCloseSnippet}
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Activity Bar */}
        {(settings?.ui?.showActivityBar !== false || showFlowMode) && (
          <div
            style={{
              width: showFlowMode ? 0 : 40,
              opacity: showFlowMode ? 0 : 1,
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <ActivityBar
              activeTab={activeSidebarTab}
              onTabChange={handleTabChange}
              onSettings={onOpenSettings}
              isSettingsOpen={isSettingsOpen}
              trashCount={trash?.length || 0}
              settings={settings}
            />
          </div>
        )}

        {/* Sidebar */}
        <aside
          className="flex flex-col overflow-hidden h-full z-10 relative bg-[var(--sidebar-bg)] border-[var(--color-border)]"
          style={{
            width: isSidebarOpen && !showFlowMode ? 250 : 0,
            opacity: isSidebarOpen && !showFlowMode ? 1 : 0,
            borderRightWidth: isSidebarOpen && !showFlowMode ? 1 : 0,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div className="h-full min-w-[250px] w-[250px] flex flex-col overflow-hidden">
            {activeSidebarTab === 'explorer' && (
              <SnippetSidebar
                isOpen={isSidebarOpen}
                snippets={snippets}
                folders={folders}
                selectedSnippet={selectedSnippet}
                selectedFolderId={selectedFolderId}
                onSelectFolder={onSelectFolder}
                onNew={onNewSnippet}
                onNewFolder={onNewFolder}
                onSearch={onSearchSnippets}
                searchQuery={searchQuery}
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
                  if (window.innerWidth <= 768) setIsSidebarOpen(false)
                }}
                onToggle={() => setIsSidebarOpen(false)}
                isCompact={isCompact}
                showToast={showToast}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                enablePagination={enablePagination}
                // Clipboard operations
                onCopy={onCopy}
                onCut={onCut}
                onPaste={onPaste}
                onSelectAll={onSelectAll}
              />
            )}

            {activeSidebarTab === 'themes' && (
              <SidebarTheme isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(false)} />
            )}

            {activeSidebarTab === 'trash' && (
              <TrashSidebar
                items={trash}
                onRestore={onRestoreItem}
                onPermanentDelete={onPermanentDeleteItem}
                onLoadTrash={onLoadTrash}
                openDeleteModal={openDeleteModal}
              />
            )}
          </div>
        </aside>

        {/* Content Area */}
        <div
          className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${
            showFlowMode ? 'flow-convas' : 'bg-[var(--editor-bg)]'
          }`}
          style={{
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div className={showFlowMode ? 'flow-content' : 'flex-1 flex flex-col overflow-hidden'}>
            {renderContent()}
          </div>

          {/* Status Bar - Only show SystemStatusFooter when NOT in editor mode (SnippetEditor has its own StatusBar) */}
          {settings?.ui?.showStatusBar !== false &&
            !showFlowMode &&
            !selectedSnippet &&
            activeView !== 'editor' && (
              <div className="flex-none border-t border-[var(--color-border)] bg-[var(--footer-bg)]">
                <SystemStatusFooter snippets={snippets || []} />
              </div>
            )}
        </div>
      </div>

      {showFlowMode && (
        <>
          <div className="flow-drag-handle" />
          <FlowStatusBadge
            onExit={() => window.dispatchEvent(new CustomEvent('app:toggle-flow'))}
            onTogglePreview={() => setShowFlowPreview(!showFlowPreview)}
            isPreviewVisible={showFlowPreview}
            snippet={selectedSnippet}
          />

          <FlowPreview
            show={showFlowPreview}
            selectedSnippet={selectedSnippet}
            snippets={snippets}
            currentTheme={currentTheme}
            fontFamily={settings?.editor?.fontFamily}
          />
        </>
      )}
    </div>
  )
}

Workbench.propTypes = {
  activeView: PropTypes.string.isRequired,
  selectedSnippet: PropTypes.object,
  snippets: PropTypes.array,
  allSnippets: PropTypes.array,
  onSave: PropTypes.func.isRequired,
  onCloseSnippet: PropTypes.func.isRequired,
  onCancelEditor: PropTypes.func,
  onDeleteRequest: PropTypes.func.isRequired,
  onNewSnippet: PropTypes.func.isRequired,
  onSearchSnippets: PropTypes.func,
  onRename: PropTypes.func,
  onSelectSnippet: PropTypes.func,
  handleRename: PropTypes.func,
  currentContext: PropTypes.string,
  onOpenSettings: PropTypes.func,
  onCloseSettings: PropTypes.func,
  showToast: PropTypes.func,
  hideWelcomePage: PropTypes.bool,
  folders: PropTypes.array,
  onToggleFolder: PropTypes.func,
  onNewFolder: PropTypes.func,
  onMoveSnippet: PropTypes.func,
  onMoveFolder: PropTypes.func,
  selectedFolderId: PropTypes.string,
  onSelectFolder: PropTypes.func,
  onRenameSnippet: PropTypes.func,
  onRenameFolder: PropTypes.func,
  onDeleteFolder: PropTypes.func,
  onDeleteBulk: PropTypes.func,
  onTogglePin: PropTypes.func,
  selectedIds: PropTypes.array,
  onSelectionChange: PropTypes.func,
  settings: PropTypes.object,
  isSettingsOpen: PropTypes.bool,
  isSidebarOpen: PropTypes.bool,
  setIsSidebarOpen: PropTypes.func,
  trash: PropTypes.array,
  onRestoreItem: PropTypes.func,
  onPermanentDeleteItem: PropTypes.func,
  onLoadTrash: PropTypes.func,
  isCompact: PropTypes.bool,
  onToggleCompact: PropTypes.func,
  autosaveStatus: PropTypes.string,
  onAutosave: PropTypes.func,
  showPreview: PropTypes.bool,
  onTogglePreview: PropTypes.func,
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func,
  enablePagination: PropTypes.bool,
  // Clipboard operations
  onCopy: PropTypes.func,
  onCut: PropTypes.func,
  onPaste: PropTypes.func,
  onSelectAll: PropTypes.func
}

export default Workbench
