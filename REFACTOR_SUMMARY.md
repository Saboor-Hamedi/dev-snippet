# Refactor Summary: Lean Core Architecture

## Objective

Refactor the application to improve speed and stability by:

1. Removing heavy dependencies
2. Reverting to a simple textarea editor
3. Removing sidebar and project management features
4. Simplifying to snippet-only management
5. Implementing Ctrl+S save prompt workflow

## Changes Made

### 1. **Dependency Cleanup**

- ✅ Kept only `react-syntax-highlighter` for code highlighting
- ✅ Removed Monaco Editor and related packages
- ✅ Removed `@uiw/react-markdown-editor`

### 2. **UI Simplification**

- ✅ **Removed Sidebar**: No more left sidebar navigation
- ✅ **Removed Activity Bar**: No more icon bar on the left
- ✅ **Removed Project Management**: Application now only manages snippets
- ✅ **Full-Screen Editor**: Editor now takes the entire viewport

### 3. **Editor Architecture**

- ✅ **Simple Textarea**: Replaced advanced editor with standard `<textarea>`
- ✅ **Split-Pane Layout**: Always-visible split view
  - Left: Raw code input (textarea)
  - Right: Live preview with syntax highlighting
- ✅ **Font Size**: Enforced 16px for both editor and preview
- ✅ **Autosave**: Silent autosave after snippet is named

### 4. **Save Workflow**

- ✅ **Ctrl+S Trigger**: Press Ctrl+S (or Cmd+S) to open save prompt
- ✅ **Name Prompt**: Modal appears asking for snippet name
- ✅ **Extension Detection**: Automatically detects language from file extension
- ✅ **Live Autosave**: Once named, changes save automatically every 1 second

### 5. **Database Cleanup**

- ✅ Removed `projects` table from database schema
- ✅ Removed all project-related IPC handlers
- ✅ Database now only stores: `snippets`, `settings`, `theme`

### 6. **Code Removals**

#### Files Modified:

- `SnippetLibrary.jsx`: Removed Sidebar, ActivityBar, project logic
- `SnippetEditor.jsx`: Added Ctrl+S save prompt trigger
- `Workbench.jsx`: Removed project-related props and logic
- `useKeyboardShortcuts.js`: Added Ctrl+S handler
- `main/index.js`: Removed projects table

#### Removed Imports:

```javascript
// Removed from SnippetLibrary.jsx
import ActivityBar from './layout/ActivityBar'
import Sidebar from './layout/Sidebar'
import CreateProjectModal from './CreateProjectModal'
```

#### Removed State Variables:

```javascript
// Removed from SnippetLibrary.jsx
const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false)
const [activeProject, setActiveProject] = useState(null)
const modalKeyRef = useRef(0)
```

#### Removed Props:

```javascript
// Removed from Workbench
;(projects, onNewProject, onSnippetSelect)

// Removed from SnippetEditor
;(snippets, onSnippetMentionClick)
```

### 7. **Keyboard Shortcuts**

#### Active Shortcuts:

- **Ctrl+N**: Create new snippet
- **Ctrl+S**: Open save prompt (if untitled)
- **Ctrl+P**: Open command palette
- **Ctrl+Shift+C**: Copy snippet to clipboard
- **Ctrl+Shift+W**: Go to welcome page
- **Escape**: Close modals/editor

#### Removed Shortcuts:

- ~~Ctrl+B~~: Toggle sidebar (removed)
- ~~Ctrl+Shift+N~~: Create new project (removed)

## User Workflow

### Creating a New Snippet:

1. Press **Ctrl+N** or click "New Snippet"
2. Start typing code in the textarea
3. Press **Ctrl+S** when ready to save
4. Enter a name (with optional extension, e.g., `hello.js`)
5. Click "Save"
6. Snippet now autosaves every 1 second

### Editing an Existing Snippet:

1. Select snippet from Command Palette (Ctrl+P)
2. Edit code in textarea
3. Changes save automatically every 1 second
4. Live preview updates in real-time

## Performance Improvements

- **Faster Startup**: Removed heavy Monaco Editor bundle
- **Lower Memory**: Simple textarea uses minimal resources
- **Instant Response**: No editor initialization delay
- **Clean Architecture**: Simplified component tree

## Files Still Using Projects (To Review)

- `useSnippetData.js`: May still have project-related logic
- `CommandPalette.jsx`: May still reference projects

## Next Steps (Optional)

1. Review `useSnippetData.js` and remove project logic
2. Update `CommandPalette.jsx` to only show snippets
3. Remove unused project-related components from file system
4. Test autosave functionality thoroughly
5. Verify Ctrl+S workflow on both Windows and Mac
