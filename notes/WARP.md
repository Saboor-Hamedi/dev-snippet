# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

dev-snippet is an Electron + React desktop application for creating, editing, and managing code/text snippets. It features a CodeMirror-based editor with syntax highlighting, markdown preview, autosave functionality, and SQLite storage.

**Note:** As of v1.2.0, the application is strictly a **Markdown Editor**.

## Development Commands

### Core Development

```powershell
# Install dependencies (runs electron-rebuild for better-sqlite3 automatically)
npm install

# Run in development mode (hot reload enabled)
npm run dev

# Build the application (compiles with electron-vite)
npm run build
```

### Testing

```powershell
# Run tests with Vitest
npm test

# Run tests with UI
npm test:ui
```

### Code Quality

```powershell
# Lint code with ESLint
npm run lint

# Format code with Prettier
npm run format
```

### Native Module Rebuild

```powershell
# Rebuild native modules (e.g., better-sqlite3) if installation fails
npm run rebuild
```

### Building Distributables

```powershell
# Build for Windows (produces NSIS installer)
npm run build:win

# Build for macOS (run on macOS only)
npm run build:mac

# Build for Linux (AppImage, snap, deb)
npm run build:linux

# Build for unpacked (for testing)
npm run build:unpack
```

### Icon Generation

```powershell
# Generate platform-specific icons from source PNG (requires 1024x1024 PNG)
npm run make:icons
```

## Architecture Overview

### Electron Multi-Process Architecture

This application follows the standard Electron multi-process model:

#### Main Process (`src/main/index.js`)

- Creates and manages the BrowserWindow with frameless design
- Initializes SQLite database (`snippets.db`) in userData directory
- Exposes IPC handlers for:
  - File system operations (read, write, dialogs)
  - Database CRUD operations (snippets, settings, themes)
  - Window controls (minimize, maximize, close, custom resize)
  - Settings file management with live watching
- Handles platform-specific icon selection (`.ico` on Windows, `.png` elsewhere)

#### Preload Script (`src/preload/index.js`)

- Bridges main and renderer processes with context isolation
- Exposes safe API to renderer via `contextBridge`:
  - `window.api.*` - IPC invocations for DB, file system, dialogs
  - `window.electron.*` - Electron toolkit utilities
  - `window.api.onSettingsChanged` - Event listener for external settings changes

#### Renderer Process (`src/renderer/src`)

- React application built with Vite
- Single-page application with view-based navigation

### Key Component Hierarchy

```
App.jsx (SettingsProvider)
  └── SnippetLibrary.jsx (Main orchestrator)
      ├── Workbench.jsx (View container)
      │   ├── Header.jsx (Title bar with window controls)
      │   ├── SnippetEditor.jsx (Code editing view)
      │   │   ├── AdvancedSplitPane.jsx
      │   │   │   ├── CodeEditor.jsx (CodeMirror wrapper)
      │   │   │   └── LivePreview.jsx (Markdown rendering)
      │   │   ├── StatusBar.jsx
      │   │   └── NamePrompt.jsx (Save dialog)
      │   ├── WelcomePage.jsx
      │   └── SettingsModal.jsx
      ├── CommandPalette.jsx (Cmd/Ctrl+P)
      ├── RenameModal.jsx
      └── DeleteModel.jsx
```

### Data Flow Pattern

1. **Loading Data**:
   - `useSnippetData` hook fetches snippets from main process via IPC on mount
   - Data flows: SQLite DB → Main Process → IPC → Renderer State

2. **Saving Data**:
   - User edits trigger debounced autosave (5 seconds)
   - Manual save via Ctrl+S bypasses debounce
   - Data flows: Renderer State → IPC → Main Process → SQLite DB
   - Local state updated immediately to prevent flicker

