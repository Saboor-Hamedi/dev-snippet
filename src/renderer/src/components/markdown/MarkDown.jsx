import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import SidebarHeader from '../layout/SidebarHeader'
import SnippetCard from '../SnippetCard'

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
  // Do not convert triple-backtick fenced blocks to <pre><code>; leave them as literal text
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
  html = html.replace(/\n/g, '<br/>')
  return html
}

const MarkDown = ({ items, onDeleteRequest, onEdit, onSave }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const previewHtml = useMemo(() => renderMarkdown(content), [content])

  const handleCreate = () => {
    setIsEditing(true)
    setTitle('')
    setContent('')
  }

  const handleSave = () => {
    const derivedTitle = title || (content.split('\n')[0] || 'untitled').trim()
    const newItem = {
      id: Date.now().toString(),
      title: derivedTitle,
      code: content,
      language: 'md',
      timestamp: Date.now(),
      type: 'markdown'
    }
    onSave(newItem)
    setIsEditing(false)
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      <SidebarHeader
        title="Markdown Files"
        count={items.length}
        itemLabel="File"
        onAction={handleCreate}
      />

      {isEditing ? (
        <div className="flex-1 overflow-hidden p-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm w-80"
            />
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-500 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 h-[calc(100%-3rem)]">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write markdown..."
              className="w-full h-full bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-slate-300 p-4 font-mono text-sm resize-none border-none outline-none focus:outline-none focus:ring-0"
              spellCheck="false"
            />
            <div className="w-full h-full overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-4">
              <div
                className="prose prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-slate-500">No markdown files yet.</p>
              <button onClick={handleCreate} className="mt-4 text-primary-500 hover:underline">
                Create one
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6 pb-6">
              {items.map((item) => (
                <SnippetCard
                  key={item.id}
                  snippet={item}
                  onRequestDelete={onDeleteRequest}
                  onEdit={onEdit}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

MarkDown.propTypes = {
  items: PropTypes.array.isRequired,
  onDeleteRequest: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
}

export default MarkDown
