// @ts-nocheck
/**
 * Universal decoder - attempts automatic decoding of transformed / steganographic text.
 * Migrated from js/core/decoder.js to TypeScript ES module.
 *
 * All `window.transforms` and `window.steganography` references have been replaced
 * with injected parameters so the decoder is a pure function of its inputs.
 */

import type { DecodeResult, DecodeContext, TransformOptions } from '@/types/transformer'
import {
  hasEmojiInText,
  decodeEmoji,
} from './steganography'
import {
  getMergedTransformOptions,
  getMergedTransformOptionsForName,
} from './transformOptions'

/**
 * Attempt every registered detector + reverse transform, plus steganography.
 *
 * @param input          Raw text to decode
 * @param transforms     Map of transform-key -> transform-object (replaces window.transforms)
 * @param context        Optional context carrying activeTab / activeTransform
 */
export function universalDecode(
  input: string,
  transforms: Record<string, any>,
  context: DecodeContext = {}
): DecodeResult | null {
  if (!input) return null

  const allDecodings: Array<{ text: string; method: string; priority: number }> = []
  const { activeTab, activeTransform } = context

  function addDecoding(text: string, method: string, priority: number = 20) {
    if (text && text !== input && text.length > 0) {
      const exists = allDecodings.some(d => d.text === text)
      if (!exists) {
        allDecodings.push({ text, method, priority })
      }
    }
  }

  // 1. Detector-driven transforms
  for (const [transformKey, transform] of Object.entries(transforms)) {
    if (transform.detector && transform.reverse) {
      try {
        if (transform.detector(input)) {
          const opts: TransformOptions = getMergedTransformOptions(transform)
          const result = transform.reverse(input, opts)
          if (result && result !== input && result.length > 0) {
            const hasContent = result.replace(/[\x00-\x1F\x7F-\x9F\s]/g, '').length > 0
            if (hasContent) {
              const detectorPriority = transform.priority || 285
              addDecoding(result, transform.name, detectorPriority)
            }
          }
        }
      } catch (_e) {
        // skip
      }
    }
  }

  // 2. Emoji steganography
  if (hasEmojiInText(input)) {
    try {
      const decoded = decodeEmoji(input)
      if (decoded) {
        addDecoding(decoded, 'Emoji Steganography', 100)
      }
    } catch (_e) {
      // skip
    }
  }

  // 3. Active transform reverse
  if (activeTab === 'transforms' && activeTransform) {
    try {
      const transformKey = Object.keys(transforms).find(
        key => transforms[key].name === activeTransform.name
      )

      if (transformKey && transforms[transformKey].reverse) {
        const t = transforms[transformKey]
        const opts = getMergedTransformOptions(t)
        const result = t.reverse(input, opts)
        if (result && result !== input) {
          addDecoding(result, activeTransform.name, 150)
        }
      }
    } catch (_e) {
      // skip
    }
  }

  // 4. Blind reverse transforms (no detector)
  for (const name in transforms) {
    const transform = transforms[name]
    if (transform.reverse && !transform.detector) {
      try {
        const opts = getMergedTransformOptions(transform)
        const result = transform.reverse(input, opts)
        if (result !== input && /[a-zA-Z0-9\s]{3,}/.test(result)) {
          addDecoding(result, transform.name, 10)
        }
      } catch (_e) {
        // skip
      }
    }
  }

  allDecodings.sort((a, b) => b.priority - a.priority)

  if (allDecodings.length === 0) return null

  const primary = allDecodings[0]
  const alternatives = allDecodings.slice(1).map(({ text, method }) => ({ text, method }))

  return {
    text: primary.text,
    method: primary.method,
    priority: primary.priority,
    alternatives,
  }
}
