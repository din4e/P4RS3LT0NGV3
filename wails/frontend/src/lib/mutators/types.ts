export interface MutatorDefinition {
  id: string
  name: string
  description: string
  requiresLLM: boolean
}

export interface MutatorHandler {
  readonly definition: MutatorDefinition
  mutate(prompt: string, llm?: (messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, options?: { temperature?: number; maxTokens?: number }) => Promise<string>): Promise<string>
}
