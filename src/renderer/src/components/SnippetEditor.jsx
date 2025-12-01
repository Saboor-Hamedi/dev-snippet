  // Edit snippets with autosave functionality - Clean live editing experience
import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useKeyboardShortcuts } from '../hook/useKeyboardShortcuts'
import WelcomePage from './WelcomePage'
import StatusBar from './StatusBar.jsx'
import SplitPane from './SplitPane.jsx'
import LivePreview from './LivePreview.jsx'

const SnippetEditor = ({
  onSave,
  initialSnippet,
  onCancel,
  onNew,
  onDelete,
  isCreateMode,
  activeView,
  onSettingsClick
}) => {
  const [code, setCode] = useState(initialSnippet?.code || '')
  const [language, setLanguage] = React.useState(initialSnippet?.language || 'text')

  const saveTimerRef = useRef(null)

  const isDeletingRef = useRef(false)
  const textareaRef = useRef(null)

  // Focus the textarea when initialSnippet changes (when opening a snippet)
  useEffect(() => {
    if (initialSnippet && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus()
      }, 50)
    }
  }, [initialSnippet?.id]) // Re-run when snippet ID changes

  // Focus the textarea when in create mode 
  useEffect(() => {
    if (isCreateMode && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [isCreateMode])

  const scheduleSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const id = initialSnippet?.id
      if (!id) return
      if (isDeletingRef.current) return
      if (window.__deletedIds && window.__deletedIds.has(id)) return
      if (initialSnippet?.is_draft && (!initialSnippet?.title || !initialSnippet.title.trim()))
        return
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
  }

  useEffect(() => {
    // Register canceler globally keyed by snippet id
    const id = initialSnippet?.id
    if (id) {
      if (!window.__autosaveCancel) window.__autosaveCancel = new Map()
      window.__autosaveCancel.set(id, () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      })
    }
    return () => {
      const id2 = initialSnippet?.id
      try {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
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

  // Always set language to 'md' for markdown snippets, ignore file extension and code content
  React.useEffect(() => {
    if (language !== 'md') setLanguage('md')
  }, [language])

  const [nameOpen, setNameOpen] = useState(false)
  const [nameInput, setNameInput] = useState('')

  // Trigger debounced save on content or language change
  useEffect(() => {
    if (!initialSnippet?.title) return
    scheduleSave()
  }, [code, language])

  // Handle keyboard shortcuts
  useKeyboardShortcuts({
    onEscape: () => {
      onCancel && onCancel()
    },
    onSave: () => {
      // Ctrl+S: Open save prompt if no title, otherwise trigger autosave
      const title = initialSnippet?.title || ''
      if (!title || title.toLowerCase() === 'untitled') {
        setNameInput('')
        setNameOpen(true)
      }
    }
  })

  const handleSave = () => {
    let title = initialSnippet?.title || ''
    if (!title || title.toLowerCase() === 'untitled') {
      setNameInput('')
      setNameOpen(true)
      return
    }
    const payload = {
      id: initialSnippet?.id || Date.now().toString(),
      title,
      code: code,
      language: 'md',
      timestamp: Date.now(),
      type: 'snippet',
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
          <WelcomePage onNewSnippet={onNew} />
        ) : (
          <div className="h-full overflow-hidden flex flex-col items-stretch bg-slate-50 dark:bg-[#0d1117] transition-colors duration-200 relative">
            <div
              className="flex-1 min-h-0 overflow-hidden editor-container relative"
              style={{ backgroundColor: 'var(--editor-bg)', display: 'flex' }}
              data-color-mode={
                document.documentElement.classList.contains('dark') ? 'dark' : 'light'
              }
            >
              <SplitPane
                left={
                  <textarea 
                    ref={textareaRef}
                    value={code || ''}
                    onChange={(e) => setCode(e.target.value || '')}
                    className="w-full h-full dark:bg-slate-900 dark:text-slate-200 font-mono text-sm leading-6"
                    style={{
                      fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                      fontSize: 16,
                      lineHeight: '1.7',
                      color: 'var(--text-main)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      padding: 16,
                      resize: 'none',
                      overflow: 'auto',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  />
                }
                right={
                  <div
                    className="h-full overflow-auto p-4"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <LivePreview code={code} />
                  </div>
                }
              />
            </div>

            {false && <div />}

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
                        const payload = {
                          id: initialSnippet?.id || Date.now().toString(),
                          title: t,
                          code: code,
                          language: 'md',
                          timestamp: Date.now(),
                          type: 'snippet',
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
            <StatusBar onSettingsClick={onSettingsClick} />
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
  isCreateMode: PropTypes.bool,
  activeView: PropTypes.string
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
