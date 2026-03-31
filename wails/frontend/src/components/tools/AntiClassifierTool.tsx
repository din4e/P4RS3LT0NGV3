// @ts-nocheck
'use client'

import { useState, useCallback } from 'react'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/utils'
import { OPENROUTER_MODELS } from '@/lib/utils/openrouterModels'
import { ANTICLASSIFIER_SYSTEM_PROMPT } from '@/lib/utils/anticlassifierPrompt'
import { callOpenRouter } from '@/lib/wails'

// ── helpers ──────────────────────────────────────────────────────────

function isWailsMode(): boolean {
  return typeof window !== 'undefined' && 'go' in window && !!(window as any).go?.main?.App
}

async function callAPI(
  model: string,
  messages: Array<Record<string, string>>,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  if (isWailsMode()) {
    const result = await callOpenRouter(model, messages as any, temperature, maxTokens)
    const parsed = JSON.parse(result)
    if (parsed.error) {
      const msg = typeof parsed.error === 'string' ? parsed.error : (parsed.error.message || 'API error')
      throw new Error(msg)
    }
    if (parsed.choices && parsed.choices[0] && parsed.choices[0].message && parsed.choices[0].message.content) {
      return parsed.choices[0].message.content.trim()
    }
    throw new Error('Empty response from model.')
  }

  // Direct fetch fallback
  const apiKey = localStorage.getItem('openrouter-api-key') || ''
  if (!apiKey) throw new Error('No API key found. Set your OpenRouter key in Settings.')

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.href || 'https://p4rs3lt0ngv3.app',
      'X-Title': 'P4RS3LT0NGV3 Anti-Classifier',
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  })

  if (resp.status === 401) throw new Error('Invalid API key. Check your OpenRouter key in Settings.')
  if (resp.status === 402) throw new Error('Insufficient credits on your OpenRouter account.')
  if (resp.status === 403) throw new Error('Access denied. Your key may lack permissions for this model.')

  const data = await resp.json()
  if (data.error) {
    throw new Error(typeof data.error === 'string' ? data.error : (data.error.message || 'API error'))
  }
  if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
    return data.choices[0].message.content.trim()
  }
  throw new Error('Empty response from model.')
}

// ── component ────────────────────────────────────────────────────────

export default function Tool() {
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const apiKeyConfigured = useSettingsStore((s) => s.apiKeyConfigured)

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const [model, setModel] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('ac-model') || 'anthropic/claude-sonnet-4.6'
    return 'anthropic/claude-sonnet-4.6'
  })
  const [temperature, setTemperature] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = parseFloat(localStorage.getItem('ac-temperature') || '')
      return Number.isFinite(saved) ? Math.min(2, Math.max(0, saved)) : 0.7
    }
    return 0.7
  })
  const [maxTokens, setMaxTokens] = useState(2000)

  const flash = useCallback(
    async (text: string) => {
      const ok = await copyToClipboard(text)
      if (ok) {
        addHistoryItem(text, 'AntiClassifier')
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }
    },
    [copyToClipboard, addHistoryItem],
  )

  const run = useCallback(async () => {
    if (!input.trim()) {
      setError('Enter a prompt to analyze.')
      return
    }
    if (!apiKeyConfigured && !isWailsMode()) {
      setError('No API key found. Set your OpenRouter key in Settings first.')
      return
    }

    setLoading(true)
    setError('')
    setOutput('')

    try {
      localStorage.setItem('ac-model', model)
      localStorage.setItem('ac-temperature', String(temperature))
    } catch { /* ignore */ }

    try {
      const result = await callAPI(
        model,
        [
          { role: 'system', content: ANTICLASSIFIER_SYSTEM_PROMPT },
          { role: 'user', content: input },
        ],
        Math.min(2, Math.max(0, temperature)),
        Math.max(100, Math.min(32000, maxTokens)),
      )
      setOutput(result)
    } catch (e: any) {
      setError(e.message || 'Request failed.')
    } finally {
      setLoading(false)
    }
  }, [input, model, temperature, maxTokens, apiKeyConfigured])

  // ── styles ─────────────────────────────────────────────────────

  const inputCls =
    'w-full rounded-md px-3 py-2 text-sm outline-none transition-colors ' +
    'placeholder:text-[var(--muted-foreground)] ' +
    'bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] ' +
    'focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'

  const selectCls =
    'w-full rounded-md px-3 py-2 text-sm outline-none transition-colors ' +
    'bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] ' +
    'focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'

  const btnPrimary =
    'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium ' +
    'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50'

  const labelCls = 'text-xs font-medium text-[var(--muted-foreground)] mb-1'

  // ── render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Anti-Classifier
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Syntactic prompt rewriting via OpenRouter to test content filter robustness
        </p>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Prompt to rewrite</label>
        <textarea
          className={cn(inputCls, 'min-h-[80px] resize-y')}
          placeholder="Enter a prompt to analyze and rewrite..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
        />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Model</label>
          <select
            className={selectCls}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {OPENROUTER_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Max Tokens</label>
          <input
            className={inputCls}
            type="number"
            min={100}
            max={32000}
            value={maxTokens}
            onChange={(e) => setMaxTokens(Math.max(100, Number(e.target.value)))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Temperature: {temperature.toFixed(2)}</label>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="accent-[var(--primary)]"
          />
        </div>
      </div>

      {/* Action */}
      <div className="flex flex-wrap gap-2">
        <button className={btnPrimary} onClick={run} disabled={loading}>
          {loading ? 'Analyzing...' : 'Rewrite Prompt'}
        </button>
        {output && (
          <button
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium border transition-colors',
              copied
                ? 'bg-green-500/10 text-green-500 border-green-500/30'
                : 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)] hover:bg-[var(--accent)]',
            )}
            onClick={() => flash(output)}
          >
            {copied ? 'Copied!' : 'Copy Output'}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/40 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Result</label>
          <textarea
            readOnly
            value={output}
            className={cn(inputCls, 'min-h-[120px] resize-y')}
            rows={6}
          />
        </div>
      )}

      {/* Empty state */}
      {!output && !loading && !error && (
        <div className="flex flex-col items-center gap-2 py-8 text-[var(--muted-foreground)]">
          <p>Enter a prompt and click Rewrite to transform it.</p>
          <p className="text-xs">Uses OpenRouter API &mdash; requires an API key set in Settings.</p>
        </div>
      )}
    </div>
  )
}
