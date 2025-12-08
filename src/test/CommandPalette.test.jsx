import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CommandPalette from '../renderer/src/components/CommandPalette.jsx'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <div>Search</div>,
  FileCode: () => <div>File</div>,
  ArrowRight: () => <div>Arrow</div>
}))

describe('CommandPalette', () => {
  const mockOnClose = vi.fn()
  const mockOnSelect = vi.fn()

  const mockSnippets = [
    { id: '1', title: 'test.js', code: 'console.log("hello")', language: 'javascript' },
    { id: '2', title: 'hello.py', code: 'print("world")', language: 'python' },
    { id: '3', title: 'styles.css', code: 'body { margin: 0; }', language: 'css' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock scrollIntoView which isn't available in jsdom
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <CommandPalette
        isOpen={false}
        onClose={mockOnClose}
        snippets={mockSnippets}
        onSelect={mockOnSelect}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders when open', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={mockOnClose}
        snippets={mockSnippets}
        onSelect={mockOnSelect}
      />
    )
    expect(screen.getByPlaceholderText('Search snippets...')).toBeInTheDocument()
  })

  it('displays all snippets', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={mockOnClose}
        snippets={mockSnippets}
        onSelect={mockOnSelect}
      />
    )
    expect(screen.getByText('test.js')).toBeInTheDocument()
    expect(screen.getByText('hello.py')).toBeInTheDocument()
  })

  it('filters by title', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={mockOnClose}
        snippets={mockSnippets}
        onSelect={mockOnSelect}
      />
    )
    const input = screen.getByPlaceholderText('Search snippets...')
    fireEvent.change(input, { target: { value: 'hello' } })
    expect(screen.getByText('hello.py')).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={mockOnClose}
        snippets={mockSnippets}
        onSelect={mockOnSelect}
      />
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('selects on Enter', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={mockOnClose}
        snippets={mockSnippets}
        onSelect={mockOnSelect}
      />
    )
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(mockOnSelect).toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalled()
  })
})
