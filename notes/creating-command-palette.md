# How to Create a Command Palette

This guide explains how the Command Palette feature was implemented in this project.

## 1. Concept

A Command Palette is a modal interface that allows users to search for and execute commands or navigate to files quickly using the keyboard. It is typically triggered by a shortcut like `Ctrl+P` or `Ctrl+Shift+P`.

## 2. Component Structure (`CommandPalette.jsx`)

The component is built using React and Tailwind CSS.

### Key Features:

- **Modal Overlay:** A fixed `div` with a semi-transparent background (`bg-black/40 backdrop-blur-sm`) to focus attention.
- **Search Input:** An auto-focused input field that filters the list of items.
- **Results List:** A scrollable list displaying matching snippets and projects.
- **Keyboard Navigation:**
  - `ArrowUp` / `ArrowDown`: Navigate through the list.
  - `Enter`: Select the highlighted item.
  - `Escape`: Close the palette.

### Code Highlight:

```javascript
// Filtering logic
const filteredItems = React.useMemo(() => {
  if (!search.trim()) return []
  // ... filter logic ...
  return [...projectResults, ...snippetResults].slice(0, 10)
}, [search, snippets, projects])
```

## 3. Integration (`SnippetLibrary.jsx`)

The Command Palette is integrated into the main layout component.

### State Management:

```javascript
const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
```

### Keyboard Shortcut:

We added a global event listener for `Ctrl+P`:

```javascript
if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
  e.preventDefault()
  setIsCommandPaletteOpen((prev) => !prev)
}
```

### Rendering:

The component is rendered conditionally at the end of the `SnippetLibrary` JSX:

```javascript
<CommandPalette
  isOpen={isCommandPaletteOpen}
  onClose={() => setIsCommandPaletteOpen(false)}
  snippets={snippets}
  projects={projects}
  onSelect={(item) => {
    setSelectedSnippet(item)
    // Switch to the appropriate view
    if (item.type === 'project') {
      setActiveView('projects')
    } else {
      setActiveView('explorer')
    }
  }}
/>
```

## 4. Styling

We used Tailwind CSS for styling.

- **Animations:** `animate-fade-in` for smooth appearance.
- **Theming:** `dark:` classes ensure it looks good in both light and dark modes.
- **Icons:** `lucide-react` icons (Search, FileCode, Folder) provide visual cues.

## 5. How to Extend

To add "Commands" (like "Create New Snippet", "Toggle Theme"):

1.  Define a list of command objects `{ id: 'cmd-1', title: 'Create New Snippet', action: () => ... }`.
2.  Include these commands in the `filteredItems` logic.
3.  Execute `item.action()` in the `onSelect` handler if the selected item is a command.
