export const extractTags = (text) => {
  const t = String(text || '')
  const tags = new Set()
  const re = /(^|\s)#([a-zA-Z0-9_-]+)/g
  let m
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(t))) {
    tags.add(m[2].toLowerCase())
  }
  return Array.from(tags).join(',')
}

export default extractTags
