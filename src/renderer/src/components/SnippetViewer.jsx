import React from 'react'
import useSyntaxHighlight from '../hook/useSyntaxHighlight'

const SnippetViewer = ({ snippet, onClose }) => {
  const highlightedContent = useSyntaxHighlight(snippet?.code || '', snippet?.language || 'text')

  if (!snippet) return null

  const isCode = snippet.language !== 'text'

  // Copy to clipboard logic
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Split code into lines for line numbers
  const codeLines = snippet.code.split('\n')

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* HEADER / TOOLBAR - Aligned with grid header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all"
            title="Close (Esc)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="h-6 w-px bg-slate-700"></div>

          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-primary-600/20 text-primary-400 text-xs font-semibold rounded border border-primary-600/30">
              {snippet.language.toUpperCase()}
            </span>
            <span className="text-sm font-medium text-white">{snippet.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{codeLines.length} lines</span>
          <span className="text-xs text-slate-600">•</span>
          <span className="text-xs text-slate-500">
            {new Date(snippet.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>

          <div className="h-6 w-px bg-slate-700 mx-2"></div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-md text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy
          </button>
        </div>
      </div>

      {/* CODE VIEW AREA with line numbers */}
      <div className="flex-1 overflow-auto bg-slate-950">
        {isCode ? (
          <div className="flex min-h-full">
            {/* Line Numbers */}
            <div className="flex-shrink-0 bg-slate-900 border-r border-slate-800 px-4 py-6 select-none">
              <div className="font-mono text-xs leading-6 text-slate-600 text-right">
                {codeLines.map((_, index) => (
                  <div key={index} className="h-6">
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 px-6 py-6">
              <pre className="font-mono text-sm leading-6 text-slate-200">
                <code>{highlightedContent}</code>
              </pre>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-base leading-7 text-slate-300">
                {snippet.code}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SnippetViewer
