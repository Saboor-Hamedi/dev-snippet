import pkg from '../../../../package.json'

const version = pkg.version

export const docs = {
  'doc:manual': {
    title: 'Enterprise Technical Reference',
    content: `# DevSnippet Enterprise Edition
**Comprehensive Unified User Guide & Technical Specification**
*Project Version ${version} • High-Fidelity Knowledge Management Architecture*

---

## 1. Executive Summary: The Local-First Revolution
DevSnippet is a specialized desktop application engineered for technical professionals who require a high-performance, non-volatile environment for documentation and code management. Operating on a strictly local-first architectural pattern, it eliminates the latencies and privacy concerns associated with cloud-based snippet managers.

### 1.1 Architectural Philosophy
The core objective of DevSnippet is to provide a "Zero-Latency" experience. This is achieved through three primary pillars:
1.  **Rendering Isolation**: Utilizing a Shadow DOM surface to prevent layout thrashing.
2.  **Virtualized Navigation**: Utilizing React-Window for O(1) rendering of astronomical snippet counts.
3.  **Local Indexing**: Native SQLite integration for sub-millisecond full-text queries.

---

## 2. Global Control Matrix & Interaction Patterns
Efficiency in DevSnippet is driven by a keyboard-centric navigation model. The interface is designed to be fully navigable without the use of a mouse, mirroring the workflow of high-end IDEs.

### 2.1 The Unified Header & Command Palette
The application header serves as more than a visual frame; it is a context-aware navigation hub.
- **Title Interaction**: Snippet titles are synchronized in real-time. Modifying the title in the header automatically updates the database and regenerates WikiLink pointers throughout the library.
- **Command Palette (Ctrl + P)**: The primary interface for state transitions. From the palette, users can invoke UI changes, search metadata, or teleport to deep-linked folders.

### 2.2 Standardized Shortcut Reference
| Domain | Keyboard Shortcut | Functional Output |
| :--- | :--- | :--- |
| **Global** | \`Ctrl + P\` | Invoke Command Palette & Fuzzy Search |
| **Global** | \`Ctrl + G\` | Open Knowledge Graph Force-Directed Engine |
| **Global** | \`Ctrl + ,\` | Access System Preferences & JSON Configuration |
| **Workspace** | \`Ctrl + Shift + F\` | Toggle Flow Mode (Professional workstation) |
| **Editor** | \`Ctrl + S\` | Manual Flush to Disk (Auto-save is active) |
| **Editor** | \`Ctrl + / \` | Toggle Block/Line Comment |
| **Editor** | \`Ctrl + D\` | Duplicate Active Line Displacement |
| **Editor** | \`Shift + Alt + F\` | Auto-Format Active Snippet (Prettier Engine) |
| **Intelligence** | \`Ctrl + Shift + A\` | Invoke AI Pilot Sidebar Panel |
| **System** | \`Ctrl + Shift + T\` | Access Trash & Soft-Deleted Recovery Vault |

---

## 3. Flow Mode: The Desktop Workstation Environment
Flow Mode is an advanced UI state for intensive research and technical development. It transitions the application from a standard vertical layout into a multi-windowed "Station" architecture.

### 3.1 Synchronized Workstations
In Flow Mode, the Editor and Previewer are promoted to independent floating surfaces. 
- **Layer Promotion**: Windows are promoted to the GPU compositor layer (\`translateZ(0)\`), ensuring that dragging and resizing operations do not impact the main thread rendering performance.
- **Visual Shielding**: During movement, expensive CSS filters like \`backdrop-filter: blur()\` are temporarily suspended to maintain a target 60FPS interaction rate.
- **Persistence**: Window positions in Flow Mode are saved to \`persistentPosition.json\`. If you position your preview on a secondary high-resolution monitor, it will reliably spawn there every time Flow Mode is toggled.

### 3.2 Dual-Pane Logic
The Flow Workspace implements a strict relationship between its constituent windows:
1.  **Master (Editor)**: Driving the input and state changes.
2.  **Slave (Preview)**: A high-fidelity reflection of the markdown state, utilizing the Shadow DOM to prevent any CSS bleed from the editor environment.

---

## 4. Systems Integration & Configuration (settings.json)
DevSnippet uses a declarative configuration model. While many settings are accessible via the UI, the \`settings.json\` file provides the authoritative state of the application.

### 4.1 Configuration Pathology
- **Windows**: \`%APPDATA%/dev-snippet/settings.json\`
- **Unix-based**: \`~/.config/dev-snippet/settings.json\`

### 4.2 Comprehensive JSON Key Mapping
Below is an exhaustive breakdown of the configuration schema:

\`\`\`json
{
  "ui": {
    "theme": "polaris",
    "fontSize": 14,
    "fontFamily": "Outfit, Inter, sans-serif",
    "sidebarWidth": 260,
    "headerCollapsed": false,
    "statusBarVisible": true,
    "universalLock": {
      "modal": false,
      "graph": true
    }
  },
  "editor": {
    "autoSave": true,
    "autoSaveInterval": 3000,
    "lineNumbers": true,
    "wordWrap": true,
    "minimap": false,
    "tabSize": 2,
    "indentUnit": "space",
    "bracketMatching": true,
    "closeBrackets": true,
    "history": true,
    "search": true,
    "highlightActiveLine": true
  },
  "ai": {
    "provider": "deepseek",
    "apiKey": "sk-...",
    "model": "deepseek-v3",
    "maxTokens": 4096,
    "temperature": 0.7,
    "stream": true,
    "systemPrompt": "You are a professional software architect assistant..."
  },
  "security": {
    "protectSettingsFile": true,
    "confirmDeletion": true
  }
}
\`\`\`

---

## 5. Metadata & The Knowledge Graph
Your snippets are more than isolated files; they are nodes in a complex graph of technical knowledge.

### 5.1 Physics-Based Visualization
The Knowledge Graph (\`Ctrl + G\`) uses a D3-force directed layout. This simulation runs on the HTML5 Canvas to handle thousands of nodes without lag.
- **Link Strength**: Relationships are defined by the frequency of inter-note references.
- **Node Centrality**: Larger nodes indicate "Hub" documents with many incoming links.
- **Spatial Navigation**: The graph is interactive. Dragging a node will pin it in space, allowing you to organize your thoughts visually. Clicking a node instantly teleports the editor to that snippet's state.

### 5.2 Real-time Indexing
Every time you type, the engine updates the **WikiLink Map** in the background. The Sidebar uses this map to instantly highlight live vs. broken links. This metadata is also used by the FTS5 search engine to prioritize "Hub" notes in result rankings.

---

## 6. Engineering the AI Pilot
The AI Pilot is an LLM-integrated interface that provides context-aware assistance.

### 6.1 Context Awareness
When the AI sidebar is opened, it automatically gathers "Stationary Context":
1.  **Active Snippet**: The title and full markdown body.
2.  **Folder Context**: Other snippets within the same folder may be included if relevant.
3.  **Language Metadata**: The AI is informed of the active snippet's language to optimize code generation.

### 6.2 The Reasoning Engine
The Pilot uses a streaming architecture. This means as the LLM (e.g., DeepSeek-V3) generates tokens, they are instantly verified against a markdown validation layer and rendered into the UI. This eliminates the "waiting" period associated with block-based AI responses.

---

## 7. Performance & Stability Benchmarks
DevSnippet is designed to stay responsive under industrial load.

### 7.1 Virtualization & Big Data
The application handles 10,000+ snippets through a strategy called **Windowing**. Instead of rendering every item in the sidebar, the application only renders what is currently visible in the viewport plus a 5-item buffer. This keeps the DOM weight minimal, regardless of your database size.

### 7.2 The Performance Barrier
A "Performance Barrier" exists for single documents. When a single snippet exceeds 20,000 words, expensive real-time parsing features are throttled to ensure the UI thread remains interactive. In such cases, split the document using the "Continue" naming pattern to resume performance metrics.

---

## 8. Advanced Markdown Specification
The Rendering Engine supports GitHub Flavored Markdown (GFM) with enterprise extensions.

### 8.1 Complex Table Layouts
GFM tables offer robust data presentation:
| Operation | Complexity | Strategy |
| :--- | :--- | :--- |
| **Indexing** | O(log n) | B-tree Index |
| **Rendering** | O(1) | Virtual Scroller |
| **Hashing** | O(n) | SHA-256 |

### 8.2 Admonition Blocks (Callouts)
Use structured callouts to isolate technical warnings:
\`\`\`markdown
::: info
Standard technical detail or implementation notice.
:::

::: warning
Significant risks associated with data loss or system state.
:::

---

## 9. Troubleshooting & Maintenance
For system stability, adhere to the following operational guidelines.

### 9.1 Data Integrity
- **Database Backups**: Regularly export your dataset to JSON via the Settings menu.
- **Corruption Recovery**: If the SQLite file becomes locked, use the "Rebuild" command in the developer terminal.

### 9.2 Common Interface Resolutions
- **Interface Jitter**: Ensure your font is set to a monospaced or high-stability variable font like "Outfit." Proportional fonts with inconsistent line heights can cause layout shifts during marker transparency transitions.
- **Ghosting Corners**: If you see a pixel overlap on the modal edges, set \`borderRadius={false}\` to force a pure hardware-accelerated 0px clip.

---

## 10. Future Technical Roadmap
The development trajectory for DevSnippet focuses on moving heavy computation to lower-level languages.
1.  **WASM Integration**: Moving the Markdown parser from Node-based to a Rust-based WebAssembly module for a 400% increase in parsing speed.
2.  **Backlink Analysis**: Implementation of a dedicated "Backlinks" panel to show what documents reference the current one.
3.  **Semantic Search**: Integrating vector embeddings (local-only) for natural language search queries.

---

## 11. Developer Appendix
Technical specifications for the build ecosystem.
- **Runtime**: Electron 39.x (Node 22.x)
- **Engine**: CodeMirror 6 (Integrated via custom extensions)
- **UI Framework**: React 19 (Strict Mode)
- **Style Engine**: Vanilla CSS with hardware-accelerated transitions
- **Persistence**: Zustand for transient state, electron-store for global state.

---

*Technical reference for DevSnippet. Authored and maintained by the Antigravity Engine.*
*Confidentiality: Public Technical Reference*
*Revision Audit: January 8, 2026*

*Note: This document is designed to be exhaustive. If you require further clarification on specific IPC channels or SQLite triggers, refer to the source-level comments in \`src/main/db/manager.js\`.*
`
  }
}
