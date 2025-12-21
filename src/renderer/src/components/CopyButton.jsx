import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`
        p-1 transition-all duration-200
        ${
          copied
            ? 'text-emerald-400 bg-emerald-400/10'
            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
        }
      `}
      title={copied ? 'Copied!' : 'Copy code'}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

export default CopyButton
