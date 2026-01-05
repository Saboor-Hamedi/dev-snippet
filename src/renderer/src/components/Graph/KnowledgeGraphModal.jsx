import React from 'react'
import UniversalModal from '../universal/UniversalModal'
import KnowledgeGraph from './KnowledgeGraph'
import { Search, Share2 } from 'lucide-react'
import './KnowledgeGraphModal.css'

/**
 * Knowledge Graph Modal
 *
 * Full-screen modal displaying the Knowledge Graph visualization.
 * Accessible via Ctrl+G / Cmd+G keyboard shortcut.
 */
const KnowledgeGraphModal = ({ isOpen, onClose, snippets, onSelectSnippet }) => {
  const [isMaximized, setIsMaximized] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [graphStats, setGraphStats] = React.useState({ nodes: 0, links: 0 })
  const [selectedNodeInfo, setSelectedNodeInfo] = React.useState(null)
  const searchInputRef = React.useRef(null)

  if (!isOpen) return null

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <>
          <Share2 size={14} className="text-[var(--color-accent-primary)]" />
        </>
      }
      width="96vw"
      height="94vh"
      noOverlay={false}
      resetPosition={false}
      customKey="knowledge_graph_modal"
      className="knowledge-graph-modal-wrapper no-padding"
      headerHeight={40}
      hideHeaderBorder={true}
      allowMaximize={false}
      noTab={true}
      noRadius={true}
      headerContent={
        <div className="nexus-modal-header-search no-drag">
          <div
            className="nexus-header-search-group no-drag"
            onClick={(e) => {
              e.stopPropagation()
              searchInputRef.current?.focus()
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <Search size={14} className="nexus-header-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="nexus-header-search-input"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      }
      footer={
        <div className="nexus-modal-footer-stats">
          <div className="flex items-center gap-4 px-4 h-8 text-[11px] opacity-60 font-medium tracking-wide uppercase">
            <span>Nodes: {graphStats.nodes}</span>
            <span>Links: {graphStats.links}</span>
            {selectedNodeInfo && (
              <>
                <div className="w-[1px] h-3 bg-white/10" />
                <span className="text-[var(--color-accent-primary)]">
                  Selected: {selectedNodeInfo.name || selectedNodeInfo.title || 'Untitled'}
                </span>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col w-full h-full overflow-hidden">
        <KnowledgeGraph
          selectedSnippetId={null}
          searchQuery={searchQuery}
          onSelectSnippet={(snippet) => {
            onClose()
            onSelectSnippet(snippet)
          }}
          onDataLoaded={(data) => {
            setGraphStats({
              nodes: data.nodes?.length || 0,
              links: data.links?.length || 0
            })
          }}
          onNodeSelect={(node) => {
            setSelectedNodeInfo(node)
          }}
          onClose={onClose}
        />
      </div>
    </UniversalModal>
  )
}

export default KnowledgeGraphModal
