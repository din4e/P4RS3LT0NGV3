// @ts-nocheck
'use client'

import { useState, useCallback } from 'react'
import { useClipboard } from '@/hooks/useClipboard'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/utils'
import { OPENROUTER_MODELS } from '@/lib/utils/openrouterModels'
import { callOpenRouter as wailsCallOpenRouter } from '@/lib/wails'

// ── strategy data ────────────────────────────────────────────────────

interface Strategy {
  id: string
  name: string
  icon: string
  desc: string
}

const STRATEGIES: Strategy[] = [
  { id: 'rephrase', name: 'Rephrase', icon: '\u21BB', desc: 'Reword while preserving intent' },
  { id: 'obfuscate', name: 'Obfuscate', icon: '\u26AB', desc: 'Obscure meaning through indirection' },
  { id: 'roleplay', name: 'Role-Play Wrap', icon: '\uD83C\uDFAD', desc: 'Embed in a fictional scenario' },
  { id: 'multilingual', name: 'Multi-Language', icon: '\uD83C\uDF10', desc: 'Mix multiple languages together' },
  { id: 'expand', name: 'Expand', icon: '\u2B22', desc: 'Elaborate with more detail and context' },
  { id: 'compress', name: 'Compress', icon: '\u25A0', desc: 'Minimize to fewest possible tokens' },
  { id: 'metaphor', name: 'Metaphor', icon: '\u2601', desc: 'Express through analogy and metaphor' },
  { id: 'fragment', name: 'Fragment', icon: '\uD83E\uDDE9', desc: 'Split across disjointed fragments' },
  { id: 'custom', name: 'Custom', icon: '\u270F', desc: 'Your own mutation instruction' },
]

const SYSTEM_PROMPTS: Record<string, string> = {
  rephrase: 'You are a prompt rephrasing expert. Rewrite the given prompt in a completely different way while preserving the exact same intent and meaning. Use different vocabulary, sentence structure, and framing. Do NOT add commentary \u2014 output ONLY the rephrased prompt.',
  obfuscate: 'You are a prompt obfuscation specialist. Rewrite the given prompt using indirection, euphemism, coded language, metaphor, or abstract framing so the surface-level reading obscures the true intent. The meaning should still be recoverable by a careful reader. Do NOT add commentary \u2014 output ONLY the obfuscated prompt.',
  roleplay: 'You are a creative writer. Wrap the given prompt inside a fictional role-play scenario, story context, or character dialogue that naturally leads to the same request being made. Use creative framing like academic research, historical fiction, game design, etc. Do NOT add commentary \u2014 output ONLY the role-play wrapped prompt.',
  multilingual: 'You are a polyglot prompt crafter. Rewrite the given prompt by mixing 2-4 different languages together naturally (e.g., English + Spanish + Japanese + French). The mixed-language version should still convey the same meaning. Do NOT add commentary \u2014 output ONLY the multilingual prompt.',
  expand: 'You are a prompt expansion expert. Take the given prompt and elaborate it with rich context, background detail, specific examples, and nuanced instructions that make the request more detailed and comprehensive. Do NOT add commentary \u2014 output ONLY the expanded prompt.',
  compress: 'You are a prompt compression expert. Reduce the given prompt to the absolute minimum number of tokens while preserving full meaning. Use abbreviations, shorthand, telegram-style language. Every word must earn its place. Do NOT add commentary \u2014 output ONLY the compressed prompt.',
  metaphor: 'You are a metaphor specialist. Rewrite the given prompt entirely through analogy, metaphor, and figurative language. The literal meaning should be expressed through symbolic/allegorical framing. Do NOT add commentary \u2014 output ONLY the metaphorical prompt.',
  fragment: 'You are a prompt fragmentation expert. Break the given prompt into 3-5 separate, seemingly disconnected fragments that individually seem innocuous but together reconstruct the full meaning. Number each fragment. Do NOT add commentary \u2014 output ONLY the fragments.',
  custom: '',
}

// ── helpers ──────────────────────────────────────────────────────────

function isWailsMode(): boolean {
  return typeof window !== 'undefined' && 'go' in window && !!(window as any).go?.main?.App
}

async function callOpenRouter(
  model: string,
  messages: Array<Record<string, string>>,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  if (isWailsMode()) {
    const result = await wailsCallOpenRouter(
      model,
      messages as any,
      temperature,
      maxTokens,
    )
    // callOpenRouter returns the content directly
    const parsed = JSON.parse(result)
    if (parsed.error) {
      throw new Error(typeof parsed.error === 'string' ? parsed.error : parsed.error.message || 'API error')
    }
    if (parsed.choices?.[0]?.message?.content) {
      return parsed.choices[0].message.content.trim()
    }
    throw new Error('Empty response from model')
  }

  // Direct fetch fallback
  const apiKey = localStorage.getItem('openrouter-api-key') || ''
  if (!apiKey) throw new Error('No API key found. Set your OpenRouter key in Settings.')

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.href || 'https://p4rs3lt0ngv3.app',
      'X-Title': 'P4RS3LT0NGV3 PromptCraft',
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  })

  if (resp.status === 401) throw new Error('Invalid API key. Check your OpenRouter key in Settings.')
  if (resp.status === 402) throw new Error('Insufficient credits on your OpenRouter account.')
  if (resp.status === 403) throw new Error('Access denied. Your key may lack permissions for this model.')

  const data = await resp.json()
  if (data.error) {
    const msg = typeof data.error === 'string' ? data.error : data.error.message || 'API error'
    throw new Error(msg)
  }
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content.trim()
  }
  throw new Error('Empty response from model')
}

