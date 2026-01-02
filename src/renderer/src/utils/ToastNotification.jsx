import React from 'react'
const ToastNotification = ({ toast }) => {
  // If toast is null, don't render anything
  if (!toast) return null
  // Apply dynamic classes based on the toast type
  return (
    <div
      className={`toast toast-base toast-${toast.type}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        zIndex: 1000,
        backgroundColor: 'var(--color-bg-secondary)',
        color: 'var(--color-text-primary)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      {toast.message}
    </div>
  )
}

export default ToastNotification
