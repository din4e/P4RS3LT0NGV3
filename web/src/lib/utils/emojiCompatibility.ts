// @ts-nocheck
/**
 * Emoji compatibility checker.
 * Migrated from js/data/emojiCompatibility.js to TypeScript ES module.
 *
 * Tests which emoji features the user's browser/device supports using
 * canvas pixel detection.
 */

export interface EmojiCompatibilityStats {
  compatible: number
  total: number
  percentage: string | number
}

const CACHE_KEY = 'emojiTestResults_v2_simple'
const CACHE_EXPIRY_DAYS = 30

let _emojiTestCache: Record<string, boolean> | null = null
let _testCanvas: HTMLCanvasElement | null = null
let _testCtx: CanvasRenderingContext2D | null = null

/**
 * Load cached results from localStorage.
 */
export function loadCache(): Record<string, boolean> | null {
  if (_emojiTestCache) return _emojiTestCache

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const data = JSON.parse(cached)
    const now = Date.now()
    const age = now - data.timestamp
    const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000

    if (age > maxAge) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }

    _emojiTestCache = data.results
    return _emojiTestCache
  } catch (_e) {
    return null
  }
}

/**
 * Persist current cache to localStorage.
 */
export function saveCache(): void {
  if (!_emojiTestCache) return
  try {
    const data = {
      timestamp: Date.now(),
      results: _emojiTestCache,
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Could not save emoji test cache:', e)
  }
}

/**
 * Clear the emoji test cache.
 */
export function clearCache(): void {
  try { localStorage.removeItem(CACHE_KEY) } catch (_e) { /* noop */ }
  _emojiTestCache = null
}

/**
 * Test if a specific emoji actually renders in the browser
 * using canvas pixel detection.
 */
export function testEmojiRenders(emoji: string): boolean {
  if (!_emojiTestCache) {
    _emojiTestCache = loadCache() || {}
  }

  if (emoji in _emojiTestCache) {
    return _emojiTestCache[emoji]
  }

  if (!_testCanvas) {
    _testCanvas = document.createElement('canvas')
    _testCanvas.width = 64
    _testCanvas.height = 64
    _testCtx = _testCanvas.getContext('2d', { willReadFrequently: true })!
  }

  const ctx = _testCtx!
  ctx.font = '48px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", sans-serif'
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  const emojiWidth = ctx.measureText(emoji).width
  const referenceWidth = ctx.measureText('\uD83D\uDE0A').width

  if (emojiWidth > referenceWidth * 1.8) {
    _emojiTestCache[emoji] = false
    return false
  }

  ctx.clearRect(0, 0, 64, 64)
  ctx.fillStyle = 'black'
  ctx.fillText(emoji, 8, 8)

  const imageData = ctx.getImageData(0, 0, 64, 64).data

  let hasPixels = false
  for (let i = 0; i < imageData.length; i += 4) {
    if (imageData[i + 3] > 0) {
      hasPixels = true
      break
    }
  }

  _emojiTestCache[emoji] = hasPixels
  return hasPixels
}

/**
 * Check if a specific emoji should be shown in the UI picker.
 */
export function shouldShowInPicker(emoji: string): boolean {
  return testEmojiRenders(emoji)
}

/**
 * Batch-test a list of emojis for compatibility.
 */
export async function getCompatibleEmojis(
  allEmojis: string[],
  progressCallback?: (tested: number, total: number, compatible: number) => void
): Promise<string[]> {
  loadCache()

  const compatible: string[] = []
  let tested = 0
  const total = allEmojis.length
  const batchSize = 50

  const self = { shouldShowInPicker }

  function testBatch(): Promise<void> {
    return new Promise(resolve => {
      const end = Math.min(tested + batchSize, total)

      for (let i = tested; i < end; i++) {
        if (self.shouldShowInPicker(allEmojis[i])) {
          compatible.push(allEmojis[i])
        }
        tested++
      }

      if (progressCallback) {
        progressCallback(tested, total, compatible.length)
      }

      if (tested < total) {
        requestAnimationFrame(() => {
          setTimeout(() => resolve(testBatch()), 10)
        })
      } else {
        saveCache()
        resolve()
      }
    })
  }

  await testBatch()
  return compatible
}

/**
 * Get compatibility statistics from cache.
 */
export function getStats(): EmojiCompatibilityStats | null {
  const cache = loadCache()
  if (cache) {
    const compatible = Object.values(cache).filter(v => v === true).length
    const total = Object.keys(cache).length
    return {
      compatible,
      total,
      percentage: total > 0 ? ((compatible / total) * 100).toFixed(1) : 0,
    }
  }
  return null
}
