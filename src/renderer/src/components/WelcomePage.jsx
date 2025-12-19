import { useState, useEffect, memo } from 'react'
import PropTypes from 'prop-types'
import { Folder, Command, Plus, Settings, Github } from 'lucide-react'
import { GitHubProfile, GitHubSettings } from './github'
import SystemStatusFooter from './SystemStatusFooter'
import useGeneralProp from '../hook/useGeneralProp.js'
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

  

  // Get recent files (last 5 snippets by timestamp)
  // Get recent files
  const allRecentSnippets = snippets
    .filter((snippet) => !snippet.is_draft)
    .sort((a, b) => b.timestamp - a.timestamp)

  const recentFiles = showAllRecents ? allRecentSnippets.slice(0, 5) : allRecentSnippets.slice(0, 1)

  // Save GitHub username to localStorage
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
          {/* Minimal Header */}
          <div className="px-4 py-6">
            <div className="flex space-x-4 justify-around items-center">
              <div className="flex items-center gap-7 ">
                {/* GitHub Profile Button - Top Left */}
                <button
                  onClick={() => {
                    if (githubUsername) {
                      setShowGitHubProfile(true)
                    } else {
                      setShowGitHubSettings(true)
                    }
                  }}
                  className="flex items-center gap-2 p-1 border rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center group-hover:bg-[var(--color-accent)]/10 transition-colors">
                    <Github size={12} className="group-hover:text-[var(--color-accent)]" />
                  </div>
                  <span className="text-xtiny font-normal opacity-80 group-hover:opacity-100">
                    {githubUsername ? `@${githubUsername}` : 'Connect'}
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-mono text-[var(--color-accent)] tabular-nums">
                    {snippets.length}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Snippets
                  </div>
                </div>
                <div className="w-px h-8 bg-[var(--color-border)]/30"></div>
                <button
                  onClick={onOpenSettings}
                  className="rounded-md hover:bg-[var(--color-accent)] transition-colors flex items-center justify-center group"
                >
                  <Settings size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - VS Code Style Layout */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-12 py-12">
              <div className="mb-12">
                <h1 className="text-4xl font-light text-[var(--color-text-primary)] mb-1">
                  Div Snippet
                </h1>
                <p className="text-xl text-[var(--color-text-secondary)] font-light opacity-80">
                  Editing evolved
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                {/* Left Column: Start */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 items-start">
                    <button
                      onClick={onNewSnippet}
                      className="group p-1 flex items-center gap-2 text-[var(--color-accent)] hover:underline decoration-[var(--color-accent)] underline-offset-2 transition-all text-left"
                    >
                      <Plus size={12} />
                      <span className="text-tiny">New Snippet</span>
                    </button>

                    <button
                      onClick={onNewProject}
                      className="group p-1 flex items-center gap-2 text-[var(--color-accent)] hover:underline decoration-[var(--color-accent)] underline-offset-2 transition-all text-left"
                    >
                      <Folder size={12} />
                      <span className="text-tiny">Open Project</span>
                    </button>

                    <button className="group p-1 flex items-center gap-2 text-[var(--color-accent)] hover:underline decoration-[var(--color-accent)] underline-offset-2 transition-all text-left">
                      <Command size={12} />
                      <span className="text-tiny">Command Palette</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Recent */}
                <div className="flex flex-col gap-4">
                  <h2 className="text-lg font-normal text-[var(--color-text-primary)]">Recent</h2>
                  <div className="flex flex-col gap-2">
                    {recentFiles.length > 0 ? (
                      recentFiles.map((snippet) => (
                        <button
                          key={snippet.id}
                          onClick={() => onSelectSnippet && onSelectSnippet(snippet)}
                          className="group p-1 flex flex-col items-start text-left text-[var(--color-accent)] hover:text-[var(--color-text-primary)] transition-colors py-1"
                        >
                          <span className="text-tiny group-hover:underline decoration-[var(--color-accent)] underline-offset-2">
                            {snippet.title || 'Untitled'}
                          </span>
                          <span className="text-xs text-[var(--color-text-secondary)] opacity-70 font-mono">
                            {snippet.language}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-[var(--color-text-secondary)] opacity-60 text-sm italic">
                        No recent files
                      </p>
                    )}

                    {/* Show 'More...' link */}
                    {allRecentSnippets.length > 1 && (
                      <button
                        onClick={() => setShowAllRecents(!showAllRecents)}
                        className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline text-left mt-2"
                      >
                        {showAllRecents ? 'Less...' : 'More...'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <SystemStatusFooter snippets={snippets} />
        </div>
      </div>

      {/* GitHub Profile Modal */}
      {showGitHubProfile && githubUsername && (
        <GitHubProfile username={githubUsername} onClose={() => setShowGitHubProfile(false)} />
      )}

      {/* GitHub Settings Modal */}
      {showGitHubSettings && (
        <GitHubSettings
          currentUsername={githubUsername}
          onSave={handleSaveGitHubUsername}
          onCancel={() => setShowGitHubSettings(false)}
        />
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
