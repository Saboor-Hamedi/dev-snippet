import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Copy: () => <div>Copy</div>,
  Check: () => <div>Check</div>,
  X: () => <div>X</div>,
  Trash2: () => <div>Trash</div>
}))

describe('Editor UI Components', () => {
  describe('CopyButton', () => {
    let CopyButton

    beforeEach(async () => {
      const module = await import('../renderer/src/components/CopyButton.jsx')
      CopyButton = module.default
    })

    it('renders copy button', () => {
      render(<CopyButton text="test code" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('handles clipboard copy', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue()
        }
      })

      render(<CopyButton text="test code" />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test code')
    })

    it('handles empty text', () => {
      render(<CopyButton text="" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('NamePrompt', () => {
    let NamePrompt

    beforeEach(async () => {
      const module = await import('../renderer/src/components/modal/NamePrompt.jsx')
      NamePrompt = module.default
    })

    it('renders when open', () => {
      render(
        <NamePrompt
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          value=""
          onChange={vi.fn()}
        />
      )
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('displays current value', () => {
      render(
        <NamePrompt
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          value="test.js"
          onChange={vi.fn()}
        />
      )
      expect(screen.getByDisplayValue('test.js')).toBeInTheDocument()
    })

    it('calls onChange when typing', () => {
      const mockChange = vi.fn()
      render(
        <NamePrompt
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          value=""
          onChange={mockChange}
        />
      )

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'new.js' } })

      expect(mockChange).toHaveBeenCalled()
    })
  })
})
