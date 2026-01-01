import React, { useRef, useEffect, useState } from 'react'
import { GripVertical } from 'lucide-react'

// SplitPane: left/right resizable panes with optional collapsing of the
// right pane. Preserves previous split percent when hidden and restores it
// when shown. Uses requestAnimationFrame for drag smoothing and a small
// animated transition when collapsing/restoring.

const SplitPane = ({
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
  const [leftPercent, setLeftPercent] = useState(initialLeft)
  // Delay removing right pane from DOM until collapse animation completes
  const [renderRight, setRenderRight] = useState(!rightHidden)
  const prevLeftRef = useRef(initialLeft)
  const draggingRef = useRef(false)
  const rafRef = useRef(null)

  const cancelPendingRaf = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const animatePercent = (fromPct, toPct, duration = 200, onComplete) => {
    cancelPendingRaf()
    const start = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = fromPct + (toPct - fromPct) * eased
      setLeftPercent(Math.min(99.99, Math.max(0, current)))
      if (t < 1) rafRef.current = requestAnimationFrame(step)
      else {
        rafRef.current = null
        try {
          if (typeof onComplete === 'function') onComplete()
        } catch {}
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const userSplitRef = useRef(initialLeft)
  const isAnimatingRef = useRef(false)
  const lastToggleTimeRef = useRef(0)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingRef.current || !containerRef.current) return

      e.preventDefault()
      e.stopPropagation()

      const rect = containerRef.current.getBoundingClientRect()

      if (overlayMode) {
        // In overlay mode, adjust the width of the floating panel from the right edge
        const x = e.clientX - rect.left
        const rightWidth = rect.width - x
        const rightPercent = Math.max(20, Math.min(80, (rightWidth / rect.width) * 100))
        const newLeftPercent = 100 - rightPercent

        setLeftPercent(newLeftPercent)
        userSplitRef.current = newLeftPercent
      } else {
        // Standard side-by-side mode
        const x = e.clientX - rect.left
        const minLeftPx = Math.max(minLeft, 0)
        const minRightPx = Math.max(minRight, 0)
        const clampedX = Math.min(Math.max(x, minLeftPx), rect.width - minRightPx)
        const newPercent = Math.max(10, Math.min(90, (clampedX / rect.width) * 100))

        setLeftPercent(newPercent)
        userSplitRef.current = newPercent
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
  }, [minLeft, minRight])

  const handleMouseDown = (e) => {
    e.preventDefault()
    draggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    try {
      // Debounce rapid toggles (prevent toggling faster than 300ms)
      const now = Date.now()
      if (now - lastToggleTimeRef.current < 300) {
        return
      }
      lastToggleTimeRef.current = now

      // Prevent new animations if one is already running
      if (isAnimatingRef.current) {
        cancelPendingRaf()
      }

      if (rightHidden) {
        // Hide: animate from current position to 100%
        isAnimatingRef.current = true
        animatePercent(leftPercent, 100, 200, () => {
          setRenderRight(false)
          isAnimatingRef.current = false
        })
      } else {
        // Show: restore to last user-selected split
        const target = userSplitRef.current || initialLeft
        setRenderRight(true)
        isAnimatingRef.current = true
        // Start animation from current leftPercent (which should be 100 or close to it)
        animatePercent(leftPercent, target, 200, () => {
          isAnimatingRef.current = false
        })
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightHidden])

  if (!renderRight) {
    return (
      <div
        ref={containerRef}
        className="flex h-full w-full overflow-hidden "
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
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden"
        style={{ backgroundColor: 'var(--editor-bg)' }}
      >
        {/* Full-width editor (left pane) */}
        <div className="absolute inset-0 w-full h-full">{left}</div>

        {/* Floating LivePreview overlay (right pane) */}
        {!rightHidden && (
          <div
            className="absolute top-4 right-4 bottom-4 bg-white dark:bg-slate-800 
                       border border-slate-200 dark:border-slate-700 rounded-lg
                       shadow-md overflow-hidden"
            style={{
              width: `${100 - leftPercent}%`,
              minWidth: `${minRight}px`,
              maxWidth: '80%'
            }}
          >
            {/* Resize handle */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/20 transition-colors flex items-center justify-center"
              onMouseDown={startDrag}
            >
              <div className="w-1 h-8 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
            </div>

            {/* Content with padding for resize handle */}
            <div className="h-full ml-2 overflow-auto">{right}</div>
          </div>
        )}
      </div>
    )
  }

  // Standard side-by-side mode
  return (
    // Main Container for Live Preview and Editor
    <div
      ref={containerRef}
      className={`flex h-full w-full  ${unifiedScroll ? 'overflow-auto' : 'overflow-hidden'}`}
      style={{ backgroundColor: 'var(--editor-bg)' }}
    >
      <div
        className={`min-h-0 ${unifiedScroll ? 'overflow-visible' : 'overflow-auto'}`}
        style={{ width: `${leftPercent}%` }}
      >
        {left}
      </div>
      {/* This is the knob of the splitPane - VS Code style */}
      <div className="shrink-0 relative flex items-center justify-center group">
        {/* Invisible hit area for easier grabbing */}
        <div
          className="absolute inset-y-0 -inset-x-2 cursor-col-resize"
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          style={{
            userSelect: 'none',
            touchAction: 'none',
            WebkitUserSelect: 'none',
            msUserSelect: 'none',
            MozUserSelect: 'none'
          }}
        />

        {/* Visual separator line */}
        <div
          className="w-[1px] h-full bg-slate-300 dark:bg-slate-700 
                     group-hover:bg-blue-500 dark:group-hover:bg-blue-400
                     transition-colors duration-150"
          role="separator"
          aria-orientation="vertical"
        />

        {/* Grip indicator - shows on hover */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                     w-3 h-6 flex items-center justify-center
                     bg-slate-200 dark:bg-slate-800
                     border border-slate-300 dark:border-slate-700
                     rounded opacity-0 group-hover:opacity-100
                     transition-opacity duration-150 pointer-events-none"
        >
          <GripVertical className="text-slate-500 dark:text-slate-400" size={12} />
        </div>
      </div>
      <div className="min-h-0 overflow-auto" style={{ width: `${100 - leftPercent}%` }}>
        {/* Display the LivePreview  */}
        {right}
      </div>
    </div>
  )
}
export default SplitPane
