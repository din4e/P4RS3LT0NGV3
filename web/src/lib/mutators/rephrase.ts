import type { MutatorHandler } from './types'

const REPHRASE_SYSTEM = `You are a prompt rephraser. Rephrase the following text while preserving its exact semantic meaning. Use different words, sentence structure, and phrasing but keep the core intent identical. Output ONLY the rephrased text, nothing else.`

export const rephraseMutator: MutatorHandler = {
  definition: {
    id: 'rephrase',
    name: 'Rephrase',
    description: 'LLM-based rephrasing preserving semantic intent',
    requiresLLM: true
  },
  async mutate(prompt, llm) {
    if (!llm) {
      throw new Error('Rephrase mutator requires LLM but none provided')
    }
    return llm([
      { role: 'system', content: REPHRASE_SYSTEM },
      { role: 'user', content: prompt }
    ])
  }
}
