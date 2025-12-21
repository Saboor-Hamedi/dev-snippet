import { useState, memo, lazy, Suspense } from 'react'
import PropTypes from 'prop-types'
import { Folder, Command, Plus, Settings, Github } from 'lucide-react'
import SystemStatusFooter from './SystemStatusFooter'
import useGeneralProp from '../hook/settings/useGeneralProp.js'

// Lazy load GitHub components
const GitHubProfile = lazy(() => import('./github').then((m) => ({ default: m.GitHubProfile })))
const GitHubSettings = lazy(() => import('./github').then((m) => ({ default: m.GitHubSettings })))

const WelcomePage = ({
  onNewSnippet,
  onNewProject,
  onOpenSettings,
  onSelectSnippet,
  snippets = []
}) => {
  // GitHub profile state
  const [showGitHubProfile, setShowGitHubProfile] = useState(false)
  const [showGitHubSettings, setShowGitHubSettings] = useState(false)
  const [showAllRecents, setShowAllRecents] = useState(false)
  const { welcomeBg } = useGeneralProp() // Get welcome background color

  const [githubUsername, setGitHubUsername] = useState(() => {
    try {
      return localStorage.getItem('githubUsername') || 'Saboor-Hamedi'
    } catch (e) {
      return 'Saboor-Hamedi'
    }
  })

  // Get recent files
  const allRecentSnippets = snippets
    .filter((snippet) => !snippet.is_draft)
    .sort((a, b) => b.timestamp - a.timestamp)

  const recentFiles = showAllRecents ? allRecentSnippets.slice(0, 5) : allRecentSnippets.slice(0, 3)

  const handleSaveGitHubUsername = (username) => {
    try {
      localStorage.setItem('githubUsername', username)
      setGitHubUsername(username)
      setShowGitHubSettings(false)
      setShowGitHubProfile(true)
    } catch (e) {
      console.error('Failed to save GitHub username')
    }
  }

  return (
    <>
      <div className="h-full overflow-y-auto" style={{ backgroundColor: welcomeBg }}>
        <div className="h-full flex flex-col">
          {/* Clean Header Bar */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left: GitHub Profile */}
              <button
                onClick={() => {
                  if (githubUsername) {
                    setShowGitHubProfile(true)
                  } else {
                    setShowGitHubSettings(true)
                  }
                }}
                className="flex items-center gap-2 px-0 py-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors group"
              >
                <div className="flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                  <Github size={12} />
                </div>
                <span className="text-xs font-medium opacity-60 group-hover:opacity-100">
                  {githubUsername ? `@${githubUsername}` : 'Connect GitHub'}
                </span>
              </button>

              {/* Right: Stats & Settings */}
              <div className="flex items-center gap-3">
                <div className="text-center px-2">
                  <div className="text-lg font-bold text-[var(--color-accent)] tabular-nums leading-none">
                    {snippets.length}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wider opacity-60">
                    Snippets
                  </div>
                </div>

                <div className="w-px h-6 bg-[var(--color-border)]/30"></div>

                <button
                  onClick={onOpenSettings}
                  className="p-1.5 rounded-md hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all theme-exempt"
                  title="Settings"
                >
                  <Settings size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-12 py-16">
              {/* Hero Section */}
              <div className="mb-12">
                <h1 className="text-3xl font-light text-[var(--color-text-primary)] mb-1">
                  Dev Snippet
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)] font-light opacity-60">
                  Your code, organized and accessible
                </p>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                {/* Left Column: Quick Actions */}
                <div>
                  <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4 opacity-50">
                    Start
                  </h2>
                  <div className="space-y-1">
                    <button
                      onClick={onNewSnippet}
                      className="w-full flex items-center gap-3 px-0 py-2 text-left opacity-70 hover:opacity-100 transition-opacity bg-transparent hover:bg-transparent theme-exempt"
                    >
                      <div className="text-[var(--color-accent)]">
                        <Plus size={14} />
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        New Snippet
                      </span>
                    </button>

                    <button
                      onClick={onNewProject}
                      className="w-full flex items-center gap-3 px-0 py-2 text-left opacity-70 hover:opacity-100 transition-opacity bg-transparent hover:bg-transparent theme-exempt"
                    >
                      <div className="text-blue-500">
                        <Folder size={14} />
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        Open Project
                      </span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-0 py-2 text-left opacity-70 hover:opacity-100 transition-opacity bg-transparent hover:bg-transparent theme-exempt">
                      <div className="text-purple-500">
                        <Command size={14} />
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        Command Palette
                      </span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Recent Snippets */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider opacity-50">
                      Recent
                    </h2>
                    {allRecentSnippets.length > 3 && (
                      <button
                        onClick={() => setShowAllRecents(!showAllRecents)}
                        className="text-[10px] text-[var(--color-accent)] hover:underline opacity-80"
                      >
                        {showAllRecents ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {recentFiles.length > 0 ? (
                      recentFiles.map((snippet) => (
                        <button
                          key={snippet.id}
                          onClick={() => onSelectSnippet && onSelectSnippet(snippet)}
                          className="w-full flex items-center justify-between px-0 py-2 text-left opacity-70 hover:opacity-100 transition-opacity bg-transparent hover:bg-transparent theme-exempt"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                              {snippet.title || 'Untitled'}
                            </div>
                            <div className="text-[10px] text-[var(--color-text-secondary)] font-mono opacity-50 mt-0.5">
                              {snippet.language}
                            </div>
                          </div>
                          <div className="text-[10px] text-[var(--color-text-secondary)] opacity-40 whitespace-nowrap">
                            {new Date(snippet.timestamp).toLocaleDateString()}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="py-8 text-center border border-dashed border-[var(--color-border)]/30 rounded-lg">
                        <p className="text-xs text-[var(--color-text-secondary)] opacity-60">
                          No recent snippets
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SystemStatusFooter snippets={snippets} />
        </div>
      </div>

      {/* GitHub Profile Modal - Lazy Loaded */}
      {showGitHubProfile && githubUsername && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/20" />}>
          <GitHubProfile username={githubUsername} onClose={() => setShowGitHubProfile(false)} />
        </Suspense>
      )}

      {/* GitHub Settings Modal - Lazy Loaded */}
      {showGitHubSettings && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/20" />}>
          <GitHubSettings
            currentUsername={githubUsername}
            onSave={handleSaveGitHubUsername}
            onCancel={() => setShowGitHubSettings(false)}
          />
        </Suspense>
      )}
    </>
  )
}

WelcomePage.propTypes = {
  onNewSnippet: PropTypes.func.isRequired,
  onNewProject: PropTypes.func.isRequired,
  onOpenSettings: PropTypes.func,
  onSelectSnippet: PropTypes.func,
  snippets: PropTypes.array
}

export default memo(WelcomePage)
