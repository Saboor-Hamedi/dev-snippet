// Edit snippets with autosave functionality - Clean live editing experience

import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useDebounce } from 'use-debounce'
import { useTextEditor } from '../hook/useTextEditor'
import { useKeyboardShortcuts } from '../hook/useKeyboardShortcuts'

const SnippetEditor = ({ onSave, initialSnippet, onCancel }) => {
  const { code, setCode, textareaRef, handleKeyDown } = useTextEditor(initialSnippet?.code || '')
  const [language, setLanguage] = React.useState(initialSnippet?.language || 'txt')

  // Debounce the code value - wait 1000ms after user stops typing
  const [debouncedCode] = useDebounce(code, 1000)
  const [debouncedLanguage] = useDebounce(language, 1000)

  // Track if this is the initial mount to prevent autosave on first render
  const isInitialMount = useRef(true)
  const lastSnippetId = useRef(initialSnippet?.id)

  // Update language/code if initialSnippet changes (only on ID change to prevent autosave loops)
  React.useEffect(() => {
    if (initialSnippet && initialSnippet.id !== lastSnippetId.current) {
      setLanguage(initialSnippet.language)
      setCode(initialSnippet.code)
      lastSnippetId.current = initialSnippet.id
    }
  }, [initialSnippet?.id])

  // Auto-detect language based on code content
  React.useEffect(() => {
    const t = code || ''
    const has = (r) => r.test(t)
    let detected = 'txt'
    if (has(/^\s*<\w|<!DOCTYPE|<html[\s>]/i)) detected = 'html'
    else if (has(/\b(def|import\s+\w+|from\s+\w+|print\(|elif|except|with)\b/)) detected = 'py'
    else if (has(/\b(function|const|let|var|=>|console\.log|class\s+\w+)\b/)) detected = 'js'
    else if (has(/\{[\s\S]*\}|:\s*\w+;|@media|--[a-z-]+:/)) detected = 'css'
    else if (has(/\{\s*"|\[\s*\{|\}\s*\]/)) detected = 'json'
    else if (has(/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\b/i)) detected = 'sql'
    else if (has(/#include\s+<|std::|int\s+main\s*\(/)) detected = 'cpp'
    else if (has(/\bpublic\s+class\b|System\.out\.println|package\s+\w+/)) detected = 'java'
    else if (has(/^#!.*(bash|sh)|\becho\b|\bcd\b|\bfi\b/)) detected = 'sh'
    else if (has(/^(# |## |### |> |\* |\d+\. )/m)) detected = 'md'

    // Only switch language if we detected something specific (not txt)
    // This prevents flickering back to 'txt' while typing
    if (detected !== 'txt' && detected !== language) {
      setLanguage(detected)
    }
  }, [code, language])

  // Autosave effect - triggers when user stops typing
  useEffect(() => {
    // Skip autosave on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Only autosave if snippet has a title (project is created/named)
    if (!initialSnippet?.title) {
      return
    }

    // Construct the updated snippet
    const updatedSnippet = {
      id: initialSnippet.id,
      title: initialSnippet.title,
      code: debouncedCode,
      language: debouncedLanguage,
      timestamp: Date.now(),
      type: initialSnippet.type || 'snippet'
    }

    // Trigger autosave
    onSave(updatedSnippet)
  }, [debouncedCode, debouncedLanguage])

  // Handle keyboard shortcuts (only Escape now)
  useKeyboardShortcuts({
    onEscape: onCancel
  })

  // Manual save for new snippets (that don't have a title yet)
  const handleManualSave = () => {
    const title = initialSnippet?.title || 'Untitled'
    const newSnippet = {
      id: initialSnippet?.id || Date.now().toString(),
      title: title,
      code: code,
      language: language,
      timestamp: Date.now(),
      type: 'snippet'
    }
    onSave(newSnippet)
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#0f172a] transition-colors duration-200 relative">
      {/* Pure EDITOR AREA - No headers, no buttons, just code */}
      <textarea
        placeholder="Type your snippets here..."
        value={code}
        ref={textareaRef}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        className="
          w-full h-full
          bg-slate-50 dark:bg-[#0f172a]
          text-slate-800 dark:text-slate-300
          p-4
          font-mono text-sm

          /* REMOVE BORDERS & RINGS */
          resize-none
          border-none
          outline-none
          focus:outline-none
          focus:ring-0

          /* TYPOGRAPHY POLISH */
          leading-relaxed
          tracking-normal

          /* VISUAL FLINT */
          caret-primary-600 dark:caret-primary-400
          selection:bg-primary-200 dark:selection:bg-primary-900/50

          transition-colors duration-200
        "
        spellCheck="false"
        autoFocus
      />

      {/* Show Save button ONLY for new snippets (no title) */}
      {!initialSnippet?.title && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={handleManualSave}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded shadow-lg text-sm font-medium transition-colors"
          >
            Save Snippet
          </button>
        </div>
      )}
    </div>
  )
}

SnippetEditor.propTypes = {
  onSave: PropTypes.func.isRequired,
  initialSnippet: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    code: PropTypes.string,
    language: PropTypes.string,
    timestamp: PropTypes.number
  }),
  onCancel: PropTypes.func
}

export default SnippetEditor
