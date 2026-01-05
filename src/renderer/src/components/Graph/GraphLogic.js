/**
 * GraphLogic.js
 *
 * Responsible for parsing snippet content, extracting WikiLinks,
 * and building the node-link data structure for the Knowledge Graph.
 */

const WIKILINK_REGEX = /\[\[([^\]\n]+)\]\]/g

/**
 * Parses all snippets and builds the graph data
 * @param {Array} snippets - Array of snippet objects (must include 'code' and 'title')
 * @returns {Object} { nodes, links }
 */
export const buildGraphData = (snippets) => {
  if (!snippets || !Array.isArray(snippets)) return { nodes: [], links: [] }

  const nodesMap = new Map()
  const links = []

  // 1. Initialize all snippets as nodes
  snippets.forEach((snippet) => {
    if (!snippet.title) return
    nodesMap.set(snippet.title.toLowerCase(), {
      id: snippet.id,
      title: snippet.title,
      type: snippet.type || 'snippet',
      language: snippet.language || 'markdown',
      isPinned: !!snippet.is_pinned,
      isFavorite: !!snippet.is_favorite,
      count: 0, // Number of incoming/outgoing links
      val: 1 // For node sizing (initially 1)
    })
  })

  // 2. Extract links
  snippets.forEach((snippet) => {
    if (!snippet.title) return
    const content = snippet.code || ''
    let match

    // Reset regex state
    WIKILINK_REGEX.lastIndex = 0

    const sourceTitle = snippet.title.toLowerCase()
    const sourceNode = nodesMap.get(sourceTitle)

    while ((match = WIKILINK_REGEX.exec(content)) !== null) {
      const targetTitle = match[1].trim().toLowerCase()

      // We only link to nodes that exist in our snippet library
      if (nodesMap.has(targetTitle)) {
        const targetNode = nodesMap.get(targetTitle)

        // Avoid self-links for the graph visuals
        if (sourceTitle !== targetTitle) {
          links.push({
            source: snippet.id, // We use IDs for stability in force-directed engines
            target: targetNode.id,
            type: 'wikilink'
          })

          // Increase connectivity metrics
          if (sourceNode) sourceNode.count++
          if (targetNode) targetNode.count++
        }
      }
    }
  })

  // 3. Finalize nodes list and adjust sizing based on connectivity
  const nodes = Array.from(nodesMap.values()).map((node) => {
    // Robust scaling: base visibility + connectivity weight
    // Base is 5 to ensure "normal zoom" visibility, scaling is 4 for hubs
    node.val = 8 + Math.log2(node.count + 1) * 4
    return node
  })

  return { nodes, links }
}

/**
 * Filters graph data based on search query or other criteria
 */
export const filterGraphData = (data, query) => {
  if (!query) return data

  const lowerQuery = query.toLowerCase()
  const filteredNodes = data.nodes.filter(
    (node) =>
      node.title.toLowerCase().includes(lowerQuery) ||
      node.language.toLowerCase().includes(lowerQuery)
  )

  const nodeIds = new Set(filteredNodes.map((n) => n.id))
  const filteredLinks = data.links.filter(
    (link) =>
      nodeIds.has(typeof link.source === 'object' ? link.source.id : link.source) &&
      nodeIds.has(typeof link.target === 'object' ? link.target.id : link.target)
  )

  return { nodes: filteredNodes, links: filteredLinks }
}

/**
 * Generates a random beautiful graph theme
 */
export const generateRandomGraphTheme = () => {
  const backgrounds = [
    '#050505',
    '#0a0a0c',
    '#0d1117',
    '#09090b',
    '#111111',
    '#020617',
    '#080a0f',
    '#070707',
    '#121212',
    '#030712'
  ]

  // 🛰️ COSMIC THEMES: High-contrast "Night Sky" variations
  const palettes = [
    {
      name: 'Obsidian Cosmos',
      bg: '#0a0d14',
      accent: '#58a6ff',
      secondary: '#626e7c',
      moon: '#f0f4f8', // Bright Moon White
      central: '#38BDF8' // Shimmering Sky Blue
    },
    {
      name: 'Midnight Nebula',
      bg: '#09090b',
      accent: '#c084fc',
      secondary: '#4b5563',
      moon: '#faf5ff', // Ethereal Purple-White
      central: '#ec4899' // Vibrant Pink Hub
    },
    {
      name: 'Deep Sea Night',
      bg: '#020617',
      accent: '#10b981',
      secondary: '#334155',
      moon: '#f0fdf4', // Soft Emerald Glow
      central: '#22d3ee' // Electric Cyan
    },
    {
      name: 'Eclipse',
      bg: '#050505',
      accent: '#fb923c',
      secondary: '#44403c',
      moon: '#fff7ed', // Warm Sunlight White
      central: '#f59e0b' // Amber Sun Hub
    },
    {
      name: 'Starlight Sky',
      bg: '#0c111d',
      accent: '#6366f1',
      secondary: '#475467',
      moon: '#f9fafb',
      central: '#818cf8'
    }
  ]

  const palette = palettes[Math.floor(Math.random() * palettes.length)]

  return {
    background: palette.bg,
    accent: palette.accent,
    secondary: palette.secondary,
    moon: palette.moon,
    central: palette.central,
    linkOpacity: 0.22,
    particleColor: palette.accent
  }
}
