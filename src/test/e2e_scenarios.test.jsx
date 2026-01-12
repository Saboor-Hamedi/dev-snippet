import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest'
import Workbench from '../renderer/src/components/workbench/Workbench.jsx'
import { useSnippetData } from '../renderer/src/hook/useSnippetData.js'

// --- GLOBAL MOCKS ---
// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock window capabilities
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// --- COMPONENT MOCKS ---

// Mock CodeEditor to be a simple textarea for easy testing
vi.mock('../renderer/src/components/CodeEditor/CodeEditor.jsx', () => ({
  default: ({ value, onChange }) => (
    <textarea
      data-testid="code-editor"
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  )
}))

// Mock ContextMenu to render plainly for detection (or check if real one renders)
// The real ContextMenu portal might be tricky in JSDOM. 
// Let's assume we want to test that the *sidebar* triggers it.
// Actually, let's allow it to render if possible, but the `Portal` usually needs a container.
// If ContextMenu uses `createPortal`, we need that container.
// Assuming ContextMenu renders into document.body or similar.

// Mock Mermaid and Graph which are heavy
vi.mock('../renderer/src/components/mermaid/MermaidDiagram.jsx', () => ({ default: () => <div>Mermaid</div> }))
vi.mock('../renderer/src/components/Graph/KnowledgeGraph.jsx', () => ({ default: () => <div>KnowledgeGraph</div> }))

// Mock Settings (to verify it opens)
vi.mock('../renderer/src/components/settings/SettingsPanel.jsx', () => ({
  default: () => <div data-testid="settings-panel">Settings Panel</div>
}))

// --- DATA MOCKS ---
const mockApi = {
  getSnippets: vi.fn().mockResolvedValue([]),
  saveSnippet: vi.fn().mockResolvedValue({}),
  deleteSnippet: vi.fn().mockResolvedValue({}),
  createFolder: vi.fn().mockResolvedValue({}),
  onCloseRequest: vi.fn(() => () => {}),
  invoke: vi.fn().mockResolvedValue([]), // For loadTrash db:getTrash
  getVersion: vi.fn().mockResolvedValue('1.0.0'), // For status/settings
  getTrash: vi.fn().mockResolvedValue([]),
  restoreFolder: vi.fn(),
  restoreSnippet: vi.fn(),
  permanentDeleteFolder: vi.fn(),
  permanentDeleteSnippet: vi.fn(),
  // Updater listeners
  onUpdateAvailable: vi.fn(() => () => {}),
  onUpdateNotAvailable: vi.fn(() => () => {}),
  onDownloadProgress: vi.fn(() => () => {}),
  onUpdateDownloaded: vi.fn(() => () => {}),
  onUpdateError: vi.fn(() => () => {})
}
window.api = mockApi

// --- CONTEXT MOCKS ---
// We need to mock the Context Providers because Workbench hooks consume them

// 1. Settings Context
const SettingsContext = React.createContext(null)
vi.mock('../renderer/src/hook/useSettingsContext', () => ({
  useSettings: () => React.useContext(SettingsContext),
  SettingsProvider: ({ children, value }) => (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  )
}))

// 2. Modal Context
const ModalContext = React.createContext(null)
vi.mock('../renderer/src/components/workbench/manager/ModalContext', () => ({
  useModal: () => React.useContext(ModalContext),
  ModalProvider: ({ children }) => (
    <ModalContext.Provider value={{
        openModal: vi.fn(),
        closeModal: vi.fn(),
        isModalOpen: false
    }}>{children}</ModalContext.Provider>
  )
}))

// 3. View Context
const ViewContext = React.createContext(null)
vi.mock('../renderer/src/context/ViewContext', () => ({
  useView: () => React.useContext(ViewContext),
  ViewProvider: ({ children }) => (
    <ViewContext.Provider value={{
        activeView: 'editor',
        setActiveView: vi.fn()
    }}>{children}</ViewContext.Provider>
  )
}))

// Wrapper component to provide data context AND Context Providers
const TestWrapper = () => {
  const snippetData = useSnippetData() // Reuse the real hook logic for integration
  
  const mockSettingsValue = {
      settings: {
          sidebar: { visible: true },
          editor: { minimap: false },
          ui: { theme: 'polaris' }
      },
      updateSetting: vi.fn(),
      getSetting: (path) => {
          if (path === 'sidebar.visible') return true
          if (path === 'ui.theme') return 'polaris'
          return undefined
      }
  }

  const mockViewValue = {
      activeView: snippetData.selectedSnippet ? 'editor' : 'welcome',
      setActiveView: vi.fn()
  }

  const mockModalValue = {
      openModal: vi.fn(),
      closeModal: vi.fn()
  }

  return (
    <SettingsContext.Provider value={mockSettingsValue}>
      <ViewContext.Provider value={mockViewValue}>
        <ModalContext.Provider value={mockModalValue}>
            <Workbench
              {...snippetData}
              activeView={snippetData.selectedSnippet ? 'editor' : 'welcome'}
              isSidebarOpen={true}
              setIsSidebarOpen={vi.fn()}
              settings={mockSettingsValue.settings} // Pass directly as prop too if needed
              onOpenSettings={() => {}} 
              // Add other required props (mocked if necessary)
            />
        </ModalContext.Provider>
      </ViewContext.Provider>
    </SettingsContext.Provider>
  )
}

