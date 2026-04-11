import type { AttackHandler, AttackDefinition, AttackResult, LLMCaller } from '../../types'

const definition: AttackDefinition = {
  id: 'bon',
  name: 'Best-of-N (BON)',
  description: 'Applies multiple text augmentations and tries each variation',
  complexity: 'medium',
  requiresAuxiliaryModel: false,
  options: [
    {
      key: 'numAugmentations',
      label: 'Number of Augmentations',
      type: 'number',
      default: 5,
      min: 1,
      max: 20,
    },
  ],
}

// Augmentation functions

function characterNoising(text: string, noiseProb = 0.06): string {
  return text
    .split('')
    .map((char) => {
      if (/[a-zA-Z]/.test(char)) {
        if (Math.random() < noiseProb) {
          const code = char.charCodeAt(0)
          const isUpper = code >= 65 && code <= 90
          const isLower = code >= 97 && code <= 122

          if (Math.random() < 0.5) {
            // Shift +1
            if (isUpper && code < 90) return String.fromCharCode(code + 1)
            if (isLower && code < 122) return String.fromCharCode(code + 1)
            if (code === 90) return 'A'
            if (code === 122) return 'a'
          } else {
            // Shift -1
            if (isUpper && code > 65) return String.fromCharCode(code - 1)
            if (isLower && code > 97) return String.fromCharCode(code - 1)
            if (code === 65) return 'Z'
            if (code === 97) return 'z'
          }
        }
      }
      return char
    })
    .join('')
}

function characterScrambling(text: string, scrambleProb = 0.6): string {
  return text
    .split(/\b/)
    .map((word) => {
      if (word.length > 3 && Math.random() < scrambleProb) {
        const first = word[0]
        const last = word[word.length - 1]
        const middle = word
          .slice(1, -1)
          .split('')
          .sort(() => Math.random() - 0.5)
          .join('')
        return first + middle + last
      }
      return word
    })
    .join('')
}

function randomCapitalization(text: string, capProb = 0.6): string {
  return text
    .split('')
    .map((char) => {
      if (/[a-zA-Z]/.test(char) && Math.random() < capProb) {
        return Math.random() < 0.5 ? char.toUpperCase() : char.toLowerCase()
      }
      return char
    })
    .join('')
}

export const handler: AttackHandler = {
  definition,

  async execute(
    prompt: string,
    targetLLM: LLMCaller,
    _auxiliaryLLM: LLMCaller | undefined,
    options: Record<string, unknown>,
    onProgress: (msg: string) => void,
  ): Promise<AttackResult> {
    try {
      const { numAugmentations = 5 } = options || {}
      const count = Math.max(1, Math.min(20, Number(numAugmentations) || 5))

      const attempts: Array<{ prompt: string; response: string }> = []

      let currentPrompt = prompt
      let lastResponse = ''

      for (let i = 1; i <= count; i++) {
        onProgress(`BON attempt ${i}/${count}`)

        // Apply all augmentations in sequence
        currentPrompt = characterNoising(prompt)
        currentPrompt = characterScrambling(currentPrompt)
        currentPrompt = randomCapitalization(currentPrompt)

        const response = await targetLLM([{ role: 'user', content: currentPrompt }])

        attempts.push({
          prompt: currentPrompt,
          response,
        })

        lastResponse = response
      }

      return {
        attackId: definition.id,
        originalPrompt: prompt,
        transformedPrompt: currentPrompt,
        response: lastResponse,
        classifications: {},
        isJailbroken: false,
        metadata: {
          attempts: count,
          allAttempts: attempts,
        },
        timestamp: Date.now(),
      }
    } catch (error) {
      return {
        attackId: definition.id,
        originalPrompt: prompt,
        transformedPrompt: prompt,
        response: '',
        classifications: {},
        isJailbroken: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      }
    }
  },
}
