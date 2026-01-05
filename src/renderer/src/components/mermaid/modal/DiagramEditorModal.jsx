import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as React from 'react'
import CodeEditor from '../../CodeEditor/CodeEditor'
import mermaid from 'mermaid'
import {
  RotateCcw,
  MousePointer2,
  Hand,
  Save,
  Trash2,
  Copy,
  Palette,
  Ghost,
  Sparkles,
  Layers,
  GitBranch,
  ListMusic,
  Database,
  PieChart,
  Activity,
  Code
} from 'lucide-react'
import { getMermaidConfig } from '../mermaidConfig'
import './DiagramEditorModal.css'
import UniversalModal from '../../universal/UniversalModal'

// Initial setup with a neutral starting point
mermaid.initialize(getMermaidConfig(true))

const PaneHeader = ({ title, icon: Icon, children }) => (
  <div className="pane-header">
    <div className="header-label">
      <Icon size={12} className="header-icon" />
      <span>{title}</span>
    </div>
    <div className="header-actions">{children}</div>
  </div>
)

const DiagramEditorModal = ({ initialCode, onSave, onCancel }) => {
  const [code, setCode] = useState(initialCode || '')
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(null)
  const [isRendering, setIsRendering] = useState(false)
  const [autoRender, setAutoRender] = useState(code.length < 3000)
  const [lastRenderTime, setLastRenderTime] = useState(0)

  // Transform State
  // Transform State (Refs for performance)
  const [previewZoom, setPreviewZoom] = useState(1)
  const [panPos, setPanPos] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false) // Restored mode toggle
  const [isDraggingState, setIsDraggingState] = useState(false)

  const isDarkThemeState = useRef(true) // Ref for immediate access in event handlers
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [maximizedPane, setMaximizedPane] = useState(null) // 'editor' | 'preview' | null

  // Sync ref
  useEffect(() => {
    isDarkThemeState.current = isDarkTheme
  }, [isDarkTheme])

  const [isTransparent, setIsTransparent] = useState(false)
  const previewRef = useRef(null)
  const isDragging = useRef(false)
  const lastActive = useRef({ x: 0, y: 0 })
  const currentTransform = useRef({ x: 0, y: 0, scale: 1 })

  // Sync refs with state when not dragging
  useEffect(() => {
    currentTransform.current = { x: panPos.x, y: panPos.y, scale: previewZoom }
  }, [panPos, previewZoom])

  const renderDiagram = async (src) => {
    if (!src.trim()) {
      setSvg('')
      setError(null)
      return
    }

    const startTs = performance.now()
    setIsRendering(true)
    try {
      mermaid.initialize(getMermaidConfig(isDarkTheme))
      const id = `mermaid-modal-${Math.random().toString(36).substr(2, 9)}`

      try {
        await mermaid.parse(src)
      } catch (parseErr) {
        setError(parseErr.message)
        setIsRendering(false)
        return
      }

      const { svg: renderedSvg } = await mermaid.render(id, src)
      setSvg(renderedSvg)
      setError(null)
      setLastRenderTime(Math.round(performance.now() - startTs))
    } catch (err) {
      console.warn('Mermaid render error:', err)
      setError(err.message || 'Rendering failed. Check syntax.')
    } finally {
      setIsRendering(false)
    }
  }

  useEffect(() => {
    if (!autoRender) return

    const len = code.length
    let delay = 300
    if (len > 3000) delay = 1200
    else if (len > 1000) delay = 600

    const timer = setTimeout(() => {
      renderDiagram(code)
    }, delay)
    return () => clearTimeout(timer)
  }, [code, isDarkTheme, autoRender])

  useEffect(() => {
    const container = previewRef.current
    if (!container) return

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const zoomSpeed = 0.001
        const delta = -e.deltaY * zoomSpeed
        const newZoom = Math.min(5, Math.max(0.1, currentTransform.current.scale + delta))

        currentTransform.current.scale = newZoom
        setPreviewZoom(newZoom) // State update is fine for zoom (less frequent than drag)
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  // Optimized Panning - Direct DOM Manipulation
  const handleMouseDown = useCallback(
    (e) => {
      if (!isPanning) return // Only pan if in Pan Mode

      // Allow dragging from container or wrapper
      if (e.target.closest('.diagram-scaling-wrapper') || e.target === previewRef.current) {
        isDragging.current = true
        setIsDraggingState(true)
        lastActive.current = { x: e.clientX, y: e.clientY }
        e.preventDefault()
      }
    },
    [isPanning]
  )

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return
    e.preventDefault()

    const deltaX = e.clientX - lastActive.current.x
    const deltaY = e.clientY - lastActive.current.y

    // Update Ref
    currentTransform.current.x += deltaX
    currentTransform.current.y += deltaY
    lastActive.current = { x: e.clientX, y: e.clientY }

    // Direct DOM update (High Performance)
    const svgHost = document.getElementById('diagram-svg-host-target')
    if (svgHost) {
      svgHost.style.transform = `translate(${currentTransform.current.x}px, ${currentTransform.current.y}px) scale(${currentTransform.current.scale})`
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false
      setIsDraggingState(false)
      // Sync state at the end of drag
      setPanPos({ x: currentTransform.current.x, y: currentTransform.current.y })
    }
  }, [])

  const resetTransform = () => {
    setPreviewZoom(1)
    setPanPos({ x: 0, y: 0 })
    currentTransform.current = { x: 0, y: 0, scale: 1 }
  }

  const insertTemplate = (template) => {
    const templates = {
      flowchart: `graph TD\n    A[Start] --> B{Is it?}\n    B -- Yes --> C[OK]\n    B -- No --> D[End]`,
      sequence: `sequenceDiagram\n    Alice->>John: Hello John, how are you?\n    John-->>Alice: Great!`,
      gantt: `gantt\n    title A Gantt Diagram\n    section Section\n    A task           :a1, 2023-01-01, 30d\n    Another task     :after a1  , 20d`,
      class: `classDiagram\n    Class01 <|-- AveryLongClass : Cool\n    Class01 : size()\n    Class01 : int chimp`,
      state: `stateDiagram-v2\n    [*] --> Still\n    Still --> [*]\n    Still --> Moving\n    Moving --> Still\n    Moving --> Crash\n    Crash --> [*]`,
      er: `erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    ORDER ||--|{ LINE-ITEM : contains\n    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`,
      pie: `pie title Pets adopted by volunteers\n    "Dogs" : 386\n    "Cats" : 85\n    "Rats" : 15`,
      mindmap: `mindmap\n  root((mindmap))\n    Origins\n      Long history\n      ::icon(fa fa-book)\n    Architecture\n      Strategic\n      Technical\n    Research`,
      timeline: `timeline\n    title History of Social Media Platform\n    2002 : LinkedIn\n    2004 : Facebook\n           : Google\n    2005 : Youtube\n    2006 : Twitter`,
      git: `gitGraph\n    commit\n    commit\n    branch develop\n    checkout develop\n    commit\n    commit\n    checkout main\n    merge develop\n    commit`
    }
    if (templates[template]) setCode(templates[template])
  }

  const copySvg = () => {
    if (!svg) return
    navigator.clipboard.writeText(svg)
  }

  const clearAll = () => {
    if (confirm('Are you sure you want to clear the diagram?')) {
      setCode('')
    }
  }

  return (
    <div
      className={`diagram-editor-modal h-full flex flex-col ${maximizedPane ? `maximized-${maximizedPane}` : ''}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <div className="diagram-editor-toolbar border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30">
        <div className="toolbar-left">
          <div className="template-group">
            <button className="small" onClick={() => insertTemplate('flowchart')} title="Flowchart">
              <Activity size={12} /> Flow
            </button>
            <button className="small" onClick={() => insertTemplate('sequence')} title="Sequence">
              <ListMusic size={12} /> Seq
            </button>
            <button className="small" onClick={() => insertTemplate('state')} title="State Diagram">
              <Sparkles size={12} /> State
            </button>
            <button
              className="small"
              onClick={() => insertTemplate('er')}
              title="Entity Relationship"
            >
              <Database size={12} /> ER
            </button>
            <button className="small" onClick={() => insertTemplate('pie')} title="Pie Chart">
              <PieChart size={12} /> Pie
            </button>
            <button className="small" onClick={() => insertTemplate('mindmap')} title="Mindmap">
              <Layers size={12} /> Mind
            </button>
            <button className="small" onClick={() => insertTemplate('timeline')} title="Timeline">
              <RotateCcw size={12} /> Time
            </button>
            <button className="small" onClick={() => insertTemplate('git')} title="Git Graph">
              <GitBranch size={12} /> Git
            </button>
          </div>
          <div className="divider" />
          <button
            className="small btn-danger-text"
            onClick={(e) => {
              e.currentTarget.blur()
              clearAll()
            }}
            title="Clear All"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <div className="toolbar-right">
          <button className="small btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="small btn-save" onClick={() => onSave(code)}>
            <Save size={14} /> Apply Changes
          </button>
        </div>
      </div>

      <div className="diagram-editor-main flex-1 flex overflow-hidden">
        <div
          className={`diagram-editor-pane code-pane border-r border-[var(--color-border)] ${maximizedPane === 'editor' ? 'is-maximized' : maximizedPane === 'preview' ? 'is-hidden' : ''}`}
        >
          <PaneHeader title="Syntax Editor" icon={Code}>
            <div className="flex items-center gap-2">
              <div className="syntax-info">{code.length} chars</div>
              <button
                className={`small icon-only ${maximizedPane === 'editor' ? 'active' : ''}`}
                onClick={() => setMaximizedPane(maximizedPane === 'editor' ? null : 'editor')}
                title={maximizedPane === 'editor' ? 'Restore View' : 'Maximize Editor'}
              >
                <Layers size={12} />
              </button>
            </div>
          </PaneHeader>
          <div className="editor-inner h-full">
            <CodeEditor
              value={code}
              height="100%"
              language="markdown"
              isDark={isDarkTheme}
              autoFocus={true}
              onChange={(value) => setCode(value)}
            />
          </div>
        </div>

        <div
          className={`diagram-editor-pane preview-pane ${maximizedPane === 'preview' ? 'is-maximized' : maximizedPane === 'editor' ? 'is-hidden' : ''}`}
        >
          <PaneHeader title="Visual Preview" icon={Sparkles}>
            <div className="preview-options">
              <button
                className={`small icon-only ${autoRender ? 'active' : ''}`}
                onClick={() => setAutoRender(!autoRender)}
                title={autoRender ? 'Disable Auto-render' : 'Enable Auto-render'}
              >
                <Activity size={12} />
              </button>
              {!autoRender && (
                <button
                  className="small btn-primary px-2 flex items-center gap-1"
                  onClick={() => renderDiagram(code)}
                  disabled={isRendering}
                >
                  <RotateCcw size={10} className={isRendering ? 'animate-spin' : ''} />
                  Render
                </button>
              )}
              <div className="divider" />
              <button
                className={`small icon-only ${maximizedPane === 'preview' ? 'active' : ''}`}
                onClick={() => setMaximizedPane(maximizedPane === 'preview' ? null : 'preview')}
                title={maximizedPane === 'preview' ? 'Restore View' : 'Maximize Preview'}
              >
                <Sparkles size={12} />
              </button>
              <div className="divider" />
              <button
                className={`small icon-only ${!isPanning ? 'active' : ''}`}
                onClick={() => setIsPanning(false)}
                title="Select Mode"
              >
                <MousePointer2 size={12} />
              </button>
              <button
                className={`small icon-only ${isPanning ? 'active' : ''}`}
                onClick={() => setIsPanning(true)}
                title="Pan Mode"
              >
                <Hand size={12} />
              </button>
              <div className="divider" />
              <button
                className={`small icon-only ${isDarkTheme ? 'active' : ''}`}
                onClick={() => setIsDarkTheme(!isDarkTheme)}
                title="Toggle Theme"
              >
                <Palette size={12} />
              </button>
            </div>
          </PaneHeader>

          <div
            className={`diagram-preview-container flex-1 relative ${isPanning ? 'cursor-grab' : ''} ${isDraggingState ? 'cursor-grabbing' : ''}`}
            ref={previewRef}
            onMouseDown={handleMouseDown}
            style={{ overflow: 'hidden' }}
          >
            {isRendering && (
              <div
                className="rendering-overlay"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(1px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                    Optimizing...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="diagram-error-overlay" style={{ zIndex: 11 }}>
                <div className="error-badge">Syntax Error</div>
                <pre>{error}</pre>
              </div>
            )}

            <div
              className={`diagram-scaling-wrapper ${isTransparent ? 'is-transparent' : ''}`}
              style={{
                transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${previewZoom})`,
                transformOrigin: '0 0',
                transition: isDraggingState ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)'
              }}
            >
              <div
                id="diagram-svg-host"
                className={`diagram-svg-host ${isDarkTheme ? 'mermaid-dark' : 'mermaid-light'}`}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>

            {lastRenderTime > 0 && !error && (
              <div
                className="render-stats"
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  fontSize: '9px',
                  opacity: 0.4,
                  fontWeight: 'bold',
                  letterSpacing: '0.05em',
                  zIndex: 5
                }}
              >
                RENDERED IN {lastRenderTime}MS
              </div>
            )}
          </div>

          <div className="preview-footer border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30">
            <div className="zoom-controls">
              <button
                className="small"
                onClick={() => setPreviewZoom((z) => Math.max(0.2, z - 0.1))}
              >
                -
              </button>
              <span className="zoom-percentage">{Math.round(previewZoom * 100)}%</span>
              <button className="small" onClick={() => setPreviewZoom((z) => Math.min(5, z + 0.1))}>
                +
              </button>
              <button className="small icon-only" onClick={resetTransform} title="Reset View">
                <RotateCcw size={12} />
              </button>
            </div>

            <div className="footer-actions">
              <button className="small action-btn" onClick={copySvg} title="Copy as SVG">
                <Copy size={12} /> Copy SVG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiagramEditorModal
