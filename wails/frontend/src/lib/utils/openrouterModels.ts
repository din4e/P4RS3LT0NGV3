// @ts-nocheck
/**
 * OpenRouter model list with extended Chinese model support.
 * Migrated from js/data/openrouterModels.js to TypeScript ES module.
 */

import type { OpenRouterModel } from '@/types/transformer'

export const OPENROUTER_MODELS: OpenRouterModel[] = [
  // ============ Anthropic Claude ============
  { id: 'anthropic/claude-opus-4.6', name: 'Claude Opus 4.6', provider: 'Anthropic' },
  { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', provider: 'Anthropic' },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic' },
  { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', provider: 'Anthropic' },

  // ============ OpenAI ============
  { id: 'openai/gpt-5.4', name: 'GPT-5.4', provider: 'OpenAI' },
  { id: 'openai/gpt-5.4-pro', name: 'GPT-5.4 Pro', provider: 'OpenAI' },
  { id: 'openai/gpt-5.4-mini', name: 'GPT-5.4 Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI' },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'OpenAI' },
  { id: 'openai/o3-pro', name: 'o3-pro', provider: 'OpenAI' },
  { id: 'openai/o3', name: 'o3', provider: 'OpenAI' },
  { id: 'openai/o4-mini', name: 'o4-mini', provider: 'OpenAI' },
  { id: 'openai/gpt-5.3-codex', name: 'GPT-5.3 Codex', provider: 'OpenAI' },

  // ============ Google ============
  { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'Google' },
  { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'Google' },
  { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'Google' },
  { id: 'google/gemma-3-27b-it', name: 'Gemma 3 27B', provider: 'Google' },

  // ============ xAI Grok ============
  { id: 'x-ai/grok-4.20-beta', name: 'Grok 4.20 Beta', provider: 'xAI' },
  { id: 'x-ai/grok-4', name: 'Grok 4', provider: 'xAI' },
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xAI' },
  { id: 'x-ai/grok-code-fast-1', name: 'Grok Code Fast 1', provider: 'xAI' },

  // ============ DeepSeek 深度求索 ============
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'DeepSeek' },
  { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3', provider: 'DeepSeek' },
  { id: 'deepseek/deepseek-r1-0528', name: 'DeepSeek R1 (0528)', provider: 'DeepSeek' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek' },
  { id: 'deepseek/deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B', provider: 'DeepSeek' },
  { id: 'deepseek/deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Distill Qwen 32B', provider: 'DeepSeek' },
  { id: 'deepseek/deepseek-coder-v2', name: 'DeepSeek Coder V2', provider: 'DeepSeek' },

  // ============ Qwen 通义千问 (Alibaba) ============
  { id: 'qwen/qwen3-235b-a22b', name: 'Qwen3 235B', provider: 'Qwen' },
  { id: 'qwen/qwen3-coder-480b-a35b-instruct', name: 'Qwen3 Coder 480B', provider: 'Qwen' },
  { id: 'qwen/qwq-32b', name: 'QwQ 32B', provider: 'Qwen' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen2.5 72B', provider: 'Qwen' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen2.5 Coder 32B', provider: 'Qwen' },
  { id: 'qwen/qwen-2-7b-instruct', name: 'Qwen2 7B', provider: 'Qwen' },
  { id: 'qwen/qwen-2-72b-instruct', name: 'Qwen2 72B', provider: 'Qwen' },

  // ============ Moonshot 月之暗面 (Kimi) ============
  { id: 'moonshotai/kimi-k2-0720', name: 'Kimi K2 (0720)', provider: 'Moonshot' },
  { id: 'moonshotai/kimi-2.7-pro', name: 'Kimi 2.7 Pro', provider: 'Moonshot' },
  { id: 'moonshotai/kimi-2.5-pro', name: 'Kimi 2.5 Pro', provider: 'Moonshot' },
  { id: 'moonshotai/kimi-2.5-flash', name: 'Kimi 2.5 Flash', provider: 'Moonshot' },
  { id: 'moonshotai/kimi-latest', name: 'Kimi Latest', provider: 'Moonshot' },
  { id: 'moonshotai/moonshot-v1-128k', name: 'Moonshot V1 128K', provider: 'Moonshot' },
  { id: 'moonshotai/moonshot-v1-32k', name: 'Moonshot V1 32K', provider: 'Moonshot' },
  { id: 'moonshotai/moonshot-v1-8k', name: 'Moonshot V1 8K', provider: 'Moonshot' },

  // ============ Zhipu AI 智谱 (GLM) ============
  { id: 'zhipu/glm-5.1-air', name: 'GLM-5.1 Air', provider: 'Zhipu' },
  { id: 'zhipu/glm-5.1-flash', name: 'GLM-5.1 Flash', provider: 'Zhipu' },
  { id: 'zhipu/glm-5-plus', name: 'GLM-5 Plus', provider: 'Zhipu' },
  { id: 'zhipu/glm-5-air', name: 'GLM-5 Air', provider: 'Zhipu' },
  { id: 'zhipu/glm-5-flash', name: 'GLM-5 Flash', provider: 'Zhipu' },
  { id: 'zhipu/glm-4-plus', name: 'GLM-4 Plus', provider: 'Zhipu' },
  { id: 'zhipu/glm-4-9b-chat', name: 'GLM-4 9B', provider: 'Zhipu' },
  { id: 'zhipu/glm-4-long', name: 'GLM-4 Long', provider: 'Zhipu' },
  { id: 'zhipu/glm-z1-air', name: 'GLM-Z1 Air', provider: 'Zhipu' },
  { id: 'zhipu/glm-z1-airx', name: 'GLM-Z1 AirX', provider: 'Zhipu' },
  { id: 'zhipu/glm-z1-flash', name: 'GLM-Z1 Flash', provider: 'Zhipu' },
  { id: 'zhipu/chatglm-turbo', name: 'ChatGLM Turbo', provider: 'Zhipu' },

  // ============ 01.AI 零一万物 (Yi) ============
  { id: 'yi-01-ai/yi-lightning', name: 'Yi Lightning', provider: '01.AI' },
  { id: 'yi-01-ai/yi-large', name: 'Yi Large', provider: '01.AI' },
  { id: 'yi-01-ai/yi-large-turbo', name: 'Yi Large Turbo', provider: '01.AI' },
  { id: 'yi-01-ai/yi-1.5-34b-chat', name: 'Yi 1.5 34B', provider: '01.AI' },
  { id: 'yi-01-ai/yi-1.5-9b-chat', name: 'Yi 1.5 9B', provider: '01.AI' },

  // ============ MiniMax ============
  { id: 'minimax/minimax-2.5-pro', name: 'MiniMax 2.5 Pro', provider: 'MiniMax' },
  { id: 'minimax/minimax-2.5-flash', name: 'MiniMax 2.5 Flash', provider: 'MiniMax' },
  { id: 'minimax/minimax-2.5-air', name: 'MiniMax 2.5 Air', provider: 'MiniMax' },
  { id: 'minimax/minimax-01', name: 'MiniMax 01', provider: 'MiniMax' },
  { id: 'minimax/abab6.5s-chat', name: 'ABAB 6.5s', provider: 'MiniMax' },
  { id: 'minimax/abab6.5-chat', name: 'ABAB 6.5', provider: 'MiniMax' },
  { id: 'minimax/abab5.5-chat', name: 'ABAB 5.5', provider: 'MiniMax' },

  // ============ Baichuan 百川 ============
  { id: 'baichuan/baichuan-2-13b-chat', name: 'Baichuan2 13B', provider: 'Baichuan' },
  { id: 'baichuan/baichuan-2-7b-chat', name: 'Baichuan2 7B', provider: 'Baichuan' },

  // ============ Meta Llama ============
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta' },
  { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', provider: 'Meta' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta' },

  // ============ Mistral ============
  { id: 'mistralai/mistral-large-3-2512', name: 'Mistral Large 3', provider: 'Mistral' },
  { id: 'mistralai/devstral-2-2512', name: 'Devstral 2', provider: 'Mistral' },
  { id: 'mistralai/codestral-2508', name: 'Codestral', provider: 'Mistral' },

  // ============ Other Providers ============
  { id: 'cohere/command-a', name: 'Command A', provider: 'Cohere' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b', name: 'Hermes 3 405B', provider: 'Nous' },
  { id: 'perplexity/sonar-deep-research', name: 'Sonar Deep Research', provider: 'Perplexity' },
  { id: 'perplexity/sonar-pro', name: 'Sonar Pro', provider: 'Perplexity' },

  // ============ Auto ============
  { id: 'openrouter/auto', name: 'Auto (best for price)', provider: 'OpenRouter' },
]
