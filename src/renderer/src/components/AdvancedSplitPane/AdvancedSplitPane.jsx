import { useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { GripVertical } from 'lucide-react'
import useAdvancedSplitPane from './useAdvacedSplitPane.js'

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

  if (rightHidden) {
    return (
      <div
        ref={containerRef}
        className="flex h-full w-full overflow-hidden"
        style={{ backgroundColor: 'var(--editor-bg)' }}
      >
        <div className="min-h-0 overflow-auto" style={{ width: '100%' }}>
          {left}
        </div>
      </div>
    )
  }

  // Overlay mode: LivePreview floats over editor
  if (overlayMode) {
    return (
      // This is the live preview overlay mode
      <div ref={containerRef} className="relative h-full w-full overflow-hidden">
        {/* Full-width editor */}
        <div className="absolute inset-0 w-full h-full">{left}</div>

        {/* Floating preview */}
        {!rightHidden && (
          <>
            {/* Preset buttons */}
            <div className="absolute top-2 right-2 flex gap-1 z-20 ">
              <button
                onClick={() => {
                  setOverlayWidth(25)
                  localStorage.setItem('overlayWidth', 25)
                }}
                className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 
                text-white rounded transition-colors"
              >
                25%
              </button>
              <button
                onClick={() => {
                  setOverlayWidth(50)
                  localStorage.setItem('overlayWidth', 50)
                }}
                className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 
                text-white rounded transition-colors"
              >
                50%
              </button>
              <button
                onClick={() => {
                  setOverlayWidth(75)
                  localStorage.setItem('overlayWidth', 75)
                }}
                className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
              >
                75%
              </button>
            </div>

            {/* Floating panel  change the size and the margin from here*/}
            <div
              className="absolute top-2 right-5 bottom-2 
                         shadow-lg  z-10 overflow-x-auto"
              style={{
                width: `${overlayWidth}%`,
                minWidth: `${minRight}px`,
                maxWidth: '90%',
                backgroundColor: bgColor,
                border: `${borderWidth}px solid ${borderColor || 'rgba(0,0,0,0.06)'}`,
                // borderColor: borderColor || 'rgba(0,0,0,0.06)',
                borderRadius: `${borderRound}px`
                // borderStyle: 'solid'
              }}
            >
              {/* Resize handle */}
              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize
                 hover:bg-blue-500/20 transition-colors flex items-center justify-center"
                onMouseDown={startDrag}
              >
                <div className="w-1 h-8 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
              </div>

              {/* Content */}
              <div className="h-full ml-2 overflow-auto">{right}</div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Standard side-by-side mode
  return (
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
          className="w-8 h-12 flex items-center justify-center 
             bg-slate-700/50 hover:bg-slate-600/70 
             transition-all duration-200 
             rounded-md p-2 cursor-col-resize select-none"
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
            className="text-slate-600 dark:text-slate-300 pointer-events-none"
            size={16}
          />
        </div>
      </div>

      <div className="min-h-0 overflow-auto" style={{ width: `${100 - sideBySideLeft}%` }}>
        {right}
      </div>
    </div>
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

export default AdvancedSplitPane
