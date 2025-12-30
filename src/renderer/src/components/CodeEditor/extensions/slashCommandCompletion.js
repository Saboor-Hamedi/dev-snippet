/**
 * SlashCommandCompletion - A premium autocomplete provider for CodeMirror 6.
 *
 * This module allows users to type "/" to trigger a command menu, similar to Notion or Obsidian.
 * It supports both static snippets (like headers) and dynamic triggers that open interactive
 * modals (like the Mermaid or Table editors).
 */

/**
 * COMMANDS - The library of available slash triggers.
 * Each entry includes its UI representation (label, display, icon)
 * and its functional template or modal trigger logic.
 */
const COMMANDS = [
  // --- Basic Markdown Blocks ---
  {
    label: '/h1 Heading 1',
    display: 'Heading 1',
    detail: 'Large section heading',
    section: 'Basic Blocks',
    template: '# ',
    icon: 'H1'
  },
  {
    label: '/h2 Heading 2',
    display: 'Heading 2',
    detail: 'Medium section heading',
    section: 'Basic Blocks',
    template: '## ',
    icon: 'H2'
  },
  {
    label: '/h3 Heading 3',
    display: 'Heading 3',
    detail: 'Small section heading',
    section: 'Basic Blocks',
    template: '### ',
    icon: 'H3'
  },
  {
    label: '/todo Checklist',
    display: 'Checklist',
    detail: 'Task list with checkboxes',
    section: 'Basic Blocks',
    template: '- [ ] ',
    icon: '☑️'
  },
  {
    label: '/list Bulleted List',
    display: 'Bulleted List',
    detail: 'Simple bullet list',
    section: 'Basic Blocks',
    template: '- ',
    icon: '•'
  },
  {
    label: '/num Numbered List',
    display: 'Numbered List',
    detail: 'Ordered list',
    section: 'Basic Blocks',
    template: '1. ',
    icon: '1.'
  },
  {
    label: '/quote Quote',
    display: 'Quote',
    detail: 'Blockquote for emphasis',
    section: 'Basic Blocks',
    template: '> ',
    icon: '"'
  },
  {
    label: '/code Code Block',
    display: 'Generic Code',
    detail: 'Simple code block',
    section: 'Basic Blocks',
    template: '\n```\n\n```\n',
    icon: '</>'
  },
  {
    label: '/js Javascript',
    display: 'Javascript',
    detail: 'Highlighted JS block',
    section: 'Basic Blocks',
    template: '\n```js\n\n```\n',
    icon: 'JS'
  },
  {
    label: '/py Python',
    display: 'Python',
    detail: 'Highlighted Python block',
    section: 'Basic Blocks',
    template: '\n```py\n\n```\n',
    icon: 'PY'
  },
  {
    label: '/sql SQL Query',
    display: 'SQL Query',
    detail: 'Database syntax block',
    section: 'Basic Blocks',
    template: '\n```sql\n\n```\n',
    icon: 'SQL'
  },

  // --- Advanced Components & Modals ---
  {
    label: '/table Table Editor',
    display: 'Table Editor',
    detail: 'Visual data management',
    section: 'Basic Blocks',
    template: '| Col | Col |\n| --- | --- |\n| | |',
    icon: '田'
  },
  {
    label: '/mermaid Mermaid Diagram',
    display: 'Mermaid Diagram',
    detail: 'Flowcharts & smart charts',
    section: 'Advanced Layouts',
    template: '\n```mermaid\ngraph TD\n  A[Start] --> B(Decision)\n```\n',
    icon: '📊'
  },
  {
    label: '/kanban Kanban Board',
    display: 'Kanban Board',
    detail: 'Visual project board',
    section: 'Advanced Layouts',
    template: '\n[kanban]\n## To Do\n- [ ] Task 1\n[/kanban]\n',
    icon: '📋'
  },
  {
    label: '/tabs Tabbed View',
    display: 'Tabbed View',
    detail: 'Switchable content tabs',
    section: 'Advanced Layouts',
    template: '\n[tabs]\n[tab: Tab 1]\nContent One\n[/tabs]\n',
    icon: '📑'
  },
  {
    label: '/grid Grid Layout',
    display: 'Grid Layout',
    detail: 'Multi-column container',
    section: 'Advanced Layouts',
    template: '\n[grid: 2]\nCol 1\n\nCol 2\n[/grid]\n',
    icon: '⊞'
  },
  {
    label: '/timeline Timeline',
    display: 'Timeline',
    detail: 'Vertical roadmap',
    section: 'Advanced Layouts',
    template: '\n[timeline]\n2024: Start\n[/timeline]\n',
    icon: '⏳'
  },
  {
    label: '/tree File Tree',
    display: 'File Tree',
    detail: 'Document directory structure',
    section: 'Advanced Layouts',
    template: '\n[tree]\nsrc/\n  main.js\n[/tree]\n',
    icon: '📁'
  },
  {
    label: '/info Callout',
    display: 'Callout',
    detail: 'Styled info/warning box',
    section: 'Components',
    template: '\n::: info\nYour message here\n:::\n',
    icon: '💡'
  },
  {
    label: '/badge Badge',
    display: 'Badge',
    detail: 'Metadata label',
    section: 'Components',
    template: '[badge: Label | Value | #0366d6]',
    icon: '🏷️'
  },
  {
    label: '/qr QR Code',
    display: 'QR Code',
    detail: 'Scannable link',
    section: 'Components',
    template: '[qr: https://]',
    icon: '📱'
  },
  {
    label: '/rating Star Rating',
    display: 'Star Rating',
    detail: '0-5 scale visual',
    section: 'Components',
    template: '[rating: 4.5]',
    icon: '⭐'
  },
  {
    label: '/progress Progress Bar',
    display: 'Progress Bar',
    detail: 'Completion visualization',
    section: 'Components',
    template: '[progress: 75%]',
    icon: '▓'
  },
  {
    label: '/spark Sparkline',
    display: 'Sparkline',
    detail: 'Mini trendline chart',
    section: 'Components',
    template: '[spark: 10,20,50,30,90]',
    icon: '📈'
  },
  {
    label: '/toc Table of Contents',
    display: 'TOC',
    detail: 'Automatic [TOC]',
    section: 'Components',
    template: '[TOC]\n',
    icon: '≡'
  }
]

