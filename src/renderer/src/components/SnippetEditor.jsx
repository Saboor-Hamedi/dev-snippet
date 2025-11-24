import React, { useState } from 'react'

const SnippetEditor = ({ onSave }) => {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validation
    if (!code.trim()) return

    // Auto-generate title based on the first line of code
    const codePreview = code.trim().substring(0, 30)
    const title = `Snippet: ${codePreview}${code.length > 30 ? '...' : ''}`

    // Construct the object
    const newSnippet = {
      id: Date.now().toString(),
      title: title,
      code: code,
      language: language,
      timestamp: Date.now(),
      type: 'snippet'
    }

    // Send it back to the parent
    onSave(newSnippet)

    // Reset form
    setCode('')
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        {/* EDITOR AREA */}
        <div className="flex-1 relative">
          <textarea
            placeholder="// Start typing your code here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full bg-[#0f172a] text-slate-300 p-6 font-mono text-sm resize-none focus:outline-none focus:ring-inset focus:ring-1 focus:ring-slate-700"
            spellCheck="false"
            autoFocus
          />
        </div>

        {/* TOOLBAR / FOOTER */}
        <div className="border-t border-slate-700 p-4 bg-slate-800/50 flex items-center justify-between backdrop-blur-sm">
          {/* Left: Language Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Language:
            </span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-slate-500 transition-colors"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="bash">Bash / Shell</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
              <option value="sql">SQL</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="plaintext">Plain Text</option>
            </select>
          </div>

          {/* Right: Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCode('')}
              className="px-4 py-1.5 text-sm text-slate-400 hover:text-white transition-colors hover:bg-slate-700/50 rounded"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={!code.trim()}
              className="px-6 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-md text-sm font-medium transition-all shadow-lg shadow-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Save Snippet
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default SnippetEditor
