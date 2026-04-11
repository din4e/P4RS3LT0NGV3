'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { allTransforms } from '@/lib/transformers'
import { cn } from '@/lib/utils'
import { useAIConfig, useHasProvider } from '@/hooks/useAIConfig'
import { fuzzerRegistry, runFuzzer } from '@/lib/fuzzer'
import type {
  AttackDefinition,
  AttackResult,
  FuzzerConfig,
  FuzzerCallbacks,
  FuzzerReport,
  FuzzerSummary,
} from '@/lib/fuzzer'
import {
  Bug, Play, Square, Download, Loader2, AlertCircle,
  CheckCircle2, XCircle, ChevronDown, ChevronRight,
  Shield, Zap, Brain, Copy, Check, RefreshCw,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────

type FuzzerMode = 'mutation' | 'llm'
type LLMTab = 'configure' | 'progress' | 'results'

interface ProgressEntry {
  attackId: string
  message: string
  status: 'running' | 'jailbroken' | 'safe' | 'error'
  timestamp: number
}

// ── Mutation Lab Helpers (preserved from original) ────────────────────

function seededRandomFactory(seedStr: string): () => number {
  if (!seedStr) return Math.random
  let h = 1779033703 ^ seedStr.length
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h ^= h >>> 16
    h = Math.imul(h, 2246822507)
    h ^= h >>> 13
    h = Math.imul(h, 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function pick(arr: string[], rnd: () => number): string {
  return arr[Math.floor(rnd() * arr.length)]
}

function injectZeroWidth(text: string, rnd: () => number): string {
  const zw = ['\u200B', '\u200C', '\u200D', '\u2060']
  return [...text].map((ch) => (rnd() < 0.2 ? ch + pick(zw, rnd) : ch)).join('')
}

function injectUnicodeNoise(text: string, rnd: () => number): string {
  const marks = ['\u0301', '\u0300', '\u0302', '\u0303', '\u0308', '\u0307', '\u0304']
  return [...text].map((ch) => (rnd() < 0.15 ? ch + pick(marks, rnd) : ch)).join('')
}

function whitespaceChaos(text: string, rnd: () => number): string {
  return text.replace(/\s/g, (m) => (rnd() < 0.5 ? m : rnd() < 0.5 ? '\t' : '\u00A0'))
}

function casingChaos(text: string, rnd: () => number): string {
  return [...text]
    .map((c) => (/[a-z]/i.test(c) ? (rnd() < 0.5 ? c.toUpperCase() : c.toLowerCase()) : c))
    .join('')
}

function encodeShuffle(text: string, rnd: () => number): string {
  const map: Record<string, string> = {
    A: '\u0391', B: '\u0392', C: '\u03F9', E: '\u0395', H: '\u0397',
    I: '\u0399', K: '\u039A', M: '\u039C', N: '\u039D', O: '\u039F',
    P: '\u03A1', T: '\u03A4', X: '\u03A7', Y: '\u03A5',
    a: '\u0430', c: '\u0441', e: '\u0435', i: '\u0456', j: '\u0458',
    o: '\u043E', p: '\u0440', s: '\u0455', x: '\u0445', y: '\u0443',
  }
  return [...text].map((ch) => (map[ch] && rnd() < 0.25 ? map[ch] : ch)).join('')
}

// ── Styles ───────────────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────────────

export default function Tool() {
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const aiConfig = useAIConfig('fuzzer')
  const hasProvider = useHasProvider()
  const [copied, setCopied] = useState<string | null>(null)
  const [mode, setMode] = useState<FuzzerMode>('mutation')

  const flash = useCallback(
    (key: string, text: string) => {
      copyToClipboard(text)
      addHistoryItem(text, 'Fuzzer')
      setCopied(key)
      setTimeout(() => setCopied(null), 1200)
    },
    [copyToClipboard, addHistoryItem],
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-[var(--muted)] p-1">
        <button
          type="button"
          onClick={() => setMode('mutation')}
          className={cn(
            'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            mode === 'mutation'
              ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          )}
        >
          <Zap className="inline h-3.5 w-3.5 mr-1.5" />
          Mutation Lab
        </button>
        <button
          type="button"
          onClick={() => setMode('llm')}
          className={cn(
            'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            mode === 'llm'
              ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          )}
        >
          <Shield className="inline h-3.5 w-3.5 mr-1.5" />
          LLM Fuzzer
        </button>
      </div>

      {mode === 'mutation' ? <MutationLab flash={flash} copied={copied} /> : <LLMFuzzer aiConfig={aiConfig} hasProvider={hasProvider} flash={flash} copied={copied} />}
    </div>
  )
}

// ── Mutation Lab (preserved from original) ────────────────────────────

function MutationLab({ flash, copied }: { flash: (key: string, text: string) => void; copied: string | null }) {
  const [input, setInput] = useState('')
  const [count, setCount] = useState(20)
  const [seed, setSeed] = useState('')
  const [outputs, setOutputs] = useState<string[]>([])
  const [useRandomMix, setUseRandomMix] = useState(true)
  const [zeroWidth, setZeroWidth] = useState(true)
  const [unicodeNoise, setUnicodeNoise] = useState(true)
  const [zalgo, setZalgo] = useState(false)
  const [whitespace, setWhitespace] = useState(true)
  const [casing, setCasing] = useState(true)
  const [encodeShuffleOn, setEncodeShuffle] = useState(false)

  const generateCases = useCallback(() => {
    const src = input
    if (!src) { setOutputs([]); return }
    const rnd = seededRandomFactory(String(seed || ''))
    const result: string[] = []
    const total = Math.max(1, Math.min(500, count || 1))
    for (let i = 0; i < total; i++) {
      let s = src
      if (useRandomMix) { try { const t = allTransforms['randomizer']; if (t) s = t.func(s, { minTransforms: 2, maxTransforms: 4 }) } catch { /* */ } }
      if (zeroWidth) s = injectZeroWidth(s, rnd)
      if (unicodeNoise) s = injectUnicodeNoise(s, rnd)
      if (whitespace) s = whitespaceChaos(s, rnd)
      if (casing) s = casingChaos(s, rnd)
      if (zalgo) { try { const t = allTransforms['zalgo']; if (t) s = t.func(s) } catch { /* */ } }
      if (encodeShuffleOn) s = encodeShuffle(s, rnd)
      result.push(s)
    }
    setOutputs(result)
  }, [input, count, seed, useRandomMix, zeroWidth, unicodeNoise, zalgo, whitespace, casing, encodeShuffleOn])

  const copyAllFuzz = useCallback(() => { if (outputs.length > 0) flash('all-fuzz', outputs.join('\n')) }, [outputs, flash])
  const downloadFuzz = useCallback(() => {
    const lines = outputs.map((s, i) => `#${i + 1}\t${s}`).join('\n')
    const blob = new Blob([`# Parseltongue Fuzzer Output\n# count=${outputs.length}\n\n${lines}\n`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'fuzz_cases.txt'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 200)
  }, [outputs])

  const toggleCls = 'inline-flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer select-none'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Mutation Lab</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Generate mutated text payloads. Multiple fuzzing strategies applied in combination.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Base text</label>
        <textarea className={cn(inputCls, 'min-h-[80px] resize-y')} placeholder="Enter seed text to fuzz..." value={input} onChange={(e) => setInput(e.target.value)} rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Cases</label>
          <input className={inputCls} type="number" min={1} max={500} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value)))} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Seed (optional)</label>
          <input className={inputCls} type="text" placeholder="e.g., 1337" value={seed} onChange={(e) => setSeed(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {[['Random Mix', useRandomMix, setUseRandomMix], ['Zero-width pepper', zeroWidth, setZeroWidth], ['Unicode noise', unicodeNoise, setUnicodeNoise], ['Zalgo', zalgo, setZalgo], ['Whitespace chaos', whitespace, setWhitespace], ['Casing chaos', casing, setCasing], ['Homoglyph confusables', encodeShuffleOn, setEncodeShuffle]].map(([label, val, setter]) => (
          <label key={String(label)} className={toggleCls}>
            <input type="checkbox" className="accent-[var(--primary)]" checked={val as boolean} onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)} />
            {label as string}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={btnPrimary} onClick={generateCases}>Generate Cases</button>
        {outputs.length > 0 && (
          <>
            <button className={btnSecondary} onClick={copyAllFuzz}>{copied === 'all-fuzz' ? 'Copied!' : 'Copy All'}</button>
            <button className={btnSecondary} onClick={downloadFuzz}>Download</button>
          </>
        )}
      </div>
      {outputs.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-[var(--muted-foreground)]">{outputs.length} mutated case{outputs.length !== 1 ? 's' : ''}</span>
          <div className="grid gap-2">
            {outputs.map((out, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <span className="shrink-0 px-2 py-2 text-xs font-mono text-[var(--muted-foreground)] bg-[var(--muted)] border-r border-[var(--border)] self-stretch flex items-center">#{i + 1}</span>
                <textarea className="flex-1 min-h-[40px] py-2 pr-1 text-sm text-[var(--foreground)] bg-transparent outline-none resize-y border-none" readOnly value={out} rows={1} />
                <button className="shrink-0 self-center px-2 text-xs text-[var(--primary)] hover:underline" onClick={() => flash(`fz-${i}`, out)}>{copied === `fz-${i}` ? 'Copied!' : 'Copy'}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── LLM Fuzzer ──────────────────────────────────────────────────────

function LLMFuzzer({
  aiConfig,
  hasProvider,
  flash,
  copied,
}: {
  aiConfig: ReturnType<typeof useAIConfig>
  hasProvider: boolean
  flash: (key: string, text: string) => void
  copied: string | null
}) {
  const [tab, setTab] = useState<LLMTab>('configure')

  // Config state
  const [targetPrompt, setTargetPrompt] = useState('')
  const [selectedAttacks, setSelectedAttacks] = useState<Set<string>>(new Set())
  const [selectedClassifiers, setSelectedClassifiers] = useState<Set<string>>(new Set(['harmful_llm']))
  const [attackOptions, setAttackOptions] = useState<Record<string, Record<string, unknown>>>({})
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['simple']))

  // Runtime state
  const [loading, setLoading] = useState(false)
  const [progressLog, setProgressLog] = useState<ProgressEntry[]>([])
  const [results, setResults] = useState<AttackResult[]>([])
  const [report, setReport] = useState<FuzzerReport | null>(null)
  const [summary, setSummary] = useState<FuzzerSummary | null>(null)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // Get attack/classifier definitions
  const attackDefs = useMemo(() => fuzzerRegistry.getAttackDefinitions(), [])
  const classifierDefs = useMemo(() => fuzzerRegistry.getAllClassifiers().map((c) => ({ id: c.id, name: c.name, description: c.description })), [])

  const attacksByComplexity = useMemo(() => {
    const groups: Record<string, AttackDefinition[]> = { simple: [], medium: [], advanced: [] }
    for (const def of attackDefs) {
      if (groups[def.complexity]) groups[def.complexity].push(def)
    }
    return groups
  }, [attackDefs])

  // Toggle helpers
  const toggleAttack = useCallback((id: string) => {
    setSelectedAttacks((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }, [])
  const toggleClassifier = useCallback((id: string) => {
    setSelectedClassifiers((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }, [])
  const toggleGroup = useCallback((g: string) => {
    setExpandedGroups((prev) => { const next = new Set(prev); next.has(g) ? next.delete(g) : next.add(g); return next })
  }, [])

  const needsAuxModel = useMemo(
    () => [...selectedAttacks].some((id) => { const h = fuzzerRegistry.getAttack(id); return h?.definition.requiresAuxiliaryModel }),
    [selectedAttacks],
  )

  const [modelsLoading, setModelsLoading] = useState(false)

  const handleRefreshModels = useCallback(async () => {
    setModelsLoading(true)
    try {
      await aiConfig.refreshModels()
    } catch (err) {
      console.error('Failed to refresh models:', err)
    } finally {
      setModelsLoading(false)
    }
  }, [aiConfig])

  // Auto-fetch models when provider is configured but no models available
  useEffect(() => {
    if (aiConfig.isConfigured && aiConfig.availableModels.length === 0 && !modelsLoading) {
      handleRefreshModels()
    }
  }, [aiConfig.isConfigured, aiConfig.availableModels.length, modelsLoading, handleRefreshModels])

  // Run fuzzer
  const handleRun = useCallback(async () => {
    if (!targetPrompt.trim() || selectedAttacks.size === 0 || !aiConfig.model) return

    setLoading(true)
    setError('')
    setProgressLog([])
    setResults([])
    setReport(null)
    setSummary(null)
    setTab('progress')

    const abort = new AbortController()
    abortRef.current = abort

    const config: FuzzerConfig = {
      targetPrompt,
      attackIds: [...selectedAttacks],
      classifierIds: [...selectedClassifiers],
      targetModel: aiConfig.model,
      targetProvider: aiConfig.provider?.id,
      attackOptions,
    }

    const callbacks: FuzzerCallbacks = {
      onAttackStart: (id) => {
        setProgressLog((prev) => [...prev, { attackId: id, message: 'Starting...', status: 'running', timestamp: Date.now() }])
      },
      onAttackProgress: (id, msg) => {
        setProgressLog((prev) => [...prev.slice(0, -1), { attackId: id, message: msg, status: 'running', timestamp: Date.now() }])
      },
      onAttackComplete: (id, result) => {
        setResults((prev) => [...prev, result])
        setProgressLog((prev) => [
          ...prev.slice(0, -1),
          { attackId: id, message: result.isJailbroken ? 'Jailbroken!' : result.error ? `Error: ${result.error}` : 'Safe', status: result.isJailbroken ? 'jailbroken' : result.error ? 'error' : 'safe', timestamp: Date.now() },
        ])
      },
      onClassifyComplete: () => {},
      onError: (id, msg) => {
        setProgressLog((prev) => [...prev, { attackId: id, message: msg, status: 'error', timestamp: Date.now() }])
      },
      onSummaryUpdate: (s) => setSummary({ ...s }),
    }

    try {
      const r = await runFuzzer(config, callbacks, abort.signal)
      setReport(r)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }, [targetPrompt, selectedAttacks, selectedClassifiers, aiConfig, attackOptions])

  const handleCancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const handleExport = useCallback(() => {
    if (!report) return
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `fuzzer-report-${report.id}.json`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 200)
  }, [report])

  const anyRequiresAux = needsAuxModel
  const canRun = targetPrompt.trim() && selectedAttacks.size > 0 && aiConfig.isConfigured && aiConfig.model

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
          <Bug className="h-5 w-5" /> LLM Fuzzer
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Test LLM safety with adversarial attack techniques. Ported from CyberArk FuzzyAI.
        </p>
      </div>

      {/* Provider warning */}
      {!hasProvider && (
        <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/40 text-amber-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          No API provider configured. Add one in Settings to use the LLM Fuzzer.
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {(['configure', 'progress', 'results'] as LLMTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              tab === t
                ? 'border-[var(--primary)] text-[var(--foreground)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            {t === 'configure' ? 'Configure' : t === 'progress' ? 'Progress' : 'Results'}
            {t === 'progress' && loading && <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />}
            {t === 'results' && results.length > 0 && (
              <span className="ml-1.5 text-xs bg-[var(--muted)] rounded-full px-1.5">{results.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Configure Tab ─────────────────────────────────────── */}
      {tab === 'configure' && (
        <div className="flex flex-col gap-5">
          {/* Target prompt */}
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Target Prompt</label>
            <textarea
              className={cn(inputCls, 'min-h-[100px] resize-y')}
              placeholder="Enter the prompt to test against the target LLM..."
              value={targetPrompt}
              onChange={(e) => setTargetPrompt(e.target.value)}
              rows={4}
            />
          </div>

          {/* Attack selection */}
          <div className="flex flex-col gap-3">
            <label className={cn(labelCls, '!mb-0')}>Attack Techniques ({selectedAttacks.size} selected)</label>
            {(['simple', 'medium', 'advanced'] as const).map((group) => {
              const defs = attacksByComplexity[group]
              if (!defs || defs.length === 0) return null
              const isExpanded = expandedGroups.has(group)
              const groupIcon = group === 'simple' ? Zap : group === 'medium' ? Brain : Shield
              const GroupIcon = groupIcon
              return (
                <div key={group} className="rounded-md border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                  >
                    <GroupIcon className="h-4 w-4" />
                    <span className="capitalize">{group}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">({defs.length})</span>
                    <span className="ml-auto">{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 grid gap-2">
                      {defs.map((def) => (
                        <label key={def.id} className="flex items-start gap-2 text-sm text-[var(--foreground)] cursor-pointer">
                          <input
                            type="checkbox"
                            className="accent-[var(--primary)] mt-0.5"
                            checked={selectedAttacks.has(def.id)}
                            onChange={() => toggleAttack(def.id)}
                          />
                          <div>
                            <span className="font-medium">{def.name}</span>
                            {def.requiresAuxiliaryModel && (
                              <span className="ml-1.5 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">aux model</span>
                            )}
                            <p className="text-xs text-[var(--muted-foreground)]">{def.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Classifier selection */}
          <div className="flex flex-col gap-2">
            <label className={cn(labelCls, '!mb-0')}>Classifiers</label>
            <div className="grid gap-2">
              {classifierDefs.map((c) => (
                <label key={c.id} className="flex items-start gap-2 text-sm text-[var(--foreground)] cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-[var(--primary)] mt-0.5"
                    checked={selectedClassifiers.has(c.id)}
                    onChange={() => toggleClassifier(c.id)}
                  />
                  <div>
                    <span className="font-medium">{c.name}</span>
                    <p className="text-xs text-[var(--muted-foreground)]">{c.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Model selection */}
          <div className="rounded-md border border-[var(--border)] p-3 flex flex-col gap-2">
            <label className={cn(labelCls, '!mb-0')}>Target Model</label>
            {!aiConfig.isConfigured ? (
              <p className="text-xs text-amber-400">Configure a provider in Settings first</p>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  className={cn(selectCls, 'flex-1')}
                  value={aiConfig.model}
                  onChange={(e) => aiConfig.setModel(e.target.value)}
                >
                  <option value="">-- Select model --</option>
                  {aiConfig.availableModels.length > 0 ? (
                    aiConfig.availableModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))
                  ) : (
                    <option value={aiConfig.model || 'default'}>{aiConfig.model || 'No models available'}</option>
                  )}
                </select>
                <button
                  type="button"
                  onClick={handleRefreshModels}
                  disabled={modelsLoading}
                  className={cn(btnSecondary, 'shrink-0')}
                  title="Refresh model list"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', modelsLoading && 'animate-spin')} />
                </button>
                {aiConfig.provider && (
                  <span className="text-xs text-[var(--muted-foreground)] shrink-0">({aiConfig.provider.name})</span>
                )}
              </div>
            )}
            {aiConfig.isConfigured && !aiConfig.model && (
              <p className="text-xs text-amber-400">Select a model to start testing</p>
            )}
          </div>

          {/* Run button */}
          <button
            type="button"
            onClick={handleRun}
            disabled={!canRun}
            className={btnPrimary}
          >
            <Play className="h-4 w-4" />
            Run Fuzzer ({selectedAttacks.size} attacks x {selectedClassifiers.size} classifiers)
          </button>
        </div>
      )}

      {/* ── Progress Tab ──────────────────────────────────────── */}
      {tab === 'progress' && (
        <div className="flex flex-col gap-4">
          {/* Summary bar */}
          {summary && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-[var(--muted-foreground)]">
                {summary.completedAttacks}/{summary.totalAttacks} complete
              </span>
              {summary.jailbroken > 0 && (
                <span className="text-red-400 font-medium">{summary.jailbroken} jailbroken</span>
              )}
              {summary.safe > 0 && (
                <span className="text-green-400 font-medium">{summary.safe} safe</span>
              )}
              {summary.failedAttacks > 0 && (
                <span className="text-amber-400 font-medium">{summary.failedAttacks} errors</span>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            {loading && (
              <button type="button" onClick={handleCancel} className={cn(btnSecondary, 'text-red-400 border-red-400/30')}>
                <Square className="h-3.5 w-3.5" /> Cancel
              </button>
            )}
            {report && (
              <>
                <button type="button" onClick={handleExport} className={btnSecondary}>
                  <Download className="h-3.5 w-3.5" /> Export JSON
                </button>
                <button type="button" onClick={() => setTab('results')} className={btnSecondary}>
                  View Results
                </button>
              </>
            )}
          </div>

          {/* Progress log */}
          {progressLog.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {progressLog.map((entry, i) => {
                const attackDef = attackDefs.find((d) => d.id === entry.attackId)
                return (
                  <div
                    key={i}
                    className={cn(
                      'p-2.5 rounded-md border text-sm flex items-start gap-2',
                      entry.status === 'running' ? 'border-[var(--border)] bg-[var(--muted)]' :
                      entry.status === 'jailbroken' ? 'border-red-500/30 bg-red-500/5' :
                      entry.status === 'safe' ? 'border-green-500/30 bg-green-500/5' :
                      'border-amber-500/30 bg-amber-500/5',
                    )}
                  >
                    {entry.status === 'running' ? <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)] shrink-0 mt-0.5" /> :
                     entry.status === 'jailbroken' ? <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" /> :
                     entry.status === 'safe' ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" /> :
                     <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <span className={cn('font-medium', entry.status === 'jailbroken' ? 'text-red-400' : entry.status === 'safe' ? 'text-green-400' : 'text-[var(--foreground)]')}>
                        {attackDef?.name || entry.attackId}
                      </span>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{entry.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : !loading ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
              No fuzzer runs yet. Configure attacks and click Run.
            </p>
          ) : null}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/40 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </div>
      )}

      {/* ── Results Tab ───────────────────────────────────────── */}
      {tab === 'results' && (
        <div className="flex flex-col gap-4">
          {report ? (
            <>
              {/* Summary card */}
              <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Report Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                  {[
                    { label: 'Total', value: report.summary.totalAttacks, color: 'text-[var(--foreground)]' },
                    { label: 'Completed', value: report.summary.completedAttacks, color: 'text-[var(--foreground)]' },
                    { label: 'Jailbroken', value: report.summary.jailbroken, color: 'text-red-400' },
                    { label: 'Safe', value: report.summary.safe, color: 'text-green-400' },
                    { label: 'Success Rate', value: `${(report.summary.successRate * 100).toFixed(0)}%`, color: report.summary.successRate > 0 ? 'text-red-400' : 'text-green-400' },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col">
                      <span className={cn('text-2xl font-bold', item.color)}>{item.value}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-attack results */}
              <div className="space-y-3">
                {report.results.map((result, i) => {
                  const attackDef = attackDefs.find((d) => d.id === result.attackId)
                  return (
                    <div
                      key={i}
                      className={cn(
                        'rounded-md border p-3',
                        result.isJailbroken ? 'border-red-500/30 bg-red-500/5' :
                        result.error ? 'border-amber-500/30 bg-amber-500/5' :
                        'border-[var(--border)] bg-[var(--card)]',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {result.isJailbroken ? <XCircle className="h-4 w-4 text-red-400" /> :
                           result.error ? <AlertCircle className="h-4 w-4 text-amber-400" /> :
                           <CheckCircle2 className="h-4 w-4 text-green-400" />}
                          <span className="text-sm font-semibold text-[var(--foreground)]">
                            {attackDef?.name || result.attackId}
                          </span>
                          <span className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded',
                            attackDef?.complexity === 'simple' ? 'bg-gray-500/20 text-gray-400' :
                            attackDef?.complexity === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-purple-500/20 text-purple-400',
                          )}>
                            {attackDef?.complexity}
                          </span>
                        </div>
                        {result.isJailbroken ? (
                          <span className="text-xs font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded">JAILBROKEN</span>
                        ) : result.error ? (
                          <span className="text-xs text-amber-400">ERROR</span>
                        ) : (
                          <span className="text-xs text-green-400">SAFE</span>
                        )}
                      </div>

                      {/* Classification details */}
                      {Object.entries(result.classifications).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {Object.entries(result.classifications).map(([clfId, clf]) => {
                            const clfDef = classifierDefs.find((c) => c.id === clfId)
                            return (
                              <span
                                key={clfId}
                                className={cn(
                                  'text-[10px] px-1.5 py-0.5 rounded',
                                  clf.isJailbreak ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400',
                                )}
                              >
                                {clfDef?.name || clfId}: {clf.isJailbreak ? 'Yes' : 'No'} ({(clf.score * 100).toFixed(0)}%)
                              </span>
                            )
                          })}
                        </div>
                      )}

                      {/* Response preview */}
                      {result.response && (
                        <div className="mt-2">
                          <label className="text-[10px] text-[var(--muted-foreground)]">Response</label>
                          <textarea
                            readOnly
                            value={result.response.slice(0, 500) + (result.response.length > 500 ? '...' : '')}
                            className={cn(inputCls, 'min-h-[60px] resize-y text-xs mt-1')}
                            rows={3}
                          />
                          <div className="flex gap-2 mt-1">
                            <button type="button" onClick={() => flash(`res-${i}`, result.response)} className="text-xs text-[var(--primary)] hover:underline">
                              {copied === `res-${i}` ? 'Copied!' : 'Copy response'}
                            </button>
                            {result.transformedPrompt && result.transformedPrompt !== result.originalPrompt && (
                              <button type="button" onClick={() => flash(`tp-${i}`, result.transformedPrompt)} className="text-xs text-[var(--muted-foreground)] hover:underline">
                                Copy transformed prompt
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {result.error && (
                        <p className="text-xs text-amber-400 mt-1">{result.error}</p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Export */}
              <div className="flex gap-2">
                <button type="button" onClick={handleExport} className={btnSecondary}>
                  <Download className="h-3.5 w-3.5" /> Export JSON Report
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
              No results yet. Run the fuzzer first.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
