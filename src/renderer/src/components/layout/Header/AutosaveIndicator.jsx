import React, { useState, useEffect } from 'react'

const AutosaveIndicator = ({ status, noBorder = false }) => {
  const [localStatus, setLocalStatus] = useState(status)

  useEffect(() => {
    setLocalStatus(status)
  }, [status])

  useEffect(() => {
    const handleStatus = (e) => {
      setLocalStatus(e.detail?.status)
    }
    window.addEventListener('autosave-status', handleStatus)
    return () => window.removeEventListener('autosave-status', handleStatus)
  }, [])

  // Auto-hide "Saved" after 3 seconds for a smoother feel
  useEffect(() => {
    if (localStatus === 'saved') {
      const timer = setTimeout(() => {
        setLocalStatus(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [localStatus])

  if (!localStatus) return null

  return (
    <div
      className="flex items-center ml-2 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 transition-all duration-500 animate-in fade-in slide-in-from-right-2"
      style={{
        minWidth: '70px',
        justifyContent: 'center',
        gap: '6px'
      }}
    >
      {(localStatus === 'saving' || localStatus === 'pending') && (
        <svg
          className="animate-spin h-2.5 w-2.5 text-blue-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {localStatus === 'saved' && (
        <svg
          size={10}
          className="text-green-400"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      )}
      <span className="whitespace-nowrap opacity-80 text-[9px] font-bold tracking-tight uppercase">
        {localStatus === 'pending' && 'Waiting'}
        {localStatus === 'saving' && 'Saving'}
        {localStatus === 'saved' && 'Saved'}
        {localStatus === 'error' && <span className="text-red-400 font-black">Error</span>}
      </span>
    </div>
  )
}

export default AutosaveIndicator
