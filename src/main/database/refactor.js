/**
 * WikiLink Refactoring Engine
 * 
 * Handles the propagation of title changes across the entire snippet library.
 * This ensures that when a snippet is renamed, all inbound [[WikiLinks]] in 
 * other snippets are updated to maintain knowledge graph integrity.
 */

/**
 * propagateRename - Executes a batch update for WikiLinks.
 * @param {Object} db - The better-sqlite3 database instance.
 * @param {string} oldTitle - The title before the change.
 * @param {string} newTitle - The new title to propagate.
 */
export const propagateRename = (db, oldTitle, newTitle) => {
  if (!oldTitle || !newTitle || oldTitle === newTitle) return 0;

  console.log(`🔗 [WikiLink Refactor] Propagating rename: "[[${oldTitle}]]" -> "[[${newTitle}]]"`);

  // We only target WikiLinks: [[Title]] or [[Title|Alias]]
  // Regex explanation:
  // \[\[ : Match opening brackets
  // ( ... ) : Capture group for the title
  // ${escapeRegex(oldTitle)} : The exact old title
  // (\|.*?)? : Optional alias group (e.g. |Alias)
  // \]\] : Match closing brackets
  
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedOld = escapeRegex(oldTitle);
  
  // Revised Regex:
  // \[\[ : Opening brackets
  // ( ... ) : Group 1: The old title (escaped)
  // (\.(?:md|markdown))? : Group 2: Optional extension
  // (\|.*?)? : Group 3: Optional alias
  // \]\] : Closing brackets
  // 'gi' : Global and Case-Insensitive
  const wikiLinkPattern = new RegExp(`\\[\\[(${escapedOld})(\\.(?:md|markdown))?(\\|.*?)?\\]\\]`, 'gi');

  // Find all snippets that might contain this link
  const searchPattern = `%[[${oldTitle}%`;
  const impactedSnippets = db.prepare(
    'SELECT id, code, code_draft FROM snippets WHERE (code LIKE ? OR code_draft LIKE ?) AND is_deleted = 0'
  ).all(searchPattern, searchPattern);

  let updatedCount = 0;

  impactedSnippets.forEach(snippet => {
    let hasChanges = false;
    let newCode = snippet.code;
    let newCodeDraft = snippet.code_draft;

    // Update main code
    if (newCode && newCode.toLowerCase().includes(`[[${oldTitle.toLowerCase()}`)) {
      const updated = newCode.replace(wikiLinkPattern, (match, title, ext, alias) => {
        return `[[${newTitle}${ext || ''}${alias || ''}]]`;
      });
      if (updated !== newCode) {
        newCode = updated;
        hasChanges = true;
      }
    }

    // Update draft code (if it exists)
    if (newCodeDraft && newCodeDraft.toLowerCase().includes(`[[${oldTitle.toLowerCase()}`)) {
      const updated = newCodeDraft.replace(wikiLinkPattern, (match, title, ext, alias) => {
        return `[[${newTitle}${ext || ''}${alias || ''}]]`;
      });
      if (updated !== newCodeDraft) {
        newCodeDraft = updated;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      db.prepare('UPDATE snippets SET code = ?, code_draft = ? WHERE id = ?')
        .run(newCode, newCodeDraft, snippet.id);
      updatedCount++;
    }
  });

  console.log(`✅ [WikiLink Refactor] Successfully updated ${updatedCount} snippets.`);
  return updatedCount;
};
