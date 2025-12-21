import React from 'react'
import CodeEditor from '../CodeEditor/CodeEditor'
import { Save, FileJson } from 'lucide-react'
const UserSettings = ({
  activeTab,
  jsonContent,
  isJsonDirty,
  handleSaveJson,
  setJsonContent,
  setIsJsonDirty
}) => {
  return (
    <>
      {activeTab === 'json' && (
        <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
          <div className="mb-4 flex items-end justify-between sticky top-0 z-10 bg-[var(--color-bg-primary)] pt-4 pb-3 border-b border-[var(--color-border)]">
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                <div className="p-1 bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                  <FileJson size={14} />
                </div>
                settings.json
              </h3>
            </div>

            <button
              onClick={handleSaveJson}
              disabled={!isJsonDirty}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all duration-200 border ${
                isJsonDirty
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-500'
                  : 'bg-transparent text-[var(--color-text-tertiary)] border-transparent cursor-not-allowed opacity-50'
              }`}
            >
              <Save size={12} className={isJsonDirty ? 'animate-pulse' : ''} />
              <span>SAVE</span>
            </button>
          </div>

          <div
            className="flex-1 overflow-hidden border"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <CodeEditor
              value={jsonContent}
              language="json"
              onChange={(newVal) => {
                setJsonContent(newVal)
                setIsJsonDirty(true)
              }}
              className="h-full"
            />
          </div>
        </div>
      )}
    </>
  )
}

export default UserSettings
