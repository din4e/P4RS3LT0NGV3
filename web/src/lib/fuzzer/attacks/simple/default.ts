import type { AttackHandler, AttackResult, LLMCaller } from '../../types'

export const defaultHandler: AttackHandler = {
  definition: {
    id: 'default',
    name: 'Default (Baseline)',
    description: 'Send the prompt as-is without any transformation. Used as a baseline.',
    complexity: 'simple',
    requiresAuxiliaryModel: false,
  },

  transform(prompt: string): string {
    return prompt
  },

  async execute(
    prompt: string,
    targetLLM: LLMCaller,
    _auxiliaryLLM: LLMCaller | undefined,
    _options: Record<string, unknown>,
    onProgress: (msg: string) => void,
  ): Promise<AttackResult> {
    onProgress('Sending prompt as-is...')
    const transformed = prompt
    const response = await targetLLM([{ role: 'user', content: transformed }])
    return {
      attackId: 'default',
      originalPrompt: prompt,
      transformedPrompt: transformed,
      response,
      classifications: {},
      isJailbroken: false,
      timestamp: Date.now(),
    }
  },
}
