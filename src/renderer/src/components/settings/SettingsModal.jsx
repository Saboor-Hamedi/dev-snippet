import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import pkg from '../../../../../package.json'
import {
  X,
  Settings,
  Monitor,
  Keyboard,
  Type,
  Zap,
  RotateCcw,
  Search,
  Command,
  Layout,
  History,
  RefreshCw,
  Database,
  Cloud,
  Sparkles,
  Brain
} from 'lucide-react'
import { DEFAULT_SETTINGS } from '../../config/defaultSettings'

// Import the centralized settings tabs
import {
  EditorTab,
  AppearanceTab,
  BehaviorTab,
  AdvancedTab,
  ShortcutsTab,
  SyncTab,
  DataTab,
  UpdateTab,
  AITab
} from './sections'

import { useSettings } from '../../hook/useSettingsContext'
import { useView } from '../../context/ViewContext'
import UniversalModal from '../universal/UniversalModal'

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                           SETTINGS MODAL                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * FILE LOCATION:
 *   src/renderer/src/components/settings/SettingsModal.jsx
 *
 * PARENT COMPONENTS:
 *   - ModalManager.jsx (src/renderer/src/components/workbench/manager/ModalManager.jsx)
 *     └─> Opens this modal via openSettingsModal() function from useModal hook
 *
 * CALLED FROM:
 *   1. SnippetLibraryInner.jsx → onCommandSettings() handler
 *      Triggered by: Custom event 'app:open-settings'
 *
 *   2. CommandPalette.jsx → "Settings" command
 *      Triggered by: User typing "settings" in command palette
 *
 *   3. ActivityBar.jsx → Settings icon click
 *      Triggered by: User clicking gear icon in activity bar
 *
 *   4. Header.jsx → Settings button
 *      Triggered by: User clicking settings button in header
 *
 * HOW TO OPEN SETTINGS MODAL:
 *   ```javascript
 *   // Method 1: Via Modal Manager (RECOMMENDED)
 *   const { openSettingsModal } = useModal()
 *   openSettingsModal()
 *
 *   // Method 2: Via custom event
 *   window.dispatchEvent(new CustomEvent('app:open-settings'))
 *
 *   // Method 3: Direct navigation with specific tab
 *   window.dispatchEvent(new CustomEvent('app:open-settings', {
 *     detail: { tab: 'sync' } // Opens directly to Sync tab
 *   }))
 *   ```
 *
 * HOW TO ADD A NEW SETTINGS TAB:
 *   1. Create tab component in: src/renderer/src/components/settings/sections/
 *   2. Export it from: src/renderer/src/components/settings/sections/index.js
 *   3. Import it at the top of this file
 *   4. Add to 'sections' array (line ~220) with id, label, and icon
 *   5. Add render case in the content area (line ~290+)
 *
 * RELATED FILES:
 *   - sections/EditorTab.jsx - Editor settings
 *   - sections/AppearanceTab.jsx - Theme & UI settings
 *   - sections/SyncTab.jsx - GitHub sync settings
 *   - sections/ShortcutsTab.jsx - Keyboard shortcuts
 *   - sections/UpdateTab.jsx - Auto-update settings
 *   - sections/DataTab.jsx - Import/export data
 *   - components/SettingRow.jsx - Individual setting row component
 *   - components/SettingSection.jsx - Settings group container
 *
 * ARCHITECTURE NOTES:
 *   - Uses React Suspense for lazy-loading tab components
 *   - Settings are persisted via SettingsContext to disk
 *   - Local state (localSettings) provides instant UI feedback
 *   - Global state (contextUpdateSetting) handles persistence
 *   - Modal is rendered via React Portal in ModalManager
 *   - Z-index: 50000 (below other modals like popups)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SettingsModal Component
 *
 * A full-screen modal overlay that displays application settings organized into tabs.
 * Uses a professional sidebar navigation pattern similar to VS Code or Obsidian.
 *
 * Features:
 * - Tab-based navigation for different setting categories
 * - Search functionality to filter setting categories
 * - Real-time settings synchronization with global state
 * - Update notification integration
 * - Deep linking support (can open directly to a specific tab)
 * - Factory reset capability
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback to close the modal
 *
 * @example
 * // Basic usage (via Modal Manager)
 * const { openSettingsModal } = useModal()
 * <button onClick={openSettingsModal}>Open Settings</button>
 *
 * @example
 * // Direct usage with deep linking
 * <SettingsModal
 *   isOpen={showSettings}
 *   onClose={() => setShowSettings(false)}
 * />
 */