// ── component ────────────────────────────────────────────────────────

export default function Tool() {
  const { copyToClipboard } = useClipboard()
  const apiKeyConfigured = useSettingsStore((s) => s.apiKeyConfigured)

  const [input, setInput] = useState('')
  const [strategy, setStrategy] = useState('rephrase')
  const [customInstruction, setCustomInstruction] = useState('')
  const [model, setModel] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pc-model') || 'nousresearch/hermes-3-llama-3.1-405b'
    return 'nousresearch/hermes-3-llama-3.1-405b'
  })
  const [temperature, setTemperature] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = parseFloat(localStorage.getItem('pc-temperature') || '')
      return Number.isFinite(saved) ? Math.min(2, Math.max(0, saved)) : 0.9
    }
    return 0.9
  })
  const [count, setCount] = useState(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [outputs, setOutputs] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const flash = useCallback(
    (key: string, text: string) => {
      copyToClipboard(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 1200)
    },
    [copyToClipboard],
  )

  const runMutation = useCallback(async () => {
    if (!input.trim()) {
      setError('Enter a prompt to mutate.')
      return
    }
    if (!apiKeyConfigured && !isWailsMode()) {
      setError('No API key found. Set your OpenRouter key in Settings first.')
      return
    }

    setLoading(true)
    setError('')
    setOutputs([])

    try {
      localStorage.setItem('pc-model', model)
      localStorage.setItem('pc-temperature', String(temperature))
    } catch { /* ignore */ }

    let systemPrompt = SYSTEM_PROMPTS[strategy] || SYSTEM_PROMPTS.rephrase
    if (strategy === 'custom' && customInstruction) {
      systemPrompt = customInstruction
    }

    const maxVariants = Math.max(1, Math.min(10, count))
    const temp = Math.min(2, Math.max(0, temperature))

    try {
      const requests = Array.from({ length: maxVariants }, () =>
        callOpenRouter(
          model,
          [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input },
          ],
          temp,
          2048,
        ),
      )

      const results = await Promise.allSettled(requests)
      const out: string[] = []
      for (const result of results) {
        if (result.status === 'fulfilled') {
          out.push(result.value)
        } else {
          setError(result.reason?.message || 'Request failed')
        }
      }
      setOutputs(out)
    } catch (e: any) {
      setError(e.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }, [input, strategy, customInstruction, model, temperature, count, apiKeyConfigured])

  const copyAll = useCallback(() => {
    if (outputs.length === 0) return
    flash('all', outputs.join('\n\n---\n\n'))
  }, [outputs, flash])

  const useAsInput = useCallback((text: string) => {
    setInput(text)
  }, [])

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

  const btnSecondary =
    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ' +
    'bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)] ' +
    'hover:bg-[var(--accent)] transition-colors'

  const labelCls = 'text-xs font-medium text-[var(--muted-foreground)] mb-1'

  // ── render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          PromptCraft
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          AI-assisted prompt mutation via OpenRouter
        </p>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Source Prompt</label>
        <textarea
          className={cn(inputCls, 'min-h-[80px] resize-y')}
          placeholder="Enter your prompt to mutate..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
        />
      </div>

      {/* Strategy grid */}
      <div className="flex flex-col gap-2">
        <label className={labelCls}>Strategy</label>
        <div className="flex flex-wrap gap-1.5">
          {STRATEGIES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStrategy(s.id)}
              title={s.desc}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors',
                strategy === s.id
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                  : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--accent)]',
              )}
            >
              <span>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom instruction */}
      {strategy === 'custom' && (
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Custom Mutation Instruction</label>
          <textarea
            className={cn(inputCls, 'min-h-[60px] resize-y')}
            placeholder="Describe how to mutate the prompt..."
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            rows={2}
          />
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
          <label className={labelCls}>Variants</label>
          <input
            className={inputCls}
            type="number"
            min={1}
            max={10}
            value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>
            Temperature: {temperature.toFixed(2)}
          </label>
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

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button className={btnPrimary} onClick={runMutation} disabled={loading}>
          {loading ? 'Generating...' : 'Mutate Prompt'}
        </button>
        {outputs.length > 0 && (
          <button className={btnSecondary} onClick={copyAll}>
            {copied === 'all' ? 'Copied!' : 'Copy All'}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/40 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {outputs.length > 0 && (
        <div className="flex flex-col gap-3">
          {outputs.map((out, i) => (
            <div
              key={i}
              className="rounded-md border border-[var(--border)] bg-[var(--card)] overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--muted)]">
                <span className="text-xs font-mono text-[var(--muted-foreground)]">
                  #{i + 1}
                </span>
                <div className="flex gap-1">
                  <button
                    className="px-2 py-0.5 text-xs rounded border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] transition-colors text-[var(--foreground)]"
                    onClick={() => useAsInput(out)}
                    title="Use as new input"
                  >
                    &larr; Use
                  </button>
                  <button
                    className="px-2 py-0.5 text-xs rounded border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] transition-colors text-[var(--foreground)]"
                    onClick={() => flash(`out-${i}`, out)}
                  >
                    {copied === `out-${i}` ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="px-3 py-3 text-sm text-[var(--foreground)] whitespace-pre-wrap break-words">
                {out}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {outputs.length === 0 && !loading && !error && (
        <div className="flex flex-col items-center gap-2 py-8 text-[var(--muted-foreground)]">
          <p>Enter a prompt and choose a mutation strategy.</p>
          <p className="text-xs">Uses OpenRouter API &mdash; requires an API key set in Settings.</p>
        </div>
      )}
    </div>
  )
}
