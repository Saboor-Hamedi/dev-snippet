import { forceSelection } from './forceSelection'
import buildTheme from './buildTheme'
import { premiumTypingBundle } from './premiumFeatures'
import { zenFocusExtension } from './zenFocus'
import { linkPreviewTooltip } from './linkPreview'
import './linkPreview.css'
import { tags as t } from '@lezer/highlight'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { richMarkdownExtension } from '../engine'

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

  const { tooltips } = await import('@codemirror/view')
  exts.push(
    tooltips({
      position: 'fixed'
    })
  )

  // 2.5 LINK PREVIEW (WikiLinks) - Premium Feature
  exts.push(linkPreviewTooltip)

  // 2.5.1 ZEN FOCUS - Immersive Writing Feature
  exts.push(zenFocusExtension(zenFocus))

  // 2.6 DOUBLE-CLICK WARP - Navigation Speed Feature
  const { wikiLinkWarp, wikiLinkPlugin } = await import('./linkPreview')
  exts.push(wikiLinkWarp)
  exts.push(wikiLinkPlugin)
  const completionSources = []
  if (!isLargeFile) {
    try {
      const { wikiLinkCompletionSource } = await import('./wikiLinkCompletion.js')
      if (wikiLinkCompletionSource) {
        completionSources.push(wikiLinkCompletionSource(snippetTitles))
      }
    } catch (e) {
      console.warn('[Editor] Failed to load wiki link completion', e)
    }

    // 3. SLASH COMMANDS
    try {
      const { slashCommandCompletionSource } = await import('./slashCommandCompletion.js')
      if (slashCommandCompletionSource) {
        completionSources.push(slashCommandCompletionSource)
      }
    } catch (e) {
      console.warn('[Editor] Failed to load slash commands', e)
    }
  }

  // 3. CORE EDITOR FUNCTIONALITY (Try-Catch to prevent complete engine failure)
  try {
    const { dropCursor, drawSelection, keymap, highlightActiveLine } =
      await import('@codemirror/view')
    const { indentOnInput, bracketMatching, defaultHighlightStyle } =
      await import('@codemirror/language')
    const { defaultKeymap, historyKeymap, history } = await import('@codemirror/commands')
    const {
      closeBrackets,
      closeBracketsKeymap,
      completionKeymap,
      closeCompletion,
      autocompletion
    } = await import('@codemirror/autocomplete')

    // Define premium syntax highlighting style
    // NOTE: Font sizes are controlled by buildTheme.js (.cm-h1, .cm-h2, etc.)
    // This HighlightStyle only handles COLORS and STYLES, not sizes
    const premiumHighlightStyle = HighlightStyle.define([
      { tag: t.keyword, color: 'var(--color-syntax-keyword, #ff7b72)', fontWeight: 'bold' },
      {
        tag: [t.variableName, t.definition(t.variableName), t.propertyName],
        color: 'var(--color-syntax-variable, #79c0ff)'
      },
      {
        tag: [t.function(t.variableName), t.function(t.propertyName)],
        color: 'var(--color-syntax-variable, #79c0ff)',
        fontStyle: 'italic'
      },
      { tag: t.string, color: 'var(--color-syntax-string, #a5d6ff)' },
      { tag: t.number, color: 'var(--color-syntax-number, #d19a66)' },
      { tag: t.bool, color: 'var(--color-syntax-boolean, #ff7b72)' },
      { tag: t.null, color: 'var(--color-syntax-null, #79c0ff)' },
      { tag: t.comment, color: 'var(--color-syntax-comment, #8b949e)', fontStyle: 'italic' },
      {
        tag: [t.punctuation, t.separator, t.bracket],
        color: 'var(--color-syntax-punctuation, #8b949e)'
      },
      { tag: t.heading, color: 'var(--color-accent-primary, #58a6ff)', fontWeight: 'bold' },
      // REMOVED fontSize from headings - controlled by buildTheme.js instead
      { tag: t.heading1 },
      { tag: t.heading2 },
      { tag: t.heading3 },
      { tag: t.heading4 },
      { tag: t.heading5 },
      { tag: t.heading6 },
      { tag: t.link, color: 'var(--color-accent-secondary, #58a6ff)', textDecoration: 'underline' },
      { tag: t.strong, fontWeight: 'bold' },
      { tag: t.emphasis, fontStyle: 'italic' },
      { tag: t.strikethrough, textDecoration: 'line-through' },
      {
        tag: t.monospace,
        color: 'var(--color-accent-primary, #58a6ff)',
        backgroundColor: 'rgba(88, 166, 255, 0.1)',
        padding: '1px 4px',
        borderRadius: '4px'
      }
    ])

    // ========================================================================
    // HYBRID SELECTION SYSTEM (Custom Cursor + Text-Only Selection)
    // ========================================================================
    //
    // THE CHALLENGE:
    // - CodeMirror's 'drawSelection' is REQUIRED for custom cursor shapes (block, underline).
    // - BUT 'drawSelection' creates full-width selection backgrounds (ugly on headers).
    // - Disabling 'drawSelection' gives clean selection but kills custom cursors.
    // - Hiding CM's selection layer while forcing native ::selection fails (transparent).
    //
    // THE SOLUTION (3-Part Hybrid):
    // 1. Enable 'drawSelection' below → Provides custom cursor rendering
    // 2. Add 'forceSelection()' extension → Decorates selected text with .cm-force-selection
    // 3. CSS in CodeEditor.css:
    //    - Hides .cm-selectionBackground (kills full-width blocks)
    //    - Styles .cm-force-selection (provides visible text-only highlight)
    //
    // RESULT: Custom cursor shapes + Clean text-only selection highlighting
    // ========================================================================
    exts.push(drawSelection({ cursorBlinkRate: 0 }))
    exts.push(forceSelection())

    // Intentionally DO NOT add highlightActiveLine() to avoid aggressive
    // full-line background highlighting on single click. Background
    // indicator is managed via theme CSS instead.

    // Only load heavy interaction handlers for standard files
    if (!isLargeFile) {
      exts.push(indentOnInput())
      // Exclude backticks from auto-closing as per user request
      exts.push(closeBrackets({ brackets: ['(', '[', '{', "'", '"'] }))
      exts.push(bracketMatching())

      // Add Premium Typing Bundle (Sounds + Selection watcher)
      // This was previously imported but missing from the push list
      exts.push(premiumTypingBundle)
    }

    exts.push(syntaxHighlighting(premiumHighlightStyle, { fallback: true }))
    exts.push(history())

    // REGISTER UNIFIED AUTOCOMPLETION
    // We use 'override' for markdown to prioritize WikiLinks
    const autoConfig = {
      activateOnTyping: !isLargeFile, // Disable auto-popup for massive files
      icons: true,
      defaultKeymap: true
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

    if (isWikiEnabled && completionSources.length > 0) {
      autoConfig.override = completionSources
    }

    exts.push(autocompletion(autoConfig))

    // Essential Keymaps
    exts.push(
      keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap, ...completionKeymap])
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
        l.alias.some((a) => a.toLowerCase() === normalizedLang) ||
        (l.extensions && l.extensions.some((e) => e.toLowerCase() === normalizedLang))
    )
    // Priority 1: Explicit JSON (Settings)
    if (normalizedLang === 'json') {
      const { json } = await import('@codemirror/lang-json')
      exts.push(json())
    }
    // Priority 2: Markdown with extras
    else if (normalizedLang === 'markdown' || normalizedLang === 'md') {
      const { markdown, markdownLanguage } = await import('@codemirror/lang-markdown')
      const { languages } = await import('@codemirror/language-data')

      // Attempt to load GFM extensions for Tables/TaskLists - Critical for Live Preview
      let mdExtensions = [markdownLanguage]
      try {
        const { GFM, Table, TaskList } = await import('@lezer/markdown')
        mdExtensions = [GFM, Table, TaskList]
      } catch (e) {
        console.warn('[Editor] GFM extensions not found, falling back to CommonMark.', e)
      }

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
