import React, { useState } from 'react'

const MigrationPanel = ({ onClose }) => {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleMigrate = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)
    
    try {
      const migrationResult = await window.api.migrateSnippets()
      setResult(migrationResult)
    } catch (err) {
      setError(err.message || 'Migration failed')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
          Migrate Snippets to Files
        </h2>
        
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          This will move snippet content from the database to individual files for better performance.
          Your data will be safely migrated and no content will be lost.
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
            <div className="text-red-700 dark:text-red-400 text-sm">
              ❌ {error}
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3 mb-4">
            <div className="text-green-700 dark:text-green-400 text-sm">
              ✅ Migration completed successfully!<br/>
              Migrated: {result.migrated} snippets<br/>
              Skipped: {result.skipped} snippets
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleMigrate}
            disabled={isRunning}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded"
          >
            {isRunning ? 'Migrating...' : 'Start Migration'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MigrationPanel