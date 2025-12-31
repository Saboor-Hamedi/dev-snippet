import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, Copy, Check, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { toBlob, toPng } from 'html-to-image'
import { saveAs } from 'file-saver'
import PropTypes from 'prop-types'
import { ToggleButton } from '../../ToggleButton'

const customVscDarkPlus = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-"]'],
    background: 'transparent',
    textShadow: 'none'
  },
  'code[class*="language-"]': {
    ...vscDarkPlus['code[class*="language-"]'],
    background: 'transparent',
    textShadow: 'none'
  }
}

const GRADIENTS = [
  { name: 'Purple Haze', class: 'bg-gradient-to-br from-purple-600 to-blue-500' },
  { name: 'Sunset', class: 'bg-gradient-to-br from-orange-500 to-pink-500' },
  { name: 'Oceanic', class: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
  { name: 'Emerald', class: 'bg-gradient-to-br from-emerald-400 to-cyan-500' },
  { name: 'Midnight', class: 'bg-gradient-to-br from-slate-700 to-slate-900' },
  { name: 'Transparent', class: 'bg-transparent' }
]

const PADDINGS = [
  { label: 'Compact', value: 'p-8' },
  { label: 'Normal', value: 'p-12' },
  { label: 'Spacious', value: 'p-16' }
]

const ImageExportModal = ({ isOpen, onClose, snippet }) => {
  const [activeGradient, setActiveGradient] = useState(GRADIENTS[0])
  const [padding, setPadding] = useState(PADDINGS[1])
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportState, setExportState] = useState(null)

  const exportRef = useRef(null)

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setExportState(null)
      setIsExporting(false)
    }
  }, [isOpen])

  if (!isOpen || !snippet) return null

  const handleCopy = async () => {
    if (!exportRef.current) return
    setIsExporting(true)
    try {
      const blob = await toBlob(exportRef.current, { pixelRatio: 2 })
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setExportState('copied')
      setTimeout(() => setExportState(null), 2000)
    } catch (err) {
      console.error('Failed to copy image', err)
    } finally {
      setIsExporting(false)
    }
  }

  const handleSave = async () => {
    if (!exportRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await toPng(exportRef.current, { pixelRatio: 2 })
      saveAs(dataUrl, `${snippet.title || 'snippet'}.png`)
      setExportState('saved')
      setTimeout(() => setExportState(null), 2000)
    } catch (err) {
      console.error('Failed to save image', err)
    } finally {
      setIsExporting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
        onMouseDown={onClose}
      />
      <div className="relative w-full max-w-5xl h-[85vh] bg-[var(--color-bg-primary)] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--color-accent-primary)]/10 rounded-lg text-[var(--color-accent-primary)]">
              <ImageIcon size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                Export as Image
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Create beautiful screenshots of your code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--hover-bg)] rounded-lg text-[var(--color-text-secondary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 overflow-auto p-12 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-center checkered-bg">
            <div
              ref={exportRef}
              className={`relative transition-all duration-300 ${padding.value} ${activeGradient.class} flex items-center justify-center min-w-[500px] shadow-2xl`}
              style={{ minHeight: '300px' }}
            >
              <div className="w-full bg-[#1e1e1e] rounded-xl shadow-2xl overflow-hidden border border-white/10 ring-1 ring-black/50">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#2a2a2b] border-b border-white/5 select-none">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-inner" />
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-inner" />
                    <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-inner" />
                  </div>
                  <div className="ml-4 text-xs font-mono text-slate-400 opacity-80 font-medium">
                    {snippet.title}
                  </div>
                </div>

                <div className="p-0">
                  <SyntaxHighlighter
                    language={snippet.language || 'javascript'}
                    style={customVscDarkPlus}
                    showLineNumbers={showLineNumbers}
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      background: 'transparent',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace"
                    }}
                    wrapLines={true}
                    wrapLongLines={true}
                  >
                    {snippet.code || ''}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          </div>

          <div className="w-80 border-l border-white/10 bg-black/20 p-6 overflow-y-auto flex flex-col gap-8 backdrop-blur-md">
            <section>
              <h3 className="text-xs font-bold uppercase text-[var(--color-text-tertiary)] tracking-wider mb-4">
                Background
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {GRADIENTS.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveGradient(g)}
                    className={`h-12 rounded-lg ring-2 ring-offset-2 ring-offset-[var(--bg-primary)] transition-all ${
                      activeGradient.name === g.name
                        ? 'ring-indigo-500 scale-105'
                        : 'ring-transparent hover:scale-105'
                    } ${g.class} ${g.name === 'Transparent' ? 'border border-dashed border-slate-400' : ''}`}
                    title={g.name}
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase text-[var(--color-text-tertiary)] tracking-wider mb-4">
                Settings
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-[var(--color-text-secondary)]">Padding</label>
                  <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-lg border border-[var(--color-border)]">
                    {PADDINGS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => setPadding(p)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                          padding.label === p.label
                            ? 'bg-[var(--bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="flex items-center justify-between group cursor-pointer"
                  onClick={() => setShowLineNumbers(!showLineNumbers)}
                >
                  <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                    Show Line Numbers
                  </span>
                  <ToggleButton checked={showLineNumbers} onChange={setShowLineNumbers} />
                </div>
              </div>
            </section>

            <div className="flex-1" />

            <div className="space-y-3">
              <button
                onClick={handleCopy}
                disabled={isExporting}
                className="w-full h-9 flex items-center justify-center gap-2 bg-[var(--bg-secondary)] border border-[var(--color-border)] hover:bg-[var(--hover-bg)] text-[var(--color-text-primary)] font-medium rounded-lg transition-all"
              >
                {isExporting && exportState === 'copied' ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : exportState === 'copied' ? (
                  <Check size={16} className="text-emerald-500" />
                ) : (
                  <Copy size={16} />
                )}
                {exportState === 'copied' ? 'Copied!' : 'Copy to Clipboard'}
              </button>

              <button
                onClick={handleSave}
                disabled={isExporting}
                className="w-full h-9 flex items-center justify-center gap-2 bg-[var(--color-accent-primary)] hover:opacity-90 text-[var(--color-bg-primary)] font-bold rounded-lg transition-all"
              >
                {isExporting && exportState !== 'copied' ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : exportState === 'saved' ? (
                  <Check size={16} />
                ) : (
                  <Download size={16} />
                )}
                {exportState === 'saved' ? 'Saved!' : 'Save PNG'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

ImageExportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  snippet: PropTypes.object
}

export default ImageExportModal
