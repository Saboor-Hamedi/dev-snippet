import buildTheme from './buildTheme'
import { premiumTypingBundle } from './premiumFeatures'

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

  if (!isLargeFile) {
    exts.push(...premiumTypingBundle)
  }

  // 2. PREPARE AUTOCOMPLETION
  const completionSources = []
  if (!isLargeFile) {
    try {
      const { wikiLinkCompletionSource } = await import('./wikiLinkCompletion.js')
      if (wikiLinkCompletionSource) {
        completionSources.push(wikiLinkCompletionSource(snippetTitles))
      }
    } catch (e) {
      console.warn('[WikiLink] Failed to load source', e)
    }
  }

  // 3. CORE EDITOR FUNCTIONALITY (Try-Catch to prevent complete engine failure)
  try {
    const { dropCursor, drawSelection, keymap, highlightActiveLine } =
      await import('@codemirror/view')
    const { indentOnInput, bracketMatching, syntaxHighlighting, defaultHighlightStyle } =
      await import('@codemirror/language')
    const { defaultKeymap, historyKeymap, history } = await import('@codemirror/commands')
    const { closeBrackets, closeBracketsKeymap, completionKeymap, autocompletion } =
      await import('@codemirror/autocomplete')

    // Basic UI Extensions
    exts.push(dropCursor())
    exts.push(drawSelection({ cursorBlinkRate: 0 })) // We use custom blinking
    exts.push(highlightActiveLine())
    exts.push(indentOnInput())
    exts.push(syntaxHighlighting(defaultHighlightStyle, { fallback: true }))
    exts.push(closeBrackets())
    exts.push(bracketMatching())
    exts.push(history())

    // REGISTER UNIFIED AUTOCOMPLETION
    // We use 'override' for markdown to prioritize WikiLinks
    const autoConfig = {
      activateOnTyping: true,
      icons: true,
      defaultKeymap: true
    }

    // Only use override if we are in markdown and have titles
    const isMarkdown = language === 'markdown' || language === 'md'
    if (isMarkdown && completionSources.length > 0) {
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

  // 4. EDITOR UI (Line Numbers / Folding)
  try {
    const { lineNumbers } = await import('@codemirror/view')
    const { foldGutter, codeFolding } = await import('@codemirror/language')

    exts.push(lineNumbers({ formatNumber: (n) => n.toString() }))

    if (!isLargeFile) {
      exts.push(codeFolding())
      exts.push(
        foldGutter({
          markerDOM: (open) => {
            const icon = document.createElement('span')
            icon.className = 'cm-fold-marker'
            icon.innerHTML = open ? '▾' : '▸'
            return icon
          }
        })
      )
    }
  } catch (e) {
    console.warn('[Editor] Failed to load UI extras', e)
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

    if (langDesc) {
      const langSupport = await langDesc.load()
      exts.push(langSupport)
      console.info(`[Editor] Loaded language: ${langDesc.name}`)
    } else if (language === 'markdown' || language === 'md') {
      const { markdown } = await import('@codemirror/lang-markdown')
      exts.push(markdown({ addKeymap: true }))
    }
  } catch (e) {
    console.warn(`[Editor] Language loading failed for: ${language}`, e)
  }

  return exts
}

export default buildExtensions
