import React from 'react'
import PropTypes from 'prop-types'
import SnippetEditor from './SnippetEditor'
import SettingsPanel from '../SettingsPanel'
import WelcomePage from '../WelcomePage'
import { Header } from '../layout/Header'

import SidebarTheme from '../preference/SidebarTheme'
import SnippetSidebar from './SnippetSidebar'
import ActivityBar from '../layout/activityBar/ActivityBar'
import { StatusBar, SystemStatusFooter } from '../layout/StatusBar/useStatusBar'
import { useModal } from './manager/ModalContext'
import FlowStatusBadge from '../FlowMode/FlowStatusBadge'
import FlowPreview from '../FlowMode/FlowPreview'
import UniversalModal from '../universal/UniversalModal'
import FlowWorkspace from '../FlowMode/FlowWorkspace'
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
  onToggleFavorite,
  selectedIds,
  onSelectionChange,
  settings,
  isSettingsOpen,
  // Clipboard operations
  onCopy,
  onCut,
  onPaste,
  onSelectAll,
  onDailyNote,
  pinPopover,
  setPinPopover,
  onPing,
  onFavorite
}) => {
  const { currentTheme } = useTheme()
  const handleSave = (snippet) => {
    onSave(snippet)
  }

  const headerIsFavorited = (() => {
    const id = selectedSnippet?.id
    if (!id) return false
    const fromAll = (allSnippets || []).find((s) => s.id === id)
    if (fromAll && typeof fromAll.is_favorite !== 'undefined') return fromAll.is_favorite === 1
    return selectedSnippet?.is_favorite === 1
  })()
  const { openDeleteModal, openTrashModal } = useModal()
  const [activeSidebarTab, setActiveSidebarTab] = React.useState('explorer')
  const [showFlowPreview, setShowFlowPreview] = React.useState(false)

  // Listen for global commands (Command Palette) - REMOVED (Handled in SnippetLibraryInner)

  const handleTabChange = (tabId) => {
    // Only 'explorer' and 'themes' should open/toggle the sidebar
    if (tabId === 'explorer' || tabId === 'themes') {
      if (activeSidebarTab === tabId) {
        setIsSidebarOpen(!isSidebarOpen)
      } else {
        setActiveSidebarTab(tabId)
        setIsSidebarOpen(true)
      }
    } else {
      // For other tabs (like notifications or misc), just update the tab ID without opening
      setActiveSidebarTab(tabId)
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
          pinPopover={pinPopover}
          setPinPopover={setPinPopover}
          onPing={onPing}
          onFavorite={onFavorite}
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
          pinPopover={pinPopover}
          setPinPopover={setPinPopover}
          onPing={onPing}
          onFavorite={onFavorite}
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
  const sidebarWidth = settings?.ui?.sidebarWidth || 250

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
          snippetTitle={selectedSnippet?.title}
          isFavorited={headerIsFavorited}
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
          sidebarWidth={sidebarWidth}
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
              onDailyNote={onDailyNote}
              onTrash={openTrashModal}
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
            width: isSidebarOpen && !showFlowMode ? sidebarWidth : 0,
            opacity: isSidebarOpen && !showFlowMode ? 1 : 0,
            borderRightWidth: isSidebarOpen && !showFlowMode ? 1 : 0,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div
            className="h-full flex flex-col overflow-hidden"
            style={{ width: sidebarWidth, minWidth: sidebarWidth }}
          >
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
                onDailyNote={onDailyNote}
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
                onToggleFavorite={onToggleFavorite}
                selectedIds={selectedIds}
                onSelectionChange={onSelectionChange}
                onSelect={(s) => {
                  // Prevent deselecting the editor view by clicking sidebar background
                  if (s === null && activeView === 'editor') {
                    // keep editor open and selection as-is
                    return
                  }
                  if (onSelectSnippet) onSelectSnippet(s)
                  if (window.innerWidth <= 768) setIsSidebarOpen(false)
                }}
                onToggle={() => setIsSidebarOpen(false)}
                isCompact={isCompact}
                showToast={showToast}
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
          </div>
        </aside>

        {/* Content Area */}
        <div
          className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 relative"
          style={{
            backgroundColor: showFlowMode ? 'transparent' : 'var(--editor-bg)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {showFlowMode && (
            <div className="flow-convas" style={{ zIndex: -1 }}>
              <div className="zen-atmosphere">
                <div className="cyber-grid" />
                <div className="zen-orb" />
                <div className="zen-orb" />
                <div className="zen-orb" />
                <div className="scanning-laser" />
              </div>
            </div>
          )}
          {showFlowMode ? (
            <FlowWorkspace
              selectedSnippet={selectedSnippet}
              snippets={snippets}
              fontFamily={settings?.editor?.fontFamily}
              renderEditor={renderContent}
              onExit={() => window.dispatchEvent(new CustomEvent('app:toggle-flow'))}
            />
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">{renderContent()}</div>
          )}
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
        <div style={{ display: 'none' }}>{/* Flow session managed by FlowWorkspace header */}</div>
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
  onToggleFavorite: PropTypes.func,
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
  // Clipboard operations
  onCopy: PropTypes.func,
  onCut: PropTypes.func,
  onPaste: PropTypes.func,
  onSelectAll: PropTypes.func
}

export default Workbench
