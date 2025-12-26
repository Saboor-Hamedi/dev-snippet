import React, { useState, useEffect, useMemo, memo } from 'react'
import PropTypes from 'prop-types'
import { useZoomLevel, useEditorZoomLevel } from '../../../hook/useSettingsContext'

import './StatusBar.css'

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

  return (
    <div className="status-bar-container text-xs">
      {/* LEFT: System Info (Matches SystemStatusFooter) */}
      <div className="status-bar-left">
        <div className="status-bar-item">
          <div
            className={`w-1.5 h-1.5 rounded-full ${hasEditorContext ? 'bg-cyan-400' : 'bg-emerald-400'}`}
          ></div>
          <span className="font-mono tabular-nums opacity-80">
            {hasEditorContext ? 'Editing' : 'System Ready'}
          </span>
        </div>
        <div className="status-bar-item opacity-60 hidden sm:flex">
          <span className="font-mono tabular-nums">v{version}</span>
        </div>
        <div className="status-bar-divider"></div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('app:toggle-flow'))}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-blue-500/10 text-blue-400/80 hover:text-blue-400 transition-all group"
          title="Enter Flow Mode (Alt+Shift+F)"
        >
          <span className="text-xs leading-none group-hover:scale-110 transition-transform">
            🌀
          </span>
          <span className="font-mono text-xtiny opacity-90">Flow Mode</span>
        </button>
      </div>

      {/* RIGHT: Context Info (Editor Specific) */}
      <div className="status-bar-right">
        {isLargeFile && (
          <span
            className="px-1.5 py-0.5 rounded text-xtiny uppercase font-bold tracking-wider bg-amber-500/20 text-amber-500"
            title="Performance Mode: Some features disabled for large files"
          >
            Performance Mode
          </span>
        )}

        <div className="status-bar-item opacity-80">
          <span className="font-mono text-xtiny uppercase tracking-wider">
            {title?.split('.').pop() || 'PLAINTEXT'}
          </span>
        </div>

        <div className="status-bar-divider"></div>

        <div className="flex items-center gap-2">
          {displayEditorZoom !== 1.0 && (
            <span
              className="font-mono text-xtiny text-cyan-400 px-1 py-0.5 hover:bg-white/5 rounded cursor-pointer"
              title="Editor Font Scale"
            >
              Code: {Math.round(displayEditorZoom * 100)}%
            </span>
          )}
          <span
            className="font-mono text-xtiny opacity-80 px-1 py-0.5 hover:bg-white/5 rounded cursor-pointer"
            title="Global Window Zoom"
          >
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
