import React, { useState, useEffect, useMemo, memo } from 'react'
import PropTypes from 'prop-types'
import { useZoomLevel, useEditorZoomLevel } from '../hook/useSettingsContext'

const StatusBar = ({ title, isLargeFile = false, snippets = [] }) => {
  const [version, setVersion] = useState('...')
  const [zoom] = useZoomLevel()
  const [editorZoom] = useEditorZoomLevel()

  // Debounce display values to keep statusbar "still" during fast wheeling
  const [displayZoom, setDisplayZoom] = useState(zoom)
  const [displayEditorZoom, setDisplayEditorZoom] = useState(editorZoom)

  useEffect(() => {
    const t = setTimeout(() => setDisplayZoom(zoom), 50)
    return () => clearTimeout(t)
  }, [zoom])

  useEffect(() => {
    const t = setTimeout(() => setDisplayEditorZoom(editorZoom), 50)
    return () => clearTimeout(t)
  }, [editorZoom])

  useEffect(() => {
    window.api?.getVersion().then(setVersion)
  }, [])

  const hasEditorContext = title !== undefined && title !== null
  const uniqueLanguages = useMemo(() => new Set(snippets.map((s) => s.language)).size, [snippets])

  return (
    <div
      className="flex items-center justify-between gap-3 text-xs w-full px-3 py-1 select-none border-t"
      style={{
        backgroundColor: 'var(--footer-bg)',
        color: 'var(--statusbar-text, var(--header-text))',
        borderColor: 'var(--color-border)'
      }}
    >
      {/* LEFT: System Info */}
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

      {/* RIGHT: Context Info */}
      <div className="flex items-center gap-3 opacity-90">
        {isLargeFile && (
          <span
            className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-500"
            title="Performance Mode: Some features disabled for large files"
          >
            Performance Mode
          </span>
        )}

        <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
          {title?.split('.').pop() || 'PLAINTEXT'}
        </span>
        <span className="text-white/20">|</span>
        <div className="flex items-center gap-2">
          {displayEditorZoom !== 1.0 && (
            <span className="font-mono text-[10px] text-cyan-400" title="Editor Font Scale">
              Code: {Math.round(displayEditorZoom * 100)}%
            </span>
          )}
          <span className="font-mono text-[10px] opacity-80" title="Global Window Zoom">
            {displayZoom !== 1.0 || displayEditorZoom === 1.0
              ? `Win: ${Math.round(displayZoom * 100)}%`
              : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

StatusBar.propTypes = {
  title: PropTypes.string,
  isLargeFile: PropTypes.bool,
  snippets: PropTypes.array
}

export default memo(StatusBar)
