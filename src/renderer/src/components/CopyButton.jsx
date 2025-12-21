// components/CopyButton.tsx
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="relative flex h-8 w-20 items-center 
                    justify-center overflow-hidden rounded-md
                 bg-white/10 text-gray-300 transition-all duration-200
                 hover:bg-white/20 active:scale-95"
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
    >
      {/* "Copy" state */}
      <span
        className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-300
        ${copied ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}
      >
        <Copy size={14} />
        Copy
      </span>

      {/* "Copied!" state */}
      <span
        className={`absolute flex items-center gap-1.5 text-xs font-medium text-green-300 transition-all duration-300
        ${copied ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      >
        <Check size={14} />
        Copied!
      </span>
    </button>
  )
}
