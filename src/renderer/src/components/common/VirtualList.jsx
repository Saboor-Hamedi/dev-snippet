import React from 'react'
import PropTypes from 'prop-types'

/**
 * Custom Virtual List Component
 * Renders only visible items for performance optimization
 * Avoids bundler/CJS issues with react-window
 */
const VirtualList = React.forwardRef(
  ({ height, width, itemCount, itemSize, itemData, children: Row, overscan = 10 }, ref) => {
    const containerRef = React.useRef(null)
    const [scrollTop, setScrollTop] = React.useState(0)
    const frameId = React.useRef(null)

    React.useImperativeHandle(ref, () => ({
      scrollToItem: (index) => {
        if (containerRef.current) {
          const itemTop = index * itemSize
          const itemBottom = itemTop + itemSize
          // Current view bounds
          const viewTop = containerRef.current.scrollTop
          const viewBottom = viewTop + height

          // Scroll Logic: "Scroll Into View"
          if (itemTop < viewTop) {
            // Item is above view -> align to top
            containerRef.current.scrollTop = itemTop
            setScrollTop(itemTop)
          } else if (itemBottom > viewBottom) {
            // Item is below view -> align to bottom
            containerRef.current.scrollTop = itemBottom - height
            setScrollTop(itemBottom - height)
          }
        }
      }
    }))

    const handleScroll = (e) => {
      const { scrollTop: newScrollTop } = e.currentTarget

      // --- BLAZE OPTIMIZATION: RequestAnimationFrame ---
      // Instead of updating state on every scroll event (which can fire 100s of times/sec),
      // we sync the update with the browser's paint cycle. This eliminates "white flickering"
      // during high-speed flick-scrolling.
      if (frameId.current) cancelAnimationFrame(frameId.current)

      frameId.current = requestAnimationFrame(() => {
        setScrollTop(newScrollTop)
      })
    }

    React.useEffect(() => {
      return () => {
        if (frameId.current) cancelAnimationFrame(frameId.current)
      }
    }, [])

    const visibleCount = Math.ceil(height / itemSize)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemSize) - overscan)
    const endIndex = Math.min(itemCount - 1, startIndex + visibleCount + overscan * 2)

    const items = []
    for (let i = startIndex; i <= endIndex; i++) {
      items.push(
        <Row
          key={i}
          index={i}
          style={{
            position: 'absolute',
            top: i * itemSize,
            left: 0,
            width: '100%',
            height: itemSize,
            willChange: 'transform',
            transform: 'translateZ(0)'
          }}
          data={itemData}
        />
      )
    }

    return (
      <div
        ref={containerRef}
        style={{ height, width, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}
        onScroll={handleScroll}
        className="custom-scrollbar virtual-list-container"
      >
        <div
          className="virtual-list-inner"
          style={{
            height: itemCount * itemSize + itemSize, // Space for exactly one item at the bottom
            width: '100%',
            cursor: 'default'
          }}
          onClick={(e) => {
            // If clicking directly on the spacer/inner container (not on a row)
            if (e.target === e.currentTarget) {
              if (itemData.handleBackgroundClick) {
                itemData.handleBackgroundClick(e)
              }
            }
          }}
        >
          {items}
        </div>
      </div>
    )
  }
)

VirtualList.displayName = 'VirtualList'

VirtualList.propTypes = {
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  itemCount: PropTypes.number.isRequired,
  itemSize: PropTypes.number.isRequired,
  itemData: PropTypes.object.isRequired,
  children: PropTypes.elementType.isRequired,
  overscan: PropTypes.number
}

export default VirtualList
