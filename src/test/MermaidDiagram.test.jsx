// import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

// 1. Mock Mermaid library BEFORE importing the component
// The component uses 'import mermaid from "mermaid"' so we mock the default export.
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn()
  }
}))

// Import the mocked library to control valid/rejected states in tests
import mermaid from 'mermaid'

// Import the component under test
import MermaidDiagram from '../renderer/src/components/mermaid/MermaidDiagram'

describe('MermaidDiagram', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset any mocks if needed
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders placeholder when chart is empty', () => {
    render(<MermaidDiagram chart="" />)
    expect(screen.getByText(/Empty Diagram/i)).toBeInTheDocument()
    expect(screen.getByText(/Start typing Mermaid syntax/i)).toBeInTheDocument()
  })

  it('renders placeholder when chart is only whitespace', () => {
    render(<MermaidDiagram chart="   " />)
    expect(screen.getByText(/Empty Diagram/i)).toBeInTheDocument()
  })

  it('renders svg content upon successful mermaid render', async () => {
    // Mock successful render returning an object with 'svg' property
    mermaid.render.mockResolvedValue({ svg: '<svg id="mock-svg">Mock Diagram Content</svg>' })

    const code = 'graph TD; A-->B;'
    render(<MermaidDiagram chart={code} />)

    // 1. Loading state might happen or double buffer might keep partial state,
    // but eventually mermaid.render should be called.
    await waitFor(() => {
      expect(mermaid.render).toHaveBeenCalled()
    })

    // 2. Check if the svg content is injected
    // Since it's dangerouslySetInnerHTML, we look for the text or element
    await waitFor(() => {
      // The text "Mock Diagram Content" should allow us to find it?
      // Note: dangerouslySetInnerHTML might simply put the string.
      // screen.getByText won't find it if it's inside an SVG structure sometimes,
      // but here the string IS the innerHTML.
      // However, jsdom handles innerHTML.
      // We can inspect the container.
      const container = document.querySelector('.mermaid-container')
      expect(container).toBeInTheDocument()
      expect(container.innerHTML).toContain('Mock Diagram Content')
    })
  })

  it('displays error message on render failure', async () => {
    // Mock failure
    const errorMsg = 'Syntax Error: Invalid stuff'
    mermaid.render.mockRejectedValue(new Error(errorMsg))

    render(<MermaidDiagram chart="bad code" />)

    await waitFor(() => {
      expect(screen.getByText(/Mermaid Error:/i)).toBeInTheDocument()
      expect(screen.getByText(/Syntax Error: Invalid stuff/i)).toBeInTheDocument()
    })
  })

  it('debounces rapid changes', async () => {
    mermaid.render.mockResolvedValue({ svg: '<svg>debounce test</svg>' })
    vi.useFakeTimers()

    const { rerender } = render(<MermaidDiagram chart="A" />)

    // Update props genericly (simulate typing)
    rerender(<MermaidDiagram chart="AB" />)
    rerender(<MermaidDiagram chart="ABC" />)

    // Fast forward time by 100ms (debouncer is 150ms)
    vi.advanceTimersByTime(100)

    // Should NOT have called render yet (except maybe the first one if it wasn't cancelled fast enough?
    // Actually the first one sets a timeout. The second one should clear it.)
    // Note: useEffect cleanup clears timeout.

    // We expect 0 calls or 1 call if the first one fired immediately?
    // The implementation: const timeoutId = setTimeout(renderChart, 150)
    // So 0 calls at 100ms.
    expect(mermaid.render).not.toHaveBeenCalled()

    // Advance past 150ms
    vi.advanceTimersByTime(100)

    // Now it should have called render with the LAST chart "ABC"
    // But since "renderChart" is an async function inside the effect capturing "C" from closure...
    // Actually the effect re-runs on every chart change.
    // Effect A (chart="A") -> sets timeout A.
    // Rerender ("AB") -> Cleanup A (clears timeout A) -> Effect B -> sets timeout B.
    // Rerender ("ABC") -> Cleanup B -> Effect C -> sets timeout C.
    // Advance timers -> Timeout C fires.

    expect(mermaid.render).toHaveBeenCalledTimes(1)
    // Verify it was called with the latest id (random) and chart "ABC"
    // We can check the second arg of the first call
    expect(mermaid.render.mock.calls[0][1]).toBe('ABC')

    vi.useRealTimers()
  })
})
