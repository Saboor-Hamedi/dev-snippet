import React from 'react'
import PropTypes from 'prop-types'

/**
 * Pagination Component - Inspired by Laravel's pagination
 * Displays Previous, page numbers, Next with ellipsis for large page counts
 */
const Pagination = ({ currentPage, totalPages, onPageChange, className = '' }) => {
  // Temporarily remove condition to force show for testing
  // if (totalPages <= 1) return null

  const generatePages = () => {
    const pages = []
    const delta = 1 // Number of pages to show around current page

    // Always show first page
    if (1 < currentPage - delta) {
      pages.push(1)
      if (2 < currentPage - delta) {
        pages.push('...')
      }
    }

    // Show pages around current
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i)
    }

    // Always show last page
    if (totalPages > currentPage + delta) {
      if (totalPages - 1 > currentPage + delta) {
        pages.push('...')
      }
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className={`flex items-center justify-between p-2 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onPageChange(currentPage - 1)
        }}
        disabled={currentPage === 1}
        className="px-3 py-1 text-xs hover:bg-white/5 disabled:cursor-not-allowed rounded transition-colors"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--sidebar-text)',
          opacity: currentPage === 1 ? 0.5 : 1
        }}
      >
        Previous
      </button>

      {/* Page Info */}
      <span className="px-3 py-1 text-xs text-gray-400">
        {currentPage} of {totalPages}
      </span>

      {/* Next Button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onPageChange(currentPage + 1)
        }}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-xs hover:bg-white/5 disabled:cursor-not-allowed rounded transition-colors"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--sidebar-text)',
          opacity: currentPage === totalPages ? 0.5 : 1
        }}
      >
        Next
      </button>
    </div>
  )
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  className: PropTypes.string
}

export default Pagination