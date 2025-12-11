import { vi } from 'vitest'
import '@testing-library/jest-dom'

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

// Mock document for components that access it during render
// Object.defineProperty(global, 'document', {
//   value: {
//     documentElement: {
//       classList: {
//         contains: vi.fn(() => false),
//         add: vi.fn(),
//         remove: vi.fn()
//       },
//       getAttribute: vi.fn(() => null),
//       setAttribute: vi.fn(),
//       style: {
//         setProperty: vi.fn()
//       }
//     },
//     body: {
//       appendChild: vi.fn(),
//       removeChild: vi.fn()
//     },
//     querySelector: vi.fn(() => null),
//     addEventListener: vi.fn(),
//     removeEventListener: vi.fn(),
//     createElement: vi.fn(() => ({
//       style: {},
//       setAttribute: vi.fn(),
//       getAttribute: vi.fn()
//     }))
//   },
//   writable: true
// })
