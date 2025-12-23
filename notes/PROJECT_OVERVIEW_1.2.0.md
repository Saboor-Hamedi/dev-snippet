<!--
  Release notes / human overview for v1.2.0
  Based on notes/PROJECT_OVERVIEW1.md (v1.0.0)
-->

# Quick Snippets — Release Notes & Overview (v1.2.0)

> This is the 1.2.0 follow-up to our original 1.0.0 overview. Think of 1.0.0 as the promise — fast capture and frictionless snippets — and 1.2.0 as the polish: live settings, smoother zoom, smarter language handling, and quality-of-life fixes that make the app feel more like part of your workflow.

If you haven't already, read the original 1.0.0 note (`notes/PROJECT_OVERVIEW1.md`) — this short post assumes you know the core idea: a tiny, local-first snippet manager that gets out of your way.

---

## What's new in 1.2.0 (short)

- Live Settings: modify editor preferences (theme, font, word-wrap, zoom) and see them apply instantly across the app.
- Rename → Language Sync: when you rename a snippet to include an extension (e.g., `example.js`), the editor automatically picks the right language and syntax highlighting updates immediately.
- Smoother Zoom: mouse-wheel and keyboard zoom are throttled and debounced to remove jitter; transitions are tuned for a stable, VS Code-like feeling.
- Caret & Rendering Fixes: the cursor no longer looks oversized during zoom and keeps consistent thickness at all scales.
- Split-pane polish: overlay mode and animated show/hide are more fluid, and the Live Preview remains snappy while maintaining performance.
- Developer ergonomics: language registry refactor and better settings watching make it easier to add languages and adjust behavior at runtime.

---

## Live Settings — why it matters (and what you can do)

One of the most-requested improvements was the ability to tweak settings and immediately feel the result. In 1.2.0 we introduced a live settings pipeline:

- Edit settings from the Settings panel (theme, editor font + size, word wrap, overlay mode, zoom level).
- Changes are written to the local settings file and are watched by the app — updates are applied everywhere without restarting.
- External edits (you or another app editing the same JSON file) are detected and merged safely with defaults.

This means:

- Try a theme and see the editor update instantly.
- Drag the zoom control and watch the CodeMirror area resize smoothly — the value persists for next launches.
- Tweak word-wrap or editor font and continue working without losing focus.

Image placeholders (add your screenshots here):

- Live Settings panel screenshot: `![Live Settings](/notes/images/live-settings.png)`
- Theme change example: `![Theme Switch](/notes/images/theme-switch.png)`

---

## How 1.2.0 relates to 1.0.0

Think of 1.0.0 as the foundation (keyboard-centric flows, fast capture, split preview). 1.2.0 keeps everything you loved and focuses on three things:

- Reliability — fix edge-cases (rename/language sync, autosave edge conditions).
- Responsiveness — reduce visual jitter and make UI feel consistent under rapid interactions (zoom, toggles, theme changes).
- Developer friendliness — clearer language registry, centralized settings, easier to extend.

If the 1.0.0 post is the elevator pitch, 1.2.0 is the little UX polish that makes you use the app every day.

---

## Upgrade notes (for power users)

- Settings file: 1.2.0 watches the same settings file but will fallback to defaults if JSON is malformed. If you manually edit `settings.json`, ensure valid JSON (no trailing commas). Use `window.api.getSettingsPath()` from DevTools to find the file.
- Language mapping: If you add custom extensions, register them in the language registry so rename-to-language continues working.

---

## A few technical highlights (for curious devs)

- `languageRegistry` centralizes extension → language mapping and lazy-loads CodeMirror language packages.
- `SettingManager` reads and watches settings.json, merges safely with `DEFAULT_SETTINGS`, and notifies components on change.
- `CodeEditor` applies zoom via a CSS variable (`--zoom-level`) for instant visual updates and uses a debounced persistence step so settings are not spammed during fast interactions.

Placeholder for architecture diagram: `![Architecture Diagram](/notes/images/architecture.png)`

---

## What’s next / roadmap hints

- Snippet tagging & collections (search by tag).
- Export/import (Gist, JSON bundles).
- Plugin hooks for custom renderers or integrations.

If you want any of these prioritized, open an issue or drop me a note in the repo — your feedback shapes the next minor.

---

Thanks for using Quick Snippets. This version is about small, focused improvements that make the app feel like an extension of your workflow rather than another tool you have to babysit. Add your screenshots into `/notes/images/` and they’ll show up in the placeholders above.

— The Quick Snippets Team
