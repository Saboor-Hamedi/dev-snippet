/**
 * Check if a snippet is saved (not a draft)
 * A snippet is considered saved if:
 * - It has a valid ID
 * - It's not marked as draft
 * - It doesn't have a draft- prefix ID
 */
export function isSnippetSaved(snippet) {
  if (!snippet) return false
  
  // Explicitly marked as draft
  if (snippet.is_draft === true) return false
  
  // Has draft ID prefix (temporary/unsaved)
  if (typeof snippet.id === 'string' && snippet.id.startsWith('draft-')) return false
  
  // Must have a valid ID to be considered saved
  return Boolean(snippet.id)
}