const SettingsModal = ({ isOpen, onClose }) => {
  // ============================================================================
  // HOOKS & STATE MANAGEMENT
  // ============================================================================

  /**
   * Access to global settings state and update functions.
   * - settings: Current application settings object
   * - updateSettings: Replace entire settings object
   * - contextUpdateSetting: Update a single setting by path (e.g., 'ui.theme')
   */
  const { settings, updateSettings, updateSetting: contextUpdateSetting } = useSettings()

  /**
   * Access to navigation parameters for deep linking.
   * Allows opening modal directly to a specific tab (e.g., { tab: 'sync' })
   */
  const { viewParams } = useView()

  /**
   * Local copy of settings for immediate UI updates before persistence.
   * Prevents UI lag while waiting for global state to update.
   */
  const [localSettings, setLocalSettings] = useState(settings || DEFAULT_SETTINGS)

  /**
   * Currently active tab ID.
   * Possible values: 'updates', 'editor', 'appearance', 'behavior',
   * 'shortcuts', 'sync', 'system', 'advanced', 'history'
   */
  const [activeTab, setActiveTab] = useState('editor')

  /**
   * Deep linking: If modal is opened with a specific tab parameter,
   * automatically switch to that tab when modal becomes visible.
   */
  useEffect(() => {
    if (isOpen && viewParams?.tab) {
      setActiveTab(viewParams.tab)
    }
  }, [isOpen, viewParams])

  /**
   * Search query for filtering the sidebar navigation items.
   * Updates in real-time as user types.
   */
  const [searchQuery, setSearchQuery] = useState('')

  /**
   * Flag indicating if a new app update is available.
   * Used to show a notification badge on the "Updates" tab.
   */
  const [hasUpdate, setHasUpdate] = useState(false)
  const [resetConfirmation, setResetConfirmation] = useState(false)

  // ============================================================================
  // UPDATE DETECTION
  // ============================================================================

  /**
   * Listen for update availability events from Electron main process.
   * Sets hasUpdate flag to show notification badge.
   */
  useEffect(() => {
    if (window.api?.onUpdateAvailable) {
      const unsub = window.api.onUpdateAvailable(() => setHasUpdate(true))
      return unsub
    }
  }, [])

  /**
   * When modal opens, trigger a background check for updates.
   * This ensures we always show the latest update status.
   */
  // useEffect(() => {
  //   if (isOpen && window.api?.checkForUpdates) {
  //     window.api.checkForUpdates().catch(() => {})
  //   }
  // }, [isOpen])

  /**
   * Sync local settings copy with global settings state.
   * When global settings change (e.g., from another component or file load),
   * update our local copy to reflect those changes.
   */
  useEffect(() => {
    if (settings) setLocalSettings(settings)
  }, [settings])

  // ============================================================================
  // SETTINGS UPDATE HANDLER
  // ============================================================================

  /**
   * Update a single setting value using dot-notation path.
   *
   * This function provides a convenient way to update nested settings without
   * manually traversing the object structure. It updates both the local state
   * (for immediate UI response) and the global context (for persistence).
   *
   * @param {string} path - Dot-notation path to the setting (e.g., 'ui.theme' or 'editor.fontSize')
   * @param {*} value - New value for the setting (can be any type)
   *
   * @example
   * updateSetting('ui.theme', 'dark')
   * updateSetting('editor.fontSize', 14)
   * updateSetting('behavior.autoSave', true)
   */
  const updateSetting = (path, value) => {
    // Split the dot-notation path into an array (e.g., 'ui.theme' → ['ui', 'theme'])
    const pathArray = path.split('.')

    // Deep clone settings to avoid mutating state directly
    const newSettings = JSON.parse(JSON.stringify(localSettings))

    // Navigate to the parent object of the target property
    let target = newSettings
    for (let i = 0; i < pathArray.length - 1; i++) {
      // Create intermediate objects if they don't exist
      if (!target[pathArray[i]]) target[pathArray[i]] = {}
      target = target[pathArray[i]]
    }

    // Set the final value
    target[pathArray[pathArray.length - 1]] = value

    // Update local state for immediate UI response
    setLocalSettings(newSettings)

    // Persist to global context and disk
    contextUpdateSetting(path, value)
  }

  // ============================================================================
  // NAVIGATION CONFIGURATION
  // ============================================================================

  /**
   * Settings navigation sections configuration.
   * Each section represents a tab in the sidebar navigation.
   *
   * Structure:
   * - id: Unique identifier used for routing and activeTab state
   * - label: Display name shown in the sidebar
   * - icon: Lucide React icon component
   */
  const sections = [
    { id: 'updates', label: 'Updates', icon: RefreshCw },
    { id: 'editor', label: 'Editor', icon: Type },
    { id: 'appearance', label: 'Appearance', icon: Monitor },
    { id: 'behavior', label: 'Behavior', icon: Zap },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'sync', label: 'Sync', icon: Cloud },
    { id: 'ai', label: 'AI Pilot', icon: Sparkles },
    { id: 'system', label: 'System & Data', icon: Database },
    { id: 'advanced', label: 'Advanced', icon: Command },
    { id: 'history', label: 'History', icon: History }
  ]

  /**
   * Filter sections based on search query.
   * Only sections whose labels contain the search text will be visible.
   */
  const visibleSections = sections.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Don't render anything if modal is closed
  if (!isOpen) return null

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      width="min(1024px, 95vw)"
      height="85vh"
      className="settings-modal no-padding"
      customKey="settings_modal_position"
      noTab={true}
      hideHeaderBorder={true}
      noRadius={false}
      hideBorder={true}
      footer={
        <div className="flex items-stretch w-full h-10">
          <div className="w-16 md:w-64 border-r border-[var(--color-border)] flex items-center px-3 bg-[var(--color-bg-secondary)]/30">
            <button
              onClick={() => {
                if (!resetConfirmation) {
                  setResetConfirmation(true)
                  setTimeout(() => setResetConfirmation(false), 3000)
                  return
                }
                setLocalSettings(DEFAULT_SETTINGS)
                updateSettings(DEFAULT_SETTINGS)
                setResetConfirmation(false)
              }}
              className={`w-full flex items-center justify-center md:justify-start gap-2 py-1.5 px-2 rounded text-[9px] font-bold uppercase tracking-wider transition-all duration-200 border ${
                resetConfirmation
                  ? 'bg-red-500 text-white border-red-600 opacity-100 shadow-sm shadow-red-500/20'
                  : 'opacity-40 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 border-transparent hover:border-red-500/20'
              }`}
            >
              <RotateCcw
                size={10}
                className={`transition-transform duration-500 ${resetConfirmation ? 'rotate-180' : ''}`}
              />
              <span className="hidden md:block">
                {resetConfirmation ? 'Confirm Reset?' : 'Reset to Defaults'}
              </span>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-between px-6 md:px-10 bg-[var(--color-bg-primary)]">
            <div className="flex items-center gap-2 opacity-30">
              <Settings size={10} />
              <span className="text-[9px] font-bold uppercase tracking-[0.1em]">
                Settings Manager v{pkg.version}
              </span>
            </div>
            <div className="text-[9px] font-medium opacity-10 uppercase tracking-widest hidden sm:block">
              Dev-Snippet Pro
            </div>
          </div>
        </div>
      }
    >
      <div className="flex-1 flex overflow-hidden h-full">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-16 md:w-64 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 flex flex-col flex-shrink-0">
          {/* Search bar header */}
          <div className="h-10 flex items-center px-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/5">
            <div className="relative group">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-60 transition-opacity"
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={(e) => {
                  e.target.style.backgroundColor = 'var(--color-bg-primary)'
                  e.target.style.borderColor = 'var(--color-accent-primary)'
                }}
                onBlur={(e) => {
                  e.target.style.backgroundColor = 'var(--color-bg-secondary)'
                  e.target.style.borderColor = 'var(--color-border)'
                }}
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[5px] py-1.5 pl-8 pr-2 text-xs outline-none focus:border-[var(--color-accent-primary)] transition-all font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>

          <nav className="flex-1 p-2 md:p-3 space-y-1 overflow-y-auto custom-scrollbar">
            {visibleSections.map((section) => {
              const isActive = activeTab === section.id
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={`
                    w-full flex items-center justify-center md:justify-start gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group relative
                    ${
                      isActive
                        ? '' // Style handled via inline styles below
                        : 'hover:bg-[var(--sidebar-item-hover-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }
                  `}
                  style={{
                    backgroundColor: isActive ? 'var(--sidebar-item-active-bg)' : undefined,
                    color: isActive
                      ? 'var(--sidebar-item-active-fg, var(--color-text-primary))'
                      : undefined
                  }}
                >
                  <Icon
                    size={16}
                    strokeWidth={2}
                    className={
                      isActive
                        ? 'text-[var(--color-accent-primary)] opacity-100'
                        : 'opacity-70 group-hover:opacity-100'
                    }
                  />
                  <span className="hidden md:block">{section.label}</span>
                  {section.id === 'updates' && hasUpdate && (
                    <span className="absolute top-2 right-2 md:static md:ml-auto flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-primary)]">
          {/* Context Header */}
          <div className="h-10 px-6 md:px-10 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)] flex-shrink-0 flex items-center">
            <div className="flex items-center gap-2">
              {sections.find((s) => s.id === activeTab)?.icon &&
                React.createElement(sections.find((s) => s.id === activeTab).icon, {
                  size: 11,
                  className:
                    'text-[var(--color-accent-primary)] opacity-60 flex-shrink-0 relative top-[1px]'
                })}
              <h3
                className="text-[9px] font-bold uppercase tracking-[0.15em]"
                style={{ lineHeight: 1 }}
              >
                {sections.find((s) => s.id === activeTab)?.label || activeTab}
              </h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 py-4 md:py-6">
            <div className="max-w-3xl pb-24">
              <React.Suspense
                fallback={
                  <div className="h-48 flex items-center justify-center">
                    <RefreshCw className="animate-spin text-[var(--color-accent-primary)] opacity-50" />
                  </div>
                }
              >
                {activeTab === 'updates' && <UpdateTab />}
                {activeTab === 'editor' && (
                  <EditorTab settings={localSettings} updateSetting={updateSetting} />
                )}
                {activeTab === 'appearance' && (
                  <AppearanceTab settings={localSettings} updateSetting={updateSetting} />
                )}
                {activeTab === 'behavior' && (
                  <BehaviorTab settings={localSettings} updateSetting={updateSetting} />
                )}
                {activeTab === 'advanced' && (
                  <AdvancedTab settings={localSettings} updateSetting={updateSetting} />
                )}
                {activeTab === 'shortcuts' && <ShortcutsTab />}
                {activeTab === 'sync' && <SyncTab />}
                {activeTab === 'ai' && (
                  <AITab settings={localSettings} updateSetting={updateSetting} />
                )}
                {activeTab === 'system' && (
                  <DataTab
                    settings={localSettings}
                    updateSetting={updateSetting}
                    onExportData={async () => {
                      if (window.api?.exportJSON && window.api?.getSnippets) {
                        const snippets = await window.api.getSnippets({ metadataOnly: false })
                        const data = {
                          exportDate: new Date().toISOString(),
                          version: pkg.version,
                          snippets
                        }
                        await window.api.exportJSON(data)
                      }
                    }}
                  />
                )}

                {['history'].includes(activeTab) && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-20 transform scale-90">
                    <History size={64} strokeWidth={1} />
                    <p className="mt-4 font-bold tracking-[0.2em] uppercase text-xs">
                      Activity History Coming Soon
                    </p>
                  </div>
                )}
              </React.Suspense>
            </div>
          </div>
        </main>
      </div>
    </UniversalModal>
  )
}

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default SettingsModal
