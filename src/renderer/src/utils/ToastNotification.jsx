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
        // backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
        // border: '1px solid var(--border-color)',
      }}
    >
      {toast.message}
    </div>
  )
}

export default ToastNotification
