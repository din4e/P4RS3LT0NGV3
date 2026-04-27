// @ts-nocheck
/**
 * Steganography module - Emoji and invisible text encoding/decoding.
 * Migrated from js/core/steganography.js to TypeScript ES module.
 */

import type { StegOptions } from '@/types/transformer'

// --- Emoji data (set at runtime) -------------------------------------------

let _emojiData: Record<string, any> = {}

/**
 * Inject the emoji dataset (called once at app init).
 */
export function setEmojiData(data: Record<string, any>) {
  _emojiData = data
}

function _getEmojiKeys(): string[] {
  if (!_emojiData || typeof _emojiData !== 'object') return []
  return Object.keys(_emojiData).filter(key => {
    const value = _emojiData[key]
    return typeof value === 'object' && value !== null && 'official' in value
  })
}

// --- Steg option defaults --------------------------------------------------

const __STEG_DEFAULTS__: StegOptions = {
  bitZeroVS: '\ufe0e',
  bitOneVS: '\ufe0f',
  initialPresentation: 'emoji',
  trailingZW: '\u200B',
  interBitZW: null,
  interBitEvery: 1,
  bitOrder: 'msb',
}

let __stegOptions__: StegOptions = { ...__STEG_DEFAULTS__ }

export function setStegOptions(opts: Partial<StegOptions>) {
  if (!opts) return
  __stegOptions__ = { ...__stegOptions__, ...opts }
}

export function getStegOptions(): StegOptions {
  return { ...__stegOptions__ }
}

// --- Helpers ---------------------------------------------------------------

function encodeForPreview(emoji: string, text: string): string {
  return encodeEmoji(emoji, text)
}

export function hasEmojiInText(text: string): boolean {
  if (!text) return false
  const emojiKeys = _getEmojiKeys()
  if (emojiKeys.length > 0 && emojiKeys.some(emoji => text.includes(emoji))) return true
  return /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2300}-\u{23FF}\u{2B50}\u{1F004}]/u.test(text)
}