3. **Settings Management**:
   - Settings stored in two places:
     - `settings.json` in userData (for persistence and external editing)
     - SQLite DB `settings` table (legacy)
   - `SettingsProvider` context provides global settings access
   - File watcher in main process detects external changes and broadcasts to renderer

### Database Schema (SQLite via better-sqlite3)

#### `snippets` Table

- `id` (TEXT, PK) - Timestamp-based unique ID
- `title` (TEXT) - Snippet name with extension
- `code` (TEXT) - Saved content
- `code_draft` (TEXT) - Unsaved draft content (for autosave)
- `language` (TEXT) - Syntax highlighting language key (Always 'markdown')
- `timestamp` (INTEGER) - Creation/modification time
- `type` (TEXT) - Always 'snippet' (projects removed)
- `tags` (TEXT) - Auto-extracted from content
- `is_draft` (INTEGER) - Boolean flag for unsaved snippets
- `sort_index` (INTEGER) - User-defined sort order

#### `settings` Table

- `key` (TEXT, PK)
- `value` (TEXT)

#### `theme` Table

- `id` (TEXT, PK)
- `name` (TEXT)
- `colors` (TEXT) - JSON string

### CodeMirror Editor Integration

The editor (`src/renderer/src/components/CodeEditor/CodeEditor.jsx`) is a wrapper around `@uiw/react-codemirror`:

- **Extensions loaded dynamically** from `extensions/buildExtensions.js`:
  - Markdown Language Support (Standard + Custom Highlighting)
  - Theme (dark/light mode aware)
  - Zoom controls (Ctrl+MouseWheel, Ctrl+Plus/Minus)
  - Word wrap configuration
  - Custom keymaps

- **Language detection**:
  - STRICTLY enforced to Markdown (`.md`).
  - All new files and renames are forced to have `.md` extension.
  - Multi-language support has been removed to focus on a premium Markdown experience.

### Keyboard Shortcuts

Managed by `useKeyboardShortcuts` hook. Active shortcuts:

