import React from 'react'
import PropTypes from 'prop-types'
import SnippetEditor from './SnippetEditor'
import WelcomePage from '../WelcomePage'
import { Header } from '../layout/Header'

import SidebarTheme from '../preference/SidebarTheme'
import SnippetSidebar from './SnippetSidebar'
import ActivityBar from '../layout/activityBar/ActivityBar'
import { StatusBar, SystemStatusFooter } from '../layout/StatusBar/useStatusBar'
import { useModal } from './manager/ModalContext'
import UniversalModal from '../universal/UniversalModal'
import FlowWorkspace from '../FlowMode/FlowWorkspace'
import '../FlowMode/FlowMode.css'
import LivePreview from '../livepreview/LivePreview'
import { useTheme } from '../../hook/useTheme'
import { useSettings } from '../../hook/useSettingsContext'

// ... (JSDoc omitted for brevity) ...

const Workbench = ({
  // Data Props
  activeView,
  selectedSnippet,
  snippets,
  allSnippets,
  folders,
  trash,

  // Sidebar State (Passed to SnippetSidebar)
  isSidebarOpen,
  setIsSidebarOpen,

  // Actions
  onSave,
  onNewSnippet,
  onNewFolder,
  onDeleteRequest,
  onDeleteFolder,
  onDeleteBulk,
  onRestoreItem,
  onPermanentDeleteItem,
  onLoadTrash,
  onCloseSnippet,
  onCancelEditor,
  onSelectSnippet,
  onRenameSnippet,
  onRenameFolder,
  onRename, // Global rename handler
  onMoveSnippet,
  onMoveFolder,
  onToggleFolder,
  onTogglePin,
  onToggleFavorite,
  onSelectionChange,
  onSearchSnippets,
  onInlineRename,

  // View/UI State
  showPreview,
  onTogglePreview,
  currentContext,
  isCompact,
  onToggleCompact,
  autosaveStatus,
  onAutosave,
  showToast,
  hideWelcomePage,

  // Settings
  settings,
  isSettingsOpen,
  onOpenSettings,
  onCloseSettings,

  // Clipboard & Global Commands
  onCopy,
  onCut,
  onPaste,
  onSelectAll,
  onDailyNote,
  onPing,
  onFavorite,

  // Dirty State
  onDirtyStateChange,
  dirtyIds,

  // Components/Refs sharing
  pinPopover,
  setPinPopover
}) => {
  const { currentTheme } = useTheme()
  const { updateSetting, getSetting } = useSettings()
  const showFlowMode = getSetting('ui.showFlowMode')

  // --- Resizable Sidebar Logic ---
  const workbenchRef = React.useRef(null)
  const sidebarRef = React.useRef(null)
  const [sidebarWidth, setSidebarWidth] = React.useState(() => {
    return getSetting('ui.sidebarWidth') || 250
  })
  const [isResizing, setIsResizing] = React.useState(false)

  // Sync with settings if they change externally (optional, but good for reset)
  React.useEffect(() => {
    const saved = getSetting('ui.sidebarWidth')
    if (saved && !isResizing) {
      setSidebarWidth(saved)
    }
  }, [getSetting, isResizing])

  // Handle Dragging
  React.useEffect(() => {
    if (!isResizing) return

    let animationFrameId

    // Cache metrics at start of drag to keep the loop lightweight
    const showActivityBar = getSetting('ui.showActivityBar') !== false
    const activityBarWidth = showActivityBar || showFlowMode ? (showFlowMode ? 0 : 48) : 0

    const handleMouseMove = (e) => {
      // Calculate new width relative to the activity bar
      const newWidth = e.clientX - activityBarWidth

      // Constraints
      const SNAP_THRESHOLD = 50
      let finalWidth = newWidth

      if (newWidth < SNAP_THRESHOLD) {
        finalWidth = 0
      } else if (newWidth > 600) {
        finalWidth = 600
      } else if (newWidth < 150) {
        finalWidth = 0
      }

      // INSTANT SYNC: Direct DOM update without rAF delay
      if (workbenchRef.current) {
        workbenchRef.current.style.setProperty('--sidebar-width', `${finalWidth}px`)
      }
    }

    const handleMouseUp = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      let finalCommittedWidth = sidebarWidth
      if (workbenchRef.current) {
        const domValue = workbenchRef.current.style.getPropertyValue('--sidebar-width')
        if (domValue) {
          finalCommittedWidth = parseInt(domValue, 10)
        }
      }

      if (finalCommittedWidth < 100) {
        setIsSidebarOpen(false)
        setSidebarWidth(250)
        updateSetting('ui.sidebarWidth', 250)
      } else {
        setSidebarWidth(finalCommittedWidth)
        updateSetting('ui.sidebarWidth', finalCommittedWidth)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [isResizing, sidebarWidth, updateSetting, showFlowMode, getSetting, setIsSidebarOpen])

  // ... (existing logic) ...

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

  const handleCloseSnippet = (...args) => {
    onCloseSnippet(...args)
    // Explicitly deselect in sidebar when closing
  }

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'editor':
        return selectedSnippet?.title || 'New Snippet'
      case 'snippets':
        return selectedSnippet?.title || 'Quick Snippets'
      case 'welcome':
        return 'Welcome'
      default:
        return 'Quick Snippets'
    }
  }

  const renderContent = (isFlow = false) => {
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
          showPreview={isFlow ? false : showPreview}
          pinPopover={pinPopover}
          setPinPopover={setPinPopover}
          onPing={onPing}
          onFavorite={onFavorite}
          isFlow={isFlow}
          onDirtyStateChange={onDirtyStateChange}
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
          showPreview={isFlow ? false : showPreview}
          pinPopover={pinPopover}
          setPinPopover={setPinPopover}
          onPing={onPing}
          onFavorite={onFavorite}
          isFlow={isFlow}
          onDirtyStateChange={onDirtyStateChange}
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

  // ... (omitted) ...

  // REMOVED: const sidebarWidth = settings?.ui?.sidebarWidth || 250 (Now using state)

  // Initialize CSS variables on the root container
  React.useLayoutEffect(() => {
    if (workbenchRef.current) {
      const showActivityBar = getSetting('ui.showActivityBar') !== false
      const activityBarWidth = showActivityBar || showFlowMode ? (showFlowMode ? 0 : 48) : 0
      const currentWidth = isSidebarOpen && !showFlowMode ? sidebarWidth : 0

      workbenchRef.current.style.setProperty('--sidebar-width', `${currentWidth}px`)
      workbenchRef.current.style.setProperty('--activity-bar-width', `${activityBarWidth}px`)
    }
  }, [sidebarWidth, isSidebarOpen, showFlowMode, getSetting])

  return (
    <div
      ref={workbenchRef}
      className={`flex flex-col h-screen overflow-hidden select-none bg-[var(--color-bg-primary)] ${isResizing ? 'resizing' : ''}`}
    >
      {/* Header */}
      {getSetting('ui.showHeader') !== false && !showFlowMode && (
        <Header
          title={getHeaderTitle()}
          snippetTitle={selectedSnippet?.title}
          isFavorited={headerIsFavorited}
          isTab={activeView === 'editor' || (activeView === 'snippets' && !!selectedSnippet)}
          isCompact={isCompact}
          isResizing={isResizing}
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
          onRename={() => {
            if (selectedSnippet?.id === 'system:settings') {
              showToast('The settings.json file cannot be renamed', 'info')
              return
            }
            onRename && onRename()
          }}
          onClose={handleCloseSnippet}
        />
      )}

      {/* GLOBAL RESIZE OVERLAY: The "Glass Pane" technique.
          Creates a full-screen shield during resizing to prevent "detach", cursor flickering,
          or event trapping by iframes/editor. */}
      {isResizing && (
        <div
          className="fixed inset-0 z-[9999] cursor-ew-resize bg-transparent"
          style={{ userSelect: 'none' }}
        />
      )}

      {/* Main Container - Switched to Grid for Atomic Sync (mathematically prevents detach) */}
      <div
        className={`flex-1 grid overflow-hidden min-h-0 relative text-[var(--color-text-primary)] 
          ${isResizing ? 'resizing' : ''}`}
        style={{
          gridTemplateColumns: 'var(--activity-bar-width) var(--sidebar-width) 1fr',
          backgroundColor: 'var(--sidebar-bg)', // Mask sub-pixel gaps with sidebar color
          transform: 'translateZ(0)' // Hardware acceleration
        }}
      >
        {/* Activity Bar */}
        {(getSetting('ui.showActivityBar') !== false || showFlowMode) && (
          <div
            className="h-full overflow-hidden"
            style={{
              width: 'var(--activity-bar-width)',
              opacity: showFlowMode ? 0 : 1
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
          ref={sidebarRef}
          className="flex flex-col h-full z-10 relative sidebar-container"
          style={{
            width: 'var(--sidebar-width)',
            backgroundColor: 'transparent', // Let parent handle BG
            willChange: isResizing ? 'width' : 'auto',
            overflow: 'visible' // Allow Sash to protrude
          }}
        >
          {/* CONTENT CLIPPING WRAPPER: Ensures content "slides under" instead of squashing or spilling */}
          <div
            className="w-full h-full overflow-hidden flex flex-col transition-opacity duration-200"
            style={{
              opacity: isSidebarOpen && !showFlowMode ? 1 : 0,
              pointerEvents: isSidebarOpen ? 'auto' : 'none'
            }}
          >
            <div className="h-full flex flex-col" style={{ width: '100%', minWidth: '170px' }}>
              {activeSidebarTab === 'explorer' && (
                <SnippetSidebar
                  isOpen={isSidebarOpen}
                  snippets={snippets}
                  folders={folders}
                  selectedSnippet={selectedSnippet}
                  onNew={onNewSnippet}
                  onNewFolder={onNewFolder}
                  onDailyNote={onDailyNote}
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
                  onToggleFavorite={onToggleFavorite}
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
                  dirtyIds={dirtyIds}
                  onInlineRename={onInlineRename}
                />
              )}

              {activeSidebarTab === 'themes' && (
                <SidebarTheme isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(false)} />
              )}
            </div>
          </div>

          {/* Resizer Handle - Minimalist Sash (VS Code Style) */}
          {!showFlowMode && (
            <div
              className={`
                absolute top-0 bottom-0 right-[-6px] w-[12px] z-50
                cursor-ew-resize select-none active:opacity-100
              `}
              onDoubleClick={(e) => {
                e.preventDefault()
                onToggleSidebar()
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsResizing(true)
                document.body.style.cursor = 'ew-resize'
                document.body.style.userSelect = 'none'

                const showActivityBar = getSetting('ui.showActivityBar') !== false
                const currentActivityBarWidth = showActivityBar ? 48 : 0

                // If it's closed, give it a head-start width
                if (!isSidebarOpen) {
                  const startOpenWidth = Math.max(170, e.clientX - currentActivityBarWidth)
                  setIsSidebarOpen(true)
                  setSidebarWidth(startOpenWidth)
                  if (workbenchRef.current) {
                    workbenchRef.current.style.setProperty('--sidebar-width', `${startOpenWidth}px`)
                  }
                }
              }}
            >
              {/* THE BOUNDARY LINE: Always visible to show where the drag begins */}
              <div
                className="absolute right-[5px] top-0 bottom-0 w-[1px] opacity-20 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'var(--color-border)' }}
              />
              {/* The hover glow line */}
              <div
                className={`w-[2px] h-full mx-auto transition-colors duration-200 ${isResizing ? 'bg-[var(--color-accent-primary)]' : 'hover:bg-[var(--color-accent-primary)]'}`}
              />
            </div>
          )}
        </aside>

        {/* Content Area - Column 3 in Grid - Perfectly synced */}
        <div
          className="flex flex-col min-w-0 overflow-hidden relative"
          style={{
            backgroundColor: showFlowMode ? 'transparent' : 'var(--editor-bg)',
            transform: 'translateZ(0)' // Hardware acceleration
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
              renderEditor={() => renderContent(true)}
              onExit={() => window.dispatchEvent(new CustomEvent('app:toggle-flow'))}
            />
          ) : (
            <div
              className={`flex-1 flex flex-col overflow-hidden ${isResizing ? 'pointer-events-none' : 'auto'}`}
            >
              {renderContent(false)}
            </div>
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
