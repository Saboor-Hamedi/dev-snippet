/**
 * Premium Mermaid Theme Configuration
 * Centered here for easy modification by the user.
 */

export const getMermaidConfig = (
  isDark,
  fontFamily = "'Outfit', 'Inter', -apple-system, sans-serif"
) => ({
  startOnLoad: false,
  theme: isDark ? 'dark' : 'default',
  securityLevel: 'loose',
  fontFamily: fontFamily,
  themeVariables: {
    // Primary Vibrant Colors (Vibrant but Professional)
    primaryColor: isDark ? '#388bfd' : '#0969da',
    primaryTextColor: isDark ? '#f0f6fc' : '#1f2328',
    primaryBorderColor: isDark ? '#58a6ff' : '#0969da',

    // Backgrounds & Layers
    lineColor: isDark ? '#8b949e' : '#656d76',
    secondaryColor: 'transparent',
    tertiaryColor: 'transparent',
    mainBkg: 'transparent',
    background: 'transparent',

    // Node & Cluster Specifics
    nodeBorder: isDark ? '#58a6ff' : '#0969da',
    nodeTextColor: isDark ? '#f0f6fc' : '#1f2328',
    clusterBkg: 'transparent',
    clusterBorder: isDark ? '#444c56' : '#d0d7de',

    // Sequence Diagrams - High Contrast
    actorBkg: 'transparent',
    actorTextColor: isDark ? '#f0f6fc' : '#1f2328',
    actorBorder: isDark ? '#58a6ff' : '#0969da',
    actorLineColor: isDark ? '#8b949e' : '#656d76',

    // Labels
    edgeLabelBackground: 'transparent',
    labelBackgroundColor: 'transparent',
    titleColor: isDark ? '#f0f6fc' : '#1f2328'
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis' // Smoother, more premium lines
  },
  sequence: {
    showSequenceNumbers: true,
    actorMargin: 50,
    width: 150
  },
  gantt: {
    fontSize: 12,
    barHeight: 25
  }
})
