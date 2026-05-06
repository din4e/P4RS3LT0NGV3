/**
 * Browser-only API layer
 * All state persisted to localStorage. No backend required.
 */

export async function callOpenRouter(
  model: string,
  messages: any,
  temperature: number,
  maxTokens: number,
  _apiKey?: string,
): Promise<string> {
  const apiKey = _apiKey || localStorage.getItem('openrouter_api_key') || ''
  const baseUrl = localStorage.getItem('api_base_url') || ''
  const endpoint = baseUrl
    ? (baseUrl.endsWith('/chat/completions') ? baseUrl : baseUrl.replace(/\/$/, '') + '/chat/completions')
    : 'https://openrouter.ai/api/v1/chat/completions'
  const response = await fetch(endpoint, {
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
    throw new Error(`API error: ${response.status} - ${err}`)
  }
  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export async function setAPIKey(key: string): Promise<void> {
  localStorage.setItem('openrouter_api_key', key)
}

export async function getAPIKeyStatus(): Promise<boolean> {
  return !!localStorage.getItem('openrouter_api_key')
}

export async function getAPIKey(): Promise<string> {
  return localStorage.getItem('openrouter_api_key') ?? ''
}

export async function downloadFile(filename: string, content: string): Promise<boolean> {
  const blob = new Blob([content], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 200)
  return true
}

export async function setAPIBaseURL(url: string): Promise<void> {
  if (url) {
    localStorage.setItem('api_base_url', url)
  } else {
    localStorage.removeItem('api_base_url')
  }
}
