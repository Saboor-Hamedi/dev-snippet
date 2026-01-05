import * as React from 'react'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import {
  Plus,
  Minus,
  Maximize2,
  RefreshCw,
  Globe,
  Focus,
  Atom,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import { forceRadial, forceManyBody } from 'd3-force'
import { buildGraphData, filterGraphData, generateRandomGraphTheme } from './GraphLogic'
import { useSettings } from '../../hook/useSettingsContext'
import markdownToHtml from '../../utils/markdownParser'
import mermaid from 'mermaid'
import { makeDraggable } from '../../utils/draggable'
import './graphStyle.css'

// Initialize Mermaid for compact previews
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'inherit',
  fontSize: 10
})

/**
 * KnowledgeGraph Component - Nexus Edition
 *
 * Provides an interactive, multi-modal view of all snippets and their connections.
 */
const KnowledgeGraph = ({
  selectedSnippetId,
  searchQuery: externalSearchQuery,
  onSelectSnippet,
  onClose,
  onDataLoaded,
  onNodeSelect
}) => {
  const { settings, updateSetting } = useSettings()
  const graphTheme = settings?.graph?.theme || {}

  // States
  const [activeMode, setActiveMode] = useState('universe') // 'universe' | 'neighborhood' | 'orb'
  const [rawData, setRawData] = useState({ nodes: [], links: [] })
  const [allSnippets, setAllSnippets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hoverNode, setHoverNode] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isHoveringCard, setIsHoveringCard] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const hoverTimer = useRef(null)
  const searchQuery = externalSearchQuery || ''
  const graphRef = useRef()
  const containerRef = useRef()
  const toolbarRef = useRef()
  const toolbarHandleRef = useRef()

  // Notify parent of selection changes
  useEffect(() => {
    if (onNodeSelect) onNodeSelect(selectedNode)
  }, [selectedNode, onNodeSelect])

  // 0. Handle Resizing
  useEffect(() => {
    if (!containerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // 0.5. Re-center graph on size change (e.g. Maximizing)
  useEffect(() => {
    if (graphRef.current && dimensions.width > 0) {
      // Small debounce to let the layout settle
      const timer = setTimeout(() => {
        graphRef.current.zoomToFit(400, 50)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [dimensions.width, dimensions.height])

  // 1. Fetch data on mount
  const fetchData = async () => {
    setIsLoading(true)
    try {
      if (window.api?.getSnippets) {
        const snippets = await window.api.getSnippets({ metadataOnly: false })
        setAllSnippets(snippets || [])
        const graphData = buildGraphData(snippets || [])

        // Calculate Age Factor for Universe Rings
        const now = Date.now()
        const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days

        graphData.nodes.forEach((node) => {
          const s = (snippets || []).find((sn) => sn.id === node.id)
          const age = now - (s?.timestamp || now)
          node.ageFactor = Math.min(1, age / maxAge)
        })

        setRawData(graphData)
        if (onDataLoaded) onDataLoaded(graphData)
      }
    } catch (err) {
      console.error('KnowledgeGraph: Failed to load snippets:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 1.2. Make Nexus Toolbar Draggable
  useEffect(() => {
    if (toolbarRef.current && toolbarHandleRef.current) {
      const savedPos = settings?.ui?.graphToolbar?.pos
      if (savedPos && savedPos.x !== null) {
        toolbarRef.current.style.left = `${savedPos.x}px`
        toolbarRef.current.style.top = `${savedPos.y}px`
        toolbarRef.current.style.margin = '0'
        toolbarRef.current.style.position = 'absolute'
      }

      const cleanup = makeDraggable(toolbarRef.current, toolbarHandleRef.current, (pos) => {
        updateSetting('ui.graphToolbar.pos', pos)
      })
      return cleanup
    }
  }, [settings?.ui?.graphToolbar?.disableDraggable])

  // 1.5. Handle Hovering
  const handleNodeHover = (node) => {
    if (node) {
      if (hoverTimer.current) clearTimeout(hoverTimer.current)
      setHoverNode(node)
    } else {
      // Give the user 300ms to move their mouse from the node to the card
      hoverTimer.current = setTimeout(() => {
        // Only hide if we aren't currently inside the card
        setIsHoveringCard((prev) => {
          if (!prev) setHoverNode(null)
          return prev
        })
      }, 300)
    }
  }

  // 1.6. Pre-render Markdown for Insight Card
  useEffect(() => {
    const activeNode = hoverNode || selectedNode
    if (!activeNode) {
      setPreviewHtml('')
      return
    }

    const s = allSnippets.find((sn) => sn.id === activeNode.id)
    if (!s) {
      setPreviewHtml('')
      return
    }

    const render = async () => {
      // Show FULL snippet for preview as requested
      let raw = s.code || ''

      const lang = (s.language || 'markdown').toLowerCase()
      let md = raw

      // Auto-wrap mermaid if it's the snippet language but not fenced
      if (lang === 'mermaid' && !raw.trim().startsWith('```')) {
        md = `\`\`\`mermaid\n${raw}\n\`\`\``
      } else if (lang !== 'markdown' && lang !== 'md' && !raw.startsWith('```')) {
        md = `\`\`\`${lang}\n${raw}\n\`\`\``
      }

      try {
        const html = await markdownToHtml(md)
        setPreviewHtml(html)
      } catch (err) {
        console.warn('Markdown preview failed', err)
        setPreviewHtml('<div class="opacity-50 italic">Preview unavailable</div>')
      }
    }

    render()
  }, [hoverNode, selectedNode, allSnippets])

  // 1.7. Render Mermaid diagrams after HTML is injected
  useEffect(() => {
    if (previewHtml) {
      // Give a tiny delay for React to mount the HTML
      const timer = setTimeout(() => {
        const nodes = document.querySelectorAll('.nexus-insight-card .mermaid')
        if (nodes.length > 0) {
          mermaid
            .run({ nodes: Array.from(nodes) })
            .catch((err) => console.warn('Mermaid render failed:', err))
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [previewHtml])

  // 2. Filter & Sort data based on search and MODE
  const processedData = useMemo(() => {
    let { nodes, links } = rawData

    // Neighborhood filtering: Only show selected node and its neighbors
    if (activeMode === 'neighborhood' && selectedSnippetId) {
      const neighbors = new Set()
      const targetId = String(selectedSnippetId)

      links.forEach((l) => {
        const sId = String(l.source.id || l.source)
        const tId = String(l.target.id || l.target)

        if (sId === targetId) neighbors.add(tId)
        if (tId === targetId) neighbors.add(sId)
      })

      neighbors.add(targetId)

      nodes = nodes.filter((n) => neighbors.has(String(n.id)))
      links = links.filter((l) => {
        const sId = String(l.source.id || l.source)
        const tId = String(l.target.id || l.target)
        return neighbors.has(sId) && neighbors.has(tId)
      })
    }

    // Apply global search filter
    if (searchQuery) {
      const filtered = filterGraphData({ nodes, links }, searchQuery)
      nodes = filtered.nodes
      links = filtered.links
    }

    // Priority Rendering: Sort nodes so larger hubs go ON TOP of smaller nodes
    const sortedNodes = [...nodes].sort((a, b) => (a.count || 0) - (b.count || 0))

    return { nodes: sortedNodes, links }
  }, [rawData, searchQuery, activeMode, selectedSnippetId])

  // 3. D3 Forces Coordination & Reheat
  useEffect(() => {
    if (!graphRef.current) return
    const fg = graphRef.current

    // Reheat simulation on mode/data change
    if (fg.d3Simulation) {
      fg.d3Simulation().alpha(1).restart()
    }

    if (activeMode === 'orb' || activeMode === 'neighborhood') {
      fg.d3Force('center', null)
      fg.d3Force('radial', forceRadial((d) => (d.ageFactor || 0.5) * 150, 0, 0).strength(0.8))
      fg.d3Force('charge', forceManyBody().strength(-800)) // Increased repulsion
    } else {
      // Universe Mode: Chronological Rings
      fg.d3Force('center', null)
      fg.d3Force('radial', forceRadial((d) => (d.ageFactor || 0.5) * 450, 0, 0).strength(0.5))
      fg.d3Force('charge', forceManyBody().strength(-600)) // Increased repulsion
    }

    // --- AUTO-FOCUS LOGIC ---
    setTimeout(() => {
      if (!fg) return

      if (activeMode === 'neighborhood' && selectedSnippetId) {
        // Focus on selected snippet in neighborhood
        const node = processedData.nodes.find((n) => String(n.id) === String(selectedSnippetId))
        if (node) fg.centerAt(node.x, node.y, 800)
        fg.zoom(1.6, 800) // Reduced from 2.5 for better cluster visibility
      } else if (activeMode === 'orb' && processedData.nodes.length > 0) {
        // Find the biggest central hub and focus it
        const mainHub = [...processedData.nodes].sort((a, b) => (b.count || 0) - (a.count || 0))[0]
        if (mainHub) {
          fg.centerAt(mainHub.x, mainHub.y, 1000)
          fg.zoom(2.0, 1000)
        }
      } else if (activeMode === 'universe') {
        fg.zoomToFit(800, 150)
      }
    }, 200)
  }, [activeMode, processedData])

  // 4. Performance: Resolve theme colors
  const resolvedColors = useMemo(() => {
    if (!containerRef.current) return {}
    const style = getComputedStyle(containerRef.current)
    const getVar = (v, f) => style.getPropertyValue(v).trim() || f

    return {
      accent: graphTheme.accent || getVar('--color-accent-primary', '#58a6ff'),
      secondary: graphTheme.secondary || getVar('--color-text-secondary', '#8b949e'),
      primary: getVar('--color-text-primary', '#ffffff'),
      moon: graphTheme.moon || '#e6e9ef',
      central: graphTheme.central || '#00a3ff'
    }
  }, [graphTheme, containerRef.current])

  const paintNode = useCallback(
    (node, ctx, globalScale) => {
      const isSelected = node.id === selectedSnippetId || node === selectedNode
      const isHovered = hoverNode === node
      const colors = resolvedColors

      // WikiLink status - nodes with links get special highlighting
      const isLinked = (node.count || 0) > 0
      const isBigHub = node.count >= 3

      let nodeColor = colors.secondary
      if (isSelected) nodeColor = colors.moon
      else if (isBigHub)
        nodeColor = colors.central // Major hubs
      else if (isLinked)
        nodeColor = colors.accent // WikiLinked nodes
      else if (node.isPinned) nodeColor = colors.accent
      else if (node.isFavorite) nodeColor = '#ffb700'

      if (isHovered) nodeColor = colors.accent

      // Obsidian-style sizing - balanced and elegant
      // In Neighborhood mode, reduce selected node size for better cluster view
      const selectedMult = activeMode === 'neighborhood' ? 1.7 : 2.2
      const baseMult = isSelected ? selectedMult : isBigHub ? 1.8 : isLinked ? 1.3 : 1.1
      const size = node.val * baseMult

      const hasShadow = isSelected || isHovered || isBigHub
      if (hasShadow) {
        ctx.shadowColor = nodeColor
        ctx.shadowBlur = (isSelected || isHovered ? 15 : isBigHub ? 8 : 4) / globalScale
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      }

      // 2. Subtle Outer Ring for depth
      ctx.beginPath()
      ctx.arc(node.x, node.y, size + 0.8 / globalScale, 0, 2 * Math.PI, false)
      ctx.fillStyle = isSelected
        ? 'rgba(255,255,255,0.15)'
        : isLinked
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(255,255,255,0.03)'
      ctx.fill()

      // 3. Main Node Body - Smooth and organic
      ctx.beginPath()
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false)
      ctx.fillStyle = nodeColor
      ctx.fill()

      // 4. Inner highlight for 3D effect
      if (
        (isBigHub || isSelected || isLinked) &&
        isFinite(node.x) &&
        isFinite(node.y) &&
        isFinite(size)
      ) {
        const highlightGradient = ctx.createRadialGradient(
          node.x - size * 0.3,
          node.y - size * 0.3,
          0,
          node.x,
          node.y,
          size
        )
        highlightGradient.addColorStop(
          0,
          isLinked ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)'
        )
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = highlightGradient
        ctx.fill()
      }

      if (hasShadow) ctx.shadowBlur = 0 // Reset for text

      // 5. Clean label rendering
      const shouldShowLabel =
        globalScale > 0.6 || isHovered || isSelected || (isBigHub && globalScale > 0.4)

      if (shouldShowLabel) {
        const baseFontSize = isSelected ? 13 : isBigHub ? 11 : 10
        const fontSize = Math.max(9, baseFontSize / globalScale)

        ctx.font = `${node.isPinned || isSelected ? '600' : '400'} ${fontSize}px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'

        // Subtle text shadow for readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 3

        ctx.fillStyle = isSelected ? '#ffffff' : colors.primary
        ctx.globalAlpha = isHovered || isSelected ? 1 : Math.min(0.85, globalScale * 1.3)

        const label = node.title || 'Untitled'
        ctx.fillText(label, node.x, node.y + size + 8 / globalScale)

        ctx.globalAlpha = 1
        ctx.shadowBlur = 0
      }
    },
    [selectedSnippetId, hoverNode, selectedNode, resolvedColors, activeMode]
  )

  // Optimization: Specialized hit-testing area (fast paths interaction detection)
  const paintNodePointerArea = useCallback(
    (node, color, ctx, globalScale) => {
      const isSelected = node.id === selectedSnippetId || node === selectedNode
      const isBigHub = (node.count || 0) >= 3
      const selectedMult = activeMode === 'neighborhood' ? 1.7 : 2.2
      const baseMult = isSelected ? selectedMult : isBigHub ? 1.8 : 1.3
      const size = node.val * baseMult

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(node.x, node.y, size + 5 / globalScale, 0, 2 * Math.PI, false)
      ctx.fill()
    },
    [selectedSnippetId, selectedNode, activeMode]
  )

  return (
    <div className="knowledge-graph-container">
      <div
        className="graph-viewport"
        ref={containerRef}
        style={graphTheme.background ? { backgroundColor: graphTheme.background } : {}}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <RefreshCw
              size={32}
              className="animate-spin text-[var(--color-accent-primary)] opacity-20"
            />
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={processedData}
            width={dimensions.width}
            height={dimensions.height}
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={paintNodePointerArea}
            backgroundColor="transparent"
            onNodeClick={(node) => {
              setSelectedNode(node)
              // We still allow external selection if needed, but local selection drives the UI
              // onSelectSnippet({ id: node.id, title: node.title })
            }}
            onNodeHover={handleNodeHover}
            onBackgroundClick={() => setSelectedNode(null)}
            nodeLabel={() => null}
            enableNodeDrag={true}
            onNodeDragEnd={(node) => {
              node.fx = node.x
              node.fy = node.y
            }}
            cooldownTicks={100}
            warmupTicks={50}
            // Link Visuals - Living, flowing connections (theme-adaptive)
            linkWidth={1.5}
            linkColor={() => {
              const baseColor = graphTheme.secondary || '#6b7280'
              // Extract RGB and add opacity for visibility on all themes
              return baseColor.startsWith('#')
                ? `${baseColor}40` // Hex color with 25% opacity
                : 'rgba(107, 116, 128, 0.25)'
            }}
            linkDirectionalParticles={(link) => {
              if (activeMode === 'orb') return 2
              if (activeMode === 'neighborhood') return 2
              // Animation on hover: emit particles for links connected to the hovered node
              if (hoverNode && link && link.source && link.target) {
                const sId = link.source.id || link.source
                const tId = link.target.id || link.target
                if (sId === hoverNode.id || tId === hoverNode.id) {
                  return 4
                }
              }
              return 0
            }}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleColor={() => graphTheme.accent || '#58a6ff'}
            // Obsidian-quality Physics - smooth and organic
            d3AlphaDecay={0.015}
            d3VelocityDecay={0.25}
            onEngineStop={() => graphRef.current?.zoomToFit(400, 50)}
          />
        )}

        {activeMode === 'orb' && <div className="orb-lens" />}

        {/* Nexus Header Tabs & Actions - Moved AFTER viewport for better stacking */}
        <div className="nexus-header-overlay" ref={toolbarRef}>
          <div className="nexus-drag-handle" ref={toolbarHandleRef} title="Drag to move toolbar">
            <div className="drag-dots"></div>
          </div>
          <div className="nexus-group">
            <button
              className={`nexus-tab ${activeMode === 'universe' ? 'active' : ''}`}
              onClick={() => setActiveMode('universe')}
              title="Universe: Radial Chronology"
            >
              <Globe size={18} />
            </button>
            <button
              className={`nexus-tab ${activeMode === 'neighborhood' ? 'active' : ''}`}
              onClick={() => setActiveMode('neighborhood')}
              title="Neighborhood: Local Context"
            >
              <Focus size={18} />
            </button>
            <button
              className={`nexus-tab ${activeMode === 'orb' ? 'active' : ''}`}
              onClick={() => setActiveMode('orb')}
              title="The Orb: Cinematic Focus"
            >
              <Atom size={18} />
            </button>
          </div>

          <div className="nexus-divider" />

          <div className="nexus-group">
            <button
              className="nexus-tab"
              onClick={() => {
                const fg = graphRef.current
                if (fg) fg.zoom(fg.zoom() * 1.3, 400)
              }}
              title="Zoom In"
            >
              <Plus size={18} />
            </button>
            <button
              className="nexus-tab"
              onClick={() => {
                const fg = graphRef.current
                if (fg) fg.zoom(fg.zoom() / 1.3, 400)
              }}
              title="Zoom Out"
            >
              <Minus size={18} />
            </button>
            <button
              className="nexus-tab"
              onClick={() => graphRef.current?.zoomToFit(600, 100)}
              title="Fit to View"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          <div className="nexus-divider" />

          <div className="nexus-group">
            <button className="nexus-tab" onClick={fetchData} title="Refresh Knowledge Graph">
              <RefreshCw size={18} />
            </button>
            <button
              className="nexus-tab"
              onClick={() => {
                const newTheme = generateRandomGraphTheme()
                updateSetting('graph.theme', newTheme)
              }}
              title="Magic Colors: Generate Random Theme"
            >
              <Sparkles size={18} />
            </button>
          </div>
        </div>

        {selectedNode && (
          <div className="nexus-selection-overlay">
            <button className="nexus-clear-btn" onClick={() => setSelectedNode(null)}>
              Clear Selection
            </button>
          </div>
        )}

        {/* Insight Card (Tooltip replacement) - Shows for hover OR selection */}
        {(hoverNode || selectedNode) && (
          <div
            className="nexus-insight-card"
            style={{ pointerEvents: 'auto' }}
            onMouseEnter={() => setIsHoveringCard(true)}
            onMouseLeave={() => {
              if (!selectedNode) {
                setIsHoveringCard(false)
              }
            }}
          >
            {(() => {
              const activeNode = hoverNode || selectedNode
              if (!activeNode) return null
              const s = allSnippets.find((sn) => sn.id === activeNode.id)
              if (!s) return null
              return (
                <>
                  <div className="card-header-label">NODE INSIGHT</div>
                  <div className="card-header">
                    <div
                      className="card-header-main"
                      onClick={() => onSelectSnippet({ id: s.id, title: s.title })}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-title">{s.title || 'Untitled'}</div>
                      <ExternalLink size={12} className="card-link-icon" />
                    </div>
                    <div className="card-meta">
                      {s.language && (
                        <span className="preview-lang-pill">{s.language.toUpperCase()}</span>
                      )}
                      <span>{(s.code || '').split(/\s+/).length} words</span>
                    </div>
                  </div>
                  <div
                    className="card-summary markdown-body"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                    onWheel={(e) => e.stopPropagation()} // Prevent graph zoom while scrolling card
                  ></div>
                  <div className="card-footer">
                    <div className="card-timestamp">
                      Modified:{' '}
                      {s.timestamp
                        ? new Date(s.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : '—'}
                    </div>
                    {selectedNode && (
                      <button
                        className="card-open-btn"
                        onClick={() => onSelectSnippet({ id: s.id, title: s.title })}
                      >
                        Open Snippet
                      </button>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* Legend */}
        <div className="graph-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: resolvedColors.moon }}></div>
            <span>Open Note</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: resolvedColors.central }}></div>
            <span>Hub (2+ links)</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: resolvedColors.accent }}></div>
            <span>Pinned</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KnowledgeGraph
