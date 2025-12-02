# Implementation Guide: Markdown View and Save Flow

## Build & Run

- Dev: `npm run dev`
- Lint: `npm run lint`
- Windows build: `npm run build:win64`

## Changes Overview

- Added a dedicated Markdown view, and hid the sidebar when in Markdown.
- Removed auto-extension logic; new snippets start as `untitled`.
- Pressing `Ctrl+S` opens Rename dialog if filename lacks an extension.
- Fixed invalid hook usage causing toast errors.
- Improved language detection while typing; manual override respected.
- Simplified viewer header to show only the filename.

## Step-by-Step

- Activity Bar → Markdown view
  - Icon sets `activeView='markdown'` in `src/renderer/src/components/layout/ActivityBar.jsx:57–61`.
- Workbench → route to Markdown view
  - Routes to Markdown and passes only markdown items in `src/renderer/src/components/workbench/Workbench.jsx:168–188`.
- Sidebar hidden in Markdown
  - Sidebar conditional hides for Markdown in `src/renderer/src/components/SnippetLibrary.jsx:196–221`.
- Snippets filtering
  - Exclude markdown files from snippets list in `src/renderer/src/components/SnippetLibrary.jsx:54–63`.
- Markdown page + editor
  - Two‑column editor (textarea + preview) and grid in `src/renderer/src/components/markdown/MarkDown.jsx:1–104`.
- New snippet default title
  - Title defaults to `untitled` in `src/renderer/src/components/SnippetEditor.jsx:44–53`.
- Save interception for missing extension
  - Intercept `onSave` and open rename modal if there’s no extension in `src/renderer/src/components/SnippetLibrary.jsx:231–239`.
- Rename enforcement
  - Require a valid filename that includes an extension in `src/renderer/src/components/RenameModal.jsx:20–26`, `src/renderer/src/components/RenameModal.jsx:79–83`.
- Ctrl+S handling
  - Shortcut binds and calls `onSave` in `src/renderer/src/hook/useKeyboardShortcuts.js:22–27`.
  - Editor wires the handler in `src/renderer/src/components/SnippetEditor.jsx:65–68`.
- Toast hook fix
  - Removed stray `useToast()` call at module scope to fix invalid hook usage in `src/renderer/src/components/SnippetEditor.jsx:202`.
- Viewer header
  - Displays only `title` (no computed extension or subtitle) in `src/renderer/src/components/SnippetViewer.jsx:81–84`.
- Tab-like header styling
  - Restyled DocumentHeader to look like a tab in `src/renderer/src/components/layout/DocumentHeader.jsx:8–45`.

## How The Save Flow Works Now

- Create new snippet → title `untitled` → type code → press `Ctrl+S`.
- If the title lacks an extension (e.g., `untitled`), Rename dialog opens asking for a full filename like `script.js`.
- After rename, the item saves and the editor closes.

## Language Detection

- Auto-detect sets `language` based on content patterns in `src/renderer/src/components/SnippetEditor.jsx:22–38`.
- Manual selection locks the language in `src/renderer/src/components/SnippetEditor.jsx:176–192`.

## Notes

- If any hook is called outside a component/hook, React throws “Invalid hook call”. Keep hooks inside function components or custom hooks.
- UI colors and cursor customizations live in `d:/electron/div-dailevt/.vscode/settings.json`.

## Next Steps

- Add export/import for Markdown files.
- Add per-language templates when creating new snippets.
- Validate filenames against OS-specific rules if you add filesystem writes.
