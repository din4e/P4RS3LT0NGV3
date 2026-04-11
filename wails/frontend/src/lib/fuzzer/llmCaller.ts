import { chatCompletion } from '@/lib/services/chatCompletion'
import type { LLMCaller } from './types'

export function createLLMCaller(model: string, providerId?: string): LLMCaller {
  return async (
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<string> => {
    return chatCompletion({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 2000,
      ...(providerId ? { providerId } : {}),
    })
  }
}
