# Lean Snippet Manager Teardown and Rebuild

## Scope and Assumptions

. Keep CommandPlate as well

* Keep core runtime libraries: `react`, `react-dom`, Electron tooling, `better-sqlite3`.

* Remove heavy UI/editor packages; the only content-rendering dependency added will be `react-syntax-highlighter`.

* Preserve autosave behavior and theme variables; eliminate Projects feature entirely.

## Dependencies Purge

* Remove packages from `package.json` under `dependencies`:

  * `@uiw/react-markdown-editor`, `@uiw/react-markdown-preview`, `react-markdown`, `remark-gfm`, `highlight.js`, `sugar-high`, `monaco-css`, `lucide-react`, `@dnd-kit/*`, `@emotion/*`, `@mui/material`, `@headlessui/react`, `react-modal`, `use-debounce`.

* Add `react-syntax-highlighter`.

* Renderer cleanup:

  * Delete UIW CSS imports in `src/renderer/src/main.jsx` (remove `@uiw/react-markdown-editor/markdown-editor.css` and `@uiw/react-markdown-preview/markdown.css`).

## Renderer Simplification

* Replace advanced editors with a simple `<textarea>`.

* Implement a permanent Split-Pane layout (Editor + Live Preview), resizable via a lightweight custom divider.

* Remove preview toggle and all advanced decorations/context menus.

### Files to Update

* `src/renderer/src/components/SnippetEditor.jsx`

  * Replace `<MarkdownEditor ... />` with a styled `<textarea>` bound to `code`.

  * Preserve autosave: replace `use-debounce` with a local debounced `onChange` (simple `setTimeout`/`clearTimeout`).

    * Current autosave logic: see `debouncedSave` and trigger effect in `src/renderer/src/components/SnippetEditor.jsx:34-51`, `116-119`.

  * Remove preview toggle button logic (`Eye/EyeOff`) and `previewMode` state (`218-233`, `113-114`, `270-271`).

  * Remove context menu overlay and handlers (`onContextMenu` and `menu` block at `181-334`).

  * Remove mention suggestion overlays and related state/handlers (`335-371` and any `mention*` state).

  * Ensure font size is `16px` for the `<textarea>` and preview.

  * Ensure container uses flex to fill full height; a single scrollbar at parent container.

* Create `src/renderer/src/components/SplitPane.jsx`

  * Minimal two-pane horizontal/vertical splitter:

    * Structure: `div` container (flex), `div` editor pane, `div` resizer bar, `div` preview pane.

    * Resizer: `onMouseDown` captures drag and adjusts flex-basis or width.

* Create `src/renderer/src/components/LivePreview.jsx`

  * Render syntax-highlighted code using `react-syntax-highlighter`.

  * Language detection: retain simplified detection from editor (`txt`, `js`, `py`, `html`, `css`, `json`, `sql`, `cpp`, `java`, `sh`, `md`).

  * For `md`: provide minimal rendering (either plain text or very light regex formatting), avoiding external markdown libraries.

### Layout Integration

* In `SnippetEditor.jsx`, wrap `<textarea>` and `<LivePreview>` inside `<SplitPane>`, always visible.

* Remove any toggle wiring to hide/show preview; panes are always present and resizable.

## Theme Preservation

* Continue using existing theme variables and dark-mode class:

  * Variables (e.g., `--editor-bg`, `--text-main`, `--border-color`, `--accent`) from `src/renderer/src/assets/index.css`.

  * Data color mode already applied: `data-color-mode` in `SnippetEditor` (`src/renderer/src/components/SnippetEditor.jsx:261-263`).

* Apply variables to the new `<textarea>` and preview pane backgrounds, text colors, borders.

## Database and IPC Refactor (Snippets Only)

* Remove the Projects table and all project-related IPC.

### Main Process

