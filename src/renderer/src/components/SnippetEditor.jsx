// Edit snippets with autosave functionality - Clean live editing experience

import React, { useState, useEffect, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useDebounce } from 'use-debounce'
import { useTextEditor } from '../hook/useTextEditor'
import { useKeyboardShortcuts } from '../hook/useKeyboardShortcuts'
import useHighlight from '../hook/useHighlight'
import ViewToolbar from './ViewToolbar'

const SnippetEditor = ({ onSave, initialSnippet, onCancel, onNew }) => {
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
    if (isInitialMount.current) return
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

  // Markdown preview
  const renderMarkdown = (text) => {
    const esc = (t) =>
      t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
    let html = esc(text)
    html = html.replace(/^###\s?(.*)$/gm, '<h3>$1</h3>')
    html = html.replace(/^##\s?(.*)$/gm, '<h2>$1</h2>')
    html = html.replace(/^#\s?(.*)$/gm, '<h1>$1</h1>')
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
    html = html.replace(/\n/g, '<br/>')
    return html
  }
  const previewHtml = useMemo(() => renderMarkdown(code || ''), [code])
  const highlightedHtml = useHighlight(code || '', language)
  const showMarkdown = language === 'md' || language === 'markdown'
  const showCodePreview = !showMarkdown && language !== 'txt'
  const canPreview = showMarkdown || showCodePreview
  const [layoutMode, setLayoutMode] = useState('editor')
  const [previewPosition, setPreviewPosition] = useState('right')
  const [splitRatio, setSplitRatio] = useState(0.5)
  const containerRef = useRef(null)
  const previewRef = useRef(null)
  const resizingRef = useRef(false)
  const syncingRef = useRef(false)
  const dividerWidth = 6
  const [nameOpen, setNameOpen] = useState(false)
  const [nameInput, setNameInput] = useState('')

  useEffect(() => {
    if (!canPreview && layoutMode !== 'editor') {
      setLayoutMode('editor')
    }
  }, [canPreview, layoutMode])

  const handleEditorScroll = (e) => {
    if (!previewRef.current || syncingRef.current) return
    const max = e.target.scrollHeight - e.target.clientHeight
    const ratio = max > 0 ? e.target.scrollTop / max : 0
    const pMax = previewRef.current.scrollHeight - previewRef.current.clientHeight
    syncingRef.current = true
    previewRef.current.scrollTop = pMax > 0 ? ratio * pMax : 0
    syncingRef.current = false
  }

  const handlePreviewScroll = (e) => {
    if (!textareaRef.current || syncingRef.current) return
    const max = e.target.scrollHeight - e.target.clientHeight
    const ratio = max > 0 ? e.target.scrollTop / max : 0
    const tMax = textareaRef.current.scrollHeight - textareaRef.current.clientHeight
    syncingRef.current = true
    textareaRef.current.scrollTop = tMax > 0 ? ratio * tMax : 0
    syncingRef.current = false
  }

  const startResize = (ev) => {
    ev.preventDefault()
    resizingRef.current = true
    document.body.style.cursor = 'col-resize'
    const onMove = (ev) => {
      if (!resizingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      let leftFr = (ev.clientX - rect.left) / rect.width
      if (leftFr < 0.1) leftFr = 0.1
      if (leftFr > 0.9) leftFr = 0.9
      const r = previewPosition === 'left' ? leftFr : 1 - leftFr
      setSplitRatio(r)
    }
    const onUp = () => {
      resizingRef.current = false
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

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

  const handleSave = () => {
    let title = initialSnippet?.title || ''
    if (!title || title.toLowerCase() === 'untitled') {
      setNameInput('')
      setNameOpen(true)
      return
    }
    const hasExt = /\.[^\.\s]+$/.test(title)
    const extMap = {
      js: 'js',
      jsx: 'js',
      ts: 'js',
      py: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      sql: 'sql',
      cpp: 'cpp',
      h: 'cpp',
      java: 'java',
      sh: 'sh',
      md: 'md',
      txt: 'txt'
    }
    let lang = language
    if (hasExt) {
      const ext = title.split('.').pop().toLowerCase()
      lang = extMap[ext] || lang
    } else {
      lang = 'txt'
    }
    const payload = {
      id: initialSnippet?.id || Date.now().toString(),
      title,
      code: code,
      language: lang,
      timestamp: Date.now(),
      type: initialSnippet?.type || 'snippet'
    }
    onSave(payload)
  }

  return (
    <div className="h-full flex flex-col items-stretch bg-slate-50 dark:bg-[#0d1117] transition-colors duration-200 relative">
      <ViewToolbar
        onNew={onNew}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        previewPosition={previewPosition}
        setPreviewPosition={setPreviewPosition}
        resetSplit={() => setSplitRatio(0.5)}
      />
      {layoutMode === 'split' && (
        <div
          ref={containerRef}
          style={{
            display: 'grid',
            gridTemplateColumns:
              previewPosition === 'left'
                ? `${Math.round(splitRatio * 100)}% ${dividerWidth}px ${Math.round((1 - splitRatio) * 100)}%`
                : `${Math.round((1 - splitRatio) * 100)}% ${dividerWidth}px ${Math.round(splitRatio * 100)}%`,
            minHeight: 0,
            userSelect: resizingRef.current ? 'none' : 'auto',
            overflowY: 'hidden',
            alignItems: 'stretch'
          }}
          className="flex-1 min-h-0"
        >
          {previewPosition === 'left' ? (
            <div
              ref={previewRef}
              onScroll={handlePreviewScroll}
              className="h-full min-h-0 overflow-auto bg-transparent"
              style={{ maxHeight: '100%' }}
            >
              {showMarkdown ? (
                <div className="p-4">
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              ) : (
                <div className="p-4">
                  <pre className="text-xs font-mono leading-5 m-0">
                    <code
                      className="hljs block text-slate-700 dark:text-slate-300"
                      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                    />
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-0 overflow-auto" style={{ maxHeight: '100%' }}>
              <textarea
                key={`left-${layoutMode}-${previewPosition}`}
                placeholder="Type your snippets here..."
                value={code}
                ref={textareaRef}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleEditorScroll}
                className="w-full h-full overflow-y-auto text-slate-800 dark:text-white p-4 font-mono text-sm resize-none border-none outline-none focus:outline-none focus:ring-0 leading-relaxed tracking-normal transition-colors duration-200"
                style={{ backgroundColor: 'var(--color-background)' }}
                spellCheck="false"
                autoFocus
              />
            </div>
          )}

          {canPreview ? (
            <div
              onMouseDown={startResize}
              onDoubleClick={() => setSplitRatio(0.5)}
              style={{ width: `${dividerWidth}px` }}
              className="cursor-col-resize bg-slate-200 dark:bg-slate-700"
            />
          ) : null}

          {canPreview ? (
            previewPosition === 'right' ? (
              <div
                ref={previewRef}
                onScroll={handlePreviewScroll}
                className="h-full min-h-0 overflow-auto bg-transparent"
                style={{ maxHeight: '100%' }}
              >
                {showMarkdown ? (
                  <div className="p-4">
                    <div
                      className="prose prose-slate dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                ) : (
                  <div className="p-4">
                    <pre className="text-xs font-mono leading-5 m-0">
                      <code
                        className="hljs block text-slate-700 dark:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                      />
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-0 overflow-auto" style={{ maxHeight: '100%' }}>
                <textarea
                  key={`right-${layoutMode}-${previewPosition}`}
                  placeholder="Type your snippets here..."
                  value={code}
                  ref={textareaRef}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onScroll={handleEditorScroll}
                  className="w-full h-full overflow-y-auto text-slate-800 dark:text-white p-4 font-mono text-sm resize-none border-none outline-none focus:outline-none focus:ring-0 leading-relaxed tracking-normal transition-colors duration-200"
                  style={{ backgroundColor: 'var(--color-background)' }}
                  spellCheck="false"
                  autoFocus
                />
              </div>
            )
          ) : null}
        </div>
      )}

      {layoutMode === 'editor' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <textarea
            placeholder="Type your snippets here..."
            value={code}
            ref={textareaRef}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleEditorScroll}
            className="w-full h-full overflow-y-auto text-slate-800 dark:text-white p-4 font-mono text-sm resize-none border-none outline-none focus:outline-none focus:ring-0 leading-relaxed tracking-normal transition-colors duration-200"
            style={{ backgroundColor: 'var(--color-background)' }}
            spellCheck="false"
            autoFocus
          />
        </div>
      )}

      {layoutMode === 'preview' && canPreview && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div
            ref={previewRef}
            onScroll={handlePreviewScroll}
            className="h-full min-h-0 overflow-auto bg-transparent"
            style={{ maxHeight: '100%' }}
          >
            {showMarkdown ? (
              <div className="p-4">
                <div
                  className="prose prose-slate dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            ) : (
              <div className="p-4">
                <pre className="text-xs font-mono leading-5 m-0">
                  <code
                    className="hljs block text-slate-700 dark:text-slate-300"
                    dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                  />
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {!initialSnippet?.title && initialSnippet?.type !== 'project' && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded shadow-lg text-sm font-medium transition-colors"
          >
            Save
          </button>
        </div>
      )}

      {nameOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d] rounded p-4 w-80">
            <div className="text-sm mb-2 text-slate-700 dark:text-slate-200">
              Enter a name (optionally with extension)
            </div>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-[#30363d] rounded text-slate-800 dark:text-slate-200"
              placeholder="e.g. hello.js or notes"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setNameOpen(false)}
                className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const t = nameInput.trim()
                  if (!t) return
                  const hasExt = /\.[^\.\s]+$/.test(t)
                  const extMap = {
                    js: 'js',
                    jsx: 'js',
                    ts: 'js',
                    py: 'py',
                    html: 'html',
                    css: 'css',
                    json: 'json',
                    sql: 'sql',
                    cpp: 'cpp',
                    h: 'cpp',
                    java: 'java',
                    sh: 'sh',
                    md: 'md',
                    txt: 'txt'
                  }
                  let lang = language
                  if (hasExt) {
                    const ext = t.split('.').pop().toLowerCase()
                    lang = extMap[ext] || lang
                  } else {
                    lang = 'txt'
                  }
                  const payload = {
                    id: initialSnippet?.id || Date.now().toString(),
                    title: t,
                    code: code,
                    language: lang,
                    timestamp: Date.now(),
                    type: initialSnippet?.type || 'snippet'
                  }
                  setNameOpen(false)
                  onSave(payload)
                }}
                className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
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
