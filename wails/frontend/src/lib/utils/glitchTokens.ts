// @ts-nocheck
/**
 * Glitch token query utilities.
 * Migrated from js/utils/glitchTokens.js to TypeScript ES module.
 */

import type { GlitchToken } from '@/types/transformer'

// Module-level data store (replaces window.glitchTokensData)
let _data: Record<string, any> | null = null
let _loaded = false

/**
 * Set the glitch-token dataset (called once at app init).
 */
export function setGlitchTokensData(data: Record<string, any>): void {
  _data = data
  _loaded = true
}

/**
 * Load / return the glitch-token dataset.
 * Falls back to an empty AGGREGLITCH structure if none was provided.
 */
export async function loadGlitchTokens(): Promise<Record<string, any>> {
  if (_loaded && _data) return _data

  if (!_data) {
    _data = {
      _metadata: {
        name: 'AGGREGLITCH',
        version: '1.0.0',
        description: 'The Complete Glitch Token Library - All Known LLM Vocabulary Anomalies',
        total_tokens_cataloged: 0,
        last_updated: new Date().toISOString().split('T')[0],
      },
      behavior_categories: {},
      tokenizers: {},
      glitch_tokens: {},
    }
  }
  _loaded = true
  return _data
}

// --- internal helpers ------------------------------------------------------

function _inferBehavior(token: Record<string, any>, category: string): string {
  if (token.behavior) return token.behavior

  const catLower = category.toLowerCase()
  if (catLower.includes('control') || catLower.includes('character')) return 'CONTROL_CHARACTER'
  if (catLower.includes('fragment') || catLower.includes('bpe') || catLower.includes('subtoken')) return 'FRAGMENT'
  if (catLower.includes('corrupted') || catLower.includes('unicode') || catLower.includes('mojibake')) return 'CONTEXT_CORRUPTOR'
  if (catLower.includes('syntax') || catLower.includes('code')) return 'UNSPEAKABLE'
  if (catLower.includes('special') || token.purpose) return 'SPECIAL_TOKEN'

  return 'UNKNOWN'
}

function _extractTokensFromValue(
  value: any,
  category: string,
  categoryDescription: string
): GlitchToken[] {
  const tokens: GlitchToken[] = []

  if (Array.isArray(value)) {
    value.forEach(item => {
      if (item && typeof item === 'object') {
        if (item.token !== undefined) {
          tokens.push({
            ...item,
            behavior: _inferBehavior(item, category),
            category,
            categoryDescription,
          })
        } else {
          if (!item.description && !item.source && !item.quote && !item.meaning && !item.purpose) {
            tokens.push(..._extractTokensFromValue(item, category, categoryDescription))
          }
        }
      }
    })
  } else if (value && typeof value === 'object') {
    if (value.description && !value.token && Object.keys(value).length <= 3) {
      return tokens
    }
    for (const [key, val] of Object.entries(value)) {
      if (key === 'description' || key === 'source' || key === 'quote' || key === 'why' || key === 'scandal') continue
      tokens.push(..._extractTokensFromValue(val, category, categoryDescription))
    }
  }

  return tokens
}

// --- public query API ------------------------------------------------------

/**
 * Get every glitch token flattened into a single array.
 */
export function getAllGlitchTokens(): GlitchToken[] {
  if (!_data || !_data.glitch_tokens) {
    console.warn('[GlitchTokens] No glitchTokensData found')
    return []
  }

  const tokens: GlitchToken[] = []
  const glitchTokens = _data.glitch_tokens

  for (const [category, categoryData] of Object.entries(glitchTokens)) {
    if (
      category === 'exploitation_techniques' ||
      category === 'detection_tools' ||
      category === 'statistics' ||
      category === 'centroid_phenomenon' ||
      category === 'special_system_tokens'
    ) continue

    const catData = categoryData as Record<string, any>
    const categoryDescription = catData.description || catData.origin || ''

    if (catData.tokens) {
      if (Array.isArray(catData.tokens)) {
        catData.tokens.forEach((token: any) => {
          if (token && token.token !== undefined) {
            tokens.push({
              ...token,
              behavior: _inferBehavior(token, category),
              category,
              categoryDescription,
            })
          }
        })
      } else if (typeof catData.tokens === 'object') {
        tokens.push(..._extractTokensFromValue(catData.tokens, category, categoryDescription))
      }
    }
  }

  return tokens
}

export function getTokensByBehavior(behavior: string): GlitchToken[] {
  return getAllGlitchTokens().filter(t => t.behavior === behavior)
}

export function getTokensByTokenizer(tokenizer: string): GlitchToken[] {
  return getAllGlitchTokens().filter(t => t.token_id !== undefined)
}

export function searchGlitchTokens(query: string): GlitchToken[] {
  const all = getAllGlitchTokens()
  const q = query.toLowerCase()
  return all.filter(t => {
    const tokenText = (t.token || '').toLowerCase()
    const origin = (t.origin || '').toLowerCase()
    const observedOutput = (t.observed_output || '').toLowerCase()
    const tokenId = String(t.token_id || '')
    return (
      tokenText.includes(q) ||
      origin.includes(q) ||
      observedOutput.includes(q) ||
      tokenId.includes(q)
    )
  })
}
