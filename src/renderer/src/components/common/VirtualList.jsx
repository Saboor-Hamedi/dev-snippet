import React from 'react'
import PropTypes from 'prop-types'

/**
 * Custom Virtual List Component
 * Renders only visible items for performance optimization
 * Avoids bundler/CJS issues with react-window
 */
const VirtualList = React.forwardRef(
  ({ height, width, itemCount, itemSize, itemData, children: Row, overscan = 2 }, ref) => {
    const containerRef = React.useRef(null)
    const [scrollTop, setScrollTop] = React.useState(0)

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
          // Else: Item is fully visible, do nothing
        }
      }
    }))

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
            height: itemSize
          }}
          data={itemData}
        />
      )
    }

    return (
      <div
        ref={containerRef}
        style={{ height, width, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className="custom-scrollbar"
      >
        <div style={{ height: itemCount * itemSize, width: '100%' }}>{items}</div>
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
