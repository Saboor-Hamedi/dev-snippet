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
          <div className="px-6 py-4 border-b border-[var(--color-border)]/20">
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)]/30 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/30 transition-all group"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center group-hover:bg-[var(--color-accent)]/10 transition-colors">
                  <Github size={14} className="group-hover:text-[var(--color-accent)]" />
                </div>
                <span className="text-sm font-medium">
                  {githubUsername ? `@${githubUsername}` : 'Connect GitHub'}
                </span>
              </button>

              {/* Right: Stats & Settings */}
              <div className="flex items-center gap-4">
                <div className="text-center px-3 py-1">
                  <div className="text-2xl font-bold text-[var(--color-accent)] tabular-nums">
                    {snippets.length}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Snippets
                  </div>
                </div>

                <div className="w-px h-8 bg-[var(--color-border)]/30"></div>

                <button
                  onClick={onOpenSettings}
                  className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all"
                  title="Settings"
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-12 py-16">
              {/* Hero Section */}
              <div className="mb-16">
                <h1 className="text-5xl font-light text-[var(--color-text-primary)] mb-2">
                  Dev Snippet
                </h1>
                <p className="text-xl text-[var(--color-text-secondary)] font-light">
                  Your code, organized and accessible
                </p>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Quick Actions */}
                <div>
                  <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-4">
                    Start
                  </h2>
                  <div className="space-y-2">
                    <button
                      onClick={onNewSnippet}
                      className="w-full group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--color-bg-secondary)]/50 text-left transition-all"
                    >
                      <div className="p-2 rounded-md bg-[var(--color-accent)]/10 text-[var(--color-accent)] group-hover:bg-[var(--color-accent)]/20 transition-colors">
                        <Plus size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">
                          New Snippet
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          Create a new code snippet
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={onNewProject}
                      className="w-full group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--color-bg-secondary)]/50 text-left transition-all"
                    >
                      <div className="p-2 rounded-md bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                        <Folder size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">
                          Open Project
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          Browse your projects
                        </div>
                      </div>
                    </button>

                    <button className="w-full group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--color-bg-secondary)]/50 text-left transition-all">
                      <div className="p-2 rounded-md bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                        <Command size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">
                          Command Palette
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          Press Ctrl+P to open
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Right Column: Recent Snippets */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Recent
                    </h2>
                    {allRecentSnippets.length > 3 && (
                      <button
                        onClick={() => setShowAllRecents(!showAllRecents)}
                        className="text-xs text-[var(--color-accent)] hover:underline"
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
                          className="w-full group flex items-center justify-between px-4 py-3 rounded-lg hover:bg-[var(--color-bg-secondary)]/50 text-left transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                              {snippet.title || 'Untitled'}
                            </div>
                            <div className="text-xs text-[var(--color-text-secondary)] font-mono">
                              {snippet.language}
                            </div>
                          </div>
                          <div className="text-xs text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity">
                            {new Date(snippet.timestamp).toLocaleDateString()}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-[var(--color-text-secondary)] opacity-60">
                          No recent snippets
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] opacity-40 mt-1">
                          Create your first snippet to get started
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
