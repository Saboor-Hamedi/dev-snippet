# DevSnippet Roadmap: The Path to Obsidian-Grade Robustness

This document outlines the architectural and technological strategy to evolve **DevSnippet** from a snippet manager into a robust, high-performance MD editor comparable to Obsidian.

---

## 1. Architectural Pivot: "Selective Hiding" vs. "Hard Replacement"

### Current State

We currently use **Widget Replacement**. When the editor sees a table or mermaid block, it removes the text and injects a DOM element.

* **Pros**: Easy to implement.
* **Cons**: Breaks cursor movement, causes "jumping" when loading, and makes text selection across blocks nearly impossible.

### The Strategy

Shift to **Inline Markup Hiding** (Decoration-based).

* **Mechanism**: CodeMirror should treat Markdown symbols (`**`, `##`, `|`, `[[`) as "collapsible decorations."
* **The "Focus Rule"**: Only the line where your cursor is currently located shows the Raw Markdown. Every other line remains rendered.
* **Result**: The document height stays 100% constant, eliminating the "scrolling jump" bug forever.

---

## 2. Advanced Technology gaps

### 🛠️ Background Indexing (The "Knowledge Graph")

Obsidian feels powerful because it "knows" your files.

* **Missing**: A background search and link indexer.
* **Technology**: **SQLite + FTS5** (already partially in place) but we need a **Relational Link Table**.
* **Goal**: Every time you type `[[`, the app should instantly suggest headers and blocks from other snippets based on a pre-computed index, not a new search.

### 💨 Web Worker Parsing

* **Missing**: Currently, we parse Markdown on the UI thread. This causes "lag" on files with 10k+ lines.
* **Plan**: Offload the heavy Mermaid rendering and Markdown-to-HTML conversion to a **Web Worker**. The UI should never "freeze" while a diagram is generating.

### 🧩 Unified Plugin System

* **Missing**: We have separate logic for `LivePreview.jsx` and the `CodeEditor` engine.
* **Plan**: Build a **Unified Plugin Registry**. If a new feature (like a Kanban board) is added, it should be a single plugin that provides both the CodeMirror widget and the Reading Mode component.

---

## 3. The 3 Modes: Robustness Matrix

| Feature | Source Mode (Text) | Live Preview (Hybrid) | Reading Mode (View) |
| :--- | :--- | :--- | :--- |
| **Philosophy** | "Data is King" | "Visual Simplicity" | "Presentation Quality" |
| **Editing** | Pure Text + LSP | In-place Inline Editing | No Editing (Clean UI) |
| **Technology** | Language Servers (LSP) | React Portals | Static React Components |
| **Missing** | Vim/Emacs Keymaps | Context-aware Toolbars | Interactive Data Views |

---

## 4. Immediate Roadmap (The "Big Three")

1. [x] **Cursor-Aware Decoration Extension**: Implement a new CodeMirror ViewPlugin that manages the "Reveal on Focus" logic. This is the #1 step to robustness.
2. [x] **Shared Parsing Engine**: Standardize on `unified.js` (`remark` + `rehype`) for every mode to ensure what you see in Live Preview is *exactly* what gets exported to PDF.
3. [ ] **Local Asset Management**: A system to handle local images/files (attachments) within the snippet library using dedicated folder structure.

`npm install unified remark-parse remark-rehype rehype-stringify remark-emoji remark-external-links`
`npm install rehype-highlight`

---

## 5. Vision Summary

DevSnippet should not just be a place to store code; it should be an **Integrated Intelligence Environment**. The goal is to make the "Source" feel powerful, the "Live" feel magic, and the "Reading" feel like a professional document.
