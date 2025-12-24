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
    primaryColor: isDark ? '#dee1e4ff' : '#dee1e4ff',
    primaryTextColor: isDark ? '#f0f6fc' : '#1f2328',
    primaryBorderColor: isDark ? '#dee1e4ff' : '#dee1e4ff',

    // Backgrounds & Layers
    lineColor: isDark ? '#8b949e' : '#656d76',
    secondaryColor: 'transparent',
    tertiaryColor: 'transparent',
    mainBkg: 'transparent',
    background: 'transparent',

    // Node & Cluster Specifics
    nodeBorder: isDark ? '#dee1e4ff' : '#dee1e4ff',
    nodeTextColor: isDark ? '#f0f6fc' : '#1f2328',
    clusterBkg: 'transparent',
    clusterBorder: isDark ? '#dee1e4ff' : '#dee1e4ff',

    // Sequence Diagrams - High Contrast
    actorBkg: 'transparent',
    actorTextColor: isDark ? '#f0f6fc' : '#1f2328',
    actorBorder: isDark ? '#dee1e4ff' : '#dee1e4ff',
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
