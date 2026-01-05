# CodeMirror Search Feature

## Overview

Custom VS Code-style in-editor search functionality with visual highlighting, match navigation, and advanced search options.

## Features

### Core Search

- **Real-time search** - Highlights all matches as you type
- **Case-insensitive by default** - Toggle case sensitivity as needed
- **Whole word matching** - Search for complete words only
- **Regular expression support** - Advanced pattern matching
- **Match counter** - Shows "X of Y" results
- **Persistent query** - Remembers last search across sessions

### Visual Highlighting

- **Yellow highlights** - All matches highlighted in yellow
- **Orange current match** - Active match highlighted in orange with box shadow
- **Auto-clear** - Highlights removed when search closes

### Navigation

- **Keyboard shortcuts** - Enter/Shift+Enter to navigate
- **Auto-scroll** - Scrolls to center current match in viewport
- **Wrapping** - Cycles from last to first match seamlessly
- **No cursor movement** - Highlights only, cursor stays in place

### User Experience

- **Auto-fill selected text** - Selected text appears in search box
- **Compact panel** - Minimal, non-intrusive design
- **Global Escape** - Close from anywhere, not just input
- **Editor refocus** - Returns focus to editor on close

## Keyboard Shortcuts

| Shortcut                     | Action                     |
| ---------------------------- | -------------------------- |
| `Ctrl+F` (or `Cmd+F` on Mac) | Open search panel          |
| `Escape`                     | Close search panel         |
| `Enter`                      | Navigate to next match     |
| `Shift+Enter`                | Navigate to previous match |

## UI Components

### Search Input

- Flexible width input field
- Auto-focus on open
- Pre-selects text for easy replacement
- Placeholder: "Find"

### Match Counter

- Shows current match position
- Format: "X of Y" or "No results"
- Always visible to prevent layout shift

### Navigation Buttons

- Previous match (up arrow)
- Next match (down arrow)
- Disabled when no matches found

### Toggle Options

- **Case Sensitive** - Match exact case
- **Whole Word** - Match complete words only
- **Use Regex** - Enable regular expression mode

### Close Button

- X icon to close panel
- Also accessible via Escape key

## File Structure

```
src/renderer/src/components/CodeEditor/search/
├── SearchPanel.jsx           # Main search UI component
├── searchHighlighter.js      # CodeMirror highlighting extension
└── SearchDoc.md             # This documentation
```

## Implementation Details

### SearchPanel.jsx

React component that provides the search UI and manages search state.

**Key Features:**

- State management for query, options, and match tracking
- Keyboard event handling
- Integration with CodeMirror highlighting
- Auto-scroll to current match

### searchHighlighter.js

CodeMirror StateField extension for search highlighting.

**Key Features:**

- `setSearchQuery` - Highlights all matches in yellow
- `setCurrentMatch` - Highlights specific match in orange
- `clearSearch` - Removes all highlights
- Decoration-based highlighting system

## Usage

### Opening Search

1. Press `Ctrl+F` (or `Cmd+F` on Mac)
2. Search panel appears at top-right
3. Input is auto-focused
4. If text is selected, it appears in search box

### Searching

1. Type your search query
2. All matches highlight in yellow
3. Current match highlights in orange
4. Counter shows "X of Y"

### Navigating Matches

1. Press `Enter` to go to next match
2. Press `Shift+Enter` to go to previous match
3. Click arrow buttons to navigate
4. Editor scrolls to center each match

### Using Options

- Click **Aa** icon to toggle case sensitivity
- Click **Ab** icon to toggle whole word matching
- Click **.\*** icon to toggle regex mode
- Active options show blue background

### Closing Search

1. Press `Escape` (works from anywhere)
2. Click X button
3. Highlights are automatically cleared
4. Focus returns to editor

## Technical Notes

### DRY Principles

- `buildSearchPattern()` helper eliminates code duplication
- Single source of truth for search pattern building
- Consistent behavior across all search operations

### Performance

- Efficient regex iteration for match finding
- Debounced by React's state batching
- Minimal re-renders with proper dependency arrays

### Error Handling

- Invalid regex patterns caught and handled gracefully
- Null checks prevent crashes when editor not ready
- Console warnings for debugging

### Memory Management

- Proper cleanup in useEffect returns
- Event listeners removed on unmount
- No memory leaks

## Edge Cases Handled

- Empty query clears highlights
- No matches shows "No results"
- Invalid regex shows 0 results
- Very long selected text (>100 chars) ignored
- Editor not ready handled with null checks
- Match index out of bounds resets to 1
- Rapid typing handled smoothly

## Integration

### With CodeEditor

- `CodeEditor.jsx` manages search panel visibility
- Stores persistent query in parent state
- Handles `Ctrl+F` keyboard shortcut

### With Extensions

- Registered in `buildExtensions.js`
- Integrates with CodeMirror's decoration system
- No conflicts with other extensions

## Future Enhancements

Potential improvements for future versions:

- Find and replace functionality
- Search history
- Multi-line search support
- Search within selection
- Highlight color customization
