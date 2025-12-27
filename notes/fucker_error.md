# Error Report: TilePointer & Mermaid State Crashes

## 1. The Errors (Resolved)

### Case A: The "TilePointer" Scroll Crash

```text
TypeError: Cannot destructure property 'tile' of 'parents.pop(...)' as it is undefined.
    at TilePointer.advance (chunk-4QGRRRLT.js?v=...)
    at DocView.updateInner (chunk-4QGRRRLT.js?v=...)
```

### Case B: The "Undefined ID" Facet Crash

```text
TypeError: Cannot read properties of undefined (reading 'id')
    at _EditorState.facet (chunk-JUHZDVLE.js?v=...)
    at MermaidWidget.toDOM (richMarkdown.js:326:31)
```

## 2. Root Cause Analysis

1. **Asynchronous Height Shifts**: In "Live Preview" mode, heavy widgets like Mermaid diagrams or Tables render *after* CodeMirror has already finished its layout pass. When the diagram finally appears, the widget's height suddenly changes. CodeMirror's measurement tiles (which track the vertical position of every line) become stale. When you scroll, the `TilePointer` tries to find a specific tile at a calculated Y-coordinate, misses, and crashes the entire engine.
2. **State-Detached Facet Access**: Accessing `view.state.facet(EditorView.dark)` inside a widget's `toDOM` can sometimes hit an "orphaned" or partially initialized state during rapid re-renders (e.g., when switching snippets). This leads to the internal CodeMirror "Facet ID" lookup failing with a null pointer.

## 3. The Address (Implementation Details)

To achieve 100% stability while keeping the rich "Obsidian-style" features, we implemented the following "Defensive Logic" patterns:

- **The Height Notification Pattern (`requestMeasure`)**: 
  In `richMarkdown.js`, we now call `view.requestMeasure()` immediately after the Mermaid diagram finishes its asynchronous SVG render. This informs CodeMirror: *"Hey, my height just changed, please recalculate your line tiles!"* This stops the `TilePointer` crashes during scrolling.

- **Defensive State Capture**: 
  We no longer rely solely on `view.state.facet`. Instead, we capture the theme state synchronously in `toDOM` using a robust fallback mechanism:

```javascript
let isDark = true;
try {
  isDark = view.state.facet(EditorView.dark);
} catch (e) {
  isDark = document.documentElement.classList.contains('dark');
}
```

This ensures the widget always knows the theme even if the editor is in a transient state.

- **Safe Document Indexing**: 
  Implemented `safeLineAt` and `safeLine` helpers that clamp all position requests to `[0, doc.length]`. This prevents the `Position out of range` errors that happen when the syntax tree is slightly behind the actual document content.

- **Strict "No Transition" Enforcement**: 
  All editor-internal elements (cursors, lines, gutters) have `transition: none !important` forced in `buildTheme.js`. Layout measurements must be instantaneous to avoid "fractional drift" crashes.

---

**Summary: The editor is now protected by asynchronous measurement synchronization and defensive state-checking.**
*Updated for Dev Snippet Stability Patch v2.0*
