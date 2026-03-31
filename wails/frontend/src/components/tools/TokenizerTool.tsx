// @ts-nocheck
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'

// ── types ────────────────────────────────────────────────────────────

interface Token {
  text: string
  id?: number
}

type Engine = 'byte' | 'word' | 'cl100k' | 'o200k' | 'p50k' | 'r50k'

// ── helpers ──────────────────────────────────────────────────────────

function tokenizeBytes(text: string): Token[] {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)
  return Array.from(bytes).map((b) => ({
    id: b,
    text: `0x${b.toString(16).padStart(2, '0')}`,
  }))
}

function tokenizeWords(text: string): Token[] {
  const parts = text.split(/(\s+|[.,!?:;()[\]{}])/)
  return parts.filter(Boolean).map((p) => ({ text: p }))
}

// Cache for the dynamically-loaded gpt-tokenizer module
let gptTokenizerModule: any = null

async function loadGptTokenizer(): Promise<any> {
  if (gptTokenizerModule) return gptTokenizerModule
  gptTokenizerModule = await import('gpt-tokenizer')
  return gptTokenizerModule
}

async function tokenizeGpt(
  text: string,
  engine: string
): Promise<Token[]> {
  const mod = await loadGptTokenizer()

  const map: Record<string, string> = {
    cl100k: 'cl100k_base',
    o200k: 'o200k_base',
    p50k: 'p50k_edit',
    r50k: 'r50k_base',
  }
  const enc = map[engine]
  if (!enc) throw new Error(`Unknown engine: ${engine}`)

  let ids: number[]
  let decoder: any

  if (mod.get_encoding) {
    const encoder = mod.get_encoding(enc as any)
    if (!encoder) throw new Error(`Encoding ${enc} not found`)
    ids = encoder.encode(text)
    decoder = encoder
  } else if (mod.encode) {
    ids = mod.encode(text, enc as any)
    decoder = null
  } else {
    throw new Error('Tokenizer library API not recognized')
  }

  const tokens: Token[] = []
  for (const id of ids) {
    let piece: string
    if (decoder) {
      piece = decoder.decode([id])
    } else {
      piece = mod.decode([id], enc as any)
    }
    tokens.push({ id, text: piece })
  }
  return tokens
}

// ── component ────────────────────────────────────────────────────────

export default function Tool() {
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const [copied, setCopied] = useState(false)

  const [input, setInput] = useState('')
  const [engine, setEngine] = useState<Engine>('byte')
  const [tokens, setTokens] = useState<Token[]>([])
  const [charCount, setCharCount] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runTokenizer = useCallback(
    async (text: string, eng: Engine) => {
      if (!text) {
        setTokens([])
        setCharCount(0)
        setWordCount(0)
        setError(null)
        return
      }

      setCharCount(Array.from(text).length)
      setWordCount((text.trim().match(/[^\s]+/g) || []).length)

      if (eng === 'byte') {
        setTokens(tokenizeBytes(text))
        setError(null)
      } else if (eng === 'word') {
        setTokens(tokenizeWords(text))
        setError(null)
      } else {
        setLoading(true)
        try {
          const result = await tokenizeGpt(text, eng)
          setTokens(result)
          setError(null)
        } catch (e: any) {
          setError(
            `GPT tokenizer unavailable: ${e.message}. Install gpt-tokenizer or use byte/word mode.`
          )
          // fallback to bytes
          setTokens(tokenizeBytes(text))
        } finally {
          setLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runTokenizer(input, engine), 150)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [input, engine, runTokenizer])

  const handleCopyAll = useCallback(() => {
    const text = tokens
      .map((t, i) => `${i}: ${t.text}${t.id !== undefined ? ` (#${t.id})` : ''}`)
      .join('\n')
    copyToClipboard(text)
    addHistoryItem(text, 'Tokenizer')
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }, [tokens, copyToClipboard, addHistoryItem])

  // ── styles ─────────────────────────────────────────────────────

  const inputCls =
    'w-full rounded-md px-3 py-2 text-sm outline-none transition-colors ' +
    'placeholder:text-[var(--muted-foreground)] ' +
    'bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] ' +
    'focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'

  const selectCls =
    'rounded-md px-3 py-2 text-sm outline-none transition-colors ' +
    'bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] ' +
    'focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'

  const labelCls = 'text-xs font-medium text-[var(--muted-foreground)] mb-1'

  // ── render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Tokenizer Visualization
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Paste text to see how different tokenizers segment it.
        </p>
      </div>

      {/* Engine selector */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Engine</label>
        <select
          className={selectCls}
          value={engine}
          onChange={(e) => setEngine(e.target.value as Engine)}
        >
          <option value="byte">UTF-8 bytes</option>
          <option value="word">Naive words</option>
          <option value="cl100k">OpenAI: cl100k_base (GPT-3.5/4)</option>
          <option value="o200k">OpenAI: o200k_base (GPT-4o)</option>
          <option value="p50k">OpenAI: p50k_edit (Code editing models)</option>
          <option value="r50k">OpenAI: r50k_base</option>
        </select>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Input Text</label>
        <textarea
          className={inputCls + ' min-h-[120px] resize-y'}
          placeholder="Paste text to visualize tokens"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
        />
      </div>

      {/* Output header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Tokens
          </span>
          {tokens.length > 0 && (
            <span className="text-xs text-[var(--muted-foreground)]">
              {tokens.length} total &middot; {wordCount} words &middot;{' '}
              {charCount} chars
            </span>
          )}
        </div>
        {tokens.length > 0 && (
          <button
            className="text-xs text-[var(--primary)] hover:underline"
            onClick={handleCopyAll}
          >
            {copied ? 'Copied!' : 'Copy All'}
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md border border-[var(--destructive)] bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-sm text-[var(--muted-foreground)] animate-pulse">
          Loading tokenizer...
        </div>
      )}

      {/* Token tiles */}
      {tokens.length > 0 && !loading && (
        <div className="flex flex-wrap gap-1.5">
          {tokens.map((tok, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--muted)] px-2 py-1 text-sm"
            >
              <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                {i}
              </span>
              <span className="text-[var(--foreground)] break-all">
                {tok.text}
              </span>
              {tok.id !== undefined && (
                <span className="text-[10px] font-mono text-[var(--primary)]">
                  #{tok.id}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {tokens.length === 0 && !loading && !error && (
        <p className="text-sm text-[var(--muted-foreground)]">
          Tokens will appear here.
        </p>
      )}
    </div>
  )
}
