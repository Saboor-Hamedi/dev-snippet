import React, { useState, useRef, useEffect } from 'react'
import { Download, Copy, Check, Loader2 } from 'lucide-react'
import { toBlob, toPng } from 'html-to-image'
import { saveAs } from 'file-saver'
import PropTypes from 'prop-types'
import { ToggleButton } from '../../ToggleButton'
import { markdownToHtml } from '../../../utils/markdownParser'
import UniversalModal from '../../universal/UniversalModal'

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
  const [highlightedHtml, setHighlightedHtml] = useState('')

  const exportRef = useRef(null)

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setExportState(null)
      setIsExporting(false)

      const highlight = async () => {
        const html = await markdownToHtml(snippet.code, { renderMetadata: false })
        setHighlightedHtml(html)
      }

      highlight()
    }
  }, [isOpen, snippet.code, snippet.language])

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

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Export as Image"
      width="min(1000px, 98vw)"
      height="85vh"
      className="image-export-universal"
    >
      <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
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

                <div
                  className={`p-6 overflow-hidden code-content ${showLineNumbers ? 'show-line-numbers' : ''}`}
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    color: '#d4d4d4',
                    background: 'transparent'
                  }}
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
              </div>
            </div>
          </div>

          <div className="w-80 border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30 p-6 overflow-y-auto flex flex-col gap-8 backdrop-blur-md">
            <section>
              <h3 className="text-[9px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-widest mb-4">
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
              <h3 className="text-[9px] font-bold uppercase text-[var(--color-text-tertiary)] tracking-widest mb-4">
                Settings
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-[var(--color-text-secondary)]">Padding</label>
                  <div className="flex bg-[var(--color-bg-tertiary)] p-1 rounded-lg border border-[var(--color-border)]">
                    {PADDINGS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => setPadding(p)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                          padding.label === p.label
                            ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
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
                className="w-full h-10 flex items-center justify-center gap-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] font-medium rounded-lg transition-all"
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
                className="w-full h-10 flex items-center justify-center gap-2 bg-[var(--color-accent-primary)] hover:opacity-90 text-white font-bold rounded-lg transition-all shadow-sm"
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
    </UniversalModal>
  )
}

ImageExportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  snippet: PropTypes.object
}

export default ImageExportModal
