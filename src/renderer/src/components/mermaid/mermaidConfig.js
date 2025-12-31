/**
 * Enhanced Premium Mermaid Theme Configuration
 * Fixed: Bottom text clipping/overlays in nodes (especially with <p> tags)
 * By disabling htmlLabels – uses pure SVG text for reliable rendering
 */

export const getMermaidConfig = (
  isDark,
  fontFamily = "'Outfit', 'Inter', -apple-system, sans-serif"
) => {
  // COLORS ALIGNED WITH index.css
  const primary = isDark ? '#58a6ff' : '#0969da'
  const text = isDark ? '#c9d1d9' : '#24292f'
  const bg = isDark ? '#161b22' : '#ffffff'
  const border = isDark ? 'rgba(88, 166, 255, 0.4)' : 'rgba(9, 105, 218, 0.25)'
  const edge = isDark ? '#8b949e' : '#6b7280'

  return {
    theme: isDark ? 'dark' : 'neutral',
    securityLevel: 'loose',
    fontFamily: fontFamily,
    themeVariables: {
      darkMode: isDark,
      primaryColor: isDark ? '#1f6feb' : '#eff6ff',
      primaryTextColor: isDark ? '#ffffff' : '#1e3a8a',
      primaryBorderColor: primary,
      lineColor: edge,
      secondaryColor: isDark ? '#238636' : '#f9fafb',
      tertiaryColor: isDark ? '#161b22' : '#ffffff',

      // Node styling - Balanced for all diagram types
      nodeBorder: border,
      clusterBkg: isDark ? 'rgba(22, 27, 34, 0.9)' : '#f3f4f6',
      clusterBorder: border,
      defaultLinkColor: edge,

      // Mindmap - Generous sizing and spacing
      mindmapNodeRadius: '50',
      mindmapTextColor: text,
      mindmapLineColor: edge,

      // Sequence & General Labels
      actorBkg: isDark ? '#0d1117' : '#ffffff',
      actorTextColor: text,
      actorBorder: primary,
      actorLineColor: edge,
      signalColor: text,
      signalTextColor: text,
      labelBoxBkgColor: bg,
      labelBoxBorderColor: primary,
      labelTextColor: text,
      loopTextAreaBkgColor: isDark ? '#0d1117' : '#f0f9ff',
      noteBkgColor: isDark ? '#f2cc60' : '#fff9db',
      noteTextColor: '#000000',
      noteBorderColor: isDark ? '#f2cc60' : '#fab005',

      // Global Font Scaling - 16px is standard for high-legibility
      fontSize: '16px',
      mainBkg: bg,
      background: bg
    },
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true, // Re-enabled with CSS fix for best rendering
      curve: 'basis',
      padding: 60,
      nodeSpacing: 60,
      rankSpacing: 60
    },
    mindmap: {
      useMaxWidth: true,
      padding: 80,
      maxNodeWidth: 250
    },
    sequence: {
      showSequenceNumbers: true,
      actorMargin: 100,
      width: 200,
      mirrorActors: true,
      bottomMarginAdjustment: 20,
      boxMargin: 20
    },
    er: {
      useMaxWidth: true,
      padding: 60,
      fill: bg,
      stroke: primary,
      entityPadding: 30
    },
    gantt: {
      useMaxWidth: true,
      numberSectionStyles: 2,
      axisFormat: '%m/%d/%Y',
      barHeight: 30,
      barGap: 8,
      padding: 60,
      fontSize: 16
    },
    journey: {
      useMaxWidth: true,
      actorMargin: 80,
      boxMargin: 20,
      padding: 60
    }
  }
}
