# Documentation System Implementation Plan

## Objective

Implement a lightweight, integrated documentation system without affecting application performance.

## Proposed Solution: "Virtual Documentation Snippets"

Instead of embedding a separate PDF viewer or website, we will leverage the application's existing Markdown capabilities. Documentation will be treated as **ReadOnly Virtual Snippets**.

### Architecture

1. **Virtual ID Namespace**: Use a special ID prefix (e.g., `doc:intro`, `doc:shortcuts`) to distinguish documentation from user snippets.
2. **Lazy Loading**: Documentation content (Markdown strings) will be stored in a separate module and only loaded into memory when the user specifically opens a help topic.
3. **WikiLink Integration**: The documentation will support `[[WikiLinks]]`, allowing users to navigate between help topics (e.g., clicking `[[Keyboard Shortcuts]]` in the Intro opens the Shortcuts guide).

### Performance Impact

* **Memory**: Negligible (Text strings are tiny).
* **Render**: Zero impact on the main editor until a doc is opened.
* **Bundle Size**: Minimal (Pure text).

### Implementation Steps

1. **Data Source**: Create `src/renderer/src/documentation/content.js` to dictionary-map IDs to Markdown content.
2. **Snippet Resolver**: Update `SnippetLibraryInner.jsx` to intercept the "Open Documentation" command:
   * If a `doc:` ID is requested, fetch content from the data source.
   * Construct a temporary "Virtual Snippet" object.
   * Set it as the `selectedSnippet`.
3. **UI Entry Point**:
   * Add a **"Help" (?)** icon to the Activity Bar or Settings Menu.
   * On click, open `doc:index` (Table of Contents).

### Example Content Structure (`doc:index`)

```markdown
# Dev Snippet Documentation

Welcome to **Dev Snippet**, your knowledge base.

## Topics
- [[doc:shortcuts|Keyboard Shortcuts]]
- [[doc:graph|Using the Knowledge Graph]]
- [[doc:flow|Flow Mode Essentials]]
- [[doc:theme|Customizing Themes]]
```

This approach makes the documentation feel like a natural part of the "Obsidian-like" ecosystem.
