// @ts-nocheck
/**
 * Wails Go bindings wrapper
 * In Wails desktop mode, calls Go backend methods
 * In browser mode, falls back to direct API calls
 */

let _wailsApp: any = null

async function getWailsApp(): Promise<any | null> {
  if (typeof window === 'undefined') return null
  if (_wailsApp) return _wailsApp
  try {
    // Use string concatenation to prevent webpack from resolving the path at build time
    const wailsPath = ['../', '../', 'wailsjs/go/main/App'].join('')
    const mod = await import(/* webpackIgnore: true */ /* @vite-ignore */ wailsPath)
    _wailsApp = new mod.default()
    return _wailsApp
  } catch {
    return null
  }
}

export async function callOpenRouter(
  model: string,
  messages: any,
  temperature: number,
  maxTokens: number,
  _apiKey?: string,
): Promise<string> {
  const app = await getWailsApp()
  if (app) {
    return app.CallOpenRouter(model, typeof messages === 'string' ? messages : JSON.stringify(messages), temperature, maxTokens)
  }

  // Fallback: direct fetch (browser mode)
  const apiKey = _apiKey || localStorage.getItem('openrouter_api_key') || ''
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'P4RS3LT0NGV3',
    },
    body: JSON.stringify({ model, messages: typeof messages === 'string' ? JSON.parse(messages) : messages, temperature, max_tokens: maxTokens }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${err}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export async function setAPIKey(key: string): Promise<void> {
  const app = await getWailsApp()
  if (app) {
    return app.SetAPIKey(key)
  }
  localStorage.setItem('openrouter_api_key', key)
}

export async function getAPIKeyStatus(): Promise<boolean> {
  const app = await getWailsApp()
  if (app) {
    return app.GetAPIKeyStatus()
  }
  return !!localStorage.getItem('openrouter_api_key')
}

export async function getAPIKey(): Promise<string> {
  const app = await getWailsApp()
  if (app) {
    return ''
  }
  return localStorage.getItem('openrouter_api_key') ?? ''
}

export function isWailsMode(): boolean {
  return typeof window !== 'undefined' && !!(window as any).runtime
}
