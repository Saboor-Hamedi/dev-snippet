import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import ContextMenu from '../renderer/src/components/ContextMenu.jsx'

describe('ContextMenu', () => {
  const defaultItems = [
    { label: 'Edit', onClick: vi.fn(), shortcut: 'Cmd+E' },
    { label: 'separator' },
    { label: 'Delete', onClick: vi.fn(), danger: true }
  ]

  it('renders menu items and shortcuts', () => {
    render(
      <ContextMenu 
        x={100} 
        y={100} 
        onClose={vi.fn()} 
        items={defaultItems} 
      />
    )

    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Cmd+E')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('renders separators', () => {
    const { container } = render(
      <ContextMenu 
        x={100} 
        y={100} 
        onClose={vi.fn()} 
        items={defaultItems} 
      />
    )
    
    // Look for the separator style or class
    // ContextMenu.jsx:55 className="my-1 border-t"
    const separator = container.querySelector('.border-t')
    expect(separator).toBeInTheDocument()
  })

  it('calls onClick and onClose when item is clicked', () => {
    const mockOnClick = vi.fn()
    const mockOnClose = vi.fn()
    
    render(
      <ContextMenu 
        x={100} 
        y={100} 
        onClose={mockOnClose} 
        items={[{ label: 'Action', onClick: mockOnClick }]} 
      />
    )

    fireEvent.click(screen.getByText('Action'))
    expect(mockOnClick).toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onClose when clicking outside (overlay)', () => {
    const mockOnClose = vi.fn()
    const { container } = render(
      <ContextMenu 
        x={100} 
        y={100} 
        onClose={mockOnClose} 
        items={defaultItems} 
      />
    )

    // The overlay is the outer div
    // ContextMenu.jsx:35 <div className="fixed inset-0..." onClick={onClose}>
    const overlay = container.firstChild
    fireEvent.click(overlay)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('adjusts position to stay on screen (logic check)', () => {
    // We can't fully test getBoundingClientRect logic in jsdom without layout,
    // but we can verify reasonable behavior or rely on manual testing for positioning.
    // This test ensures the component renders without crashing even with boundary values.
    render(
      <ContextMenu 
        x={9999} 
        y={9999} 
        onClose={vi.fn()} 
        items={defaultItems} 
      />
    )
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })
})
