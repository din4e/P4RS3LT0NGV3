/**
 * API Provider Presets
 * Pre-configured endpoints for various AI model providers, especially Chinese ones.
 */

export interface APIProvider {
  id: string
  name: string
  baseUrl: string
  description: string
  region: 'china' | 'global' | 'local'
  modelPrefix?: string
  /** LobeHub icon component name */
  icon?: string
  /** Whether this provider requires an API key */
  requiresApiKey?: boolean
  /** Whether this is a local provider */
  isLocal?: boolean
}

export const API_PROVIDERS: APIProvider[] = [
  // ============ Local Providers ============
  {
    id: 'ollama',
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    description: 'Local LLM inference with Ollama',
    region: 'local',
    isLocal: true,
    requiresApiKey: false,
    icon: 'Ollama',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    baseUrl: 'http://localhost:1234/v1',
    description: 'Local LLM inference with LM Studio',
    region: 'local',
    isLocal: true,
    requiresApiKey: false,
    icon: 'LMStudio',
  },

  // ============ Global Providers ============
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    description: 'Multi-model gateway with 200+ models',
    region: 'global',
    icon: 'OpenRouter',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    description: 'Official OpenAI API',
    region: 'global',
    modelPrefix: 'openai/',
    icon: 'OpenAI',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    description: 'Official Anthropic Claude API',
    region: 'global',
    modelPrefix: 'anthropic/',
    icon: 'Anthropic',
  },
  {
    id: 'google',
    name: 'Google AI',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    description: 'Google Gemini API',
    region: 'global',
    modelPrefix: 'google/',
    icon: 'Google',
  },

  // ============ Chinese Providers (Domestic 国内) ============
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    description: 'DeepSeek V3/R1 系列模型',
    region: 'china',
    modelPrefix: 'deepseek-',
    icon: 'DeepSeek',
  },
  {
    id: 'qwen',
    name: 'Qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    description: '阿里云通义千问系列模型',
    region: 'china',
    modelPrefix: 'qwen-',
    icon: 'Qwen',
  },
  {
    id: 'moonshot-cn',
    name: 'Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    description: 'Kimi 长文本对话模型 - 国内版',
    region: 'china',
    modelPrefix: 'moonshot-',
    icon: 'Moonshot',
  },
  {
    id: 'zhipu-cn',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    description: 'GLM-5/4 系列对话模型 - 国内版',
    region: 'china',
    modelPrefix: 'glm-',
    icon: 'ChatGLM',
  },
  {
    id: 'minimax-cn',
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    description: 'MiniMax 2.5/01 系列模型 - 国内版',
    region: 'china',
    modelPrefix: 'abab',
    icon: 'Minimax',
  },
  {
    id: 'yi',
    name: '零一万物',
    baseUrl: 'https://api.lingyiwanwu.com/v1',
    description: 'Yi 系列大语言模型',
    region: 'china',
    modelPrefix: 'yi-',
    icon: 'Yi',
  },
  {
    id: 'baichuan',
    name: '百川',
    baseUrl: 'https://api.baichuan-ai.com/v1',
    description: '百川大语言模型',
    region: 'china',
    modelPrefix: 'baichuan-',
    icon: 'Baichuan',
  },
  {
    id: 'baidu',
    name: '百度文心',
    baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1',
    description: '百度文心一言系列',
    region: 'china',
    modelPrefix: 'ernie-',
    icon: 'Baidu',
  },
  {
    id: 'spark',
    name: '讯飞星火',
    baseUrl: 'https://spark-api-open.xf-yun.com/v1',
    description: '讯飞星火认知大模型',
    region: 'china',
    modelPrefix: 'spark-',
    icon: 'Spark',
  },
  {
    id: 'tencent',
    name: '腾讯混元',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    description: '腾讯混元大模型',
    region: 'china',
    modelPrefix: 'hunyuan-',
    icon: 'Hunyuan',
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    description: '多种开源模型托管服务',
    region: 'china',
    icon: 'SiliconCloud',
  },
  {
    id: 'modelscope',
    name: '魔搭',
    baseUrl: 'https://api-inference.modelscope.cn/v1',
    description: '阿里云魔搭社区模型服务',
    region: 'china',
    icon: 'ModelScope',
  },

  // ============ Chinese Providers (International 国际) ============
  {
    id: 'zhipu-global',
    name: 'Zhipu GLM',
    baseUrl: 'https://open.zhipu.ai/api/paas/v4',
    description: 'GLM-5.1/5/4 系列模型 - 国际版',
    region: 'global',
    modelPrefix: 'glm-',
    icon: 'ChatGLM',
  },
  {
    id: 'minimax-global',
    name: 'MiniMax',
    baseUrl: 'https://api.minimaxi.com/v1',
    description: 'MiniMax 2.5 系列模型 - 国际版',
    region: 'global',
    modelPrefix: 'minimax-',
    icon: 'Minimax',
  },
  {
    id: 'moonshot-global',
    name: 'Kimi',
    baseUrl: 'https://api.moonshot.ai/v1',
    description: 'Kimi 2.7/2.5 系列模型 - 国际版',
    region: 'global',
    modelPrefix: 'kimi-',
    icon: 'Moonshot',
  },
]

/**
 * Get provider by ID
 */
export function getProviderById(id: string): APIProvider | undefined {
  return API_PROVIDERS.find((p) => p.id === id)
}

/**
 * Get all Chinese domestic providers
 */
export function getChineseProviders(): APIProvider[] {
  return API_PROVIDERS.filter((p) => p.region === 'china')
}

/**
 * Get all global providers (including international Chinese providers)
 */
export function getGlobalProviders(): APIProvider[] {
  return API_PROVIDERS.filter((p) => p.region === 'global')
}

/**
 * Get international Chinese providers (global region but Chinese companies)
 */
export function getInternationalChineseProviders(): APIProvider[] {
  const chineseGlobalIds = ['zhipu-global', 'minimax-global', 'moonshot-global']
  return API_PROVIDERS.filter((p) => chineseGlobalIds.includes(p.id))
}

/**
 * Get non-Chinese global providers
 */
export function getNonChineseGlobalProviders(): APIProvider[] {
  const chineseGlobalIds = ['zhipu-global', 'minimax-global', 'moonshot-global']
  return API_PROVIDERS.filter((p) => p.region === 'global' && !chineseGlobalIds.includes(p.id))
}

/**
 * Get local providers (Ollama, LM Studio, etc.)
 */
export function getLocalProviders(): APIProvider[] {
  return API_PROVIDERS.filter((p) => p.region === 'local')
}
