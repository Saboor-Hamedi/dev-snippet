import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SnippetSidebar from '../renderer/src/components/workbench/SnippetSidebar.jsx'

// --- Mocks ---

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ChevronsUp: () => <div data-testid="icon-collapse-all">ChevronsUp</div>,
  Book: () => <div>BookIcon</div>,
  ChevronRight: () => <div>ChevronRight</div>,
  ChevronDown: () => <div>ChevronDown</div>,
  FileText: () => <div>FileText</div>,
  Folder: () => <div>Folder</div>,
  FolderOpen: () => <div>FolderOpen</div>,
  Search: () => <div>Search</div>,
  Plus: () => <div>Plus</div>,
  Pin: () => <div>Pin</div>
}))

// Mock VirtualList to render all items immediately (no virtualization for tests)
vi.mock('../renderer/src/components/common/VirtualList.jsx', () => ({
  default: ({ itemCount, itemData, children: Row }) => (
    <div data-testid="virtual-list">
      {Array.from({ length: itemCount }).map((_, index) => (
        <div key={index} data-testid={`row-${index}`}>
          <Row index={index} data={itemData} style={{ height: 30 }} />
        </div>
      ))}
    </div>
  )
}))

// Mock useSidebarStore
const mockSetSearchQuery = vi.fn()
const mockSetSelectedFolderId = vi.fn()
const mockSetSelectedIds = vi.fn()
const mockSetSidebarSelected = vi.fn()

vi.mock('../renderer/src/store/useSidebarStore.js', () => ({
  useSidebarStore: vi.fn(() => ({
    searchQuery: '',
    setSearchQuery: mockSetSearchQuery,
    selectedFolderId: null,
    setSelectedFolderId: mockSetSelectedFolderId,
    selectedIds: [],
    setSelectedIds: mockSetSelectedIds,
    isSidebarSelected: false,
    setSidebarSelected: mockSetSidebarSelected
  }))
}))

// Mock useSidebarLogic - The core logic we want to control
const mockStartCreation = vi.fn()
const mockCancelCreation = vi.fn()
const mockConfirmCreation = vi.fn()
const mockTogglePinned = vi.fn()
const mockCollapseAll = vi.fn()
const mockStartRenaming = vi.fn()
const mockCancelRenaming = vi.fn()
const mockHandleSelectionInternal = vi.fn()
const mockHandleItemKeyDown = vi.fn()

vi.mock('../renderer/src/components/workbench/sidebar/useSidebarLogic.js', () => ({
  default: () => ({
    treeItems: [
      { id: '1', type: 'folder', data: { id: '1', name: 'My Folder', collapsed: 0 }, depth: 0 },
      { id: '2', type: 'snippet', data: { id: '2', title: 'My Snippet.md' }, depth: 1 }
    ],
    lastSelectedIdRef: { current: null },
    handleSelectionInternal: mockHandleSelectionInternal,
    handleItemKeyDown: mockHandleItemKeyDown,
    startCreation: mockStartCreation,
    cancelCreation: mockCancelCreation,
    confirmCreation: mockConfirmCreation,
    togglePinned: mockTogglePinned,
    collapseAll: mockCollapseAll,
    editingId: null,
    startRenaming: mockStartRenaming,
    cancelRenaming: mockCancelRenaming,
    activePath: []
  })
}))

// Mock sub-components if needed
vi.mock('../renderer/src/components/common/PaneHeader.jsx', () => ({
  default: ({ children, title }) => (
    <div data-testid="pane-header">
      <span>{title}</span>
      {children}
    </div>
  )
}))

vi.mock('../renderer/src/components/common/SidebarBody.jsx', () => ({
  default: ({ children, noPadding, ...props }) => (
    <div data-testid="sidebar-body" {...props}>
      {children}
    </div>
  )
}))

vi.mock('../renderer/src/components/workbench/sidebar/SnippetSidebarRow.jsx', () => ({
  default: ({ data, index, style }) => (
    <div style={style}>
      Root Row {index}: {data.treeItems[index].data.name || data.treeItems[index].data.title}
    </div>
  )
}))

vi.mock('uuid', () => ({
  v4: () => 'mock-uuid'
}))

describe('SnippetSidebar', () => {
  const defaultProps = {
    isOpen: true,
    snippets: [{ id: '2', title: 'My Snippet.md', folder_id: '1' }],
    folders: [{ id: '1', name: 'My Folder' }],
    onSelect: vi.fn(),
    onToggleFolder: vi.fn(),
    onNew: vi.fn(), // onNewSnippet
    onMoveSnippet: vi.fn(),
    onMoveFolder: vi.fn(),
    onTogglePin: vi.fn(),
    dirtyIds: new Set(),
    selectedSnippet: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the sidebar structure', () => {
    render(<SnippetSidebar {...defaultProps} />)
    expect(screen.getByTestId('pane-header')).toBeInTheDocument()
    expect(screen.getByText('EXPLORER')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('renders tree items via VirtualList', () => {
    render(<SnippetSidebar {...defaultProps} />)
    expect(screen.getByTestId('virtual-list')).toBeInTheDocument()
    // We mocked 2 items in useSidebarLogic
    expect(screen.getByText('My Folder')).toBeInTheDocument()
    expect(screen.getByText('My Snippet.md')).toBeInTheDocument()
  })

  it('calls collapseAll when collapse button is clicked', () => {
    render(<SnippetSidebar {...defaultProps} />)
    const collapseBtn = screen.getByTestId('icon-collapse-all').closest('button')
    fireEvent.click(collapseBtn)
    expect(mockCollapseAll).toHaveBeenCalled()
    expect(mockSetSidebarSelected).toHaveBeenCalledWith(true)
  })

  it('updates search query on input', () => {
    render(<SnippetSidebar {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText('Search...')
    fireEvent.change(searchInput, { target: { value: 'test query' } })
    // setSearchQuery comes from store logic, wait for possible debounce if any
    expect(mockSetSearchQuery).toHaveBeenCalledWith('test query')
  })

  it('handles background click to clear selection', () => {
    render(<SnippetSidebar {...defaultProps} />)
    // The background click area is usually the SidebarBody or a specific container
    // We need to find the element with the onClick handler.
    // In our mock, VirtualList takes up space, but the container around it handles the click.
    // Let's try to click the virtual list container's parent if possible, or just the body.
    
    // Note: In the real component, it's the div with ref={parentRef}.
    // Since we can't easily query by ref, we look for the container styling or structure.
    // Based on the code, it's the div wrapping the VirtualList.
    
    const virtualList = screen.getByTestId('virtual-list')
    const sidebarBody = virtualList.parentElement
    
    // Simulate clicking the background (target === currentTarget)
    fireEvent.click(sidebarBody)
    
    expect(mockSetSidebarSelected).toHaveBeenCalledWith(true)
    expect(mockSetSelectedFolderId).toHaveBeenCalledWith(null)
    expect(defaultProps.onSelect).toHaveBeenCalledWith(null)
  })
})