* `src/main/index.js`

  * Drop `projects` table creation and column migration; delete IPC handlers:

    * Creation and pragma block: see `src/main/index.js:initDB` (`CREATE TABLE IF NOT EXISTS projects ...`).

    * IPC: remove handlers `db:getProjects`, `db:saveProject`, `db:deleteProject`, `db:saveProjectDraft`, `db:commitProjectDraft` (`file contains these blocks`).

  * Optional: execute `DROP TABLE IF EXISTS projects;` once during migration.

### Preload Bridge

* `src/preload/index.js`

  * Remove `getProjects`, `saveProject`, `deleteProject`, `saveProjectDraft`, `commitProjectDraft` from the exposed API.

### Renderer Data Layer

* `src/renderer/src/hook/useSnippetData.js`

  * Remove `projects` state and all calls to `window.api.*Project*`.

  * Simplify selection and CRUD flows to snippets only.

## UI Simplification (Remove Projects)

* Remove Projects view and all references to `activeView === 'projects'`.

### Files

* `src/renderer/src/components/workbench/Workbench.jsx`

  * Remove Projects branch rendering and `onNewProject` wiring; always use snippet flows.

* `src/renderer/src/components/layout/ActivityBar.jsx`

  * Remove Projects icon and view toggling.

* `src/renderer/src/components/layout/Explorer.jsx`

  * Remove projects mode; only show snippets list.

* `src/renderer/src/components/layout/Sidebar.jsx`

  * Remove `onCreateProject`; only snippet creation remains.

* `src/renderer/src/components/SnippetLibrary.jsx`

  * Remove `activeView` duality; strip all project-related logic (filters, drafts, DnD typing as project).

  * Remove `CreateProjectModal` integration.

* `src/renderer/src/components/CommandPalette.jsx`

  * Remove project entries and badges.

* `src/renderer/src/components/WelcomePage.jsx`

  * Remove `onNewProject` prop; keep `onNewSnippet`.

## Styling and Usability Mandates

* Font size: enforce `16px` in both editor `<textarea>` and preview.

* Full height: use flex containers so the editor/preview area fills the remaining viewport height; ensure a single scrollbar from the parent container.

* CSS updates (if needed): add or adjust utility classes to bind `font-size: 16px` and `min-height: 100%` for the editor/preview panes.

## Verification Plan

* Build and run in preview/dev:

  * Create/edit a snippet; observe autosave after typing pause.

  * Confirm theme colors apply to textarea and preview in light/dark.

  * Confirm preview highlights for key languages using `react-syntax-highlighter`.

  * Ensure both panes are always visible and resizable; no toggle present.

  * Verify no references to Projects remain; IPC calls succeed for snippets; DB contains only `snippets`, `settings`, `theme`.

## Code References

* Autosave hook and triggers to mirror:

  * `src/renderer/src/components/SnippetEditor.jsx:34-51`, `116-119`.

* Preview toggle to remove:

  * `src/renderer/src/components/SnippetEditor.jsx:213-233`, `270-271`.

* UIW editor import and usage to replace:

  * `src/renderer/src/components/SnippetEditor.jsx:6`, `265-271`.

* Projects DB and IPC to remove:

  * `src/main/index.js` (table creation and `ipcMain.handle('db:*Project*', ...)` blocks).

* Preload projects bridge to remove:

  * `src/preload/index.js` (`getProjects`, `saveProject`, `deleteProject`, `saveProjectDraft`, `commitProjectDraft`).

* Renderer projects usage to remove:

  * `src/renderer/src/hook/useSnippetData.js` and components listed above.

## Deliverables

* Updated `package.json` with purged dependencies and `react-syntax-highlighter` added.

* New `SplitPane.jsx` and `LivePreview.jsx` components.

* Refactored `SnippetEditor.jsx` using `<textarea>` with debounced autosave and always-on split view.

* Removed Projects feature across main, preload, and renderer.

* Verified app behavior: fast editor, stable autosave, clean theme application, simplified UI.

