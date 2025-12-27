import React, { useState, useEffect, useMemo, memo } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useZoomLevel, useEditorZoomLevel, useSettings } from '../../../hook/useSettingsContext'
import { Check } from 'lucide-react'

import './StatusBar.css'

const useStatusBar = ({
  title,
  isLargeFile = false,
  snippets = [],
  stats,
  line = 1,
  col = 1,
  minimal = false
}) => {
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

  const { getSetting, updateSetting } = useSettings()

  // Visibility States
  const showSystemStatus = getSetting('statusBar.showSystemStatus') !== false
  const showVersion = getSetting('statusBar.showVersion') !== false
  const showFlowMode = getSetting('statusBar.showFlowMode') !== false
  const showPerformance = getSetting('statusBar.showPerformance') !== false
  const showLanguage = getSetting('statusBar.showLanguage') !== false
  const showStats = getSetting('statusBar.showStats') !== false
  const showZoom = getSetting('statusBar.showZoom') !== false

  // New Toggles
  const showCursorPosition = getSetting('statusBar.showCursorPosition') !== false
  const showIndentation = getSetting('statusBar.showIndentation') !== false
  const showEncoding = getSetting('statusBar.showEncoding') !== false

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 })

  const handleContextMenu = (e) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY
    })
  }

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false })
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [contextMenu])

  const menuItems = [
    { label: 'System Status', key: 'statusBar.showSystemStatus', checked: showSystemStatus },
    { label: 'Version', key: 'statusBar.showVersion', checked: showVersion },
    { label: 'Flow Mode', key: 'statusBar.showFlowMode', checked: showFlowMode },
    { label: 'Cursor Position', key: 'statusBar.showCursorPosition', checked: showCursorPosition },
    { label: 'Indentation', key: 'statusBar.showIndentation', checked: showIndentation },
    { label: 'Encoding', key: 'statusBar.showEncoding', checked: showEncoding },
    { label: 'Language', key: 'statusBar.showLanguage', checked: showLanguage },
    { label: 'Word Count', key: 'statusBar.showStats', checked: showStats },
    { label: 'Zoom', key: 'statusBar.showZoom', checked: showZoom }
  ]

  return (
    <>
      <div
        className="status-bar-container text-xs select-none"
        onContextMenu={handleContextMenu}
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {/* LEFT: System Info - HIDDEN in minimal mode */}
        <div className="status-bar-left">
          {!minimal && showFlowMode && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('app:toggle-flow'))}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-all group"
              title="Enter Flow Mode (Alt+Shift+F)"
            >
              <span className="text-xs leading-none group-hover:scale-110 transition-transform">
                🌀
              </span>
              <span className="font-mono text-xtiny opacity-90">Flow Mode</span>
            </button>
          )}

          {/* Version (Restored) */}
          {!minimal && showVersion && (
            <div className="status-bar-item opacity-60 hover:opacity-100 transition-opacity">
              <span className="font-mono tabular-nums">v{version}</span>
            </div>
          )}

          {/* Git Branch / Version Placeholder (Toggle via System Status) */}
          {!minimal && showSystemStatus && (
            <div className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer opacity-60 hover:opacity-100 flex items-center gap-1">
              <span className="icon-branch text-[10px]">main*</span>
            </div>
          )}
        </div>

        {/* RIGHT: Context Info (VS Code Style) */}
        <div className="status-bar-right flex items-center gap-0">
          {/* 1. Cursor Position - Ln {line}, Col {col} */}
          {showCursorPosition && (
            <div
              className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer min-w-[80px] justify-end"
              title="Go to Line"
            >
              <span className="font-mono tabular-nums">
                Ln {line}, Col {col}
              </span>
            </div>
          )}

          {/* 2. Indentation - HIDDEN in minimal mode */}
          {!minimal && showIndentation && (
            <div
              className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer hidden sm:flex"
              title="Select Indentation"
            >
              <span className="font-sans">Spaces: 2</span>
            </div>
          )}

          {/* 3. Encoding - HIDDEN in minimal mode */}
          {!minimal && showEncoding && (
            <div
              className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer hidden sm:flex"
              title="Select Encoding"
            >
              <span className="font-sans">UTF-8</span>
            </div>
          )}

          {/* 4. Statistics (Char/Word Count) - ALWAYS shown if stats exist */}
          {stats && (
            <div
              className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer flex"
              title="Word Count"
            >
              <span className="font-sans tabular-nums">
                {stats.words} words, {stats.chars} chars
              </span>
            </div>
          )}

          {/* 5. Language Mode - HIDDEN in minimal mode */}
          {!minimal && showLanguage && (
            <div
              className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              title="Select Language Mode"
            >
              <span className="font-mono text-xtiny uppercase tracking-wider">
                {title?.split('.').pop() || 'TXT'}
              </span>
            </div>
          )}

          {/* 6. Zoom Level - HIDDEN in minimal mode */}
          {!minimal && showZoom && displayEditorZoom && (
            <div
              className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              title="Zoom Level"
            >
              <span className="font-mono tabular-nums text-xtiny">
                {Math.round((displayEditorZoom || 1) * 100)}%
              </span>
            </div>
          )}

          {/* 7. Prettier / Feedback (Smile) - HIDDEN in minimal mode */}
          {!minimal && (
            <div
              className="status-bar-item hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer px-1.5"
              title="Tweet Feedback"
            >
              <span className="text-[14px]">😊</span>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu using Portal */}
      {contextMenu.visible &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999]"
            onClick={() => setContextMenu({ ...contextMenu, visible: false })}
            onContextMenu={(e) => {
              e.preventDefault()
              setContextMenu({ ...contextMenu, visible: false })
            }}
          >
            <div
              className="status-bar-context-menu"
              style={{
                left: Math.min(contextMenu.x, window.innerWidth - 200),
                bottom: window.innerHeight - contextMenu.y + 10 // Anchor 10px above mouse/click
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {menuItems.map((item) => (
                <div
                  key={item.key}
                  className="context-menu-item"
                  onClick={() => updateSetting(item.key, !item.checked)}
                >
                  <div className="context-menu-check">
                    {item.checked && <Check size={14} strokeWidth={3} />}
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

useStatusBar.propTypes = {
  title: PropTypes.string,
  isLargeFile: PropTypes.bool,
  snippets: PropTypes.array,
  stats: PropTypes.shape({
    chars: PropTypes.number,
    words: PropTypes.number
  }),
  line: PropTypes.number,
  col: PropTypes.number
}

export default memo(useStatusBar)
