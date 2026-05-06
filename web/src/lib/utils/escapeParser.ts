// @ts-nocheck
/**
 * Escape sequence parser.
 * Migrated from js/utils/escapeParser.js to TypeScript ES module.
 */

/**
 * Parse a single escape-sequence string literal (e.g. `"\\u200B"`, `"\\n"`)
 * and return the actual character.
 */
export function parseEscapeSequence(str: string): string {
  if (!str || typeof str !== 'string') {
    return str
  }

  const escapeMap: Record<string, string> = {
    '\\u200B': '\u200B',
    '\\u200C': '\u200C',
    '\\u200D': '\u200D',
    '\\u2060': '\u2060',
    '\\uFE0E': '\uFE0E',
    '\\uFE0F': '\uFE0F',
    '\\n': '\n',
    '\\r': '\r',
    '\\t': '\t',
    '\\0': '\0',
    "\\'": "'",
    '\\"': '"',
    '\\\\': '\\',
  }

  if (escapeMap[str] !== undefined) {
    return escapeMap[str]
  }

  const unicodeMatch = str.match(/^\\u([0-9A-Fa-f]{4})$/)
  if (unicodeMatch) {
    return String.fromCharCode(parseInt(unicodeMatch[1], 16))
  }

  const hexMatch = str.match(/^\\x([0-9A-Fa-f]{2})$/)
  if (hexMatch) {
    return String.fromCharCode(parseInt(hexMatch[1], 16))
  }

  return str
}
