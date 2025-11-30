## Overview

* Replace the textarea-based editor with a single Monaco instance that serves both input and rendered view via decorations.

* Remove the separate markdown preview and split layout; Monaco becomes the authoritative visual source.

* Preserve autosave, backend IPC, and theming.

## Files to Modify/Remove

1. Remove

* `src/renderer/src/components/MarkdownPreview.jsx`

1. Update

* `src/renderer/src/components/SnippetEditor.jsx`

* `src/renderer/src/components/ViewToolbar.jsx` (remove preview/split controls)

* `src/renderer/src/assets/index.css` (ensure decoration classes cover full-width Monaco and theme consistency)

1. Keep (logic remains intact)

* Backend IPC handlers, database save/delete functions, theme loader, and main/index files (no changes)

## SnippetEditor.jsx Changes

1. Replace Editor Component

* Replace `react-simple-code-editor` usage with `MonacoMarkdownEditor`.

* Props: `value={code}`, `onChange={setCode}`, `language={language}`.

1. Remove Preview/Split Layout

* Delete grid split container and divider logic.

* Remove `layoutMode`, `previewPosition`, `splitRatio`, `containerRef`, `previewRef`, and related handlers.

* Remove preview selection lock states and derived preview HTML (`renderMarkdown`, `useHighlight`, `enhanceMentionsHtml`, etc.).

1. Remove MarkdownPreview Usage

* Remove imports and JSX rendering of `MarkdownPreview` entirely.

1. Keep Autosave and Language Detection

* Keep `debouncedSave` (1000ms) and language auto-detect logic as-is.

* Ensure Monaco `onChange` feeds `code` state so autosave continues silently.

1. Mentions and Context Menu

* Temporarily disable textarea-specific mention placement that relies on `textareaId` and DOM cursor metrics.

* Port mentions later via Monaco APIs (overlay widget, content widgets, or inline decorations). For this iteration, keep click handling in preview removed; Monaco-only session doesn’t need preview click hooks.

## ViewToolbar Cleanup

* Remove preview/split toggle buttons and handlers.

* Keep actions relevant to creating snippets/projects and generic controls.

## MonacoMarkdownEditor Enhancements (Already Present)

* Decorations: Hide code fence markers and style fenced blocks with unified background/padding/border; headers H1/H2/H3 styled inline; lists stylized with glyph margin.

* Cursor Stability: Atomic `changeDecorations` transaction with immediate restore (`saveViewState`/`restoreViewState`, selection, position, scroll), and `requestAnimationFrame` reassertion.

* Paste Handling: Immediate decoration re-apply on paste.

* Resize/Fullscreen: Recompute layout and re-apply decorations on window resize and Monaco layout changes.

## CSS and Theme Integrity

* Ensure `markdown-*` classes in `index.css` use stable `line-height: 24px` and theme-friendly colors.

* Confirm editor container inherits `var(--editor-bg)` and dark/light theme classes.

## Performance

* Keep `useDebouncedCallback` at \~100ms for decoration apply; autosave remains 1000ms and independent of visual updates.

## Verification Steps

1. Launch in dev and open a markdown snippet.
2. Type `# Hello` and confirm in-place transformation without caret jump.
3. Paste fenced code block (with or without language) and confirm instant block styling with Monaco syntax highlighting.
4. Toggle fullscreen/resize window; ensure decorations re-apply and caret remains stable on subsequent typing.
5. Confirm snippet autosave triggers after idle and backend IPC calls remain intact.

## Deliverables

* Single-column layout: Sidebar + full-width Monaco editor.

* Removed preview component and split-pane UI; no duplicate rendering paths.

* Stable, performant, WYSIWYG-style inline markdown rendering within Monaco.

## Follow-up (Optional)

* Reintroduce mentions via Monaco overlay/content widgets with inline decorations.

* Additional markdown elements (blockquote, tables via GFM) decoration polish.

  # Suggested Addition

4\. **Context Preservation:** Verify that clicking 'New Snippet' or 'New Project' still correctly identifies the currently selected sidebar tab (Snippet vs. Project) to create the correct file type, as this logic often gets inadvertently removed with the other toolbar handlers.
