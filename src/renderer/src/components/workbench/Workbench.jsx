import React from 'react'
import PropTypes from 'prop-types'
import SnippetEditor from './SnippetEditor'
import WelcomePage from '../WelcomePage'
import { Header } from '../layout/Header'
import {
  Plus,
  Minus,
  Maximize2,
  RefreshCw,
  X,
  Share2,
  Palette,
  Sparkles,
  Search
} from 'lucide-react'
import { generateRandomGraphTheme } from '../Graph/GraphLogic'

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
import { useView } from '../../context/ViewContext'
import KnowledgeGraph from '../Graph/KnowledgeGraph'

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
  isSearching, // Added isSearching here
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
  onToggleZenFocus,

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
  const isDraggingInternal = React.useRef(false) // Instant flag for logic
  const isSettlingRef = React.useRef(false) // Lock flag for jump-prevention

  const [sidebarWidth, setSidebarWidth] = React.useState(() => {
    return getSetting('sidebar.width') || 250
  })
  const [isResizing, setIsResizing] = React.useState(false) // State for CSS/Transitions
  const lastValidWidth = React.useRef(sidebarWidth)

  // Sync with settings if they change externally (e.g. manual file edits)
  React.useEffect(() => {
    const saved = getSetting('sidebar.width')
    if (typeof saved === 'number' && !isDraggingInternal.current && !isSettlingRef.current) {
      if (saved !== sidebarWidth) {
        setSidebarWidth(saved)
        lastValidWidth.current = saved
      }
    }
  }, [settings, getSetting, sidebarWidth])

  // --- The Resizing Engine (Stable Persistent Listeners) ---
  React.useEffect(() => {
    const showActivityBar = getSetting('ui.showActivityBar') !== false
    const activityBarWidth = showActivityBar || showFlowMode ? (showFlowMode ? 0 : 48) : 0

    const handleMouseMove = (e) => {
      if (!isDraggingInternal.current) return

      const newWidth = e.clientX - activityBarWidth
      const SNAP_CLOSE_THRESHOLD = 50
      const MIN_WIDTH = 100
      let finalWidth = newWidth

      if (newWidth < SNAP_CLOSE_THRESHOLD) {
        finalWidth = 0
      } else {
        finalWidth = Math.max(MIN_WIDTH, Math.min(newWidth, 800))
      }

      lastValidWidth.current = finalWidth
      if (workbenchRef.current) {
        workbenchRef.current.style.setProperty('--sidebar-width', `${finalWidth}px`)
      }
    }

    const handleMouseUp = () => {
      if (!isDraggingInternal.current) return
      isDraggingInternal.current = false

      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.classList.remove('resizing-active')

      const dropWidth = lastValidWidth.current

      // Commit to state immediately
      if (dropWidth < 50) {
        setIsSidebarOpen(false)
        setSidebarWidth(250)
        updateSetting('sidebar.width', 250)
      } else {
        setSidebarWidth(dropWidth)
        updateSetting('sidebar.width', dropWidth)
      }

      // 3. SETTLING & CSS OPTIMIZATION:
      // We turn off the 'Dragging' flag immediately (clears overlay and cursor).
      // But we stay in 'Resizing' state for 100ms to suppress the Header's
      // width-transition which causes the 'Jump Back' visual.
      isSettlingRef.current = true

      setTimeout(() => {
        isSettlingRef.current = false
        setIsResizing(false)
      }, 100)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [updateSetting, showFlowMode, getSetting, setIsSidebarOpen])

  const handleSave = (snippet) => {
    if (snippet?.readOnly) return
    onSave(snippet)
  }

  const headerIsFavorited = (() => {
    const id = selectedSnippet?.id
    if (!id) return false
    const fromAll = (allSnippets || []).find((s) => s.id === id)
    if (fromAll && typeof fromAll.is_favorite !== 'undefined') return fromAll.is_favorite === 1
    return selectedSnippet?.is_favorite === 1
  })()

  const { openDeleteModal, openTrashModal, openAIPilot } = useModal()
  const [activeSidebarTab, setActiveSidebarTab] = React.useState('explorer')
  const [showFlowPreview, setShowFlowPreview] = React.useState(false)

  // Listen for global commands (Command Palette) - REMOVED (Handled in SnippetLibraryInner)

  const { navigateTo } = useView()

  const handleTabChange = (tabId) => {
    if (tabId === 'graph') {
      navigateTo('graph')
      setIsSidebarOpen(false)
      setActiveSidebarTab(tabId)
      showToast('Navigating to Knowledge Graph...', 'info')
      return
    }

    // If we're coming from graph back to explorer/themes/trash, restore the view
    if (
      activeView === 'graph' &&
      (tabId === 'explorer' || tabId === 'themes' || tabId === 'trash')
    ) {
      navigateTo('snippets')
    }

    // Only 'explorer' and 'themes' should open/toggle the sidebar
    if (tabId === 'explorer' || tabId === 'themes' || tabId === 'trash') {
      // Added 'trash'
      if (activeSidebarTab === tabId && isSidebarOpen) {
        setIsSidebarOpen(false)
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

  // Handlers for SnippetSidebar (to avoid passing all props directly)
  const handleSelect = (s) => {
    if (s === null && activeView === 'editor') {
      return // Keep editor open and selection as-is
    }
    if (onSelectSnippet) onSelectSnippet(s)
    if (window.innerWidth <= 768) setIsSidebarOpen(false)
  }

  const handleRenameFolder = (...args) => onRenameFolder(...args)
  const handleDeleteFolder = (...args) => onDeleteFolder(...args)
  const handleDeleteSnippet = (...args) => onDeleteRequest(...args)
  const handleBulkDelete = (...args) => onDeleteBulk(...args)
  const handlePaste = (...args) => onPaste(...args)
  const handleSelectAll = (...args) => onSelectAll(...args)

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'editor':
        // FIX: Prioritize actual title even if untyped to avoid " - Quick Snippets" glitch
        return selectedSnippet?.title || 'Untitled'
      case 'snippets':
        return selectedSnippet?.title || 'Dev Snippet'
      case 'welcome':
        return 'Dev Snippet'
      case 'graph':
        return 'Knowledge Graph'
      default:
        return 'Dev Snippet'
    }
  }

  const [graphRefreshKey, setGraphRefreshKey] = React.useState(0)

  const [graphSearchQuery, setGraphSearchQuery] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')

  // Debounce search for performance
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(graphSearchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [graphSearchQuery])

  const renderHeaderCenter = () => {
    if (activeView === 'graph') {
      return (
        <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30"
              size={12}
            />
            <input
              type="text"
              placeholder="Search Knowledge Graph..."
              value={graphSearchQuery}
              onChange={(e) => setGraphSearchQuery(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-[5px] px-8 py-1.5 text-[11px] w-[320px] focus:outline-none focus:border-[var(--color-accent-primary)]/50 focus:bg-black/60 transition-all text-white/80 placeholder:text-white/20 shadow-inner"
            />
          </div>
        </div>
      )
    }
    return null
  }

  const renderHeaderActions = () => {
    // Graph actions are now handled internally within the KnowledgeGraph component
    return null
  }

  const renderContent = (isFlow = false) => {
    if (activeView === 'graph') {
      return (
        <KnowledgeGraph
          key={`graph-${graphRefreshKey}`} // Force remount on refresh
          selectedSnippetId={selectedSnippet?.id}
          searchQuery={debouncedSearch}
          onSelectSnippet={(node) => onSelectSnippet({ id: node.id, title: node.title })}
          onClose={() => navigateTo('snippets')}
        />
      )
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
          isReadOnly={selectedSnippet?.readOnly}
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

  // --- Global Metrics Synchronization ---
  React.useLayoutEffect(() => {
    if (!workbenchRef.current) return

    // Logic for Sidebar Width
    const targetWidth = isSidebarOpen && !showFlowMode ? sidebarWidth : 0

    // CRITICAL: If we are actively resizing OR in the 150ms settling lock,
    // we DO NOT touch the CSS variable. We let the manual mouse position stand
    // until the React state (sidebarWidth) has definitively finished rendering.
    if (!isResizing && !isSettlingRef.current) {
      workbenchRef.current.style.setProperty('--sidebar-width', `${targetWidth}px`)
    }

    // Logic for Activity Bar
    const showActivityBar = getSetting('ui.showActivityBar') !== false
    const activityBarWidth = showActivityBar || showFlowMode ? (showFlowMode ? 0 : 48) : 0
    workbenchRef.current.style.setProperty('--activity-bar-width', `${activityBarWidth}px`)
  }, [sidebarWidth, isSidebarOpen, showFlowMode, getSetting, isResizing])

  // Initialize CSS variables on the root container

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
          isDirty={
            selectedSnippet && (dirtyIds?.has(selectedSnippet.id) || selectedSnippet.is_dirty)
          }
          isReadOnly={selectedSnippet?.readOnly}
          isDoc={String(selectedSnippet?.id || '').startsWith('doc:')}
          isCompact={isCompact}
          isResizing={isResizing} // Pass the resizing flag to suppress transitions
          onToggleCompact={onToggleCompact}
          autosaveStatus={autosaveStatus}
          isSidebarOpen={isSidebarOpen}
          sidebarWidth={sidebarWidth} // Pass current saved width
          onToggleSidebar={() => {
            if (getSetting('ui.zenFocus') === true) return
            setIsSidebarOpen(!isSidebarOpen)
          }}
          onSave={() => selectedSnippet && onSave(selectedSnippet)}
          onNewSnippet={onNewSnippet}
          onNewFolder={onNewFolder}
          isZenFocus={getSetting('ui.zenFocus') === true}
          onToggleZenFocus={onToggleZenFocus}
          onSearch={() => {
            if (activeView === 'settings' && onCloseSettings) {
              onCloseSettings()
            }
            setActiveSidebarTab('explorer')
          }}
          onRename={() => {
            if (selectedSnippet?.id === 'system:settings') {
              showToast('The settings.json file cannot be renamed', 'info')
              return
            }
            onRename && onRename()
          }}
          onClose={handleCloseSnippet}
          actions={renderHeaderActions()}
          centerActions={renderHeaderCenter()}
        />
      )}

      {/* GLOBAL RESIZE OVERLAY: The "Glass Pane" technique.
          Creates a full-screen shield during resizing to prevent "detach", cursor flickering,
          or event trapping by iframes/editor. */}
      {/* GLOBAL RESIZE OVERLAY: The "Glass Pane" technique.
          Visible ONLY during active dragging to ensure cursor is responsive. */}
      {isResizing && !isSettlingRef.current && (
        <div
          className="fixed inset-0 z-[9999] pointer-events-auto"
          style={{ cursor: 'ew-resize', userSelect: 'none' }}
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
              onAIPilot={openAIPilot}
              isSettingsOpen={isSettingsOpen}
              trashCount={trash?.length || 0}
              settings={settings}
              showToast={showToast}
            />
          </div>
        )}

        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className="flex flex-col h-full z-10 relative sidebar-container bg-[var(--sidebar-bg)]"
          style={{
            width: 'var(--sidebar-width)',
            willChange: isResizing ? 'width' : 'auto',
            overflow: 'hidden', // Contain content but scrollbar stays on edge
            transition: 'none'
          }}
        >
          {/* Main Content Area - Traditional Layout (Scrollbar docked to edge) */}
          <div
            className="w-full h-full flex flex-col"
            style={{
              opacity: isSidebarOpen && !showFlowMode ? 1 : 0,
              // During resizing, we set pointer-events to NONE to avoid
              // expensive hit-testing and hover calculations in the snippet list.
              pointerEvents: isResizing ? 'none' : isSidebarOpen ? 'auto' : 'none',
              // Standard snapping behavior for opacity only
              transition: isResizing ? 'none' : 'opacity 0.2s ease-in-out'
            }}
          >
            <div className="h-full flex flex-col w-full">
              {activeSidebarTab === 'explorer' && (
                <SnippetSidebar
                  isOpen={isSidebarOpen}
                  snippets={snippets}
                  folders={folders}
                  selectedSnippet={selectedSnippet}
                  onNew={onNewSnippet}
                  onNewFolder={onNewFolder}
                  onDailyNote={onDailyNote}
                  onSearch={onSearchSnippets || (() => {})}
                  onToggleFolder={onToggleFolder}
                  onMoveSnippet={onMoveSnippet}
                  onMoveFolder={onMoveFolder}
                  onRenameSnippet={onInlineRename}
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onDeleteSnippet={handleDeleteSnippet}
                  onDeleteBulk={handleBulkDelete}
                  onTogglePin={onTogglePin}
                  onToggleFavorite={onToggleFavorite}
                  onSelect={handleSelect}
                  onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                  isCompact={isCompact}
                  showToast={showToast}
                  // Clipboard operations
                  onCopy={onCopy}
                  onCut={onCut}
                  onPaste={handlePaste}
                  onSelectAll={handleSelectAll}
                  dirtyIds={dirtyIds}
                  onInlineRename={onInlineRename}
                  isSearching={isSearching}
                />
              )}

              {activeSidebarTab === 'themes' && (
                <SidebarTheme
                  isOpen={isSidebarOpen}
                  onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                />
              )}

              {activeSidebarTab === 'trash' && (
                <TrashSidebar
                  trash={trash}
                  onRestoreItem={onRestoreItem}
                  onPermanentDeleteItem={onPermanentDeleteItem}
                  onLoadTrash={onLoadTrash}
                  onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                />
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
                isDraggingInternal.current = true
                setIsResizing(true)
                document.body.classList.add('resizing-active')
                document.body.style.cursor = 'ew-resize'
                document.body.style.userSelect = 'none'

                // If sidebar is closed, toggle it open first
                if (!isSidebarOpen) {
                  setIsSidebarOpen(true)
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
