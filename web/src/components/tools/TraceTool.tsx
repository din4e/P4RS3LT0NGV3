'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Github, FileText, Play, Square, RotateCcw, ChevronDown, ChevronRight, Copy, Check, Target, Trophy } from 'lucide-react'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { useAIConfig } from '@/hooks/useAIConfig'
import { cn } from '@/lib/utils'
import { chatCompletion } from '@/lib/services/chatCompletion'
import { ModelConfigPanel } from '@/components/shared/ModelConfigPanel'
import {
  runTrace,
  renderScenario,
  DEFAULT_HYPERPARAMS,
  type TraceHyperparams,
  type Scenario,
  type IterationLog,
} from '@/lib/trace'

const TOOL_ID = 'trace'
const REPO_URL = 'https://github.com/ZJU-LLM-Safety/TRACE'
const PAPER_URL = 'https://arxiv.org/abs/2605.30883'

function humanize(id: string): string {
  return id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function Tool() {
  const t = useTranslations('trace')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const aiConfig = useAIConfig(TOOL_ID)

  const [goal, setGoal] = useState('')
  const [decompose, setDecompose] = useState(false)
  const [useMemory, setUseMemory] = useState(true)
  const [maxIterations, setMaxIterations] = useState(DEFAULT_HYPERPARAMS.maxIterations)
  const [tauMem, setTauMem] = useState(DEFAULT_HYPERPARAMS.tauMem)
  const [alpha, setAlpha] = useState(DEFAULT_HYPERPARAMS.alpha)
  const [gamma, setGamma] = useState(DEFAULT_HYPERPARAMS.gamma)
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2000)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const [logs, setLogs] = useState<IterationLog[]>([])
  const [bestScenario, setBestScenario] = useState<Scenario | null>(null)
  const [bestPrompt, setBestPrompt] = useState('')
  const [bestRho, setBestRho] = useState(-1)
  const [jailbroken, setJailbroken] = useState(false)
  const [iterations, setIterations] = useState(0)
  const [bestResponse, setBestResponse] = useState('')
  const [bestLoading, setBestLoading] = useState(false)

  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const abortRef = useRef<AbortController | null>(null)

  const effectiveModel = useMemo(() => {
    if (aiConfig.availableModels.length === 0) return ''
    if (aiConfig.availableModels.some((m) => m === aiConfig.model)) return aiConfig.model
    return aiConfig.availableModels[0]
  }, [aiConfig.model, aiConfig.availableModels])

  const callLLM = useCallback(
    async (
      msgs: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
      opts?: { temperature?: number; maxTokens?: number },
    ) => {
      return chatCompletion({
        model: effectiveModel,
        messages: msgs,
        temperature: opts?.temperature ?? temperature,
        maxTokens: opts?.maxTokens ?? maxTokens,
        toolId: TOOL_ID,
        providerId: aiConfig.provider?.id,
      })
    },
    [effectiveModel, aiConfig.provider, temperature, maxTokens],
  )

  const actionLabel = useCallback(
    (id: string) => {
      const key = `actions.${id}` as const
      try {
        // next-intl: t.has() checks key existence without throwing.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((t as any).has(key)) return t(key as any)
      } catch {
        /* fall through */
      }
      return humanize(id)
    },
    [t],
  )

  const flash = useCallback(
    (key: string, text: string) => {
      copyToClipboard(text)
      addHistoryItem(text, 'TRACE')
      setCopied(key)
      setTimeout(() => setCopied(null), 1200)
    },
    [copyToClipboard, addHistoryItem],
  )

  const run = useCallback(async () => {
    if (!goal.trim()) {
      setError(t('noGoal'))
      return
    }
    if (!aiConfig.isConfigured) {
      setError(t('noProvider'))
      return
    }

    setRunning(true)
    setError('')
    setLogs([])
    setBestScenario(null)
    setBestPrompt('')
    setBestRho(-1)
    setJailbroken(false)
    setIterations(0)
    setBestResponse('')
    setExpanded({})

    const abort = new AbortController()
    abortRef.current = abort

    const hyper: TraceHyperparams = {
      ...DEFAULT_HYPERPARAMS,
      maxIterations,
      tauMem,
      alpha,
      gamma,
    }

    try {
      await runTrace(
        {
          goal: goal.trim(),
          hyper,
          attackerLLM: callLLM,
          targetLLM: callLLM,
          judgeLLM: callLLM,
          decompose,
          useMemory,
        },
        {
          onInit: ({ scenario, rho, task, subtasks }) => {
            setBestScenario(scenario)
            setBestRho(rho)
            setBestPrompt(renderScenario(scenario, task))
            if (subtasks) {
              setLogs((prev) => [
                ...prev,
                {
                  iter: -1,
                  action: 'init',
                  rhoBefore: 0,
                  rhoAfter: rho,
                  delta: rho,
                  score: 0,
                  refusal: 0,
                  response: `subtasks: ${subtasks.length}`,
                  scenario,
                },
              ])
            }
          },
          onIteration: (log) => setLogs((prev) => [...prev, log]),
          onBestUpdate: (scenario, rho, prompt) => {
            setBestScenario(scenario)
            setBestRho(rho)
            setBestPrompt(prompt)
          },
          onComplete: (result) => {
            setBestScenario(result.bestScenario)
            setBestPrompt(result.bestPrompt)
            setBestRho(result.bestRho)
            setJailbroken(result.jailbroken)
            setIterations(result.iterations)
          },
          onError: (msg) => setError(msg),
        },
        abort.signal,
      )
    } catch (e) {
      if (!abort.signal.aborted) setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }, [goal, aiConfig.isConfigured, maxIterations, tauMem, alpha, gamma, decompose, useMemory, callLLM, t])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setRunning(false)
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setRunning(false)
    setLogs([])
    setBestScenario(null)
    setBestPrompt('')
    setBestRho(-1)
    setJailbroken(false)
    setIterations(0)
    setBestResponse('')
    setError('')
    setExpanded({})
  }, [])

  const runBest = useCallback(async () => {
    if (!bestPrompt || !aiConfig.isConfigured) return
    setBestLoading(true)
    setError('')
    try {
      const resp = await callLLM([{ role: 'user', content: bestPrompt }])
      setBestResponse(resp)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBestLoading(false)
    }
  }, [bestPrompt, aiConfig.isConfigured, callLLM])

  // ── styles
  const inputCls =
    'w-full rounded-md px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'
  const selectCls =
    'w-full rounded-md px-3 py-2 text-sm outline-none transition-colors bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'
  const btnPrimary =
    'inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50'
  const panelCls = 'rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5'
  const labelCls = 'text-xs font-medium text-[var(--muted-foreground)] mb-1'
  const chipCls =
    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors'

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{t('title')}</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">{t('description')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className={chipCls} title={REPO_URL}>
              <Github className="w-3.5 h-3.5" />
              {t('repoLabel')}
            </a>
            <a href={PAPER_URL} target="_blank" rel="noopener noreferrer" className={chipCls} title={PAPER_URL}>
              <FileText className="w-3.5 h-3.5" />
              {t('paperLabel')}
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Main panel */}
        <section className={cn(panelCls, 'lg:col-span-3 flex flex-col gap-3')}>
          {/* Goal */}
          <div className="flex flex-col gap-1">
            <label className={labelCls}>{t('goalLabel')}</label>
            <textarea
              className={cn(inputCls, 'min-h-[72px] resize-y')}
              placeholder={t('goalPlaceholder')}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              disabled={running}
            />
          </div>

          {/* Advanced */}
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            onClick={() => setAdvancedOpen((v) => !v)}
          >
            {advancedOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {t('advanced')}
          </button>
          {advancedOpen && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>{t('maxIterations')}</label>
                <input
                  className={inputCls}
                  type="number"
                  min={1}
                  max={20}
                  value={maxIterations}
                  onChange={(e) => setMaxIterations(Math.max(1, Math.min(20, Number(e.target.value))))}
                  disabled={running}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>{t('threshold')}</label>
                <input
                  className={inputCls}
                  type="number"
                  min={0.5}
                  max={1}
                  step={0.05}
                  value={tauMem}
                  onChange={(e) => setTauMem(Math.max(0.5, Math.min(1, Number(e.target.value))))}
                  disabled={running}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>
                  {t('alpha')}: {alpha.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.05}
                  value={alpha}
                  onChange={(e) => setAlpha(Number(e.target.value))}
                  className="accent-[var(--primary)]"
                  disabled={running}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>
                  {t('gamma')}: {gamma.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={0.99}
                  step={0.01}
                  value={gamma}
                  onChange={(e) => setGamma(Number(e.target.value))}
                  className="accent-[var(--primary)]"
                  disabled={running}
                />
              </div>
              <label className="col-span-2 flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
                <input type="checkbox" checked={decompose} onChange={(e) => setDecompose(e.target.checked)} disabled={running} />
                {t('decompose')}
                <span className="text-[var(--muted-foreground)]">— {t('decomposeHint')}</span>
              </label>
              <label className="col-span-2 flex items-center gap-2 text-xs text-[var(--foreground)] cursor-pointer">
                <input type="checkbox" checked={useMemory} onChange={(e) => setUseMemory(e.target.checked)} disabled={running} />
                {t('memory')}
                <span className="text-[var(--muted-foreground)]">— {t('memoryHint')}</span>
              </label>
            </div>
          )}

          {/* Trajectory */}
          <div className="flex-1 min-h-[200px] max-h-[440px] overflow-y-auto space-y-2 pr-1">
            {logs.length === 0 && !running && (
              <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)] text-sm gap-2 py-8">
                <p>{t('emptyState')}</p>
                <p className="text-xs">{t('emptyHint')}</p>
              </div>
            )}
            {logs.map((log, idx) => {
              const isInit = log.action === 'init'
              const label = isInit ? 'init' : actionLabel(log.action)
              const isOpen = expanded[idx] === true
              const deltaPos = log.delta >= 0
              return (
                <div key={idx} className="rounded-md border border-[var(--border)] bg-[var(--muted)]/40 p-2.5">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 text-left"
                    onClick={() => setExpanded((p) => ({ ...p, [idx]: !isOpen }))}
                  >
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)] w-8 shrink-0">
                      {isInit ? '•' : `#${log.iter + 1}`}
                    </span>
                    <span className="text-xs font-medium text-[var(--foreground)] truncate">{label}</span>
                    <span className="ml-auto flex items-center gap-2 text-[10px]">
                      <span className="font-mono text-[var(--muted-foreground)]">
                        {log.rhoBefore.toFixed(2)} → {log.rhoAfter.toFixed(2)}
                      </span>
                      {!isInit && (
                        <span className={cn('font-mono', deltaPos ? 'text-green-500' : 'text-red-400')}>
                          {deltaPos ? '+' : ''}
                          {log.delta.toFixed(2)}
                        </span>
                      )}
                      {log.refusal > 0 && (
                        <span className="rounded bg-red-500/15 text-red-400 px-1 py-0.5">{t('refused')}</span>
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="mt-2 space-y-1.5 pl-10">
                      {!isInit && (
                        <div className="flex gap-3 text-[10px] text-[var(--muted-foreground)]">
                          <span>
                            {t('score')}: <span className="font-mono">{log.score.toFixed(2)}</span>
                          </span>
                          <span>
                            {t('refusal')}: <span className="font-mono">{log.refusal.toFixed(2)}</span>
                          </span>
                        </div>
                      )}
                      <pre className="whitespace-pre-wrap break-words rounded bg-[var(--background)] border border-[var(--border)] p-2 text-[11px] font-mono text-[var(--foreground)] max-h-40 overflow-auto">
                        {isInit ? log.response : log.response.slice(0, 800)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
            {running && <div className="text-center text-xs text-[var(--muted-foreground)] animate-pulse">{t('running')}</div>}
          </div>

          {/* Best scenario */}
          {bestScenario && (
            <div className="rounded-md border border-[var(--primary)]/40 bg-[var(--primary)]/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-xs font-semibold text-[var(--foreground)]">{t('bestScenario')}</span>
                <span className="ml-auto text-xs font-mono text-[var(--primary)]">ρ = {bestRho.toFixed(2)}</span>
                <button
                  type="button"
                  className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                  onClick={() => flash('best', bestPrompt)}
                  title={tc('copy')}
                >
                  {copied === 'best' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="whitespace-pre-wrap break-words rounded bg-[var(--background)] border border-[var(--border)] p-2 text-[11px] font-mono text-[var(--foreground)] max-h-48 overflow-auto">
                {bestPrompt}
              </pre>
              <div className="flex items-center gap-2 mt-2">
                <button type="button" className={cn(btnPrimary, 'px-3 py-1.5 text-xs')} onClick={runBest} disabled={bestLoading || running}>
                  <Target className="w-3.5 h-3.5" />
                  {bestLoading ? t('running') : t('runBest')}
                </button>
              </div>
              {bestResponse && (
                <pre className="whitespace-pre-wrap break-words rounded bg-[var(--background)] border border-[var(--border)] p-2 mt-2 text-[11px] font-mono text-[var(--foreground)] max-h-48 overflow-auto">
                  {bestResponse}
                </pre>
              )}
            </div>
          )}
        </section>

        {/* Right column: config + controls */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <ModelConfigPanel
            aiConfig={aiConfig}
            temperature={temperature}
            onTemperatureChange={setTemperature}
            maxTokens={maxTokens}
            onMaxTokensChange={setMaxTokens}
          />

          <section className={cn(panelCls, 'flex flex-col gap-3')}>
            {!running ? (
              <button type="button" className={btnPrimary} onClick={run} disabled={!aiConfig.isConfigured || !goal.trim()}>
                <Play className="w-4 h-4" />
                {t('run')}
              </button>
            ) : (
              <button type="button" className={btnPrimary} onClick={stop}>
                <Square className="w-4 h-4" />
                {t('stop')}
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium border bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)] hover:bg-[var(--accent)] transition-colors"
              onClick={reset}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('reset')}
            </button>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Stat label={t('statsBest')} value={bestRho >= 0 ? bestRho.toFixed(2) : '—'} />
              <Stat label={t('statsIterations')} value={String(iterations)} />
              <Stat
                label={t('statsStatus')}
                value={jailbroken ? t('jailbroken') : bestRho >= 0 ? t('notJailbroken') : '—'}
                accent={jailbroken ? 'green' : bestRho >= 0 ? 'muted' : 'none'}
              />
              <Stat label={tc('model')} value={effectiveModel ? effectiveModel.split('/').pop() ?? effectiveModel : '—'} />
            </div>

            <p className="mt-auto pt-2 text-[11px] text-[var(--muted-foreground)] leading-relaxed">{t('about')}</p>
          </section>
        </div>
      </div>

      {error && <div className="p-3 rounded-md bg-red-500/10 border border-red-500/40 text-red-400 text-sm">{error}</div>}
    </div>
  )
}

function Stat({ label, value, accent = 'none' }: { label: string; value: string; accent?: 'none' | 'green' | 'muted' }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/40 px-2.5 py-1.5">
      <div className="text-[10px] text-[var(--muted-foreground)] truncate">{label}</div>
      <div
        className={cn(
          'text-xs font-medium truncate',
          accent === 'green' && 'text-green-500',
          accent === 'muted' && 'text-[var(--muted-foreground)]',
          accent === 'none' && 'text-[var(--foreground)]',
        )}
      >
        {value}
      </div>
    </div>
  )
}
