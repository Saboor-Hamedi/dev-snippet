<!--
  Project Overview written for humans.
  Place: notes/PROJECT_OVERVIEW.md
-->
# Quick Snippets — Project Overview

Quick Snippets (dev-snippet) is a lightweight, Electron-based snippets manager and editor built with React and CodeMirror.
It’s designed for fast capture, editing, and organization of small code fragments, notes, and project snippets with a familiar editor experience.

This document summarizes the app purpose, core features, architecture, developer workflow, and how to get started contributing.

---

## What is it for

- Capture and organize code snippets and short files (snippets and projects).
- Fast editor with syntax highlighting, zoom, and live preview for Markdown.
- Lightweight cross-platform desktop app using Electron + Vite.

## Key Features (User-facing)

- Snippets & Projects: create, rename, delete, and organize pieces of code and project files.
- Drafts: create a draft snippet and complete it later without accidental autosave.
- Editor: CodeMirror-based editor with language-aware highlighting, smart indentation, and keyboard shortcuts.
- Language Registry: automatic language detection from filename extension and a language selector for manual override.
- Live Preview: split pane mode for Markdown preview and unified scrolling options.
- Theme & Appearance: dark/light theme support, editor font and size settings.
- Zoom: persistent editor zoom level with smooth keyboard and mouse-wheel controls.
- Status Bar: shows file extension, language name, zoom level, and quick access to settings.
- Search & Command Palette: keyboard-driven commands and a search interface for fast navigation.
- Sidebar Explorer: file icons, project grouping, and quick file actions (rename/delete).
- Autosave & Manual Save: configurable autosave with debounced writes; Ctrl/Cmd+S triggers save.

## Developer / Architecture Notes

- Electron main & preload: application lifecycle, native dialogs, file I/O and settings bridge live under `src/main` and `src/preload`.
- Renderer (UI): React app under `src/renderer` with a `workbench` that composes the editor, sidebar, and preview.
- Editor: `src/renderer/src/components/codemirror` contains the custom CodeMirror integration and the language registry.
- State & Data: `useSnippetData`, `useSettingsContext`, and small hooks manage snippets and app settings (stored via a simple read/write API exposed by the preload layer).
- Settings Manager: `src/renderer/src/config/SettingManager.js` reads/writes a JSON settings file and watches for external changes.
- Language Registry: a single place to map extensions → language (and lazy-load CodeMirror language packages).

### Notable components

- `SnippetEditor.jsx` — main editor container, autosave, and name/save flows.
- `CodeEditor.jsx` — CodeMirror wrapper, zoom, keymaps, and mouse-wheel zoom handling.
- `SplitPane` — resizable left/right layout with overlay mode for preview.
- `Explorer.jsx` / `Sidebar.jsx` — file listing and create/rename/delete actions.

## Running Locally (short)

Prerequisites: Node.js (LTS), npm.

1. Install dependencies

```bash
npm install
```

2. Start development (Electron + Vite)

```bash
npm run dev
```

3. Build for production

```bash
npm run build
```

Other scripts (packaging) are available in `package.json` (uses `electron-builder` and `electron-vite`).

## How the rename → language sync works

- When a snippet is renamed and the new title contains a recognized extension (e.g. `foo.js`), the app derives a language key using the language registry and updates the snippet `language` field.
- The editor watches the `initialSnippet.language` and updates its local editor language state when the external language changes (unless the user is actively editing), ensuring the `StatusBar` and syntax highlighting update immediately.

## Performance and UX decisions

- Zoom is applied via a CSS variable (`--zoom-level`) so font-size updates are immediate and avoid CodeMirror reinitialization.
- Mouse-wheel zoom is throttled and debounced to avoid jitter on rapid events and to keep transitions smooth.
- The caret/cursor styling is tied to the editor font size so it scales visually with zoom but keeps a fixed border width for consistent appearance.

## Contributing

- Fork and open a PR on the repo.
- Follow existing code style. Use the small hooks and existing patterns for shared state.
- If adding languages, update the language registry and provide a friendly `name` and `extensions` array.

## Troubleshooting & Tips

- Settings JSON parse errors: check the `settings.json` path printed by `window.api.getSettingsPath()` and fix malformed JSON (trailing commas or stray characters). The `SettingManager` will fall back to defaults if load fails.
- Editor not updating on rename? Ensure `handleRenameSnippet` updates the selected snippet and the main snippet store so `SnippetEditor` receives new `initialSnippet` props.

## Next Ideas / Roadmap

- Add snippet tagging and search by tag.
- Add snippet syncing (optional) with cloud/backends.
- Add unit/integration tests for key flows (rename → language, autosave behaviour).

---

If you want this converted into a README-style file or split into smaller notes (architecture, HOWTOs, TODOs), tell me how you prefer it organized and I will create additional files under `notes/`.

---
_Generated: project overview for humans — edit this file freely and keep it in the repo's `notes/` folder._
