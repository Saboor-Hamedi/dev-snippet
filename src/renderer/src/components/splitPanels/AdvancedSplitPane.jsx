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
          <div className="absolute inset-0 w-full h-full">{left}</div>
          {!rightHidden && (
            <div
              className="absolute top-2 right-5 bottom-2 z-10 flex flex-col overflow-hidden shadow-xl"
              style={{
                width: `${overlayWidth}%`,
                minWidth: `${minRight}px`,
                maxWidth: '90%',
                backgroundColor: bgColor,
                border: `${borderWidth}px solid ${borderColor || 'rgba(0,0,0,0.06)'}`,
                borderRadius: `${borderRound}px`
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/20 transition-colors flex items-center justify-center z-20 group"
                onMouseDown={startDrag}
              >
                <div className="w-1 h-8 bg-slate-400 dark:bg-slate-500 rounded-full opacity-30 group-hover:opacity-100 transition-opacity"></div>
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
          <div className="shrink-0 relative flex items-center justify-center w-1 z-50">
            <div
              className="absolute top-0 bottom-0 w-4 -left-1.5 cursor-col-resize z-10"
              onMouseDown={startDrag}
            />
            <div
              className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] transition-colors pointer-events-none ${isDragging ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            />
            <div
              className="relative z-20 w-4 h-8 flex items-center justify-center bg-slate-800/90 hover:bg-slate-800 transition-all duration-200 rounded-sm select-none border border-white/5 shadow-md pointer-events-none"
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
