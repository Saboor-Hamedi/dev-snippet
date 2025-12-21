import React, { useState } from 'react'
import CodeEditor from '../CodeEditor/CodeEditor'
import { Save, FileJson, BookOpen } from 'lucide-react'
import { DEFAULT_SETTINGS } from '../../config/defaultSettings'

const UserSettings = ({
  activeTab,
  jsonContent,
  isJsonDirty,
  handleSaveJson,
  setJsonContent,
  setIsJsonDirty
}) => {
  const [viewMode, setViewMode] = useState('user') // 'user' | 'default'

  // Format default settings string on render (it's static)
  const defaultSettingsString = JSON.stringify(DEFAULT_SETTINGS, null, 2)

  return (
    <>
      {activeTab === 'json' && (
        <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
          {/* Header with Tabs */}
          {/* Tab Bar Header - VS Code Style */}
          <div className="flex items-center justify-between bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] select-none">
            <div className="flex items-end">
              {/* User Settings Tab */}
              <button
                onClick={() => setViewMode('user')}
                className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 transition-colors border-r border-[var(--color-border)]/30 ${
                  viewMode === 'user'
                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-t-2 border-t-[var(--color-accent)]'
                    : 'bg-transparent text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-primary)]/50 border-t-2 border-t-transparent'
                }`}
              >
                <div className={`${viewMode === 'user' ? 'text-amber-400' : 'opacity-70'}`}>
                  <FileJson size={13} />
                </div>
                <span>settings.json</span>
                {isJsonDirty && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-secondary)] opacity-80" />
                )}
              </button>

              {/* Default Settings Tab */}
              <button
                onClick={() => setViewMode('default')}
                className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 transition-colors border-r border-[var(--color-border)]/30 ${
                  viewMode === 'default'
                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-t-2 border-t-[var(--color-accent)]'
                    : 'bg-transparent text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-primary)]/50 border-t-2 border-t-transparent'
                }`}
              >
                <div className={`${viewMode === 'default' ? 'text-blue-400' : 'opacity-70'}`}>
                  <BookOpen size={13} />
                </div>
                <span>defaultSettings.json</span>
                <span className="text-[10px] opacity-50 ml-1">(Read Only)</span>
              </button>
            </div>

            {/* Actions Toolbar */}
            {viewMode === 'user' && (
              <div className="pr-3 py-1">
                <button
                  onClick={handleSaveJson}
                  disabled={!isJsonDirty}
                  title="Save Changes (Ctrl+S)"
                  className={`flex items-center gap-2 px-3 py-1 text-[11px] font-bold tracking-wide uppercase transition-all duration-200 ${
                    isJsonDirty
                      ? 'text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10'
                      : 'text-[var(--color-text-tertiary)] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Save size={14} className={isJsonDirty ? '' : ''} />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>

          <div
            className="flex-1 overflow-hidden border-t-0"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {viewMode === 'user' ? (
              <CodeEditor
                key="user-settings-editor"
                value={jsonContent}
                language="json"
                onChange={(newVal) => {
                  setJsonContent(newVal)
                  setIsJsonDirty(true)
                }}
                className="h-full"
              />
            ) : (
              <CodeEditor
                key="default-settings-editor"
                value={defaultSettingsString}
                language="json"
                readOnly={true}
                className="h-full opacity-80"
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default UserSettings
