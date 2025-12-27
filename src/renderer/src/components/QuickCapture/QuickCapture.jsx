import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Globe, Sparkles, ShieldCheck } from 'lucide-react'
import { useThemeManager } from '../../hook/useThemeManager'
import './QuickCapture.css'

const QuickCapture = () => {
  // Sync with app-wide themes
  useThemeManager()

  const [code, setCode] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [chars, setChars] = useState(0)
  const inputRef = useRef(null)

  const handleSave = useCallback(async () => {
    if (!code.trim() || isSaving) return
    setIsSaving(true)
    try {
      const now = Date.now()
      const lang = detectLanguage(code).toLowerCase()

      let inboxFolderId = null
      if (window.api?.getFolders) {
        const folders = await window.api.getFolders()
        const inbox = folders.find((f) => f.name === '📥 Inbox')
        if (inbox) {
          inboxFolderId = inbox.id
        } else {
          const newInbox = {
            id: `folder_inbox_${Date.now()}`,
            name: '📥 Inbox',
            parent_id: null,
            collapsed: 0,
            sort_index: -999
          }
          await window.api.saveFolder(newInbox)
          inboxFolderId = newInbox.id
        }
      }

      const timeStr = new Date()
        .toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
        .replace(/:/g, '-')

      const payload = {
        id: `qc_${now}`,
        title: `Captured ${timeStr}.md`,
        code: code.trim(),
        language: lang === 'markdown' ? 'markdown' : lang,
        timestamp: now,
        type: 'snippet',
        is_draft: false,
        is_pinned: 0,
        folder_id: inboxFolderId,
        tags: ['quick-capture']
      }

      if (window.api?.saveSnippet) {
        await window.api.saveSnippet(payload)
      } else if (window.api?.invoke) {
        await window.api.invoke('db:saveSnippet', payload)
      }

      setSuccess(true)
      setTimeout(() => window.close(), 1000)
    } catch (err) {
      console.error('Quick Capture Save Failed:', err)
      setIsSaving(false)
    }
  }, [code, isSaving])

  useEffect(() => {
    // Basic setup
    document.body.style.background = 'transparent'
    document.documentElement.style.background = 'transparent'

    if (inputRef.current) {
      inputRef.current.focus()
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') window.close()
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    let unsubscribeReset = null
    if (window.api?.onResetCapture) {
      unsubscribeReset = window.api.onResetCapture(() => {
        setCode('')
        setChars(0)
        setSuccess(false)
        setIsSaving(false)
        if (inputRef.current) {
          setTimeout(() => inputRef.current?.focus(), 50)
        }
      })
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (unsubscribeReset) unsubscribeReset()
    }
  }, [handleSave])

  const detectLanguage = (text) => {
    const trimmed = text.trim().substring(0, 100)
    if (!trimmed) return 'Markdown'
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('const ') ||
      trimmed.startsWith('function ')
    )
      return 'JavaScript'
    if (trimmed.startsWith('<?php')) return 'PHP'
    if (trimmed.startsWith('def ') || (trimmed.startsWith('import ') && trimmed.includes(' as ')))
      return 'Python'
    if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) return 'Markdown'
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) return 'HTML'
    if (trimmed.includes('{') && trimmed.includes('}') && trimmed.includes(':')) return 'CSS'
    return 'Markdown'
  }

  // Memoize language to prevent CPU spike and jitter during typing
  const languageLabel = useMemo(() => detectLanguage(code), [code.split('\n')[0]])

  return (
    <div className="qc-full-wrapper">
      <div className="qc-window-container">
        <div className="qc-card">
          <div className="qc-header">
            <div className="qc-status">
              <div className="qc-dot" />
              <span className="qc-title">Quick Capture</span>
            </div>
            <div className="qc-shortcuts">
              <div className="qc-kbd-group">
                <kbd className="qc-kbd">Esc</kbd>
                <span className="qc-kbd-text">Close</span>
              </div>
              <div className="qc-kbd-group">
                <kbd className="qc-kbd">Ctrl</kbd>
                <kbd className="qc-kbd">Enter</kbd>
                <span className="qc-kbd-text">Save</span>
              </div>
            </div>
          </div>

          <div className="qc-body">
            <textarea
              ref={inputRef}
              placeholder="What's in you mind?"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setChars(e.target.value.length)
              }}
              className="qc-textarea"
              spellCheck="false"
            />
          </div>

          <div className="qc-footer">
            <div className="qc-footer-item qc-lang-slot">
              <div className="qc-footer-icon">
                <Globe size={11} />
              </div>
              <span>{languageLabel}</span>
            </div>
            <div className="qc-footer-item qc-char-slot">
              <div className="qc-footer-icon" style={{ opacity: chars > 0 ? 1 : 0.4 }}>
                <Sparkles size={11} style={{ color: chars > 0 ? 'var(--q-accent)' : 'inherit' }} />
              </div>
              <span>{chars} characters</span>
            </div>
          </div>

          {success && (
            <div className="qc-success">
              <ShieldCheck size={40} className="text-green-500" />
              <div className="qc-success-title">Transferred to Inbox</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuickCapture
