import { forceSelection } from './forceSelection'
import buildTheme from './buildTheme'
import { premiumTypingBundle } from './premiumFeatures'
import { zenFocusExtension } from './zenFocus'
import { linkPreviewTooltip } from './linkPreview'
import './linkPreview.css'
import { richMarkdownExtension } from '../engine'
import { tags as t } from '@lezer/highlight'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import * as stateExports from '@codemirror/state'
import * as viewExports from '@codemirror/view'
import * as commandsExports from '@codemirror/commands'
import * as autocompleteExports from '@codemirror/autocomplete'
import * as languageExports from '@codemirror/language'
import * as completionExports from './wikiLinkCompletion.js'
import { slashCommandCompletionSource } from './slashCommandCompletion.js'
import { wikiLinkWarp, wikiLinkPlugin } from './linkPreview'

// Note: slashCommandCompletion.js still lazily loaded if needed,
// but let's try to stabilize the core.

const { drawSelection, keymap } = viewExports
const { indentOnInput, bracketMatching } = languageExports
const { defaultKeymap, historyKeymap, history } = commandsExports
const { closeBrackets, closeBracketsKeymap, completionKeymap, autocompletion } = autocompleteExports

import * as jsonLangExports from '@codemirror/lang-json'
import * as markdownLangExports from '@codemirror/lang-markdown'
import * as langDataExports from '@codemirror/language-data'
import * as lezerMarkdownExports from '@lezer/markdown'

