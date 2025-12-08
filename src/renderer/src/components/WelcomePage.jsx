import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  FileCode,
  Folder,
  Command,
  Plus,
  Settings,
  Terminal,
  FolderOpen,
  ChevronRight,
  Github,
  User
} from 'lucide-react'
import { GitHubProfile, GitHubSettings } from './github'
import SystemStatusFooter from './SystemStatusFooter'

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
  const [githubUsername, setGitHubUsername] = useState(() => {
    try {
      return localStorage.getItem('githubUsername') || 'Saboor-Hamedi'
    } catch (e) {
      return 'Saboor-Hamedi'
    }
  })

  // Get recent files (last 5 snippets by timestamp)
  const recentFiles = snippets
    .filter((snippet) => !snippet.is_draft)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)

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
      <div className="h-full overflow-y-auto bg-[var(--color-bg)]">
        <div className="h-full flex flex-col">
          {/* Minimal Header */}
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative"></div>
                <div>
                  <h1 className="text-xl font-light text-[var(--color-text-primary)] tracking-wide">
                    Div Snippet
                  </h1>
                  <p className="text-xs text-[var(--color-text-secondary)] font-mono opacity-70">
                    Professional Code & Markdown Organization
                  </p>
                </div>
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
                  className="w-8 h-8 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-accent)]/20 transition-colors flex items-center justify-center group"
                >
                  <Settings
                    size={14}
                    className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Single Column Layout */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Top Section - Actions */}
            <div className="px-8 pb-6">
              <div className="mb-4">
                <h2 className="text-lg font-light text-[var(--color-text-primary)] mb-1">
                  Quick Actions
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)] opacity-70">
                  Create • Organize • Deploy
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* New Snippet - Compact */}
                <button
                  onClick={onNewSnippet}
                  className="group p-4 rounded-xl bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-accent)]/5 hover:from-[var(--color-accent)]/20 hover:to-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/40 transition-all duration-300 text-left"
                >
                  <Plus
                    size={20}
                    className="text-[var(--color-accent)] mb-3 group-hover:scale-110 transition-transform"
                  />
                  <div className="text-sm font-medium text-[var(--color-text-primary)] mb-0.5">
                    New Snippet
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] opacity-60 font-mono">
                    Ctrl+N
                  </div>
                </button>

                {/* Project */}
                <button
                  onClick={onNewProject}
                  className="group p-4 rounded-xl bg-[var(--color-bg-secondary)]/20 hover:bg-[var(--color-bg-secondary)]/40 transition-all duration-300 text-left"
                >
                  <Folder
                    size={20}
                    className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors mb-3"
                  />
                  <div className="text-sm font-medium text-[var(--color-text-primary)] mb-0.5">
                    Project
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] opacity-60">
                    Organize
                  </div>
                </button>

                {/* Palette */}
                <button className="group p-4 rounded-xl bg-[var(--color-bg-secondary)]/20 hover:bg-[var(--color-bg-secondary)]/40 transition-all duration-300 text-left">
                  <Command
                    size={20}
                    className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors mb-3"
                  />
                  <div className="text-sm font-medium text-[var(--color-text-primary)] mb-0.5">
                    Palette
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] opacity-60">
                    Ctrl+P
                  </div>
                </button>

                {/* GitHub */}
                <button
                  onClick={() => {
                    if (githubUsername) {
                      setShowGitHubProfile(true)
                    } else {
                      setShowGitHubSettings(true)
                    }
                  }}
                  className="group p-4 rounded-xl bg-gradient-to-br from-[#24292e]/10 to-[#24292e]/5 hover:from-[#24292e]/20 hover:to-[#24292e]/10 border border-[#24292e]/20 hover:border-[#24292e]/40 transition-all duration-300 text-left"
                >
                  <Github
                    size={20}
                    className="text-[var(--color-text-secondary)] group-hover:text-[#24292e] transition-colors mb-3"
                  />
                  <div className="text-sm font-medium text-[var(--color-text-primary)] mb-0.5 truncate">
                    {githubUsername ? '@' + githubUsername : 'GitHub'}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)] opacity-60">
                    {githubUsername ? 'Profile' : 'Connect'}
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Section - Recent Activity */}
            <div className="flex-1 overflow-y-auto px-8 pb-6">
              <div className="max-w-3xl">
                <div className="mb-4 sticky top-0 bg-[var(--color-bg)] py-2 z-10">
                  <h2 className="text-lg font-light text-[var(--color-text-primary)] mb-1">
                    Recent Activity
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)] opacity-70">
                    Last modified snippets
                  </p>
                </div>

                <div className="space-y-3">
                  {recentFiles.length > 0 ? (
                    recentFiles.map((snippet, index) => (
                      <button
                        key={snippet.id}
                        onClick={() => onSelectSnippet && onSelectSnippet(snippet)}
                        className="group w-full p-4 rounded-xl hover:bg-[var(--color-bg-secondary)]/20 transition-all duration-300 text-left border border-transparent hover:border-[var(--color-border)]/30"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/8 flex items-center justify-center group-hover:bg-[var(--color-accent)]/12 transition-colors">
                            <span className="text-xs font-mono text-[var(--color-accent)] uppercase font-medium">
                              {snippet.language?.slice(0, 2) || 'MD'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[var(--color-text-primary)] truncate mb-1">
                              {snippet.title || 'Untitled'}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-secondary)] opacity-70">
                              <span className="font-mono">
                                {new Date(snippet.timestamp).toLocaleDateString()}
                              </span>
                              <div className="w-1 h-1 bg-[var(--color-text-secondary)] rounded-full opacity-30"></div>
                              <span className="capitalize">{snippet.language || 'markdown'}</span>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight
                              size={14}
                              className="text-[var(--color-text-secondary)]"
                            />
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center border-2 border-dashed border-[var(--color-border)]/30 rounded-xl">
                      <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-secondary)]/30 flex items-center justify-center mb-3">
                        <FileCode
                          size={20}
                          className="text-[var(--color-text-secondary)] opacity-40"
                        />
                      </div>
                      <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        No snippets yet
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] opacity-60 max-w-48 leading-relaxed">
                        Create your first snippet to start organizing.
                      </p>
                    </div>
                  )}
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

export default WelcomePage
