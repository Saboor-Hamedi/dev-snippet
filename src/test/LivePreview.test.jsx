// import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import LivePreview from '../renderer/src/components/livepreview/LivePreview'
import React from 'react'

// Mock the lazy loaded component
// Because it's lazy loaded via import(), we mock the module.
vi.mock('../renderer/src/components/mermaid/MermaidDiagram', () => ({
  default: ({ chart }) => <div data-testid="mermaid-mock">{chart}</div>
}))

describe('LivePreview', () => {
  it('renders standard markdown', async () => {
    render(<LivePreview code="# Hello World" />)
    // react-markdown renders h1. use findBy because it might be async/transition
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Hello World')
  })

  it('renders code block', async () => {
    const code = '```javascript\nconst a = 1;\n```'
    const { container } = render(<LivePreview code={code} />)

    // Check if language identifier is present
    expect(await screen.findByText('javascript')).toBeInTheDocument()

    // Check if code content is present (might be split across spans)
    const body = container.querySelector('.code-block-body')
    expect(body).toBeInTheDocument()
    expect(body).toHaveTextContent('const a = 1;')
  })

  it('renders mermaid diagram for mermaid language block', async () => {
    const code = '```mermaid\ngraph TD;\n```'
    render(<LivePreview code={code} />)

    // It uses Suspense, so we might see "Loading Diagram..." first.
    // Wait for the mock to appear.
    await waitFor(() => {
      expect(screen.getByTestId('mermaid-mock')).toBeInTheDocument()
    })

    expect(screen.getByTestId('mermaid-mock')).toHaveTextContent('graph TD;')
  })
})
