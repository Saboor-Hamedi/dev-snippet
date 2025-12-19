import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { ChevronLeft, Settings as SettingsIcon, FileJson } from 'lucide-react'
import { useFontSettings } from '../../hook/useFontSettings'
import { useSettings } from '../../hook/useSettingsContext'
import { useToast } from '../../hook/useToast'
import ToastNotification from '../../utils/ToastNotification'
import UserSettings from '../preference/UserSettings.jsx'
import cleanErrorJson from '../../hook/useCleanErrorJson.js'
import ThemeModal from '../ThemeModal'
import { AppearanceSettings, EditorSettings, KeyboardShortcuts, DataSettings } from './sections'

/**
 * Main Settings Panel Component
 * Refactored to use modular section components
 */
const SettingsPanel = ({ onClose }) => {
  const { toast, showToast } = useToast()
  const { getSetting, updateSetting, updateSettings } = useSettings()

  // Font settings
  const {
    editorFontFamily,
    editorFontSize,
    previewFontFamily,
    previewFontSize,
    caretStyle,
    caretWidth,
    updateEditorFontFamily,
    updateEditorFontSize,
    updatePreviewFontFamily,
    updatePreviewFontSize,
    updateCaretWidth,
    updateCaretStyle
  } = useFontSettings()

  // Editor settings
  const [wordWrap, setWordWrap] = useState('on')
  const [autoSave, setAutoSave] = useState(false)
  const [overlayMode, setOverlayMode] = useState(() => {
    try {
      const saved = localStorage.getItem('overlayMode')
      return saved ? saved === 'true' : false
    } catch (e) {
      return false
    }
  })

  // UI state
  const hideWelcomePage = getSetting('ui.hideWelcomePage') || false
  const [activeTab, setActiveTab] = useState('general')
  const [jsonContent, setJsonContent] = useState('')
  const [isJsonDirty, setIsJsonDirty] = useState(false)
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)

  // Detect platform for keyboard shortcuts
  const isMac = typeof navigator !== 'undefined' && /mac|iphone|ipod|ipad/i.test(navigator.platform)
  const modKey = isMac ? '⌘' : 'Ctrl'

  // Handlers
  const handleGoBack = () => {
    if (onClose) onClose()
  }

  const handleExportData = async () => {
    try {
      if (window.api?.saveFileDialog && window.api?.writeFile && window.api?.getSnippets) {
        const snippets = await window.api.getSnippets()
        const path = await window.api.saveFileDialog()

        if (path) {
          const data = {
            exportDate: new Date().toISOString(),
            version: '1.2.0',
            snippets
          }
          await window.api.writeFile(path, JSON.stringify(data, null, 2))
          showToast('✓ Data exported successfully')
        }
      }
    } catch (error) {
      showToast('❌ Failed to export data')
    }
  }

  const handleOpenJson = async () => {
    setActiveTab('json')
    if (window.api?.readSettingsFile) {
      try {
        const content = await window.api.readSettingsFile()
        setJsonContent(content || '{}')
        setIsJsonDirty(false)
      } catch (error) {
        showToast('❌ Failed to load settings file')
      }
    }
  }

  const handleSaveJson = async () => {
    let parsedSettings

    try {
      parsedSettings = JSON.parse(jsonContent)
    } catch (error) {
      const cleanError = cleanErrorJson(error, jsonContent)
      showToast(`Syntax Error: ${cleanError}`)
      return
    }

    try {
      await updateSettings(parsedSettings)
      setIsJsonDirty(false)
      showToast('✓ Settings saved and applied')
    } catch (error) {
      showToast(`❌ System Error during save: ${error.message}`)
    }
  }

  const handleOverlayModeChange = (checked) => {
    try {
      setOverlayMode(checked)
      localStorage.setItem('overlayMode', checked ? 'true' : 'false')
    } catch (e) {
      setOverlayMode((s) => !s)
    }
  }

  return (
    <div
      className="settings-panel h-full flex flex-col md:flex-row overflow-hidden transition-colors duration-200 p-2"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
      }}
    >
      <ToastNotification toast={toast} />

      {/* Sidebar Navigation */}
      <div
        className="w-full md:w-56 md:border-b-0 flex flex-col"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-bg-secondary)'
        }}
      >
        <nav className="flex-1 p-1 space-y-1 rounded-sm">
          <div
            className="text-xtiny font-thin uppercase tracking-wider mb-2 px-3"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Configuration
          </div>

          {/* Back Button */}
          <button
            onClick={handleGoBack}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xtiny font-thin transition-all duration-200"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--hover-bg)'
              e.target.style.color = 'var(--hover-text)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = 'var(--color-text-secondary)'
            }}
          >
            <ChevronLeft size={12} />
            <span>Back</span>
          </button>

          {/* General Tab */}
          <button
            onClick={() => setActiveTab('general')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xtiny font-thin transition-all duration-200"
            style={{
              backgroundColor:
                activeTab === 'general' ? 'var(--color-accent-primary)' : 'transparent',
              color:
                activeTab === 'general' ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)'
            }}
          >
            <SettingsIcon size={12} />
            <span>General</span>
          </button>

          {/* User Settings Tab */}
          <button
            onClick={handleOpenJson}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xtiny font-thin transition-all duration-200"
            style={{
              backgroundColor: activeTab === 'json' ? 'var(--color-accent-primary)' : 'transparent',
              color:
                activeTab === 'json' ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)'
            }}
          >
            <FileJson size={12} />
            <span>User Settings</span>
          </button>
        </nav>

        {/* Footer Info */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-xtiny" style={{ color: 'var(--color-text-tertiary)' }}>
            <div className="flex items-center justify-between mb-1">
              <span>Version</span>
              <span className="font-mono">1.2.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Theme</span>
              <span className="font-mono capitalize">
                {document.documentElement.getAttribute('data-theme') || 'default'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* JSON Editor View */}
        {activeTab === 'json' && (
          <UserSettings
            activeTab={activeTab}
            jsonContent={jsonContent}
            isJsonDirty={isJsonDirty}
            setIsJsonDirty={setIsJsonDirty}
            handleSaveJson={handleSaveJson}
            setJsonContent={setJsonContent}
          />
        )}

        {/* General Settings View */}
        {activeTab === 'general' && (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 max-full mx-auto ml-1 mr-1">
              {/* Appearance Section */}
              <AppearanceSettings
                onOpenThemeModal={() => setIsThemeModalOpen(true)}
                editorFontFamily={editorFontFamily}
                onEditorFontFamilyChange={updateEditorFontFamily}
                editorFontSize={editorFontSize}
                onEditorFontSizeChange={updateEditorFontSize}
                previewFontFamily={previewFontFamily}
                onPreviewFontFamilyChange={updatePreviewFontFamily}
                previewFontSize={previewFontSize}
                onPreviewFontSizeChange={updatePreviewFontSize}
                caretWidth={caretWidth}
                onCaretWidthChange={updateCaretWidth}
                caretStyle={caretStyle}
                onCaretStyleChange={updateCaretStyle}
              />

              {/* Keyboard Shortcuts Section */}
              <KeyboardShortcuts modKey={modKey} />

              {/* Editor Settings Section */}
              <EditorSettings
                wordWrap={wordWrap}
                onWordWrapChange={setWordWrap}
                autoSave={autoSave}
                onAutoSaveChange={setAutoSave}
                overlayMode={overlayMode}
                onOverlayModeChange={handleOverlayModeChange}
              />

              {/* Data & System Section */}
              <DataSettings
                hideWelcomePage={hideWelcomePage}
                onWelcomePageToggle={(value) => updateSetting('ui.hideWelcomePage', value)}
                onExportData={handleExportData}
              />
            </div>
          </div>
        )}
      </div>

      {/* Theme Modal */}
      <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
    </div>
  )
}

SettingsPanel.propTypes = {
  onClose: PropTypes.func
}

export default SettingsPanel
