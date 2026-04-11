import type { AttackHandler, AttackResult, LLMCaller } from '../../types'

function englishToPigLatin(text: string): string {
  return text.replace(/[a-zA-Z]+/g, (word) => {
    const match = word.match(/^([^aeiouAEIOU]*)(.*)/)
    if (!match) return word
    const [, consonants, rest] = match
    if (!consonants) return word + 'ay' // starts with vowel
    const cap = word[0] === word[0].toUpperCase()
    let result = rest + consonants.toLowerCase() + 'ay'
    if (cap) result = result[0].toUpperCase() + result.slice(1)
    return result
  })
}

function isPigLatin(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return false
  const endingInAy = words.filter((w) => /ay\b/i.test(w))
  return endingInAy.length / words.length > 0.5
}

function pigLatinToEnglish(text: string): string {
  return text.replace(/[a-zA-Z]+ay\b/g, (word) => {
    const stem = word.slice(0, -2) // remove 'ay'
    // Find consonant cluster at end that was moved
    const match = stem.match(/^(.*?)([bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]+)$/)
    if (!match || !match[2]) return word
    const [, body, ending] = match
    if (!body) return word
    return ending.toLowerCase() + body
  })
}

export const piglatinHandler: AttackHandler = {
  definition: {
    id: 'piglatin',
    name: 'Pig Latin',
    description: 'Encode the prompt into Pig Latin to obscure intent.',
    complexity: 'simple',
    requiresAuxiliaryModel: false,
  },

  transform(prompt: string): string {
    return englishToPigLatin(prompt)
  },

  async execute(
    prompt: string,
    targetLLM: LLMCaller,
    _auxiliaryLLM: LLMCaller | undefined,
    _options: Record<string, unknown>,
    onProgress: (msg: string) => void,
  ): Promise<AttackResult> {
    onProgress('Encoding to Pig Latin...')
    const transformed = piglatinHandler.transform!(prompt)
    let response = await targetLLM([{ role: 'user', content: transformed }])
    // If response is in Pig Latin, decode it back
    if (isPigLatin(response)) {
      response = pigLatinToEnglish(response)
    }
    return {
      attackId: 'piglatin',
      originalPrompt: prompt,
      transformedPrompt: transformed,
      response,
      classifications: {},
      isJailbroken: false,
      timestamp: Date.now(),
    }
  },
}
