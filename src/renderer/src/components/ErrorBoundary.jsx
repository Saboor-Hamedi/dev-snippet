import React from 'react'
import PropTypes from 'prop-types'
import { ShieldAlert, RefreshCw, Terminal, Info } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL APP ERROR:', error, errorInfo)
    this.setState({ errorInfo })

    // Auto-fix attempt: If it's a specific type of error, we could clear some cache here
    if (error.message?.includes('local storage') || error.message?.includes('quota')) {
      console.warn('Attempting to clear suspicious storage keys...')
      // localStorage.removeItem('searchHistory') // example
    }
  }

  handleReload = () => {
    // Clear potentially corrupt temporary state before reload
    try {
      sessionStorage.clear()
    } catch (e) {}
    // Force a hard reload
    window.location.reload()
  }

  dismissError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-xl transition-all duration-500">
          <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#0d1117]/95 rounded-[5px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-slate-800/60 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header / Graphic - Removed top border as requested */}
            {/* <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500" /> */}

            {/* Close Button / Dismiss */}
            <button
              onClick={this.dismissError}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all active:scale-95"
              title="Attempt to dismiss and continue"
            >
              <RefreshCw size={20} className="rotate-45" />
            </button>

            <div className="p-8 pb-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 group ring-1 ring-red-500/20">
                <ShieldAlert
                  size={32}
                  className="group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                Application Interrupted
              </h2>
              <p className="text-[14px] text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-[340px]">
                An unexpected system glitch occurred. Your data is likely safe, but we need to
                restart the engine or dismiss this alert to continue.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={this.handleReload}
                  className="flex-1 h-[42px] flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-[13px] font-bold shadow-lg shadow-slate-900/10 hover:shadow-xl transition-all active:scale-95 hover:bg-slate-800 dark:hover:bg-slate-200"
                >
                  <RefreshCw size={14} className="animate-spin-slow" />
                  Restore Application
                </button>
                <button
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="px-6 h-[42px] flex items-center justify-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <Terminal size={14} />
                  {this.state.showDetails ? 'Hide Log' : 'Dev Trace'}
                </button>
              </div>
            </div>

            {/* Expandable Error Details */}
            {this.state.showDetails && (
              <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-300">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[13px] overflow-auto max-h-[300px] text-red-400/90 custom-scrollbar selection:bg-red-500/30 shadow-inner">
                  <div className="flex items-center gap-2 mb-3 text-slate-500 text-[11px] uppercase tracking-widest font-bold border-b border-slate-800 pb-2">
                    <Info size={14} />
                    Stack Trace
                  </div>
                  <strong className="block mb-2 text-red-300">
                    {this.state.error?.toString()}
                  </strong>
                  <pre className="text-slate-400 opacity-90 leading-relaxed whitespace-pre-wrap">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex justify-center text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              Safe Recovery Mode • v1.1.5
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
}

export default ErrorBoundary