- **Escape**: Close modals/command palette (doesn't close editor)
- **Ctrl/Cmd + N**: Create new snippet
- **Ctrl/Cmd + S**: Save snippet (opens name prompt if untitled)
- **Ctrl/Cmd + P**: Toggle command palette
- **Ctrl/Cmd + R**: Rename selected snippet
- **Ctrl/Cmd + Delete**: Delete selected snippet
- **Ctrl/Cmd + Shift + W**: Close editor/go to welcome
- **Ctrl/Cmd + Shift + C**: Copy snippet code to clipboard
- **Ctrl/Cmd + Shift + R**: Restore default window size (in App.jsx)
- **Ctrl + MouseWheel**: Zoom in/out (in editor)

## Important Implementation Details

### Autosave Mechanism

1. Debounced 5-second timer starts on any code change
2. `onAutosave` callback notifies parent of status: `'pending'` → `'saving'` → `'saved'`
3. Cancellation via global map `window.__autosaveCancel` (keyed by snippet ID)
4. Autosave disabled if:
   - Snippet is being deleted (`isDeletingRef`)
   - Snippet has no title (drafts)
   - User toggled autosave off in settings

### Draft vs. Saved Snippets

- **Draft**: `is_draft = true`, no title or unsaved changes
- **Saved**: `is_draft = false`, has title, persisted to DB
- Draft content stored in `code_draft` column until committed

### Native Module: better-sqlite3

- Required for synchronous SQLite access in main process
- Must be rebuilt after installation: `electron-rebuild -f -w better-sqlite3`
- Automated via `postinstall` script
- If issues occur, run `npm run rebuild` manually
- **IMPORTANT**: better-sqlite3 is externalized in `electron.vite.config.mjs` and unpacked in ASAR (see `electron-builder.yml`)

### Settings Context (`useSettingsContext`)

- Provides global settings object via React Context
- Settings loaded from `settings.json` on mount
- `getSetting(key)` uses dot notation: `'editor.wordWrap'`
- `updateSettings(updates)` merges partial updates and persists to file
- External changes detected by file watcher and auto-reload

### Custom Window Controls

- Frameless window (`frame: false`) for custom title bar
- Renderer controls via IPC:
  - `window.api.minimize()`
  - `window.api.toggleMaximize()`
  - `window.api.closeWindow()`
  - `window.api.restoreDefaultSize()`

## Testing Strategy

- **Framework**: Vitest with jsdom environment
- **Location**: `src/test/`
- **Example**: `SnippetEditor.test.jsx`
- **Mocks**: Hooks and child components mocked for isolation
- **Run single test**: `npx vitest run SnippetEditor.test.jsx`

## Common Pitfalls

### 1. DevTools Toggle

- DevTools controlled by `ENABLE_DEVTOOLS` constant in `src/main/index.js` (line 2)
- Set to `true` for development, `false` for production builds

### 2. Icon Display

- Development: Icons loaded from `resources/` folder
- Production: Icons embedded from `build/` folder during packaging
- Use `npm run make:icons` to generate from `src/renderer/public/icon.png`

### 3. Native Module Errors

- Symptom: "better-sqlite3 module not found" or segfault
- Fix: Run `npm run rebuild` to recompile for current Electron version
- Ensure you're not running dev mode with wrong architecture (x64 vs arm64)

### 4. IPC Communication

- Always use `invoke/handle` pattern, never `send/on` for request-response
- Main process handlers return values synchronously or as promises
- Never expose Node.js APIs directly to renderer

### 5. State Sync Issues

- Snippets list updated immediately after save to prevent UI flicker
- Use `skipSelectedUpdate` option in `saveSnippet` if you don't want to refresh `selectedSnippet`
- Deleted snippet IDs stored temporarily in `window.__deletedIds` to prevent autosave race conditions

## File Locations

- **Database**: `%APPDATA%\dev-snippet\snippets.db` (Windows)
- **Settings**: `%APPDATA%\dev-snippet\settings.json` (Windows)
- **User data**: Retrieved via `app.getPath('userData')` in main process
- **Build output**: `out/` (after `npm run build`)
- **Distributable**: `dist/` (after `npm run build:win`)

## Configuration Files

- `electron.vite.config.mjs`: Vite configuration for main, preload, renderer
- `electron-builder.yml`: Packaging configuration (NSIS, DMG, AppImage)
- `eslint.config.mjs`: Flat ESLint config with React plugins
- `vitest.config.js`: Test configuration
- `tailwind.config.js`: Tailwind CSS configuration
- `.prettierrc.yaml`: Prettier formatting rules

## Useful Patterns

### Adding a New IPC Handler

**Main process (`src/main/index.js`)**:

```js
ipcMain.handle('my:action', async (event, arg) => {
  // Your logic here
  return result
})
```

**Preload (`src/preload/index.js`)**:

```js
const api = {
  myAction: (arg) => electronAPI.ipcRenderer.invoke('my:action', arg)
  // ...
}
```

**Renderer (any component)**:

```js
const result = await window.api.myAction(arg)
```

### Rich Markdown Preview

The Live Preview (`LivePreview.jsx`) renders GitHub Flavored Markdown (GFM) using `react-markdown`:

- **GFM Support**: Tables, task lists, strikethrough via `remark-gfm`.
- **Line Breaks**: Single newlines are rendered as `<br>` via `remark-breaks`.
- **Syntax Highlighting**: Code blocks in preview use `react-syntax-highlighter` (Prism).

### Adding a Global Keyboard Shortcut

In `SnippetLibrary.jsx`:

```js
useKeyboardShortcuts({
  onMyAction: () => {
    // Your action logic
  }
  // ...
})
```

Then implement in `src/renderer/src/hook/useKeyboardShortcuts.js`:

```js
if (isMod && e.key === 'x') {
  e.preventDefault()
  callbacks.onMyAction?.()
}
```
