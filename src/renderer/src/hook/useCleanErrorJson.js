/**
 * @description Analyzes a JSON parsing error to provide a clean, user-friendly message,
 * identifying common issues like trailing commas.
 * @param {Error} error The error object from JSON.parse.
 * @param {string} jsonContent The raw JSON string content.
 * @returns {string} A clean, formatted error message for the user.
 */
const useCleanErrorJson = (error, jsonContent) => {
  let errorDetail = error.message
  const lineMatch = error.message.match(/line (\d+)/)

  if (lineMatch) {
    const lineNum = parseInt(lineMatch[1], 10)
    const lines = jsonContent.split('\n')
    const errorLineIndex = lineNum - 1

    // Check bounds before accessing array indices (Robustness)
    if (lines[errorLineIndex] !== undefined) {
      const badLine = lines[errorLineIndex].trim()
      const prevLine = lines[errorLineIndex - 1] ? lines[errorLineIndex - 1].trim() : ''

      // Check for common trailing comma error specifically
      // We check the PREVIOUS line for a comma and the error message for context
      // This is a robust check for one of the most common user errors.
      if (error.message.includes('double-quoted property name') && prevLine.endsWith(',')) {
        // Line number refers to the line *after* the comma, so point to the line needing the fix.
        const fixedLineNum = lineNum - 1
        errorDetail = `⚠️ Trailing comma detected on line ${fixedLineNum}!\nRemove comma from: "${prevLine}"`
        return errorDetail // Return early for clear error message
      }

      // If not a trailing comma, show the standard error near the bad line
      errorDetail = `${error.message}\nNear: "${badLine}"`
    }
  }
  return errorDetail
}

export default useCleanErrorJson
