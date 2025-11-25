# How the "Create Snippet" Button Works

This document explains the complete flow of how clicking the "+" button in the Snippets sidebar opens the editor.

## The Flow

### 1. **User Clicks the "+" Button**

Location: `src/renderer/src/components/layout/Sidebar.jsx` (lines 93-101)

```javascript
{
  activeView === 'snippets' && (
    <button
      onClick={onCreateSnippet}
      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded..."
      title="New Snippet"
    >
      <Plus size={16} />
    </button>
  )
}
```

**What happens:** The button calls the `onCreateSnippet` function passed as a prop.

### 2. **Function is Passed from Parent**

Location: `src/renderer/src/components/SnippetLibrary.jsx` (line 188)

```javascript
<Sidebar
  activeView={activeView}
  items={filteredItems}
  // ... other props
  onCreateSnippet={() => setIsCreatingSnippet(true)}
  // ... other props
/>
```

**What happens:** When clicked, this sets the `isCreatingSnippet` state to `true`.

### 3. **State Change Triggers View Change**

Location: `src/renderer/src/components/SnippetLibrary.jsx` (line 197)

```javascript
<Workbench
  activeView={isCreatingSnippet ? 'editor' : activeView}
  // ... other props
/>
```

**What happens:** When `isCreatingSnippet` is true, the `activeView` prop passed to Workbench becomes `'editor'`.

### 4. **Workbench Shows the Editor**

Location: `src/renderer/src/components/workbench/Workbench.jsx` (lines 36-39)

```javascript
// If in editor mode (creating new snippet)
if (activeView === 'editor') {
  return <SnippetEditor onSave={onSave} />
}
```

**What happens:** The Workbench component checks if `activeView === 'editor'` and renders the `SnippetEditor` component.

### 5. **User Types and Saves**

The user types their code in the editor and presses **Ctrl+S**.

Location: `src/renderer/src/components/SnippetEditor.jsx` (lines 15-27)

```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      if (code.trim()) {
        handleSave()
      }
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [code, language])
```

### 6. **Save Callback Resets State**

Location: `src/renderer/src/components/SnippetLibrary.jsx` (lines 202-205)

```javascript
onSave={(code) => {
  saveSnippet(code)
  setIsCreatingSnippet(false)  // This closes the editor
}}
```

**What happens:** After saving, `isCreatingSnippet` is set back to `false`, which returns the view to the snippets list.

## Key Components

1. **Sidebar** - Contains the "+" button
2. **SnippetLibrary** - Manages the `isCreatingSnippet` state
3. **Workbench** - Decides which view to show based on `activeView`
4. **SnippetEditor** - The actual editor component

## Icons Used

We use **Lucide React** icons throughout:

- `Plus` - For create buttons
- `Trash2` - For delete
- `Pencil` - For rename/edit
- And more...

Import them like this:

```javascript
import { Plus, Trash2, Pencil } from 'lucide-react'
```

## Troubleshooting

If the button doesn't work:

1. Check that `onCreateSnippet` prop is passed to Sidebar
2. Verify `isCreatingSnippet` state exists in SnippetLibrary
3. Ensure Workbench has the `activeView === 'editor'` check
4. Confirm the editor's `onSave` callback sets `isCreatingSnippet(false)`
