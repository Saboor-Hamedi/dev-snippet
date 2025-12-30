/**
 * Notion-style Slash Command Autocompletion for CodeMirror 6.
 * Triggers when typing "/" and suggests markdown templates and components.
 */

const COMMANDS = [
  {
    label: 'Heading 1',
    detail: 'Large section heading',
    section: 'Basic Blocks',
    template: '# ',
    icon: 'H1'
  },
  {
    label: 'Heading 2',
    detail: 'Medium section heading',
    section: 'Basic Blocks',
    template: '## ',
    icon: 'H2'
  },
  {
    label: 'Heading 3',
    detail: 'Small section heading',
    section: 'Basic Blocks',
    template: '### ',
    icon: 'H3'
  },
  {
    label: 'Checklist',
    detail: 'Task list with checkboxes',
    section: 'Basic Blocks',
    template: '- [ ] ',
    icon: '☑️'
  },
  {
    label: 'Bulleted List',
    detail: 'Simple bullet list',
    section: 'Basic Blocks',
    template: '- ',
    icon: '•'
  },
  {
    label: 'Numbered List',
    detail: 'Ordered list',
    section: 'Basic Blocks',
    template: '1. ',
    icon: '1.'
  },
  {
    label: 'Quote',
    detail: 'Blockquote for emphasis',
    section: 'Basic Blocks',
    template: '> ',
    icon: '"'
  },
  {
    label: 'Code Block',
    detail: 'Syntax highlighted code',
    section: 'Basic Blocks',
    template: '\n```js\n\n```\n',
    icon: '</>'
  },
  {
    label: 'Table',
    detail: 'Professional GFM table',
    section: 'Basic Blocks',
    template:
      '\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n|          |          |          |\n|          |          |          |\n',
    icon: '田'
  },
  {
    label: 'Kanban Board',
    detail: 'Visual project board',
    section: 'Advanced Layouts',
    template:
      '\n[kanban]\n## To Do\n- [ ] Task 1\n## In Progress\n- [ ] Task 2\n## Done\n- [x] Task 3\n[/kanban]\n',
    icon: '📋'
  },
  {
    label: 'Tabbed View',
    detail: 'Switchable content tabs',
    section: 'Advanced Layouts',
    template: '\n[tabs]\n[tab: Tab 1]\nContent One\n[tab: Tab 2]\nContent Two\n[/tabs]\n',
    icon: '📑'
  },
  {
    label: 'Grid Layout',
    detail: 'Multi-column container',
    section: 'Advanced Layouts',
    template: '\n[grid: 2]\nColumn One Content\n\nColumn Two Content\n[/grid]\n',
    icon: '⊞'
  },
  {
    label: 'Timeline',
    detail: 'Vertical roadmap',
    section: 'Advanced Layouts',
    template: '\n[timeline]\n2024: Project Kickoff\n2025: Global Launch\n[/timeline]\n',
    icon: '⏳'
  },
  {
    label: 'Mermaid Chart',
    detail: 'Smart diagrams & logic',
    section: 'Advanced Layouts',
    template: '\n```mermaid\ngraph TD\n  A[Start] --> B(Decision)\n  B --> C{End}\n```\n',
    icon: '📊'
  },
  {
    label: 'File Tree',
    detail: 'Document directory structure',
    section: 'Advanced Layouts',
    template: '\n[tree]\nsrc/\n  components/\n    Editor.jsx\n  main.js\n[/tree]\n',
    icon: '📁'
  },
  {
    label: 'Callout',
    detail: 'Styled info/warning box',
    section: 'Components',
    template: '\n::: info\nYour message here\n:::\n',
    icon: '💡'
  },
  {
    label: 'Badge',
    detail: 'Metadata label',
    section: 'Components',
    template: '[badge: Label | Value | #0366d6]',
    icon: '🏷️'
  },
  {
    label: 'QR Code',
    detail: 'Scannable link',
    section: 'Components',
    template: '[qr: https://]',
    icon: '📱'
  },
  {
    label: 'Star Rating',
    detail: '0-5 scale visual',
    section: 'Components',
    template: '[rating: 4.5]',
    icon: '⭐'
  },
  {
    label: 'Progress Bar',
    detail: 'Completion visualization',
    section: 'Components',
    template: '[progress: 75%]',
    icon: '▓'
  },
  {
    label: 'Sparkline',
    detail: 'Mini trendline chart',
    section: 'Components',
    template: '[spark: 10,20,50,30,90]',
    icon: '📈'
  },
  {
    label: 'Table of Contents',
    detail: 'Automatic [TOC]',
    section: 'Components',
    template: '[TOC]\n',
    icon: '≡'
  }
]

export const slashCommandCompletionSource = (context) => {
  // 1. Strict Slash Trigger: Only match / if it's at start of line or after space
  // and NOT followed by another slash (to avoid URLs)
  const match = context.matchBefore(/(?:^|\s)\/\w*$/)
  if (!match) return null

  // Adjusted from to skip the leading space if present
  const hasSpace = /^\s/.test(match.text)
  const from = match.from + (hasSpace ? 1 : 0)
  const typed = match.text.slice(hasSpace ? 2 : 1).toLowerCase()

  // Prevent double slashes triggering the menu (e.g. https://)
  if (typed.startsWith('/')) return null

  const filtered = COMMANDS.filter(
    (cmd) =>
      !typed || cmd.label.toLowerCase().includes(typed) || cmd.section.toLowerCase().includes(typed)
  )

  if (filtered.length === 0) return null

  return {
    from,
    options: filtered.map((cmd) => ({
      label: cmd.label,
      displayLabel: cmd.label,
      detail: cmd.detail,
      section: { name: cmd.section },
      type: 'function',
      boost: 100,
      render: (completion, state) => {
        const container = document.createElement('div')
        container.className = 'cm-slash-option'
        container.style.display = 'flex'
        container.style.alignItems = 'center'
        container.style.width = '100%'

        const icon = document.createElement('div')
        icon.className = 'cm-completionIcon'
        icon.textContent = cmd.icon

        const labelText = document.createElement('div')
        labelText.className = 'cm-completionLabel'
        labelText.textContent = cmd.label

        const detailText = document.createElement('div')
        detailText.className = 'cm-completionDetail'
        detailText.textContent = cmd.detail

        container.appendChild(icon)
        container.appendChild(labelText)
        container.appendChild(detailText)
        return container
      },
      apply: (view, completion, from, to) => {
        view.dispatch({
          changes: { from, to, insert: cmd.template },
          selection: { anchor: from + cmd.template.length },
          userEvent: 'input.complete'
        })

        if (cmd.template.includes('```')) {
          const lines = cmd.template.split('\n')
          const offset = lines[0].length + 1 + lines[1].length
          view.dispatch({ selection: { anchor: from + offset } })
        } else if (cmd.template.includes(':::')) {
          view.dispatch({ selection: { anchor: from + cmd.template.indexOf('\n') + 1 } })
        }
      }
    })),
    filter: false,
    validFor: /^\/\w*$/
  }
}
