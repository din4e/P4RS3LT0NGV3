import type { AttackHandler, AttackDefinition, AttackResult, LLMCaller } from '../../types'

const definition: AttackDefinition = {
  id: 'shuffle',
  name: 'Shuffle Inconsistency',
  description: 'Shuffles word order to create inconsistent prompts',
  complexity: 'medium',
  requiresAuxiliaryModel: false,
  options: [
    {
      key: 'maxAttempts',
      label: 'Max Attempts',
      type: 'number',
      default: 10,
      min: 1,
      max: 50,
    },
  ],
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
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
      const { maxAttempts = 10 } = options || {}
      const attempts = Math.max(1, Math.min(50, Number(maxAttempts) || 10))

      const words = prompt.split(/\s+/)
      const allAttempts: Array<{ prompt: string; response: string }> = []

      let lastPrompt = prompt
      let lastResponse = ''

      for (let i = 1; i <= attempts; i++) {
        onProgress(`Shuffle attempt ${i}/${attempts}`)

        // Shuffle words randomly
        const shuffledWords = shuffleArray(words)
        const shuffledPrompt = shuffledWords.join(' ')

        const response = await targetLLM([{ role: 'user', content: shuffledPrompt }])

        allAttempts.push({
          prompt: shuffledPrompt,
          response,
        })

        lastPrompt = shuffledPrompt
        lastResponse = response
      }

      return {
        attackId: definition.id,
        originalPrompt: prompt,
        transformedPrompt: lastPrompt,
        response: lastResponse,
        classifications: {},
        isJailbroken: false,
        metadata: {
          attempts: attempts,
          allAttempts,
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
