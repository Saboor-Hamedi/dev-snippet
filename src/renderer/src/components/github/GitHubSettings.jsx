import React, { useState, useEffect } from 'react'
import { Github, User, Settings, Check, X } from 'lucide-react'

const GitHubSettings = ({ onSave, onCancel, currentUsername = '' }) => {
  const [username, setUsername] = useState(currentUsername)
  const [isValid, setIsValid] = useState(true)

  // Validate GitHub username format
  const validateUsername = (value) => {
    const githubUsernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
    return githubUsernameRegex.test(value)
  }

  const handleUsernameChange = (e) => {
    const value = e.target.value
    setUsername(value)
    setIsValid(value === '' || validateUsername(value))
  }

  const handleSave = () => {
    if (username && isValid) {
      onSave(username)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && username && isValid) {
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-bg)] rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
            <Github className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">GitHub Profile</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">Connect your GitHub profile</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              GitHub Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
              </div>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                onKeyDown={handleKeyPress}
                placeholder="Enter your GitHub username"
                className={`
                  w-full pl-10 pr-4 py-3 rounded-xl border transition-colors
                  bg-[var(--color-bg-secondary)]/30
                  text-[var(--color-text-primary)]
                  placeholder-[var(--color-text-secondary)]
                  focus:outline-none focus:ring-2
                  ${isValid 
                    ? 'border-[var(--color-border)] focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]' 
                    : 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                  }
                `}
                autoFocus
              />
            </div>
            {!isValid && username && (
              <p className="mt-2 text-sm text-red-500">
                Please enter a valid GitHub username
              </p>
            )}
            {username && isValid && (
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Profile will be fetched from: github.com/{username}
              </p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSave}
              disabled={!username || !isValid}
              className={`
                flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-colors
                ${username && isValid
                  ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/80'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] cursor-not-allowed'
                }
              `}
            >
              <Check className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-secondary)]/30 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GitHubSettings