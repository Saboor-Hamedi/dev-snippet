# Final Architecture: UIW React Markdown Editor Integration

## ✅ Completed Migration

### 1. Component Swap & Cleanup

- **Removed**: `@monaco-editor/react`, `react-simple-code-editor`
- **Installed**: `@uiw/react-markdown-editor`
- **Deleted**: `MonacoMarkdownEditor.jsx` (Monaco decoration approach abandoned)

### 2. Editor Component

**Location**: `src/renderer/src/components/SnippetEditor.jsx`

**Features**:

- ✅ **Split-pane layout** with live preview (built into @uiw/react-markdown-editor)
- ✅ **Theme compliance** via `data-color-mode` attribute (auto-detects dark/light)
- ✅ **Autosave** with 1000ms debounce
- ✅ **Context menu** (right-click): Cut, Copy, Paste, Delete
- ✅ **Mention popup** (@-mentions for snippets/projects)
- ✅ **Language auto-detection** (markdown, js, py, html, css, etc.)

### 3. Core Logic Preserved

- ✅ **Debounced onChange**: `debouncedSave` triggers after 1s of inactivity
- ✅ **IPC handlers**: All `db:saveSnippet`, `db:getSnippets` remain unchanged
- ✅ **Data integrity**: No backend modifications required

### 4. UI Components

#### Header Bar

- **New button**: Creates new snippet
- **Save button**: Manual save trigger
- Styled with theme variables (`--accent`, `--text-main`, `--border-color`)

#### Context Menu

- Appears on right-click
- Options: Cut, Copy, Paste, Delete
- Theme-aware styling

#### Mention Popup

- Triggers on `@` character
- Shows matching snippets/projects
- Auto-completes with slug format

### 5. Theme Integration

```javascript
data-color-mode={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
```

This ensures the editor respects the app's active theme.

### 6. Autosave Flow

1. User types → `setCode(newValue)`
2. `useEffect` detects code change → triggers `debouncedSave()`
3. After 1000ms of no changes → `onSave()` called
4. Parent component → IPC → `db:saveSnippet`
5. Database updated silently

### 7. CSS Variables Used

- `--editor-bg`: Editor background
- `--text-main`: Primary text color
- `--border-color`: Borders and dividers
- `--accent`: Primary action color (buttons)

## 📦 Dependencies

```json
{
  "@uiw/react-markdown-editor": "^latest",
  "use-debounce": "^10.0.6",
  "lucide-react": "^0.554.0"
}
```

## 🎯 Result

A clean, theme-aware markdown editor with:

- Live preview (split-pane)
- Silent autosave
- Context menu & mentions
- No Monaco overhead
- Full theme compliance
