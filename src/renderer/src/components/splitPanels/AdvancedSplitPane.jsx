import React, { useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { GripVertical, Smartphone, Tablet, Monitor, Image } from 'lucide-react'
import useAdvancedSplitPane from './useAdvancedSplitPane.js'

const AdvancedSplitPane = ({
  left,
  right,
  unifiedScroll = false,
  overlayMode = false,
  minLeft = 200,
  minRight = 200,
  initialLeft = 50,
  rightHidden = false,
  ...props
}) => {
  const containerRef = useRef(null)
  const draggingRef = useRef(false)

  /*
   * Read preview colors from settings via the settings hook
   * useAdvancedSplitPane.js
   * This allows dynamic updating without re-rendering the whole component.
   */
  const { bgColor, borderWidth, borderColor, borderRound } = useAdvancedSplitPane()

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--bg-color', bgColor)
      containerRef.current.style.setProperty('--border-width', `${borderWidth}px`)
      containerRef.current.style.setProperty('--border-color', borderColor)
      containerRef.current.style.setProperty('--border-round', `${borderRound}px`)
    }
  }, [bgColor, borderWidth, borderColor, borderRound, containerRef])

  // Separate state for each mode
  const [overlayWidth, setOverlayWidth] = useState(() => {
    try {
      return parseFloat(localStorage.getItem('overlayWidth')) || 40
    } catch {
      return 40
    }
  })

  const [sideBySideLeft, setSideBySideLeft] = useState(() => {
    try {
      return parseFloat(localStorage.getItem('sideBySideLeft')) || initialLeft
    } catch {
      return initialLeft
    }
  })

  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingRef.current || !containerRef.current) return

      e.preventDefault()
      e.stopPropagation()

      const rect = containerRef.current.getBoundingClientRect()

      if (overlayMode) {
        // Direct overlay width calculation
        const x = e.clientX - rect.left
        const rightEdge = rect.width - x
        const newOverlayWidth = Math.max(15, Math.min(90, (rightEdge / rect.width) * 100))

        setOverlayWidth(newOverlayWidth)
        localStorage.setItem('overlayWidth', newOverlayWidth)
      } else {
        // Standard side-by-side mode
        const x = e.clientX - rect.left
        const minLeftPx = Math.max(minLeft, 0)
        const minRightPx = Math.max(minRight, 0)
        const clampedX = Math.min(Math.max(x, minLeftPx), rect.width - minRightPx)
        const newPercent = Math.max(10, Math.min(90, (clampedX / rect.width) * 100))

        setSideBySideLeft(newPercent)
        localStorage.setItem('sideBySideLeft', newPercent)
      }
    }

    const handleMouseUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false
        setIsDragging(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [overlayMode, minLeft, minRight])

  const startDrag = (e) => {
    e.preventDefault()
    draggingRef.current = true
    setIsDragging(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  // Restore saved widths when switching modes
  useEffect(() => {
    if (overlayMode) {
      const savedOverlayWidth = parseFloat(localStorage.getItem('overlayWidth')) || 40
      setOverlayWidth(savedOverlayWidth)
    } else {
      const savedSideBySideLeft = parseFloat(localStorage.getItem('sideBySideLeft')) || initialLeft
      setSideBySideLeft(savedSideBySideLeft)
    }
  }, [overlayMode, initialLeft])

  return (
    <>
      {rightHidden ? (
        <div
          ref={containerRef}
          className="flex h-full w-full overflow-hidden"
          style={{ backgroundColor: 'var(--editor-bg)' }}
        >
          <div className="min-h-0 overflow-auto" style={{ width: '100%' }}>
            {left}
          </div>
        </div>
      ) : overlayMode ? (
        // Overlay mode: LivePreview floats over editor
        <div ref={containerRef} className="relative h-full w-full overflow-hidden">
          {/* Full-width editor */}
          <div className="absolute inset-0 w-full h-full">{left}</div>

          {/* Floating preview */}
          {!rightHidden && (
            <>
              {/* Floating panel */}
              <div
                className="absolute top-2 right-5 bottom-2 
                           z-10 flex flex-col overflow-hidden shadow-xl"
                style={{
                  width: `${overlayWidth}%`,
                  minWidth: `${minRight}px`,
                  maxWidth: '90%',
                  backgroundColor: bgColor,
                  border: `${borderWidth}px solid ${borderColor || 'rgba(0,0,0,0.06)'}`,
                  borderRadius: `${borderRound}px`
                }}
              >
                {/* Toolbar */}
                <div className="flex items-center justify-end px-2 py-1 gap-1 border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                  <button
                    onClick={() => {
                      setOverlayWidth(25)
                      localStorage.setItem('overlayWidth', 25)
                    }}
                    className={`p-1.5 text-xs rounded transition-colors flex items-center justify-center ${
                      overlayWidth === 25
                        ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500'
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                    }`}
                    title="Mobile View (25%)"
                  >
                    <Smartphone size={10} />
                  </button>
                  <button
                    onClick={() => {
                      setOverlayWidth(50)
                      localStorage.setItem('overlayWidth', 50)
                    }}
                    className={`p-1.5 text-xs rounded transition-colors flex items-center justify-center ${
                      overlayWidth === 50
                        ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500'
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                    }`}
                    title="Tablet View (50%)"
                  >
                    <Tablet size={10} />
                  </button>
                  <button
                    onClick={() => {
                      setOverlayWidth(75)
                      localStorage.setItem('overlayWidth', 75)
                    }}
                    className={`p-1.5 text-xs rounded transition-colors flex items-center justify-center ${
                      overlayWidth === 75
                        ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500'
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                    }`}
                    title="Desktop View (75%)"
                  >
                    <Monitor size={10} />
                  </button>
                </div>

                {/* Resize handle */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize
                 hover:bg-blue-500/20 transition-colors flex items-center justify-center z-20"
                  onMouseDown={startDrag}
                >
                  <div className="w-1 h-8 bg-slate-400 dark:bg-slate-500 rounded-full opacity-50 hover:opacity-100"></div>
                </div>

                {/* Content */}
                <div
                  className={`flex-1 ml-2 overflow-auto relative ${isDragging ? 'pointer-events-none' : ''}`}
                >
                  {right}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        // Standard side-by-side mode
        <div
          ref={containerRef}
          className={`flex h-full w-full ${unifiedScroll ? 'overflow-auto' : 'overflow-hidden'}`}
          style={{ backgroundColor: 'var(--editor-bg)' }}
        >
          <div
            className={`min-h-0 ${unifiedScroll ? 'overflow-visible' : 'overflow-auto'}`}
            style={{ width: `${sideBySideLeft}%` }}
          >
            {left}
          </div>

          {/* Resize knob */}
          <div className="shrink-0 relative flex items-center justify-center">
            <div
              className="w-4 h-6 flex items-center justify-center 
             bg-slate-700/30 hover:bg-slate-700/60 
             transition-all duration-200 
             rounded-[4px] cursor-col-resize select-none border border-white/5"
              role="separator"
              aria-orientation="vertical"
              onMouseDown={startDrag}
              style={{
                userSelect: 'none',
                touchAction: 'none',
                WebkitUserSelect: 'none',
                msUserSelect: 'none',
                MozUserSelect: 'none'
              }}
            >
              <GripVertical
                className="text-slate-500 dark:text-slate-400 pointer-events-none"
                size={12}
              />
            </div>
          </div>

          <div
            className={`min-h-0 overflow-auto ${isDragging ? 'pointer-events-none' : ''}`}
            style={{ width: `${100 - sideBySideLeft}%` }}
          >
            {right}
          </div>
        </div>
      )}
    </>
  )
}

AdvancedSplitPane.propTypes = {
  left: PropTypes.node,
  right: PropTypes.node,
  unifiedScroll: PropTypes.bool,
  overlayMode: PropTypes.bool,
  minLeft: PropTypes.number,
  minRight: PropTypes.number,
  initialLeft: PropTypes.number,
  rightHidden: PropTypes.bool
}

export default React.memo(AdvancedSplitPane)
