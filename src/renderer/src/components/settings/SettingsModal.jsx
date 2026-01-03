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
  Cloud
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
  UpdateTab
} from './sections'

import { useSettings } from '../../hook/useSettingsContext'
import { useView } from '../../context/ViewContext'

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
  useEffect(() => {
    if (isOpen && window.api?.checkForUpdates) {
      window.api.checkForUpdates().catch(() => {})
    }
  }, [isOpen])

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
    <>
      <div className="fixed inset-0 z-[50000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
        <div
          className="w-full max-w-5xl h-full md:h-[85vh] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-3xl flex flex-col relative overflow-hidden ring-1 ring-white/5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* UNIFIED GLOBAL HEADER (Spans whole top) */}
          <header className="w-full h-12 md:h-14 flex items-center justify-between px-4 md:px-6 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-[var(--color-accent-primary)] flex items-center justify-center shadow-sm">
                <Settings size={12} className="text-white" />
              </div>
              <h2 className="text-xs font-bold tracking-tight">Settings</h2>
            </div>

            {/* Global Search Center */}
            <div className="flex-1 max-w-sm mx-4 md:mx-12 relative group">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-60 transition-opacity"
              />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg py-2 pl-9 pr-3 text-xs outline-none focus:border-[var(--color-accent-primary)] focus:ring-2 focus:ring-[var(--color-accent-primary)]/10 transition-all font-medium"
              />
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors group"
            >
              <X size={18} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          </header>

          {/* MAIN BODY (Sidebar + Content) */}
          <div className="flex-1 flex overflow-hidden">
            {/* SIDEBAR NAVIGATION */}
            <aside className="w-16 md:w-64 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 flex flex-col flex-shrink-0">
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

              <div className="p-3 border-t border-[var(--color-border)]">
                <button
                  onClick={() => {
                    if (confirm('Restore all settings to factory defaults?')) {
                      setLocalSettings(DEFAULT_SETTINGS)
                      updateSettings(DEFAULT_SETTINGS)
                    }
                  }}
                  className="w-full flex items-center justify-center md:justify-start gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider opacity-50 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all"
                >
                  <RotateCcw size={14} />
                  <span className="hidden md:block">Defaults</span>
                </button>
              </div>
            </aside>

            {/* CONTENT AREA */}
            <main className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-primary)]">
              {/* Lean Context Header */}
              <div className="px-6 md:px-10 py-3 border-b border-[var(--color-border)]/50 bg-[var(--color-bg-primary)] flex-shrink-0">
                <div className="flex items-center gap-2">
                  {sections.find((s) => s.id === activeTab)?.icon &&
                    React.createElement(sections.find((s) => s.id === activeTab).icon, {
                      size: 12,
                      className: 'text-[var(--color-accent-primary)] opacity-60'
                    })}
                  <h3 className="text-[10px] font-bold capitalize tracking-wide">{activeTab}</h3>
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
        </div>
      </div>
    </>
  )
}

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default SettingsModal
