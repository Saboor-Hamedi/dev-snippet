import buildTheme from './buildTheme'
import { premiumTypingBundle } from './premiumFeatures'
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
    snippetTitles = []
  } = options
  const { debouncedSaveZoom } = handlers

  const exts = []

  // 1. THEME & VISUALS (Always first)
  exts.push(buildTheme(EditorView, { isDark, caretColor, fontSize, cursorWidth, cursorShape }))

  const { tooltips } = await import('@codemirror/view')
  exts.push(
    tooltips({
      position: 'fixed'
    })
  )

  // 2.5 LINK PREVIEW (WikiLinks) - Premium Feature
  exts.push(linkPreviewTooltip)

  // 2.6 DOUBLE-CLICK WARP - Navigation Speed Feature
  const { wikiLinkWarp } = await import('./linkPreview')
  exts.push(wikiLinkWarp)
  const completionSources = []
  if (!isLargeFile) {
    try {
      const { wikiLinkCompletionSource } = await import('./wikiLinkCompletion.js')
      if (wikiLinkCompletionSource) {
        completionSources.push(wikiLinkCompletionSource(snippetTitles))
      }
      // Add Slash Command completions for markdown
      const { slashCommandCompletionSource } = await import('./slashCommandCompletion.js')
      completionSources.push(slashCommandCompletionSource)
    } catch (e) {}
  }

  // 3. CORE EDITOR FUNCTIONALITY (Try-Catch to prevent complete engine failure)
  try {
    const { dropCursor, drawSelection, keymap, highlightActiveLine } =
      await import('@codemirror/view')
    const { indentOnInput, bracketMatching, defaultHighlightStyle } =
      await import('@codemirror/language')
    const { defaultKeymap, historyKeymap, history } = await import('@codemirror/commands')
    const { closeBrackets, closeBracketsKeymap, completionKeymap, autocompletion } =
      await import('@codemirror/autocomplete')

    // Define premium syntax highlighting style
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
      { tag: t.heading1, fontSize: '1.8em' },
      { tag: t.heading2, fontSize: '1.4em' },
      { tag: t.heading3, fontSize: '1.2em' },
      { tag: t.heading4, fontSize: '1.1em' },
      { tag: t.heading5, fontSize: '1em' },
      { tag: t.heading6, fontSize: '0.9em' },
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

    // Basic UI Extensions
    exts.push(dropCursor())
    exts.push(drawSelection({ cursorBlinkRate: 0 })) // We use custom blinking
    // Intentionally DO NOT add highlightActiveLine() to avoid aggressive
    // full-line background highlighting on single click. Background
    // indicator is managed via theme CSS instead.
    exts.push(indentOnInput())
    // Exclude backticks from auto-closing as per user request
    exts.push(closeBrackets({ brackets: ['(', '[', '{', "'", '"'] }))
    exts.push(bracketMatching())
    exts.push(syntaxHighlighting(premiumHighlightStyle, { fallback: true }))
    exts.push(history())

    // REGISTER UNIFIED AUTOCOMPLETION
    // We use 'override' for markdown to prioritize WikiLinks
    const autoConfig = {
      activateOnTyping: true,
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
      // Add Obsidian-style Live Preview
      exts.push(richMarkdownExtension)
    }
    // Priority 3: Dynamic discovery
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