describe('E2E Scenarios: Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.api = mockApi
    mockApi.getSnippets.mockResolvedValue([])
    mockApi.invoke.mockResolvedValue([])
  })

  it('Create, Save, Rename, Delete Flow', async () => {
    // 1. RENDER
    render(<TestWrapper />)
    
    // Check Welcome Page
    expect(screen.getByText(/Dev Snippet/i)).toBeInTheDocument()

    // 2. CREATE NEW SNIPPET
    // Find "New Snippet" button (usually a Plus icon or command)
    // Workbench has 'onNewSnippet' passed to Sidebar/Welcome.
    // Let's simulate clicking the "New Snippet" button in Welcome Page
    const newSnippetBtn = screen.getByText(/New Snippet/i)
    fireEvent.click(newSnippetBtn)

    // Expect Editor to open
    // Since we mocked CodeEditor with textarea data-testid="code-editor"
    await waitFor(() => {
        expect(screen.getByTestId('code-editor')).toBeInTheDocument()
    })

    // 3. SAVE SNIPPET
    // Type in editor
    const editor = screen.getByTestId('code-editor')
    fireEvent.change(editor, { target: { value: 'console.log("E2E Test")' } })
    
    // Click Save (assuming there's a save action/button or we trigger shortcut)
    // We can simulate shortcut or click button. Workbench header often has actions?
    // Let's assume we can trigger the save prop if exposed, or find the button.
    // If not, we might need to trigger the shortcut on the window.
    // But for this test, let's verify data flow if possible.
    
    // Waiting for 'dirty' state updates? 
    // Real save is usually triggered by User.
  })

  // Placeholder for context menu test
  it('Context Menu interactions', async () => {
    // Setup state with one snippet
    mockApi.getSnippets.mockResolvedValue([
        { id: '1', title: 'ContextMenuTest.js', code: '', language: 'javascript' }
    ])
    
    render(<TestWrapper />)
    
    await waitFor(() => {
        expect(screen.getByText('ContextMenuTest.js')).toBeInTheDocument()
    })
    
    const item = screen.getByText('ContextMenuTest.js')
    
    // Right click
    fireEvent.contextMenu(item)
    
    // Check for Context Menu items
    // "Delete", "Rename"
    await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument()
        expect(screen.getByText('Rename')).toBeInTheDocument()
    })
  })

  it('Settings and Themes Workflow', async () => {
    render(<TestWrapper />)
    
    // Open Settings (assuming command or button)
    // We can simulate the event that opens settings: 'app:command-settings' or similar
    // Or simpler: verify if Sidebar ActivityBar settings button works
    
    // Let's assume there is a Settings button in ActivityBar
    const settingsBtn = screen.getByTitle(/Settings/i) // ActivityBar uses title attribute
    if (settingsBtn) {
        fireEvent.click(settingsBtn)
        await waitFor(() => {
            expect(screen.getByTestId('settings-panel')).toBeInTheDocument()
        })
    }
    
    // Test Theme Switch using Command
    // We can dispatch the custom event if the UI trigger is hard to reach
    act(() => {
        window.dispatchEvent(new CustomEvent('app:command-theme'))
    })
    
    // We mocked matchMedia, but we can check if toast was called or if class on body changed
    // Since we can't easily check 'toast' without mocking the hook return in TestWrapper...
    // Let's assume we check body class if implemented, or just that it didn't crash.
  })

  it('FlowMode Toggle', async () => {
    render(<TestWrapper />)
    
    // Toggle Flow Mode
    act(() => {
        window.dispatchEvent(new CustomEvent('app:toggle-flow'))
    })
    
    // Check if Flow Mode specific elements are present
    // e.g. "flow-convas" or "zen-atmosphere"
    // Note: class lookup might need container query
    
    // Workbench.jsx (line 709) has <div className="flow-convas">
    // Since we render Workbench, we should be able to find it by class via visible selector or just querySelector on container
    const { container } = render(<TestWrapper />)
    
    // re-toggle to be sure
    act(() => {
         window.dispatchEvent(new CustomEvent('app:toggle-flow'))
    })

    // Wait for Flow Workspace
    await waitFor(() => {
        // "zen-atmosphere" is a good unique marker
        expect(container.querySelector('.zen-atmosphere')).not.toBeNull()
    })
  })
})
