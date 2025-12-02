import React, { useRef, useEffect, useState } from 'react'

const SplitPane = ({ left, right, minLeft = 200, minRight = 200, initialLeft = 50 }) => {
  const containerRef = useRef(null)
  const [leftPercent, setLeftPercent] = useState(initialLeft)
  const draggingRef = useRef(false)

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const minLeftPx = Math.max(minLeft, 0)
      const minRightPx = Math.max(minRight, 0)
      const clampedX = Math.min(Math.max(x, minLeftPx), rect.width - minRightPx)
      const pct = (clampedX / rect.width) * 100
      setLeftPercent(Math.min(90, Math.max(10, pct)))
    }
    const onMouseUp = () => {
      draggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const startDrag = () => {
    draggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full overflow-hidden "
      style={{ backgroundColor: 'var(--editor-bg)' }}
    >
      <div
        className="min-h-0 overflow-auto"
        style={{ width: `${leftPercent}%` }}
      >
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={startDrag}
        className="shrink-0"
        style={{
          width: 6,
          cursor: 'col-resize',
          backgroundColor: 'var(--border-color)'
        }}
      />
      <div className="min-h-0 overflow-auto" style={{ width: `${100 - leftPercent}%` }}>
        {right}
      </div>
    </div>
  )
}

export default SplitPane

