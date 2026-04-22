import type { MutatorHandler } from './types'

const SUMMARIZE_SYSTEM = `You are a text condenser. Condense the following text into a shorter version while preserving ALL key information and intent. Output ONLY the condensed text, nothing else.`

export const summarizeMutator: MutatorHandler = {
  definition: { id: 'summarize', name: 'Summarize', description: 'LLM-based text condensation preserving key info', requiresLLM: true },
  async mutate(prompt, llm) {
    if (!llm) throw new Error('Summarize requires an LLM')
    const result = await llm(
      [{ role: 'system', content: SUMMARIZE_SYSTEM }, { role: 'user', content: prompt }],
      { temperature: 0.3, maxTokens: 1500 },
    )
    return result.trim()
  },
}
