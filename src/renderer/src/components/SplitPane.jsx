import React, { useRef, useEffect, useState } from 'react'

// SplitPane: left/right resizable panes with optional collapsing of the
// right pane. Preserves previous split percent when hidden and restores it
// when shown. Uses requestAnimationFrame for drag smoothing and a small
// animated transition when collapsing/restoring.

const SplitPane = ({ left, right, minLeft = 200, minRight = 200, initialLeft = 50, rightHidden = false }) => {
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
    const scheduleUpdate = (pct) => {
      cancelPendingRaf()
      rafRef.current = requestAnimationFrame(() => {
        setLeftPercent(Math.min(90, Math.max(10, pct)))
      })
    }

    const onPointerMove = (e) => {
      if (!draggingRef.current || !containerRef.current) return
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const rect = containerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const minLeftPx = Math.max(minLeft, 0)
      const minRightPx = Math.max(minRight, 0)
      const clampedX = Math.min(Math.max(x, minLeftPx), rect.width - minRightPx)
      const pct = (clampedX / rect.width) * 100
      
      // Update user preference
      userSplitRef.current = pct
      
      scheduleUpdate(pct)
      try {
        e.preventDefault()
      } catch {}
    }

    const onPointerUp = () => {
      draggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.webkitUserSelect = ''
      try {
        if (containerRef.current && containerRef.current.children && containerRef.current.children[2]) {
          containerRef.current.children[2].style.pointerEvents = ''
          containerRef.current.children[2].style.userSelect = ''
        }
      } catch {}
      cancelPendingRaf()
    }

    window.addEventListener('mousemove', onPointerMove, { passive: false })
    window.addEventListener('touchmove', onPointerMove, { passive: false })
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('touchend', onPointerUp)
    window.addEventListener('touchcancel', onPointerUp)

    return () => {
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('touchmove', onPointerMove)
      window.removeEventListener('mouseup', onPointerUp)
      window.removeEventListener('touchend', onPointerUp)
      window.removeEventListener('touchcancel', onPointerUp)
      cancelPendingRaf()
    }
  }, [minLeft, minRight])

  const startDrag = (e) => {
    try {
      if (e && typeof e.preventDefault === 'function') e.preventDefault()
    } catch {}
    draggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'
    document.body.style.touchAction = 'none'
    try {
      if (containerRef.current && containerRef.current.children && containerRef.current.children[2]) {
        containerRef.current.children[2].style.pointerEvents = 'none'
        containerRef.current.children[2].style.userSelect = 'none'
        containerRef.current.children[2].style.webkitUserSelect = 'none'
      }
    } catch {}
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
      <div ref={containerRef} className="flex h-full w-full overflow-hidden " style={{ backgroundColor: 'var(--editor-bg)' }}>
        <div className="min-h-0 overflow-auto" style={{ width: '100%' }}>
          {left}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full overflow-hidden bg-red-400"
      style={{ backgroundColor: 'var(--editor-bg)' }}
    >
      <div className="min-h-0 overflow-auto" style={{ width: `${leftPercent}%` }}>
        {left}
      </div>
      {/* This is the knob of the splitPane */}
      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className="shrink-0 "
        style={{
          width: 5,
          cursor: 'col-resize',
          backgroundColor: 'var(--border-color)',
          userSelect: 'none',
          touchAction: 'none'
        }}
      />
      <div className="min-h-0 overflow-auto" style={{ width: `${100 - leftPercent}%` }}>
        {right}
      </div>
    </div>
  )
}
export default SplitPane

