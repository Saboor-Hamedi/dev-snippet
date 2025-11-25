import React from 'react'
import PropTypes from 'prop-types'
import { FileCode, Folder, Command, Keyboard } from 'lucide-react'

const WelcomePage = ({ onNewSnippet }) => {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-200">
      <div className="max-w-2xl mx-auto px-8 text-center">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full"></div>
            <FileCode
              className="w-24 h-24 text-primary-600 dark:text-primary-400 relative"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Welcome to Quick Snippets
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
          Your personal code snippet manager. Store, organize, and access your code snippets
          instantly.
        </p>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <button
            onClick={onNewSnippet}
            className="group relative overflow-hidden bg-white dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 border-2 border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-xl p-6 transition-all duration-200 text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <FileCode className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">New Snippet</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Create a new code snippet
                </p>
              </div>
            </div>
          </button>

          <div className="group relative overflow-hidden bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-6 transition-all duration-200 text-left opacity-75">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <Folder className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Browse Snippets
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Click any snippet in the sidebar
                </p>
              </div>
            </div>
          </div>
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
  onNewSnippet: PropTypes.func.isRequired
}

export default WelcomePage
