import React from 'react'
import CodeEditor from '../CodeEditor/CodeEditor'
import { Save } from 'lucide-react'
const EditSettings = ({
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
        <div className="flex flex-col h-full">
          <div
            className="px-4 py-2 border-b flex items-center justify-between"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)'
            }}
          >
            <span className="text-xsmall font-medium">settings.json</span>
            <button
              onClick={handleSaveJson}
              disabled={!isJsonDirty}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xsmall font-medium transition-all ${
                isJsonDirty
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-transparent text-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              <Save size={14} />
              <span>Save</span>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
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

export default EditSettings
