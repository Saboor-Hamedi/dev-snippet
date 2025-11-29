// Edit snippets with autosave functionality - Clean live editing experience
import React, { useState, useEffect, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useDebounce, useDebouncedCallback } from 'use-debounce'
import { useKeyboardShortcuts } from '../hook/useKeyboardShortcuts'
import useHighlight from '../hook/useHighlight'
import MarkdownPreview from './MarkdownPreview.jsx'
import ViewToolbar from './ViewToolbar'
import WelcomePage from './WelcomePage'
import StatusBar from './StatusBar.jsx'
import Editor from 'react-simple-code-editor'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import php from 'highlight.js/lib/languages/php'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('java', java)
hljs.registerLanguage('php', php)

const SnippetEditor = ({
  onSave,
  initialSnippet,
  onCancel,
  onNew,
  onDelete,
  onNewProject,
  isCreateMode,
  activeView,
  snippets,
  projects,
  onSnippetMentionClick
}) => {
  const [code, setCode] = useState(initialSnippet?.code || '')
  const textareaRef = useRef(null) // Keep ref for compatibility if needed, though Editor manages its own
  const [language, setLanguage] = React.useState(initialSnippet?.language || 'txt')

  // Debounce the code value - wait 1000ms after user stops typing
  const [debouncedCode] = useDebounce(code, 1000)
  const [debouncedLanguage] = useDebounce(language, 1000)
  const [debouncedPreviewCode] = useDebounce(code, 400)
  const isDeletingRef = useRef(false)

  const debouncedSave = useDebouncedCallback(() => {
    const id = initialSnippet?.id
    if (!id) return
    if (isDeletingRef.current) return
    if (window.__deletedIds && window.__deletedIds.has(id)) return
    // Guard: skip autosave for drafts without title
    if (initialSnippet?.is_draft && (!initialSnippet?.title || !initialSnippet.title.trim())) return
    const updatedSnippet = {
      id: id,
      title: initialSnippet.title,
      code: code,
      language: language,
      timestamp: Date.now(),
      type: initialSnippet.type || 'snippet',
      tags: extractTags(code)
    }
    onSave(updatedSnippet)
  }, 1000)

  useEffect(() => {
    // Register canceler globally keyed by snippet id
    const id = initialSnippet?.id
    if (id) {
      if (!window.__autosaveCancel) window.__autosaveCancel = new Map()
      window.__autosaveCancel.set(id, debouncedSave.cancel)
    }
    return () => {
      const id2 = initialSnippet?.id
      try {
        debouncedSave.cancel()
        if (id2 && window.__autosaveCancel) window.__autosaveCancel.delete(id2)
      } catch {}
    }
  }, [initialSnippet?.id])

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
    else if (has(/<\?php|<\?=|\$\w+|->|::/)) detected = 'php'
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
  const [previewSelectionLocked, setPreviewSelectionLocked] = useState(false)
  const [lockedPreviewCode, setLockedPreviewCode] = useState(initialSnippet?.code || '')
  useEffect(() => {
    if (!previewSelectionLocked) {
      setLockedPreviewCode(debouncedPreviewCode || '')
    }
  }, [debouncedPreviewCode, previewSelectionLocked])
  const previewHtml = useMemo(() => renderMarkdown(lockedPreviewCode || ''), [lockedPreviewCode])
  const highlightedHtml = useHighlight(lockedPreviewCode || '', language)
  const enhanceMentionsHtml = (html) => {
    const safe = String(html || '')
    return safe.replace(/@([a-zA-Z0-9_.-]+)/g, (m, p1) => {
      const slug = String(p1 || '').toLowerCase()
      return `<a href=\"#\" class=\"md-mention\" data-slug=\"${slug}\">@${p1}</a>`
    })
  }
  const enhancedHtml = useMemo(() => enhanceMentionsHtml(highlightedHtml), [highlightedHtml])
  const handleMentionClickInPreview = (e) => {
    const el = e.target.closest && e.target.closest('.md-mention')
    if (!el) return
    e.preventDefault()
    const slug = (el.getAttribute('data-slug') || '').toLowerCase()
    const list = [...(snippets || []), ...(projects || [])]
    const getExt = (lang) => {
      const m = {
        javascript: '.js',
        js: '.js',
        jsx: '.js',
        python: '.py',
        py: '.py',
        html: '.html',
        xml: '.xml',
        css: '.css',
        sql: '.sql',
        bash: '.sh',
        sh: '.sh',
        java: '.java',
        cpp: '.cpp',
        markdown: '.md',
        md: '.md'
      }
      return m[(lang || '').toLowerCase()] || ''
    }
    const matched = list.find((s) => {
      const title = (s.title || '').toLowerCase()
      const hyph = title.replace(/\s+/g, '-')
      const fname = title.includes('.') ? title : `${title}${getExt(s.language)}`
      return slug === hyph || slug === title || slug === fname
    })
    if (matched && typeof onSnippetMentionClick === 'function') {
      onSnippetMentionClick(matched)
    }
  }
  const isMarkdownHeuristic =
    /^(# |## |### |> |\* |\d+\. )/m.test(code || '') || /@\w+/.test(code || '')
  const isMarkdownLike =
    (language === 'txt' && isMarkdownHeuristic) || language === 'md' || language === 'markdown'
  const showMarkdown = isMarkdownLike
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
  const outerRef = useRef(null)
  const [nameOpen, setNameOpen] = useState(false)
  const [nameInput, setNameInput] = useState('')

  useEffect(() => {
    if (!canPreview && layoutMode !== 'editor') {
      setLayoutMode('editor')
    }
  }, [canPreview, layoutMode])

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

  // Trigger debounced save on content or language change
  useEffect(() => {
    if (!initialSnippet?.title) return
    debouncedSave()
  }, [code, language])

  // Handle keyboard shortcuts (only Escape now)
  useKeyboardShortcuts({
    onEscape: () => {
      if (mentionOpen) setMentionOpen(false)
      else onCancel && onCancel()
    }
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
      type: initialSnippet?.type || (activeView === 'projects' ? 'project' : 'snippet'),
      tags: extractTags(code),
      is_draft: false
    }
    onSave(payload)
  }

  return (
    <>
      {
        // Guard: if not in create mode and there's no valid snippet, show Welcome
        !isCreateMode && (!initialSnippet || !initialSnippet.id) ? (
          <WelcomePage onNewSnippet={onNew} onNewProject={onNewProject} />
        ) : (
          <div
            ref={outerRef}
            className="h-full flex flex-col items-stretch bg-slate-50 dark:bg-[#0d1117] transition-colors duration-200 relative"
          >
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
                  overflow: 'hidden',
                  alignItems: 'stretch'
                }}
                className="flex-1 min-h-0"
              >
                {previewPosition === 'left' ? (
                  <div
                    ref={previewRef}
                    onMouseDown={() => setPreviewSelectionLocked(true)}
                    onMouseUp={() => setTimeout(() => setPreviewSelectionLocked(false), 600)}
                    className="h-full min-h-0 overflow-auto bg-transparent preview-container"
                    style={{ maxHeight: '100%' }}
                  >
                    {showMarkdown ? (
                      <MarkdownPreview
                        content={lockedPreviewCode || ''}
                        snippets={[
                          ...(snippets || []),
                          ...(projects || []),
                          ...(initialSnippet?.id ? [initialSnippet] : [])
                        ]}
                        language={language}
                        onSnippetClick={onSnippetMentionClick}
                      />
                    ) : (
                      <div className="p-4">
                        <pre
                          className="m-0"
                          style={{
                            fontFamily: 'var(--preview-font-family)',
                            fontSize: 'var(--preview-font-size)',
                            lineHeight: 'var(--editor-line-height)',
                            paddingBottom:
                              'calc(var(--preview-font-size) * var(--editor-line-height))'
                          }}
                        >
                          <code
                            onClick={handleMentionClickInPreview}
                            style={{ userSelect: 'text', cursor: 'text' }}
                            className="hljs block text-slate-700 dark:text-slate-300"
                            dangerouslySetInnerHTML={{ __html: enhancedHtml }}
                          />
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="h-full min-h-0 overflow-hidden editor-container relative"
                    style={{ maxHeight: '100%', backgroundColor: 'var(--editor-bg)' }}
                  >
                    <div className="h-full w-full overflow-auto custom-scrollbar">
                      <Editor
                        value={code}
                        onValueChange={setCode}
                        highlight={(code) => {
                          const languageMap = {
                            js: 'javascript',
                            py: 'python',
                            sh: 'bash',
                            md: 'markdown',
                            txt: 'txt',
                            php: 'php'
                          }
                          const mappedLanguage = languageMap[language] || language
                          if (mappedLanguage === 'txt') return code
                          try {
                            return hljs.highlight(code, { language: mappedLanguage }).value
                          } catch {
                            return code
                          }
                        }}
                        padding={16}
                        style={{
                          fontFamily: 'var(--editor-font-family)',
                          fontSize: 'var(--editor-font-size)',
                          lineHeight: 'var(--editor-line-height)',
                          backgroundColor: 'transparent',
                          minHeight: '100%'
                        }}
                        textareaClassName="focus:outline-none"
                      />
                    </div>
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
                      onMouseDown={() => setPreviewSelectionLocked(true)}
                      onMouseUp={() => setTimeout(() => setPreviewSelectionLocked(false), 600)}
                      className="h-full min-h-0 overflow-auto bg-transparent preview-container"
                      style={{ maxHeight: '100%' }}
                    >
                      {showMarkdown ? (
                        <MarkdownPreview
                          content={lockedPreviewCode || ''}
                          snippets={[
                            ...(snippets || []),
                            ...(projects || []),
                            ...(initialSnippet?.id ? [initialSnippet] : [])
                          ]}
                          language={language}
                          onSnippetClick={onSnippetMentionClick}
                        />
                      ) : (
                        <div className="p-4">
                          <pre
                            className="m-0"
                            style={{
                              fontFamily: 'var(--preview-font-family)',
                              fontSize: 'var(--preview-font-size)',
                              lineHeight: 'var(--editor-line-height)',
                              paddingBottom:
                                'calc(var(--preview-font-size) * var(--editor-line-height))'
                            }}
                          >
                            <code
                              onClick={handleMentionClickInPreview}
                              style={{ userSelect: 'text', cursor: 'text' }}
                              className="hljs block text-slate-700 dark:text-slate-300"
                              dangerouslySetInnerHTML={{ __html: enhancedHtml }}
                            />
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="h-full min-h-0 overflow-hidden editor-container relative"
                      style={{ maxHeight: '100%', backgroundColor: 'var(--editor-bg)' }}
                    >
                      <div className="h-full w-full overflow-auto custom-scrollbar">
                        <Editor
                          value={code}
                          onValueChange={setCode}
                          highlight={(code) => {
                            const languageMap = {
                              js: 'javascript',
                              py: 'python',
                              sh: 'bash',
                              md: 'markdown',
                              txt: 'txt',
                              php: 'php'
                            }
                            const mappedLanguage = languageMap[language] || language
                            if (mappedLanguage === 'txt') return code
                            try {
                              return hljs.highlight(code, { language: mappedLanguage }).value
                            } catch {
                              return code
                            }
                          }}
                          padding={16}
                          style={{
                            fontFamily: 'var(--editor-font-family)',
                            fontSize: 'var(--editor-font-size)',
                            lineHeight: 'var(--editor-line-height)',
                            backgroundColor: 'transparent',
                            minHeight: '100%'
                          }}
                          textareaClassName="focus:outline-none"
                        />
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            )}

            {layoutMode === 'editor' && (
              <div
                className="flex-1 min-h-0 overflow-hidden editor-container relative"
                style={{ backgroundColor: 'var(--editor-bg)' }}
              >
                <div className="h-full w-full overflow-auto custom-scrollbar">
                  <Editor
                    value={code}
                    onValueChange={setCode}
                    highlight={(code) => {
                      const languageMap = {
                        js: 'javascript',
                        py: 'python',
                        sh: 'bash',
                        md: 'markdown',
                        txt: 'txt',
                        php: 'php'
                      }
                      const mappedLanguage = languageMap[language] || language
                      if (mappedLanguage === 'txt') return code
                      try {
                        return hljs.highlight(code, { language: mappedLanguage }).value
                      } catch {
                        return code
                      }
                    }}
                    padding={16}
                    style={{
                      fontFamily: 'var(--editor-font-family)',
                      fontSize: 'var(--editor-font-size)',
                      lineHeight: 'var(--editor-line-height)',
                      backgroundColor: 'transparent',
                      minHeight: '100%'
                    }}
                    textareaClassName="focus:outline-none"
                  />
                </div>
              </div>
            )}

            {layoutMode === 'preview' && canPreview && (
              <div className="flex-1 min-h-0 overflow-hidden preview-container">
                <div
                  ref={previewRef}
                  onMouseDown={() => setPreviewSelectionLocked(true)}
                  onMouseUp={() => setTimeout(() => setPreviewSelectionLocked(false), 600)}
                  className="h-full min-h-0 overflow-auto bg-transparent"
                  style={{ maxHeight: '100%' }}
                >
                  {showMarkdown ? (
                    <MarkdownPreview
                      content={lockedPreviewCode || ''}
                      snippets={[
                        ...(snippets || []),
                        ...(projects || []),
                        ...(initialSnippet?.id ? [initialSnippet] : [])
                      ]}
                      language={language}
                      onSnippetClick={onSnippetMentionClick}
                    />
                  ) : (
                    <div className="p-4">
                      <pre
                        className="m-0"
                        style={{
                          fontFamily: 'var(--preview-font-family)',
                          fontSize: 'var(--preview-font-size)',
                          lineHeight: 'var(--editor-line-height)',
                          paddingBottom:
                            'calc(var(--preview-font-size) * var(--editor-line-height))'
                        }}
                      >
                        <code
                          onClick={handleMentionClickInPreview}
                          style={{ userSelect: 'text', cursor: 'text' }}
                          className="hljs block text-slate-700 dark:text-slate-300"
                          dangerouslySetInnerHTML={{ __html: enhancedHtml }}
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
                          type:
                            initialSnippet?.type ||
                            (activeView === 'projects' ? 'project' : 'snippet'),
                          is_draft: false
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
            <StatusBar language={language} />
          </div>
        )
      }
    </>
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
  onCancel: PropTypes.func,
  onDelete: PropTypes.func,
  onNewProject: PropTypes.func,
  isCreateMode: PropTypes.bool,
  activeView: PropTypes.string,
  snippets: PropTypes.array,
  onSnippetMentionClick: PropTypes.func
}

export default SnippetEditor
const extractTags = (text) => {
  const t = String(text || '')
  const tags = new Set()
  const re = /(^|\s)#([a-zA-Z0-9_-]+)/g
  let m
  while ((m = re.exec(t))) {
    tags.add(m[2].toLowerCase())
  }
  return Array.from(tags).join(',')
}
