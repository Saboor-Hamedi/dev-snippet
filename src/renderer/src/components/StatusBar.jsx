import React from 'react'
import PropTypes from 'prop-types'

const StatusBar = ({
  onSettingsClick,
  zoomLevel = 1,
  title,
  isLargeFile = false,
  snippets = [],
  hideWelcomePage = false,
  onToggleWelcomePage
}) => {
  const [version, setVersion] = React.useState('...')

  React.useEffect(() => {
    window.api?.getVersion().then(setVersion)
  }, [])

  const hasEditorContext = title !== undefined && title !== null
  const uniqueLanguages = React.useMemo(
    () => new Set(snippets.map((s) => s.language)).size,
    [snippets]
  )

  return (
    <div
      className="flex items-center justify-between gap-3 text-xs w-full px-3 py-1 select-none border-t"
      style={{
        backgroundColor: 'var(--footer-bg)',
        color: 'var(--statusbar-text, var(--header-text))',
        borderColor: 'var(--color-border)'
      }}
    >
      {/* LEFT: System Info (Always Visible for Consistency) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-white/5 transition-colors cursor-default">
          <div
            className={`w-1.5 h-1.5 rounded-full ${hasEditorContext ? 'bg-cyan-400' : 'bg-emerald-400'}`}
          ></div>
          <span className="font-mono tabular-nums opacity-80">
            {hasEditorContext ? 'Editing' : 'System Ready'}
          </span>
        </div>
        <div className="px-1 py-0.5 rounded hover:bg-white/5 transition-colors cursor-default opacity-60 hidden sm:block">
          <span className="font-mono tabular-nums">v{version}</span>
        </div>
      </div>

      {/* RIGHT: Context Info (Swaps based on View) */}
      <div className="flex items-center gap-3 opacity-90">
        {/* Large File Warning */}
        {isLargeFile && (
          <span
            className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-500"
            title="Performance Mode: Some features disabled for large files"
          >
            Performance Mode
          </span>
        )}

        {/* EDITOR CONTEXT: Lang | Zoom */}
        {hasEditorContext ? (
          <>
            <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
              {title?.split('.').pop() || 'PLAINTEXT'}
            </span>
            <span className="text-white/20">|</span>
            <span className="font-mono text-[10px] opacity-80" title="Zoom Level">
              {Math.round(zoomLevel * 100)}%
            </span>
          </>
        ) : (
          /* SYSTEM CONTEXT: Counts | Welcome Toggle */
          <>
            <div className="flex items-center gap-2 text-[10px] opacity-80 hidden sm:flex">
              <span>{snippets.length} Snippets</span>
              <span className="text-white/20">|</span>
              <span>{uniqueLanguages} Languages</span>
            </div>

            {/* Only show toggle if handler provided */}
            {onToggleWelcomePage && (
              <>
                <span className="text-white/20 hidden sm:block">|</span>
                <button
                  onClick={() => onToggleWelcomePage(!hideWelcomePage)}
                  className="hover:text-cyan-400 transition-colors"
                  title={hideWelcomePage ? 'Show Welcome Page' : 'Hide Welcome Page'}
                >
                  {hideWelcomePage ? 'Show Welcome' : 'Hide Welcome'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

StatusBar.propTypes = {
  onSettingsClick: PropTypes.func,
  zoomLevel: PropTypes.number,
  title: PropTypes.string, // If present, shows Editor Context
  isLargeFile: PropTypes.bool,
  snippets: PropTypes.array,
  hideWelcomePage: PropTypes.bool,
  onToggleWelcomePage: PropTypes.func
}

export default React.memo(StatusBar)