/**
 * slashCommandCompletionSource - The entry point for the CodeMirror completion engine.
 */
export const slashCommandCompletionSource = (context) => {
  // We trigger as soon as the user types "/" and follow it with word characters
  const match = context.matchBefore(/\/\w*$/)
  if (!match) return null

  /**
   * Return the completion object.
   * from: The position where the "/" starts (so we can replace it).
   * options: The list of commands transformed for CodeMirror's UI.
   */
  return {
    from: match.from,
    options: COMMANDS.map((cmd) => ({
      label: cmd.label,
      displayLabel: cmd.display,
      detail: cmd.detail,
      section: cmd.section,
      type: 'function',
      boost: 99, // High priority to show above standard word completions

      /**
       * render - Custom UI builder for the completion list.
       * We create a rich, two-line layout with an icon.
       */
      render: (completion) => {
        const container = document.createElement('div')
        container.className = 'cm-slash-option'
        container.style.cssText =
          'display: flex; align-items: center; gap: 10px; padding: 4px 8px; width: 100%; min-width: 280px;'

        const iconCol = document.createElement('div')
        iconCol.style.cssText = 'width: 20px; display: flex; justify-content: center; opacity: 0.8;'
        iconCol.textContent = cmd.icon

        const textCol = document.createElement('div')
        textCol.style.cssText = 'flex: 1; display: flex; flex-direction: column;'

        const label = document.createElement('div')
        label.style.cssText = 'font-weight: 600; font-size: 13px;'
        label.textContent = cmd.display

        const detail = document.createElement('div')
        detail.style.cssText = 'font-size: 11px; opacity: 0.5;'
        detail.textContent = cmd.detail

        textCol.appendChild(label)
        textCol.appendChild(detail)
        container.appendChild(iconCol)
        container.appendChild(textCol)
        return container
      },

      /**
       * apply - Executes the command when selected from the list.
       */
      apply: (view, completion, from, to) => {
        /**
         * SPECIAL CASE: Interactive Modals
         * If the user selects Mermaid or Table, we open a specialized modal
         * instead of just inserting a text string.
         */
        if (cmd.label.includes('Mermaid') || cmd.label.includes('Table Editor')) {
          // Clear the "/" trigger text first
          view.dispatch({ changes: { from, to, insert: '' } })

          // Fire a global event that the Workbench/SnippetEditor listens for
          window.dispatchEvent(
            new CustomEvent('app:open-source-modal', {
              detail: {
                view,
                from,
                to: from,
                initialCode: cmd.label.includes('Mermaid')
                  ? '```mermaid\ngraph TD\n  Start --> End\n```'
                  : '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |'
              }
            })
          )
          return
        }

        // STANDARD CASE: Insert the markdown template
        view.dispatch({
          changes: { from, to, insert: cmd.template },
          selection: { anchor: from + cmd.template.length },
          userEvent: 'input.complete'
        })

        /**
         * AUTO-CURSORY POSITIONING:
         * We intelligently move the cursor inside code blocks or callouts
         * after insertion so the user can start typing immediately.
         */
        if (cmd.template.includes('```')) {
          const lines = cmd.template.split('\n')
          // Skip the first ``` line and place cursor at start of second line
          const offset = lines[0].length + 1 + (lines[1] ? lines[1].length : 0)
          view.dispatch({ selection: { anchor: from + offset } })
        } else if (cmd.template.includes(':::')) {
          // Place cursor inside the admonition block
          view.dispatch({ selection: { anchor: from + cmd.template.indexOf('\n') + 1 } })
        }
      }
    })),
    // Use CodeMirror's built-in fuzzy filtering
    filter: true,
    validFor: /^\/\w*$/
  }
}
