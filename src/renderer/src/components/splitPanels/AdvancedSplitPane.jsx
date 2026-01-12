import React, { useRef, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { GripVertical, Smartphone, Tablet, Monitor } from 'lucide-react'
import useAdvancedSplitPane from './useAdvancedSplitPane.js'
import { SplitPaneContext } from './SplitPaneContext'

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

  const { bgColor, borderWidth, borderColor, borderRound } = useAdvancedSplitPane()

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--bg-color', bgColor)
      containerRef.current.style.setProperty('--border-width', `${borderWidth}px`)
      containerRef.current.style.setProperty('--border-color', borderColor)
      containerRef.current.style.setProperty('--border-round', `${borderRound}px`)
    }
  }, [bgColor, borderWidth, borderColor, borderRound, containerRef])

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
      const rect = containerRef.current.getBoundingClientRect()

      if (overlayMode) {
        const x = e.clientX - rect.left
        const rightEdge = rect.width - x
        const newOverlayWidth = Math.max(15, Math.min(90, (rightEdge / rect.width) * 100))
        setOverlayWidth(newOverlayWidth)
        localStorage.setItem('overlayWidth', newOverlayWidth)
      } else {
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

    document.addEventListener('mousemove', handleMouseMove)
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

  useEffect(() => {
    if (overlayMode) {
      const savedOverlayWidth = parseFloat(localStorage.getItem('overlayWidth')) || 40
      setOverlayWidth(savedOverlayWidth)
    } else {
      const savedSideBySideLeft = parseFloat(localStorage.getItem('sideBySideLeft')) || initialLeft
      setSideBySideLeft(savedSideBySideLeft)
    }
  }, [overlayMode, initialLeft])

  const contextValue = React.useMemo(
    () => ({ overlayMode, overlayWidth, setOverlayWidth }),
    [overlayMode, overlayWidth]
  )

  const handleDoubleClick = () => {
    if (overlayMode) {
      setOverlayWidth(40)
      localStorage.setItem('overlayWidth', 40)
    } else {
      setSideBySideLeft(initialLeft)
      localStorage.setItem('sideBySideLeft', initialLeft)
    }
  }

  // Device Presets
  const setPreset = (percent) => {
    setOverlayWidth(percent)
    localStorage.setItem('overlayWidth', percent)
  }

  return (
    <SplitPaneContext.Provider value={contextValue}>
      {rightHidden ? (
        <div ref={containerRef} className="flex h-full w-full overflow-hidden">
          <div className="flex-1 min-h-0 h-full overflow-hidden" style={{ width: '100%' }}>
            {left}
          </div>
        </div>
      ) : overlayMode ? (
        <div ref={containerRef} className="relative h-full w-full overflow-hidden">
          <div className="absolute inset-0 w-full h-full z-0">{left}</div>
          {!rightHidden && (
            <div
              className="absolute top-4 right-5 bottom-6 z-40 flex flex-col overflow-hidden transition-all duration-300 ease-out"
              style={{
                width: `${overlayWidth}%`,
                minWidth: `${minRight}px`,
                maxWidth: '92%',
                backgroundColor: bgColor,
                border: `${borderWidth}px solid ${borderColor || 'rgba(255,255,255,0.1)'}`,
                borderRadius: `${borderRound}px`
              }}
            >
              {/* Overlay Toolbar & Resizer */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/30 transition-colors z-50 group flex items-center justify-center"
                onMouseDown={startDrag}
                onDoubleClick={handleDoubleClick}
              >
                <div className="w-0.5 h-12 bg-white/20 rounded-full group-hover:bg-blue-400 transition-colors" />
              </div>


              <div
                className={`flex-1 overflow-auto relative ${isDragging ? 'pointer-events-none' : ''}`}
              >
                {right}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          ref={containerRef}
          className={`flex h-full w-full ${unifiedScroll ? 'overflow-auto' : 'overflow-hidden'}`}
        >
          <div
            className={`min-h-0 h-full overflow-auto ${isDragging ? 'pointer-events-none' : ''}`}
            style={{ width: `${sideBySideLeft}%`, flex: '0 0 auto', position: 'relative' }}
          >
            {left}
          </div>
          <div className="shrink-0 relative flex items-center justify-center w-1 z-20">
            <div
              className="absolute top-0 bottom-0 w-5 -left-2.5 cursor-col-resize z-20"
              onMouseDown={startDrag}
              onDoubleClick={handleDoubleClick}
            />
            <div
              className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] transition-colors pointer-events-none ${isDragging ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            />
              <div
                className="relative z-10 w-4 h-8 flex items-center justify-center bg-slate-800/90 hover:bg-slate-800 transition-all duration-200 rounded-sm select-none border border-white/5 shadow-md pointer-events-none"
              role="separator"
              aria-orientation="vertical"
            >
              <GripVertical className="text-slate-400" size={12} />
            </div>
          </div>
          <div
            className={`flex-1 min-h-0 h-full overflow-auto ${isDragging ? 'pointer-events-none' : ''}`}
            style={{ minWidth: 0 }}
          >
            {right}
          </div>
        </div>
      )}
    </SplitPaneContext.Provider>
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
