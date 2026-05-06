import type { MutatorHandler } from './types'

export const randropMutator: MutatorHandler = {
  definition: { id: 'randrop', name: 'Random Drop', description: 'Randomly drops ~15% of words from the text', requiresLLM: false },
  async mutate(prompt) {
    const words = prompt.split(' ')
    const dropRate = 0.15
    return words.filter(() => Math.random() > dropRate).join(' ')
  },
}
