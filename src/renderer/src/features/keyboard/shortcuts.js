const MOD_KEY_PLACEHOLDER = '{{MOD}}'

const isModKeyPressed = (event) => event.ctrlKey || event.metaKey
const matchesKey = (event, key) => event.key?.toLowerCase() === key
const matchesBackslash = (event) =>
  event.key === '\\' ||
  event.key === '|' ||
  event.code === 'Backslash' ||
  event.code === 'IntlBackslash'

export const SHORTCUT_DEFINITIONS = [
  {
    id: 'dismiss-overlays',
    scope: 'Navigation',
    action: 'Dismiss overlays',
    description: 'Close open menus, modals, or popovers without blurring the editor.',
    displayCombos: ['Esc'],
    handlerKey: 'onEscapeMenusOnly',
    matchers: [
      {
        when: (event) => event.key === 'Escape' || event.key === 'Esc',
        preventDefault: (_, handled) => Boolean(handled),
        stopImmediatePropagation: (_, handled) => Boolean(handled)
      }
    ]
  },
  {
    id: 'close-editor',
    scope: 'Navigation',
    action: 'Close editor',
    description: 'Return to the Snippet Library.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + W`],
    handlerKey: 'onCloseEditor',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && matchesKey(event, 'w') && !event.shiftKey,
        preventDefault: () => true
      }
    ]
  },
  {
    id: 'search-library',
    scope: 'Navigation',
    action: 'Search in Library',
    description: 'Open quick search / commands (hold Shift for Command Mode).',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + P`],
    handlerKey: 'onToggleCommandPalette',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && matchesKey(event, 'p'),
        getArgs: (event) => [event.shiftKey]
      }
    ]
  },
  {
    id: 'toggle-sidebar',
    scope: 'Navigation',
    action: 'Toggle sidebar',
    description: 'Show or hide the snippet explorer.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + B`],
    handlerKey: 'onToggleSidebar',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && matchesKey(event, 'b') && !event.shiftKey
      }
    ]
  },
  {
    id: 'open-settings',
    scope: 'Navigation',
    action: 'Open Settings',
    description: 'Configure preferences from anywhere.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + ,`],
    handlerKey: 'onToggleSettings',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && event.key === ','
      }
    ]
  },
  {
    id: 'cycle-layouts',
    scope: 'Navigation',
    action: 'Cycle layouts',
    description: 'Switch Reading / Hybrid / Editing modes.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + /`],
    handlerKey: 'onToggleMode',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && event.key === '/'
      }
    ]
  },
  {
    id: 'toggle-flow-mode',
    scope: 'Workspace',
    action: 'Toggle Flow Mode',
    description: 'Enter the dual-pane floating workstation.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + Shift + F`],
    handlerKey: 'onToggleFlow',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && event.shiftKey && matchesKey(event, 'f')
      }
    ]
  },
  {
    id: 'toggle-quick-capture',
    scope: 'Workspace',
    action: 'Quick Capture',
    description: 'Summon the floating inbox window.',
    displayCombos: ['Shift + Alt + Space'],
    handlerKey: 'onToggleQuickCapture',
    matchers: [
      {
        when: (event) =>
          event.shiftKey &&
          event.altKey &&
          (event.code === 'Space' ||
            event.code === 'Spacebar' ||
            event.key === ' ' ||
            event.key === 'Spacebar')
      }
    ]
  },
  {
    id: 'create-snippet',
    scope: 'Editing',
    action: 'Create new snippet',
    description: 'Open a new draft and focus the editor.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + N`],
    handlerKey: 'onCreateSnippet',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && matchesKey(event, 'n') && !event.shiftKey
      }
    ]
  },
  {
    id: 'save-snippet',
    scope: 'Editing',
    action: 'Save snippet',
    description: 'Persist the active snippet.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + S`, `${MOD_KEY_PLACEHOLDER} + Shift + S`],
    handlerKey: 'onSave',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && event.key === 's' && !event.shiftKey
      },
      {
        when: (event) => isModKeyPressed(event) && event.key === 's' && event.shiftKey
      }
    ]
  },
  {
    id: 'rename-snippet',
    scope: 'Editing',
    action: 'Rename snippet',
    description: 'Inline rename for the selected snippet.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + R`],
    handlerKey: 'onRenameSnippet',
    logErrors: true,
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && matchesKey(event, 'r') && !event.shiftKey,
        stopPropagation: true
      }
    ]
  },
  {
    id: 'delete-snippet',
    scope: 'Editing',
    action: 'Delete snippet',
    description: 'Move the selection to Trash.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + Shift + D`],
    handlerKey: 'onDeleteSnippet',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && event.shiftKey && matchesKey(event, 'd')
      }
    ]
  },
  {
    id: 'copy-snippet',
    scope: 'Editing',
    action: 'Copy to clipboard',
    description: "Copy the selected snippet's code.",
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + Shift + C`],
    handlerKey: 'onCopyToClipboard',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && event.shiftKey && matchesKey(event, 'c')
      }
    ]
  },
  {
    id: 'pin-snippet',
    scope: 'Editing',
    action: 'Pin / Unpin',
    description: 'Toggle pin state for the focused snippet.',
    displayCombos: ['Alt + P'],
    handlerKey: 'onTogglePin',
    matchers: [
      {
        when: (event) => event.altKey && matchesKey(event, 'p')
      }
    ]
  },
  {
    id: 'editor-search',
    scope: 'Editing',
    action: 'In-editor search',
    description: 'Opens the CodeMirror find UI (handled in-editor).',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + F`]
  },
  {
    id: 'toggle-preview',
    scope: 'Preview',
    action: 'Toggle Preview',
    description: 'Switch between live preview and source editing.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + \\`, `${MOD_KEY_PLACEHOLDER} + E`, 'Alt + E'],
    handlerKey: 'onTogglePreview',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && !event.shiftKey && matchesBackslash(event)
      },
      {
        when: (event) => (isModKeyPressed(event) || event.altKey) && matchesKey(event, 'e')
      }
    ]
  },
  {
    id: 'zen-focus',
    scope: 'Workspace',
    action: 'Zen Focus Mode',
    description: 'Toggle immersive dim mode for focused writing.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + Shift + \\`],
    handlerKey: 'onToggleZenFocus',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && event.shiftKey && matchesBackslash(event)
      }
    ]
  },
  {
    id: 'zoom-in',
    scope: 'Zoom',
    action: 'Zoom in',
    description: 'Scale the workspace up.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + =`, `${MOD_KEY_PLACEHOLDER} + +`],
    handlerKey: 'onZoomIn',
    matchers: [
      {
        when: (event) =>
          isModKeyPressed(event) &&
          (event.key === '=' ||
            event.key === '+' ||
            event.code === 'Equal' ||
            event.code === 'NumpadAdd' ||
            event.key === 'Add')
      }
    ]
  },
  {
    id: 'zoom-out',
    scope: 'Zoom',
    action: 'Zoom out',
    description: 'Scale the workspace down.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + -`],
    handlerKey: 'onZoomOut',
    matchers: [
      {
        when: (event) =>
          isModKeyPressed(event) &&
          (event.key === '-' ||
            event.key === '_' ||
            event.code === 'Minus' ||
            event.code === 'NumpadSubtract' ||
            event.key === 'Subtract')
      }
    ]
  },
  {
    id: 'zoom-reset',
    scope: 'Zoom',
    action: 'Reset zoom',
    description: 'Return to the default scale.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + 0`],
    handlerKey: 'onZoomReset',
    matchers: [
      {
        when: (event) =>
          isModKeyPressed(event) &&
          (event.key === '0' || event.code === 'Digit0' || event.code === 'Numpad0'),
        preventDefault: false
      }
    ]
  },
  {
    id: 'toggle-knowledge-graph',
    scope: 'Navigation',
    action: 'Knowledge Graph',
    description: 'Open the interactive visual map of all snippets and connections.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + G`],
    handlerKey: 'onToggleGraph',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && matchesKey(event, 'g') && !event.shiftKey
      }
    ]
  },
  {
    id: 'toggle-ai-pilot',
    scope: 'AI',
    action: 'AI Pilot',
    description: 'Summon the intelligent DeepSeek AI Pilot.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + Shift + A`],
    handlerKey: 'onToggleAIPilot',
    matchers: [
      {
        when: (event) => isModKeyPressed(event) && event.shiftKey && matchesKey(event, 'a')
      }
    ]
  },
  {
    id: 'zoom-wheel',
    scope: 'Zoom',
    action: 'Smooth zoom',
    description: 'VS Code-style zoom via the mouse wheel.',
    displayCombos: [`${MOD_KEY_PLACEHOLDER} + Mouse Wheel`]
  }
]

export { MOD_KEY_PLACEHOLDER }
