/**
 * Premium Mermaid Theme Configuration
 * Centered here for easy modification by the user.
 */

export const getMermaidConfig = (
  isDark,
  fontFamily = "'Outfit', 'Inter', -apple-system, sans-serif"
) => ({
  // User Polish: Use 'neutral' theme for clean, standard "Paper" look without bluish tints.
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: fontFamily,
  themeVariables: {
    // Force clean B&W / Grayscale style for "Independent" feel
    primaryColor: '#ffffff',
    primaryTextColor: '#000000',
    primaryBorderColor: '#333333',
    lineColor: '#333333',
    secondaryColor: '#f4f4f4',
    tertiaryColor: '#fff',

    // Explicit Node styling to remove "thick border" or "bluish cell"
    nodeBorder: '#333333',
    clusterBkg: '#ffffff',
    clusterBorder: '#333333',

    // Sequence
    actorBkg: '#ffffff',
    actorTextColor: '#000000',
    actorBorder: '#333333',
    actorLineColor: '#333333',

    // Labels
    edgeLabelBackground: '#ffffff', // Opaque label background to read over lines
    labelBackgroundColor: '#ffffff',
    fontSize: '16px'
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  },
  sequence: {
    showSequenceNumbers: true,
    actorMargin: 50,
    width: 150
  },
  gantt: {
    fontSize: 12,
    barHeight: 25
  },
  er: {
    // Specific fix for ER Diagram "bluish selected cell"
    fill: '#ffffff',
    stroke: '#333333'
  }
})
