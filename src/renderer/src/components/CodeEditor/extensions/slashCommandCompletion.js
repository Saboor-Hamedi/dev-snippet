/**
 * SlashCommandCompletion - A premium autocomplete provider for CodeMirror 6.
 * Refactored for "Slash Menu 2.0" robustness.
 */
import './slashCommand.css' // Ensure CSS is imported (build system handles this)

/**
 * COMMANDS - The library of available slash triggers.
 */
const COMMANDS = [
  // --- Basic Blocks ---
  {
    label: '/h1',
    display: 'Heading 1',
    detail: 'Big section heading',
    section: 'Basic',
    template: '# ',
    icon: 'H1',
    cursorOffset: 2
  },
  {
    label: '/h2',
    display: 'Heading 2',
    detail: 'Medium section heading',
    section: 'Basic',
    template: '## ',
    icon: 'H2',
    cursorOffset: 3
  },
  {
    label: '/h3',
    display: 'Heading 3',
    detail: 'Small section heading',
    section: 'Basic',
    template: '### ',
    icon: 'H3',
    cursorOffset: 4
  },
  {
    label: '/text',
    display: 'Text Paragraph',
    detail: 'Start writing plain text',
    section: 'Basic',
    template: '',
    icon: 'T',
    cursorOffset: 0
  },
  {
    label: '/todo',
    display: 'To-do List',
    detail: 'Track tasks with a checklist',
    section: 'Basic',
    template: '- [ ] ',
    icon: '☑️',
    cursorOffset: 6
  },
  {
    label: '/list',
    display: 'Bulleted List',
    detail: 'Create a simple bullet list',
    section: 'Basic',
    template: '- ',
    icon: '•',
    cursorOffset: 2
  },
  {
    label: '/num',
    display: 'Numbered List',
    detail: 'Create an ordered list',
    section: 'Basic',
    template: '1. ',
    icon: '1.',
    cursorOffset: 3
  },
  {
    label: '/quote',
    display: 'Quote',
    detail: 'Capture a quote',
    section: 'Basic',
    template: '> ',
    icon: '❞',
    cursorOffset: 2
  },
  {
    label: '/divider',
    display: 'Divider',
    detail: 'Visually separate content',
    section: 'Basic',
    template: '\n---\n',
    icon: '—',
    cursorOffset: 5
  },

  // --- Code & Technical ---
  {
    label: '/code',
    display: 'Code Block',
    detail: 'Capture a code snippet',
    section: 'Code',
    template: '\n```\n\n```\n',
    icon: '</>',
    cursorOffset: 5 // Inside the block
  },
  {
    label: '/js',
    display: 'JavaScript',
    detail: 'JS code block',
    section: 'Code',
    template: '\n```javascript\n\n```\n',
    icon: 'JS',
    cursorOffset: 15
  },
  {
    label: '/py',
    display: 'Python',
    detail: 'Python code block',
    section: 'Code',
    template: '\n```python\n\n```\n',
    icon: 'PY',
    cursorOffset: 11
  },
  {
    label: '/sql',
    display: 'SQL',
    detail: 'SQL query block',
    section: 'Code',
    template: '\n```sql\n\n```\n',
    icon: 'SQL',
    cursorOffset: 8
  },
  {
    label: '/mermaid',
    display: 'Mermaid Diagram',
    detail: 'Insert a flowchart or sequence diagram',
    section: 'Code',
    template: '\n```mermaid\ngraph TD\n  A[Start] --> B[End]\n```\n',
    icon: '📊',
    cursorOffset: 21 // Inside graph content
  },

  // --- Advanced Components ---
  {
    label: '/table',
    display: 'Table',
    detail: 'Insert a simple 2x2 table',
    section: 'Advanced',
    template: '\n| Header 1 | Header 2 |\n| :--- | :--- |\n| Cell 1 | Cell 2 |\n',
    icon: '田',
    cursorOffset: 55 // End of table
  },
  {
    label: '/kanban',
    display: 'Kanban Board',
    detail: 'Manage tasks in columns',
    section: 'Advanced',
    template: '\n[kanban]\n## To Do\n- [ ] Task 1\n\n## Done\n- [x] Task 2\n[/kanban]\n',
    icon: '📋',
    cursorOffset: 22
  },
  {
    label: '/callout',
    display: 'Callout Box',
    detail: 'Highlight important information',
    section: 'Advanced',
    template: '\n::: info\nType your info here...\n:::\n',
    icon: '💡',
    cursorOffset: 10
  },
  {
    label: '/tabs',
    display: 'Tabs',
    detail: 'Create tabbed content',
    section: 'Advanced',
    template:
      '\n[tabs]\n[tab: Tab 1]\nContent 1\n[/tab]\n[tab: Tab 2]\nContent 2\n[/tab]\n[/tabs]\n',
    icon: '📑',
    cursorOffset: 21
  },

  // --- Smart Dates ---
  {
    label: '/date',
    display: 'Current Date',
    detail: "Insert today's date",
    section: 'Utility',
    template: () => new Date().toLocaleDateString(),
    icon: '📅',
    cursorOffset: 0
  },
  {
    label: '/time',
    display: 'Current Time',
    detail: 'Insert current time',
    section: 'Utility',
    template: () => new Date().toLocaleTimeString(),
    icon: '🕒',
    cursorOffset: 0
  }
]

export const slashCommandCompletionSource = (context) => {
  // Trigger on "/"
  const match = context.matchBefore(/\/\w*$/)
  if (!match) return null

  return {
    from: match.from,
    options: COMMANDS.map((cmd) => ({
      label: cmd.label,
      displayLabel: cmd.display,
      detail: cmd.detail,
      section: cmd.section,
      type: 'function',
      boost: 99,

      // Custom Render using CSS classes
      render: (completion) => {
        const container = document.createElement('div')
        container.className = 'cm-slash-option'

        const iconCol = document.createElement('div')
        iconCol.className = 'cm-slash-icon'
        iconCol.textContent = cmd.icon

        const textCol = document.createElement('div')
        textCol.className = 'cm-slash-content'

        const label = document.createElement('div')
        label.className = 'cm-slash-label'
        label.textContent = cmd.display

        const detail = document.createElement('div')
        detail.className = 'cm-slash-detail'
        detail.textContent = cmd.detail

        textCol.appendChild(label)
        textCol.appendChild(detail)
        container.appendChild(iconCol)
        container.appendChild(textCol)

        return container
      },

      apply: (view, completion, from, to) => {
        // Resolve template (handle function vs string)
        const insertText = typeof cmd.template === 'function' ? cmd.template() : cmd.template

        view.dispatch({
          changes: { from, to, insert: insertText },
          // If cursorOffset is provided, calculate exact position
          selection:
            cmd.cursorOffset !== undefined
              ? { anchor: from + insertText.indexOf('\n') + 1 + (cmd.cursorOffset || 0) }
              : // Fallback simplistic logic if explicit offset not perfect, but usually offset is best
                { anchor: from + insertText.length },

          userEvent: 'input.complete'
        })

        // Refined positioning for blocks requires calculating from the new state,
        // but the simple anchor offset above is usually sufficient for templates.
        if (cmd.cursorOffset !== undefined) {
          const finalPos = from + cmd.cursorOffset
          // Ensure we don't go out of bounds
          if (finalPos <= view.state.doc.length) {
            view.dispatch({ selection: { anchor: finalPos } })
          }
        }
      }
    })),
    filter: true,
    // Only trigger if at start of line OR preceded by space (optional, but standard behavior usually allows mid-line)
    validFor: /^\/\w*$/
  }
}
