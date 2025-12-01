import React from 'react'
import PropTypes from 'prop-types'
import { FileCode, Folder, Command, Keyboard } from 'lucide-react'

const WelcomePage = ({ onNewSnippet, onNewProject }) => {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-200">
      <div className="max-w-xl sm:max-w-2xl mx-auto px-4 sm:px-8 text-center">
        {/* Logo/Icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full"></div>
            <FileCode
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-primary-600 dark:text-primary-400 relative"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
          Welcome to Quick Snippets
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 mb-8 md:mb-12">
          Your personal code snippet manager. Store, organize, and access your code snippets
          instantly.
        </p>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 md:mb-12">
          <button
            onClick={onNewSnippet}
            className="group relative overflow-hidden bg-white dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 border-2 border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-xl p-3 sm:p-4 md:p-6 transition-all duration-200 text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <FileCode className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">New Snippet</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Create a new code snippet
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={onNewProject}
            className="group relative overflow-hidden bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-[#161b22] border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-[#30363d] rounded-xl p-3 sm:p-4 md:p-6 transition-all duration-200 text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-slate-100 dark:bg-[#161b22] rounded-lg group-hover:scale-110 transition-transform">
                <Folder className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-slate-600 dark:text-slate-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">New Project</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Create a new project</p>
              </div>
            </div>
          </button>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Keyboard className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Keyboard Shortcuts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-slate-600 dark:text-slate-400">New Snippet</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">
                  Ctrl
                </kbd>
                <span className="text-slate-400">+</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">
                  N
                </kbd>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-slate-600 dark:text-slate-400">Save Snippet</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">
                  Ctrl
                </kbd>
                <span className="text-slate-400">+</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">
                  S
                </kbd>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-slate-600 dark:text-slate-400">Command Palette</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">
                  Ctrl
                </kbd>
                <span className="text-slate-400">+</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">
                  P
                </kbd>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-slate-600 dark:text-slate-400">Toggle Sidebar</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">
                  Ctrl
                </kbd>
                <span className="text-slate-400">+</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">
                  B
                </kbd>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <span className="text-slate-600 dark:text-slate-400">Copy Snippet</span>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">
                  Ctrl
                </kbd>
                <span className="text-slate-400">+</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">
                  Shift
                </kbd>
                <span className="text-slate-400">+</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono">
                  C
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Tip */}
        <p className="mt-8 text-sm text-slate-500 dark:text-slate-600">
          Tip: Use <Command className="w-3 h-3 inline" /> Ctrl+P to quickly search and open any
          snippet
        </p>
      </div>
    </div>
  )
}

WelcomePage.propTypes = {
  onNewSnippet: PropTypes.func.isRequired,
  onNewProject: PropTypes.func.isRequired
}

export default WelcomePage
