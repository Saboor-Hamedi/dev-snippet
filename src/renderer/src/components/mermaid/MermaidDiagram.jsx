import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'base', // Use 'base' to allow full customization
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif', // Match app font
  themeVariables: {
    darkMode: true,
    background: '#354154ff', // slate-800 match
    primaryColor: '#41516cff', // blue-500
    primaryTextColor: '#e2e8f0', // slate-200
    primaryBorderColor: '#3b82f6',
    lineColor: '#64748b', // slate-500
    secondaryColor: '#0f172a', // slate-900
    tertiaryColor: '#1e293b',
    edgeLabelBackground: '#0f172a' // Dark background for connection labels
  }
})

const MermaidDiagram = ({ chart }) => {
  const containerRef = useRef(null)
  const [svgContent, setSvgContent] = useState('')
  const [error, setError] = useState(null)
  const lastRenderedChart = useRef('')

  useEffect(() => {
    let isMounted = true

    const renderChart = async () => {
      // 1. Handle empty content gracefully
      if (!chart || !chart.trim()) {
        if (isMounted) {
          setSvgContent('')
          setError(null)
          lastRenderedChart.current = ''
        }
        return
      }

      // Sanitize input: replace smart quotes with straight quotes
      const cleanChart = chart
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")

      // Optimization: Don't re-render if identical (should be handled by memo, but extra safety)
      if (cleanChart === lastRenderedChart.current) return

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`

        // Async render
        const { svg } = await mermaid.render(id, cleanChart)

        if (isMounted) {
          // SUCCESS: Swap the content instantly
          setSvgContent(svg)
          setError(null)
          lastRenderedChart.current = cleanChart
        }
      } catch (err) {
        if (isMounted) {
          // FAILURE: Show error, but maybe keep old content?
          // For now, we update error state. The UI below decides whether to hide SVG.
          const cleanMsg = err.message ? err.message.split('\n')[0] : 'Syntax Error'
          setError(cleanMsg)
        }
      }
    }

    // Debounce the render slightly to avoid choking on rapid typing
    const timeoutId = setTimeout(renderChart, 150)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [chart])

  // UI RENDER LOGIC
  // If we have an error, we show it ON TOP of or INSTEAD of the diagram?
  // Current UX decision: Show error box, hide stale diagram to avoid confusion.
  if (error) {
    return (
      <div className="p-4 border border-red-500/30 bg-red-500/10 rounded text-red-400 text-xs font-mono animate-fade-in">
        <div className="font-bold mb-1 opacity-80">Mermaid Error:</div>
        {error}
      </div>
    )
  }

  if (!svgContent) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-[var(--color-text-secondary)] opacity-40">
        <div className="text-sm font-medium">Empty Diagram</div>
        <div className="text-xs mt-1">Start typing Mermaid syntax...</div>
      </div>
    )
  }

  // If we have content (even if stale while new one is rendering), show it.
  // The 'setSvgContent' inside the effect will instantly swap the HTML string when ready.
  return (
    <div
      className="mermaid-container flex justify-center p-4 bg-transparent overflow-x-auto transition-opacity duration-200"
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}

export default React.memo(MermaidDiagram)
