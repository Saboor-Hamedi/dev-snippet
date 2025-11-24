import React from 'react'
import SnippetViewer from '../SnippetViewer'
import SnippetEditor from '../SnippetEditor'
import SettingsPanel from '../SettingsPanel'
import SnippetCard from '../SnippetCard'

const Workbench = ({
  activeView,
  selectedSnippet,
  onSave,
  onCloseSnippet,
  snippets,
  projects,
  onDeleteRequest,
  onNewSnippet
}) => {
  if (activeView === 'settings') {
    return <SettingsPanel />
  }

  // If a snippet is selected, show the Viewer
  if (selectedSnippet) {
    return <SnippetViewer snippet={selectedSnippet} onClose={onCloseSnippet} />
  }

  // Get the items to display based on active view
  const items = activeView === 'projects' ? projects : snippets

  // If in explorer or projects view, show the grid of cards
  if (activeView === 'explorer' || activeView === 'projects') {
    return (
      <div className="h-full flex flex-col bg-slate-900 overflow-hidden">
        {/* Header - Aligned with viewer */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-medium text-white ">
              {activeView === 'explorer' ? 'Code Snippets' : 'Projects'}
            </h1>
            <span className="text-xs text-slate-600">•</span>

            <p className="text-xs text-slate-500">
              {items.length} {activeView === 'explorer' ? 'snippet' : 'project'}
              {items.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* New Snippet Button */}
          {activeView === 'explorer' && (
            <button
              onClick={onNewSnippet}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-md font-medium transition-all text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Snippet
            </button>
          )}
        </div>

        {/* Snippet Grid or Welcome */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-8">
                <svg
                  className="w-24 h-24 text-slate-600 mb-6 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h2 className="text-3xl font-bold text-white mb-3">
                  {activeView === 'explorer' ? 'Welcome to Quick Snippets' : 'No Projects Yet'}
                </h2>
                <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                  {activeView === 'explorer'
                    ? 'Store and organize your code snippets in one place. Get started by creating your first snippet.'
                    : 'Create your first project to organize related snippets together.'}
                </p>
              </div>

              {activeView === 'explorer' && (
                <div className="space-y-4">
                  <button
                    onClick={onNewSnippet}
                    className="flex items-center gap-3 px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold transition-all shadow-xl hover:shadow-2xl hover:scale-105 text-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Your First Snippet
                  </button>

                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs">
                        Ctrl
                      </kbd>
                      <span>+</span>
                      <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs">
                        N
                      </kbd>
                      <span className="ml-2">New Snippet</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                  <SnippetCard key={item.id} snippet={item} onRequestDelete={onDeleteRequest} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default: show full-screen editor
  return <SnippetEditor onSave={onSave} />
}

export default Workbench