function findEmojiMatch(text: string): RegExpMatchArray | null {
  if (!text) return null

  const emojiKeys = _getEmojiKeys()
  if (emojiKeys.length > 0) {
    emojiKeys.sort((a, b) => b.length - a.length)
    const escapedEmojis = emojiKeys.map(emoji =>
      emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    const emojiRegex = new RegExp(`(${escapedEmojis.join('|')})`, 'u')
    const match = text.match(emojiRegex)
    if (match) return match
  }

  const flagEmojiRegex = /([\u{1F1E6}-\u{1F1FF}][\u{1F1E6}-\u{1F1FF}])/u
  const singleEmojiRegex = /([\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{1F004}])/u

  return text.match(flagEmojiRegex) || text.match(singleEmojiRegex)
}

// --- Carrier definitions ---------------------------------------------------

export const carriers = [
  { emoji: '🐍', name: 'SNAKE', desc: 'Classic Snake', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🐉', name: 'DRAGON', desc: 'Mystical Dragon', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🦎', name: 'LIZARD', desc: 'Sneaky Lizard', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🐊', name: 'CROCODILE', desc: 'Dangerous Croc', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🐢', name: 'TURTLE', desc: 'Steady Turtle', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🐌', name: 'SNAIL', desc: 'Slow Snail', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🐱', name: 'CAT', desc: 'Sly Cat', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🦁', name: 'RACCOON', desc: 'Masked Bandit', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🦂', name: 'SCORPION', desc: 'Lethal Stinger', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🐺', name: 'WOLF', desc: 'Lone Wolf', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🕷', name: 'SPIDER', desc: 'Web Spinner', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🐸', name: 'FROG', desc: 'Leaping Frog', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🦟', name: 'MOSQUITO', desc: 'Tiny Intruder', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🐯', name: 'TIGER', desc: 'Fierce Tiger', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🦅', name: 'EAGLE', desc: 'Sharp Eye', preview(text) { return encodeForPreview(this.emoji, text) } },
  { emoji: '🐙', name: 'OCTOPUS', desc: 'Eight Arms', preview(text) { return encodeForPreview(this.emoji, text) } },
]

// --- Emoji steganography ---------------------------------------------------

export function encodeEmoji(emoji: string, text: string): string {
  if (!text) return emoji

  let binary = ''
  try {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(text)
    const bitOrder = __stegOptions__.bitOrder || 'msb'
    binary = Array.from(bytes)
      .map(byte => {
        let byteStr = byte.toString(2).padStart(8, '0')
        if (bitOrder === 'lsb') {
          byteStr = byteStr.split('').reverse().join('')
        }
        return byteStr
      })
      .join('')
  } catch (_e) {
    const bitOrder = __stegOptions__.bitOrder || 'msb'
    binary = Array.from(text)
      .map(c => {
        const codePoint = c.codePointAt(0)!
        let bytes: number[] = []
        if (codePoint <= 0x7F) {
          bytes.push(codePoint)
        } else if (codePoint <= 0x7FF) {
          bytes.push(0xC0 | (codePoint >> 6))
          bytes.push(0x80 | (codePoint & 0x3F))
        } else if (codePoint <= 0xFFFF) {
          bytes.push(0xE0 | (codePoint >> 12))
          bytes.push(0x80 | ((codePoint >> 6) & 0x3F))
          bytes.push(0x80 | (codePoint & 0x3F))
        } else {
          bytes.push(0xF0 | (codePoint >> 18))
          bytes.push(0x80 | ((codePoint >> 12) & 0x3F))
          bytes.push(0x80 | ((codePoint >> 6) & 0x3F))
          bytes.push(0x80 | (codePoint & 0x3F))
        }
        return bytes.map(byte => {
          let byteStr = byte.toString(2).padStart(8, '0')
          if (bitOrder === 'lsb') {
            byteStr = byteStr.split('').reverse().join('')
          }
          return byteStr
        }).join('')
      })
      .join('')
  }

  const vs0 = __stegOptions__.bitZeroVS || '\ufe0e'
  const vs1 = __stegOptions__.bitOneVS || '\ufe0f'

  let result = emoji
  if (__stegOptions__.initialPresentation === 'emoji') result += '\ufe0f'
  else if (__stegOptions__.initialPresentation === 'text') result += '\ufe0e'

  for (let i = 0; i < binary.length; i++) {
    const bit = binary[i]
    result += bit === '0' ? vs0 : vs1
    if (__stegOptions__.interBitZW && i < binary.length - 1 && ((i + 1) % Math.max(1, __stegOptions__.interBitEvery as number)) === 0) {
      result += __stegOptions__.interBitZW as string
    }
  }

  if (__stegOptions__.trailingZW) {
    result += __stegOptions__.trailingZW as string
  }

  return result
}

export function decodeEmoji(text: string): string {
  if (!text) return ''

  const emojiMatch = findEmojiMatch(text)
  if (!emojiMatch) return ''

  const emojiChar = emojiMatch[1]
  const emojiIndex = emojiMatch.index!

  const fromEmoji = text.substring(emojiIndex)
  const emojiCharEscaped = emojiChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`^${emojiCharEscaped}([\ufe0e\ufe0f\u200B\u200C\u200D\ufeff]+)`, 'u')
  const emojiData = fromEmoji.match(pattern)

  if (!emojiData || !emojiData[1]) return ''

  const rawSeq = emojiData[1]
  const matches = [...rawSeq.matchAll(/[\ufe0e\ufe0f]/g)]
  if (matches.length === 0) return ''

  const skip = (__stegOptions__.initialPresentation === 'none') ? 0 : 1
  if (matches.length <= skip) return ''

  const zeroSel = __stegOptions__.bitZeroVS || '\ufe0e'
  const oneSel = __stegOptions__.bitOneVS || '\ufe0f'
  let binary = matches.slice(skip).map(m => m[0] === zeroSel ? '0' : (m[0] === oneSel ? '1' : '')).join('')

  const validBinaryLength = Math.floor(binary.length / 8) * 8
  const bytes: number[] = []
  for (let i = 0; i < validBinaryLength; i += 8) {
    let byte = binary.slice(i, i + 8)
    if (__stegOptions__.bitOrder === 'lsb') {
      byte = byte.split('').reverse().join('')
    }
    if (byte.length === 8) {
      const byteValue = parseInt(byte, 2)
      bytes.push(byteValue)
    }
  }

  try {
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const uint8Array = new Uint8Array(bytes)
    return decoder.decode(uint8Array)
  } catch (_e) {
    let decoded = ''
    for (const byteValue of bytes) {
      if (byteValue >= 0 && byteValue <= 255) {
        decoded += String.fromCharCode(byteValue)
      }
    }
    try {
      return decodeURIComponent(escape(decoded))
    } catch (_e2) {
      return decoded
    }
  }
}

// --- Invisible text steganography ------------------------------------------

export function encodeInvisible(text: string): string {
  if (!text) return ''

  const bytes = new TextEncoder().encode(text)
  return Array.from(bytes)
    .map(byte => String.fromCodePoint(0xE0000 + byte))
    .join('')
}

export function decodeInvisible(text: string): string {
  if (!text) return ''

  const matches = [...text.matchAll(/[\uE0000-\uE007F]/g)]
  if (!matches.length) return ''

  const bytes = new Uint8Array(matches.length)
  for (let i = 0; i < matches.length; i++) {
    bytes[i] = matches[i][0].codePointAt(0)! - 0xE0000
  }

  try {
    const decoder = new TextDecoder('utf-8', { fatal: false })
    let decoded = decoder.decode(bytes)
    decoded = decoded.replace(/@+(?=[a-zA-Z0-9])/g, '')
    decoded = decoded.replace(/([a-zA-Z0-9])@+/g, '$1')
    decoded = decoded.replace(/@+/g, '')
    return decoded
  } catch (_e) {
    let result = ''
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] >= 32 && bytes[i] <= 126) {
        result += String.fromCharCode(bytes[i])
      }
    }
    return result
  }
}