const { json } = jsonLangExports
const { markdown, markdownLanguage } = markdownLangExports
const { languages } = langDataExports
// Safely extract GFM extensions if available
const { GFM, Table, TaskList } = lezerMarkdownExports || {}
const premiumHighlightStyle = HighlightStyle.define([
  {
    tag: [t.keyword, t.modifier, t.self, t.atom],
    color: 'var(--color-syntax-keyword, #ff7b72)',
    fontWeight: 'bold'
  },
  {
    tag: [t.null, t.bool],
    color: 'var(--color-syntax-boolean, #569cd6)',
    fontWeight: 'bold'
  },
  {
    tag: [t.variableName, t.definition(t.variableName), t.propertyName, t.attributeName],
    color: 'var(--color-syntax-variable, #79c0ff)'
  },
  {
    tag: [
      t.function(t.variableName),
      t.function(t.propertyName),
      t.className,
      t.typeName,
      t.namespace,
      t.macroName
    ],
    color: 'var(--color-syntax-function, #dcdcaa)'
  },
  { tag: [t.string, t.special(t.string)], color: 'var(--color-syntax-string, #a5d6ff)' },
  { tag: [t.number, t.integer, t.float], color: 'var(--color-syntax-number, #d19a66)' },
  {
    tag: [t.comment, t.lineComment, t.blockComment, t.docComment],
    color: 'var(--color-syntax-comment, #8b949e)',
    fontStyle: 'italic'
  },
  {
    tag: [t.punctuation, t.separator, t.bracket, t.angleBracket, t.squareBracket, t.paren],
    color: 'var(--color-syntax-punctuation, #8b949e)'
  },
  {
    tag: [t.operator, t.compareOperator, t.logicOperator, t.arithmeticOperator, t.bitwiseOperator],
    color: 'var(--color-syntax-punctuation, #8b949e)'
  },
  {
    tag: [t.heading, t.heading1, t.heading2, t.heading3, t.heading4, t.heading5, t.heading6],
    color: 'var(--color-accent-primary, #58a6ff)',
    fontWeight: 'bold'
  },
  { tag: t.link, color: 'var(--color-accent-primary, #58a6ff)', textDecoration: 'underline' },
  { tag: t.strong, color: 'var(--color-accent-primary, inherit)', fontWeight: 'bold' },
  { tag: t.emphasis, color: 'var(--color-accent-primary, inherit)', fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  {
    tag: t.monospace,
    color: 'var(--color-accent-primary, #58a6ff)',
    backgroundColor: 'rgba(139, 148, 158, 0.15)',
    padding: '2px 4px',
    borderRadius: '6px'
  },
  // MD Markers & Punctuation Sync
  {
    tag: [t.processingInstruction, t.meta, t.contentSeparator, t.url, t.labelName],
    color: 'var(--color-accent-primary, #58a6ff)',
    opacity: 0.8
  }
])

/**
 * Lazy-load language names to keep the main bundle light.
 */
let cachedLanguages = null
const getLanguages = async () => {
  if (cachedLanguages) return cachedLanguages
  try {
    const { languages } = await import('@codemirror/language-data')
    cachedLanguages = languages
    return languages
  } catch (e) {
    return []
  }
}

/**
 * coreExtensions: Standard CodeMirror configurations for a premium editor.
 */
const buildExtensions = async (options, handlers = {}) => {
  const {
    EditorView,
    isDark = false,
    caretColor = '#0f172a',
    fontSize = '14px',
    wordWrap = 'on',
    language = 'markdown',
    isLargeFile = false,
    cursorBlinking = true,
    cursorBlinkingSpeed = 500,
    cursorWidth = 2,
    cursorShape = 'bar',
    cursorSelectionBg,
    snippetTitles = [],
    zenFocus = false
  } = options
  const { debouncedSaveZoom } = handlers

  const exts = []

  // 1. THEME & VISUALS (Always first)
  exts.push(
    buildTheme(EditorView, {
      isDark,
      caretColor,
      fontSize,
      cursorWidth,
      cursorShape,
      cursorSelectionBg
    })
  )

  // 2. WIKILINK & AUTOCOMPLETE ENGINE
  // Loading completion sources lazily...

  exts.push(
    viewExports.tooltips({
      position: 'fixed'
    })
  )

  // 2.5 LINK PREVIEW (WikiLinks) - Premium Feature
  exts.push(linkPreviewTooltip)

  // 2.5.1 ZEN FOCUS - Immersive Writing Feature
  exts.push(zenFocusExtension(zenFocus))

  // 2.6 DOUBLE-CLICK WARP - Navigation Speed Feature
  exts.push(wikiLinkWarp)
  exts.push(wikiLinkPlugin)
  const completionSources = []
  if (!isLargeFile) {
    try {
      const { wikiLinkCompletionSource } = completionExports
      if (wikiLinkCompletionSource) {
        completionSources.push(wikiLinkCompletionSource(snippetTitles))
      }
    } catch (e) {
      console.warn('[Editor] Failed to load wiki link completion', e)
    }

    // 3. SLASH COMMANDS
    try {
      if (slashCommandCompletionSource) {
        completionSources.push(slashCommandCompletionSource)
      }
    } catch (e) {
      console.warn('[Editor] Failed to load slash commands', e)
    }
  }

  // Only use override if we are in markdown/text
  const l = language.toLowerCase()
  const isWikiEnabled =
    l === 'markdown' ||
    l === 'md' ||
    l === 'plaintext' ||
    l === 'text' ||
    l === 'txt' ||
    l === 'auto' // Add auto for safety

  // 3. CORE EDITOR FUNCTIONALITY (High Stability)
  try {
    // ========================================================================
    // HYBRID SELECTION SYSTEM (Custom Cursor + Text-Only Selection)
    // ========================================================================
    exts.push(drawSelection({ cursorBlinkRate: 0 }))
    exts.push(forceSelection())

    // Only load heavy interaction handlers for standard files
    if (!isLargeFile) {
      exts.push(indentOnInput())
      // Exclude backticks from auto-closing as per user request
      exts.push(autocompleteExports.closeBrackets({ brackets: ['(', '[', '{', "'", '"'] }))
      exts.push(bracketMatching())
      exts.push(premiumTypingBundle)
    }

    const { Prec } = stateExports
    exts.push(Prec.highest(syntaxHighlighting(premiumHighlightStyle)))
    exts.push(history())

    // REGISTER UNIFIED AUTOCOMPLETION
    const autoConfig = {
      activateOnTyping: !isLargeFile,
      icons: true,
      defaultKeymap: true
    }

    if (isWikiEnabled && completionSources.length > 0) {
      autoConfig.override = completionSources
    }

    exts.push(autocompletion(autoConfig))

    // Essential Keymaps
    exts.push(
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...autocompleteExports.closeBracketsKeymap,
        ...autocompleteExports.completionKeymap
      ])
    )
  } catch (e) {
    console.error('[Editor] Failed to load core extensions', e)
  }

  // 3.5. SEARCH HIGHLIGHTING (Custom search panel with highlighting)
  try {
    const { searchHighlighter, searchHighlightTheme } =
      await import('../search/searchHighlighter.js')

    exts.push(searchHighlighter)
    exts.push(searchHighlightTheme)
  } catch (e) {
    console.warn('[Editor] Failed to load search highlighting', e)
  }

  // 5. WORD WRAP
  if (String(wordWrap) === 'on' || wordWrap === true) {
    exts.push(EditorView.lineWrapping)
  }

  // 6. DYNAMIC LANGUAGE DETECTION & LOADING
  // PERFORMANCE KILL-SWITCH: For large files, we skip all language parsers (Markdown/JS/etc.)
  // and stay in pure plaintext mode to ensure zero typing lag.
  if (isLargeFile) {
    console.warn('[Editor] Massive file detected: Forcing Plaintext mode for performance.')
    return exts
  }

  try {
    const allLangs = await getLanguages()
    const normalizedLang = language.toLowerCase().replace(/^\./, '')

    const langDesc = allLangs.find(
      (l) =>
        l.name.toLowerCase() === normalizedLang ||
        (l.alias && l.alias.some((a) => a.toLowerCase() === normalizedLang)) ||
        (l.extensions && l.extensions.some((e) => e.toLowerCase() === normalizedLang))
    )
    // Priority 1: Explicit JSON (Settings)
    // Priority 1: Explicit JSON (Settings)
    if (normalizedLang === 'json' || language === 'json') {
      try {
        exts.push(json())
      } catch (e) {
        console.warn('[Editor] Failed to load JSON grammar', e)
        if (langDesc) {
          const support = await langDesc.load()
          exts.push(support)
        }
      }
    }
    // Priority 2: Markdown with extras
    else if (normalizedLang === 'markdown' || normalizedLang === 'md') {
      // GFM extensions for Tables/TaskLists - Critical for Live Preview
      // Use pre-loaded exports
      const mdExtensions = GFM ? [GFM, Table, TaskList] : [markdownLanguage]

      exts.push(
        markdown({
          base: markdownLanguage,
          extensions: mdExtensions,
          codeLanguages: languages,
          addKeymap: true
        })
      )
      // Add Obsidian-style Live Preview ONLY for standard sized files
      if (!isLargeFile) {
        exts.push(richMarkdownExtension)
      }
    }
    // Priority 3: Plain text (no extensions needed)
    else if (['plaintext', 'text', 'txt', ''].includes(normalizedLang)) {
      // Logic for plain text: No specific language extension required.
    }
    // Priority 4: Dynamic discovery
    else if (langDesc) {
      const langSupport = await langDesc.load()
      exts.push(langSupport)
      console.info(`[Editor] Loaded language: ${langDesc.name}`)
    } else {
      console.warn('[Editor] No language support found for:', normalizedLang)
    }
  } catch (e) {
    console.warn(`[Editor] Language loading failed for: ${language}`, e)
  }

  return exts
}

export default buildExtensions
