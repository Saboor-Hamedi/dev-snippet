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

const WelcomePage = ({ onNewSnippet, onNewProject, onOpenSettings, onSelectSnippet, snippets = [] }) => {
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
    .filter(snippet => !snippet.is_draft)
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
              <div className="relative">
                {/* <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent)]/70 flex items-center justify-center">
                  <Terminal size={20} className="text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[var(--color-bg)]"></div> */}
              </div>
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
                <div className="text-lg font-mono text-[var(--color-accent)] tabular-nums">{snippets.length}</div>
                <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">Snippets</div>
              </div>
              <div className="w-px h-8 bg-[var(--color-border)]/30"></div>
              <button 
                onClick={onOpenSettings}
                className="w-8 h-8 rounded-lg bg-[var(--color-bg-secondary)] hover:bg-[var(--color-accent)]/20 transition-colors flex items-center justify-center group"
              >
                <Settings size={14} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-2">

            {/* Left Column - Actions */}
            <div className="p-10 flex flex-col overflow-y-auto">
              <div className="mb-10">
                <h2 className="text-2xl font-light text-[var(--color-text-primary)] mb-2">Quick Actions</h2>
                <p className="text-sm text-[var(--color-text-secondary)] opacity-70">Create • Organize • Deploy</p>
              </div>

              <div className="space-y-6 flex-1">
                {/* Primary Action */}
                <button
                  onClick={onNewSnippet}
                  className="group w-full p-8 rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/8 to-[var(--color-accent)]/3 hover:from-[var(--color-accent)]/12 hover:to-[var(--color-accent)]/6 transition-all duration-500 text-left overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[var(--color-accent)]/15 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
                  <div className="relative">
                    <div className="flex items-start gap-5 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/15 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Plus size={20} className="text-[var(--color-accent)]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-medium text-[var(--color-text-primary)] mb-1">New Snippet</div>
                        <div className="text-xs text-[var(--color-text-secondary)] font-mono opacity-60">Ctrl+N</div>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed opacity-80">
                      Create a new code snippet with syntax highlighting and organization tools.
                    </p>
                  </div>
                </button>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={onNewProject}
                    className="group p-6 rounded-xl bg-[var(--color-bg-secondary)]/20 hover:bg-[var(--color-bg-secondary)]/40 transition-all duration-300 text-left"
                  >
                    <Folder size={18} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors mb-3" />
                    <div className="text-base font-medium text-[var(--color-text-primary)] mb-1">Project</div>
                    <div className="text-xs text-[var(--color-text-secondary)] opacity-60">Organize</div>
                  </button>
                  
                  <button className="group p-6 rounded-xl bg-[var(--color-bg-secondary)]/20 hover:bg-[var(--color-bg-secondary)]/40 transition-all duration-300 text-left">
                    <Command size={18} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors mb-3" />
                    <div className="text-base font-medium text-[var(--color-text-primary)] mb-1">Palette</div>
                    <div className="text-xs text-[var(--color-text-secondary)] opacity-60">Ctrl+P</div>
                  </button>
                  
                  <button 
                    onClick={() => {
                      if (githubUsername) {
                        setShowGitHubProfile(true)
                      } else {
                        setShowGitHubSettings(true)
                      }
                    }}
                    className="group p-6 rounded-xl bg-gradient-to-br from-[#24292e]/10 to-[#24292e]/5 hover:from-[#24292e]/20 hover:to-[#24292e]/10 border border-[#24292e]/20 hover:border-[#24292e]/40 transition-all duration-300 text-left"
                  >
                    <Github size={18} className="text-[var(--color-text-secondary)] group-hover:text-[#24292e] transition-colors mb-3" />
                    <div className="text-base font-medium text-[var(--color-text-primary)] mb-1">
                      {githubUsername ? '@' + githubUsername : 'GitHub'}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] opacity-60">
                      {githubUsername ? 'View Profile' : 'Connect'}
                    </div>
                  </button>
                  
                  <button 
                    onClick={onOpenSettings}
                    className="group p-6 rounded-xl bg-[var(--color-bg-secondary)]/20 hover:bg-[var(--color-bg-secondary)]/40 transition-all duration-300 text-left"
                  >
                    <Settings size={18} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors mb-3" />
                    <div className="text-base font-medium text-[var(--color-text-primary)] mb-1">Settings</div>
                    <div className="text-xs text-[var(--color-text-secondary)] opacity-60">⌘,</div>
                  </button>
                </div>

                {/* System Actions */}
                <div className="pt-6">
                  <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-4 opacity-70">System</h3>
                  <div className="space-y-3">
                    <button className="group flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--color-bg-secondary)]/20 transition-all text-left w-full">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-secondary)]/30 flex items-center justify-center">
                        <FolderOpen size={16} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors" />
                      </div>
                      <span className="text-sm text-[var(--color-text-primary)] flex-1">Import Files</span>
                      <ChevronRight size={14} className="text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    
                    <button 
                      onClick={onOpenSettings}
                      className="group flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--color-bg-secondary)]/20 transition-all text-left w-full"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-secondary)]/30 flex items-center justify-center">
                        <Settings size={16} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors" />
                      </div>
                      <span className="text-sm text-[var(--color-text-primary)] flex-1">Preferences</span>
                      <kbd className="px-2 py-1 bg-[var(--color-bg-secondary)]/50 rounded text-xs font-mono opacity-50">⌘,</kbd>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column - Recent & Overview */}
            <div className="p-10 flex flex-col overflow-y-auto">
              <div className="mb-10">
                <h2 className="text-2xl font-light text-[var(--color-text-primary)] mb-2">Recent Activity</h2>
                <p className="text-sm text-[var(--color-text-secondary)] opacity-70">Last modified snippets</p>
              </div>

              <div className="flex-1">
                {recentFiles.length > 0 ? (
                  <div className="space-y-4">
                    {recentFiles.map((snippet, index) => (
                      <button
                        key={snippet.id}
                        onClick={() => onSelectSnippet && onSelectSnippet(snippet)}
                        className="group w-full p-6 rounded-xl hover:bg-[var(--color-bg-secondary)]/20 transition-all duration-300 text-left"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/8 flex items-center justify-center group-hover:bg-[var(--color-accent)]/12 transition-colors">
                            <span className="text-sm font-mono text-[var(--color-accent)] uppercase font-medium">
                              {snippet.language?.slice(0, 2) || 'MD'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-medium text-[var(--color-text-primary)] truncate mb-2">
                              {snippet.title || 'Untitled'}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] opacity-70">
                              <span className="font-mono">{new Date(snippet.timestamp).toLocaleDateString()}</span>
                              <div className="w-1.5 h-1.5 bg-[var(--color-text-secondary)] rounded-full opacity-30"></div>
                              <span className="capitalize">{snippet.language || 'markdown'}</span>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight size={16} className="text-[var(--color-text-secondary)]" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-80 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-[var(--color-bg-secondary)]/30 flex items-center justify-center mb-6">
                      <FileCode size={28} className="text-[var(--color-text-secondary)] opacity-40" />
                    </div>
                    <h3 className="text-base font-medium text-[var(--color-text-primary)] mb-3">No snippets yet</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] opacity-60 max-w-56 leading-relaxed">
                      Create your first snippet to start organizing your code and markdown files.
                    </p>
                  </div>
                )}


              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-[var(--color-bg-secondary)]/30">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[var(--color-text-secondary)]">System Ready</span>
              </div>
              <div className="text-[var(--color-text-secondary)] font-mono opacity-60">v1.0.0</div>
            </div>
            <div className="flex items-center gap-6 text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-1">
                <span className="font-mono text-[var(--color-accent)] tabular-nums">{snippets.length}</span>
                <span>Snippets</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[var(--color-accent)] tabular-nums">
                  {new Set(snippets.map(s => s.language)).size}
                </span>
                <span>Languages</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[var(--color-accent)] tabular-nums">
                  {snippets.length > 0 ? Math.round((snippets.length / Math.max(1, Math.ceil((Date.now() - Math.min(...snippets.map(s => s.timestamp))) / (1000 * 60 * 60 * 24)))) * 10) / 10 : 0}
                </span>
                <span>Per day</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* GitHub Profile Modal */}
    {showGitHubProfile && githubUsername && (
      <GitHubProfile 
        username={githubUsername}
        onClose={() => setShowGitHubProfile(false)}
      />
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
