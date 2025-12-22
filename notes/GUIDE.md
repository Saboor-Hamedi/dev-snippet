# Dev Snippet: Complete Documentation

Welcome to the comprehensive documentation for **Dev Snippet**, a high-performance, local-first code snippet manager built with Electron and React. This document covers both user functionalities and the internal technical architecture.

---

## 📚 Table of Contents
1. [User Guide](#1-user-guide)
2. [Technical Architecture](#2-technical-architecture)
3. [Data Flow Diagrams](#3-data-flow-diagrams)
4. [Project Structure](#4-project-structure)

---

## 1. User Guide

### 🚀 Core Principles
1.  **Markdown First**: Optimized for technical writing with GFM support.
2.  **Local Privacy**: 100% offline, data stored in `better-sqlite3`.
3.  **Speed**: Keyboard-centric workflow with instant search.

### ✨ Key Features
-   **Smart Editor**: Auto-detects languages, supports 100+ syntax highlights.
-   **Live Preview**: Real-time rendering with **Mermaid** diagrams and **MathJax**.
-   **Wiki-Links**: Connect snippets using `[[WikiLink]]` syntax.
-   **PDF Export**: Pro-grade `A4` PDF generation with custom margins.
-   **Mini Browser**: Detach the preview into a floating "Always on Top" window.

### ⌨️ Keyboard Shortcuts
| Action | Shortcut |
| :--- | :--- |
| **Quick Open** | `Ctrl + P` |
| **New Snippet** | `Ctrl + N` |
| **Save** | `Ctrl + S` |
| **Rename** | `Ctrl + R` |
| **Toggle Preview** | `Ctrl + Shift + \` |
| **Export PDF** | `UI Button` |

---

## 2. Technical Architecture

Dev Snippet follows a secure **Electron** architecture with strict separation between the **Main Process** (Backend) and **Renderer Process** (Frontend).

### 🏗️ System Overview

```mermaid
graph TD
    subgraph "Main Process (Node.js)"
        Main[index.js]
        IPC[IPC Handlers]
        DB[(SQLite Database)]
        FS[File System]
        Export[PDF Engine]
    end

    subgraph "Renderer Process (React)"
        UI[App UI]
        Editor[CodeMirror Editor]
        Preview[Live Preview Manager]
        Sandbox[Sandboxed Iframe]
    end

    UI -->|Invoke| IPC
    IPC -->|Query| DB
    IPC -->|Write| FS
    IPC -->|Invoke| Export
    
    Editor -->|OnChange| Preview
    Preview -->|postMessage| Sandbox
```

### 🧠 Core Modules

#### 1. Main Process (`src/main`)
-   **`index.js`**: Application entry point. Handles lifecycle and window creation.
-   **`ipc/`**: Modularized IPC handlers (`database.js`, `export.js`, `window.js`).
-   **`database/`**: Manages the local `snippets.db` using `better-sqlite3`.

##### 🗄️ Database Schema (ER Diagram)

```mermaid
erDiagram
    SNIPPETS ||--o{ SEARCH_INDEX : indexes
    SNIPPETS {
        string id PK
        string title "Not Null"
        text code "Not Null"
        text code_draft
        string language "Default: markdown"
        int timestamp
        string tags "JSON or CSV"
        boolean is_draft
    }

    SETTINGS {
        string key PK
        string value
    }

    SEARCH_INDEX {
        text title
        text code
        text tags
    }
```

#### 2. Renderer Process (`src/renderer`)
-   **`SnippetEditor.jsx`**: The heart of the app. Manages editor state, autosave timers, and preview coordination.
-   **`LivePreview.jsx`**: A React wrapper that manages the **Sandboxed Preview**.
    -   *Security*: Uses an `iframe` (`public/preview.html`) to render user content.
    -   *Performance*: Uses `fastMarkdown.js` (Regex-based) for instant rendering of massive files.
-   **`previewGenerator.js`**: Shared logic for generating HTML for **PDF Export** and **Mini Browser**.

---

## 3. Data Flow Diagrams

### 💾 1. Autosave Workflow
The app uses a "lazy save" mechanism to prevent database thrashing.

```mermaid
sequenceDiagram
    participant User
    participant Editor
    participant Timer
    participant IPC
    participant DB

    User->>Editor: Type Character
    Editor->>Timer: Reset 5s Timer
    
    note right of Timer: User stops typing
    
    Timer->>Editor: Timeout Fired
    Editor->>IPC: invoke('db:saveSnippet')
    IPC->>DB: UPDATE snippets...
    DB-->>IPC: Success
    IPC-->>Editor: Acknowledge
    Editor->>User: Show "Saved" Indicator
```

### 📄 2. PDF Export Pipeline
How we generate pixel-perfect PDFs from raw Markdown/Mermaid.

```mermaid
sequenceDiagram
    participant User
    participant Renderer
    participant PreviewGen
    participant Main
    participant HiddenWin as Hidden Window
    participant FS as File System

    User->>Renderer: Click "Export PDF"
    Renderer->>PreviewGen: generateFullHtml(forPrint: true)
    PreviewGen-->>Renderer: Returns Clean HTML (No UI, White BG)
    
    Renderer->>Main: invoke('export:pdf', html)
    Main->>HiddenWin: Create & Load HTML
    
    note over HiddenWin: Wait 2s for Mermaid/Highlight.js
    
    HiddenWin->>HiddenWin: printToPDF({ margins: 'default' })
    HiddenWin-->>Main: Buffer
    Main->>FS: writeFile(userPath.pdf)
    Main-->>Renderer: Success
    Renderer->>User: Show Toast "Export Complete"
```

### 🖼️ 3. Live Preview & Sandboxing
Ensures user code runs safely without freezing the main UI.

```mermaid
graph LR
    subgraph "React Context"
        Editor[SnippetEditor] -- Raw Code --> LivePreview
    end

    subgraph "Sandboxing Boundary"
        LivePreview -- postMessage(html, theme) --> Iframe[preview.html]
    end

    subgraph "Iframe Environment"
        Iframe --> Script[previewScript.js]
        Script --> Mermaid[Mermaid Engine]
        Script --> HLJS[Highlight.js]
        Mermaid --> DOM[Rendered SVG]
    end
```

---

## 4. Project Structure (Mindmap)

```mermaid
mindmap
  root((Dev Snippet))
    src
      main(Main Process)
        index.js
        database
          schema.js
        ipc
          export.js
          database.js
      renderer(Renderer Process)
        index.html
        src
          App.jsx
          components
            LivePreview
            SnippetEditor
            Mermaid
          utils
            fastMarkdown.js
            previewGenerator.js
          assets
            markdown.css
            variables.css
    resources
      icons
    package.json
```

---

*Documentation generated for Dev Snippet v1.1.5*
