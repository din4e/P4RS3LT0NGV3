// @ts-nocheck
/**
 * Emoji utilities.
 * Migrated from js/utils/emoji.js to TypeScript ES module.
 */

/**
 * Emoji data source injected at runtime (replaces window.emojiData).
 */
let _emojiData: Record<string, any> = {}

export function setEmojiData(data: Record<string, any>) {
  _emojiData = data
}

/**
 * Split a string into individual grapheme clusters (emoji-aware).
 */
export function splitEmojis(text: string): string[] {
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    const segmenter = new (Intl as any).Segmenter('en', { granularity: 'grapheme' })
    return Array.from(segmenter.segment(text), ({ segment }: { segment: string }) => segment)
  }
  return Array.from(text)
}

/**
 * Join an array of emoji strings back into a single string.
 */
export function joinEmojis(emojis: string[]): string {
  return emojis.join('')
}

/**
 * Return all emoji keys from the dataset that have an `official` property.
 */
export function getAllEmojis(): string[] {
  if (!_emojiData || typeof _emojiData !== 'object') {
    return []
  }
  return Object.keys(_emojiData).filter(key => {
    const value = _emojiData[key]
    return typeof value === 'object' && value !== null && 'official' in value
  })
}

/**
 * Test which emojis are compatible with the current browser/device.
 * Delegates to the emojiCompatibility module if available.
 */
export async function getCompatibleEmojis(
  compatibilityChecker: any | null,
  progressCallback?: (tested: number, total: number, compatible: number) => void
): Promise<string[]> {
  const allEmojis = getAllEmojis()

  if (compatibilityChecker && typeof compatibilityChecker.getCompatibleEmojis === 'function') {
    return await compatibilityChecker.getCompatibleEmojis(allEmojis, progressCallback)
  }
  return allEmojis
}
