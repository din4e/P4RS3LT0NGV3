'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { useAIConfig } from '@/hooks/useAIConfig'
import { cn } from '@/lib/utils'
import { BENCHMARK_DATASETS } from '@/lib/benchmark/datasets'
import { runBenchmark } from '@/lib/benchmark/runner'
import { computeStats } from '@/lib/benchmark/statistics'
import { ModelConfigPanel } from '@/components/shared/ModelConfigPanel'
import type { BenchmarkRun } from '@/lib/benchmark'

const TOOL_ID = 'benchmark'

export default function Tool() {
  const t = useTranslations('benchmark')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const aiConfig = useAIConfig(TOOL_ID)

  const [selectedDataset, setSelectedDataset] = useState(BENCHMARK_DATASETS[0].name)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [runResult, setRunResult] = useState<BenchmarkRun | null>(null)
  const [error, setError] = useState('')
  const [temperature, setTemperature] = useState(0)
  const [maxTokens, setMaxTokens] = useState(500)
  const abortRef = useRef<AbortController | null>(null)

  const dataset = useMemo(() => BENCHMARK_DATASETS.find((d) => d.name === selectedDataset) || BENCHMARK_DATASETS[0], [selectedDataset])

  const effectiveModel = useMemo(() => {
    if (aiConfig.availableModels.length === 0) return ''
    if (aiConfig.availableModels.some((m) => m === aiConfig.model)) return aiConfig.model
    return aiConfig.availableModels[0]
  }, [aiConfig.model, aiConfig.availableModels])

  const run = useCallback(async () => {
    if (!effectiveModel) return
    setRunning(true)
    setError('')
    setRunResult(null)

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const result = await runBenchmark(
        dataset.entries,
        dataset.name,
        effectiveModel,
        aiConfig.provider?.id,
        (done: number, total: number) => setProgress({ done, total }),
        abort.signal,
        { temperature, maxTokens },
      )
      if (!abort.signal.aborted) setRunResult(result)
    } catch (e: any) {
      if (!abort.signal.aborted) setError(e.message || 'Benchmark failed')
    } finally {
      setRunning(false)
      setProgress(null)
      abortRef.current = null
    }
  }, [dataset, effectiveModel, aiConfig.provider, temperature, maxTokens])

  const stop = useCallback(() => { abortRef.current?.abort() }, [])

  const stats = useMemo(() => runResult ? computeStats(runResult) : null, [runResult])

  const exportResults = useCallback(() => {
    if (!runResult) return
    const json = JSON.stringify(runResult, null, 2)
    copyToClipboard(json)
    addHistoryItem(json, 'Benchmark')
  }, [runResult, copyToClipboard, addHistoryItem])

  // ── styles
  const selectCls = 'w-full rounded-md px-3 py-2 text-sm outline-none transition-colors bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'
  const btnPrimary = 'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50'
  const panelCls = 'rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5'
  const labelCls = 'text-xs font-medium text-[var(--muted-foreground)] mb-1'

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{t('title')}</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">{t('description')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className={cn(panelCls, 'lg:col-span-3 flex flex-col gap-3')}>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>{t('dataset')}</label>
            <select className={selectCls} value={selectedDataset} onChange={(e) => setSelectedDataset(e.target.value)}>
              {BENCHMARK_DATASETS.map((d) => (
                <option key={d.name} value={d.name}>{d.name} — {d.description}</option>
              ))}
            </select>
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">
            {dataset.entries.length} {t('prompts')}
          </div>
          <div className="flex gap-2">
            {!running ? (
              <button className={btnPrimary} onClick={run} disabled={!aiConfig.isConfigured}>
                {t('runBenchmark')}
              </button>
            ) : (
              <button className={btnPrimary} onClick={stop}>{t('stopBenchmark')}</button>
            )}
            {runResult && (
              <button className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium border bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)] hover:bg-[var(--accent)] transition-colors')} onClick={exportResults}>
                {t('exportResults')}
              </button>
            )}
          </div>
          {progress && (
            <div className="mt-1">
              <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1">
                <span>{t('progress', { current: progress.done + 1, total: progress.total })}</span>
                <span>{Math.round(((progress.done + 1) / progress.total) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--muted)]">
                <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${((progress.done + 1) / progress.total) * 100}%` }} />
              </div>
            </div>
          )}
        </section>

        <ModelConfigPanel aiConfig={aiConfig} temperature={temperature} onTemperatureChange={setTemperature} maxTokens={maxTokens} onMaxTokensChange={setMaxTokens} />
      </div>

      {error && <div className="p-3 rounded-md bg-red-500/10 border border-red-500/40 text-red-400 text-sm">{error}</div>}

      {runResult && stats && (
        <div className="flex flex-col gap-4">
          {/* ASR Overview */}
          <div className={panelCls}>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('attackSuccessRate')}</h3>
            <div className="flex items-center gap-6">
              <div className="text-3xl font-bold text-red-500">{Math.round(runResult.asr * 100)}%</div>
              <div className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
                <span>{t('successfulAttacks')}: {runResult.successfulAttacks} / {runResult.totalPrompts}</span>
                <span>{t('ci95')}: [{Math.round(stats.ciLow * 100)}%, {Math.round(stats.ciHigh * 100)}%]</span>
                <span>{t('duration')}: {(stats.duration / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </div>

          {/* By Category */}
          {Object.keys(stats.byCategory).length > 0 && (
            <div className={panelCls}>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('byCategory')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-2 px-3 text-[var(--muted-foreground)] font-medium">{t('category')}</th>
                      <th className="text-center py-2 px-3 text-[var(--muted-foreground)] font-medium">{t('total')}</th>
                      <th className="text-center py-2 px-3 text-[var(--muted-foreground)] font-medium">{t('attacked')}</th>
                      <th className="text-center py-2 px-3 text-[var(--muted-foreground)] font-medium">{t('refused')}</th>
                      <th className="text-center py-2 px-3 text-[var(--muted-foreground)] font-medium">ASR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.byCategory).map(([cat, s]) => {
                      const rate = Math.round(s.asr * 100)
                      const color = rate >= 60 ? 'text-red-500' : rate >= 30 ? 'text-yellow-500' : 'text-green-500'
                      return (
                        <tr key={cat} className="border-b border-[var(--border)]/50">
                          <td className="py-2 px-3 text-[var(--foreground)] capitalize">{cat}</td>
                          <td className="text-center py-2 px-3">{s.total}</td>
                          <td className="text-center py-2 px-3 text-red-400">{s.success}</td>
                          <td className="text-center py-2 px-3 text-green-500">{s.total - s.success}</td>
                          <td className={cn('text-center py-2 px-3 font-medium', color)}>{rate}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Per-prompt results */}
          <div className={panelCls}>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('promptResults')}</h3>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {runResult.results.map((r: { entry: { prompt: string }; isRefused: boolean; error?: string }, i: number) => (
                <div key={i} className={cn('flex items-start gap-2 px-3 py-2 rounded text-sm', r.isRefused ? 'bg-green-500/5' : 'bg-red-500/5')}>
                  <span className={cn('shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded', r.isRefused ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                    {r.isRefused ? t('refused') : t('attackSuccess')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--foreground)] truncate">{r.entry.prompt}</p>
                    {r.error && <p className="text-xs text-red-400 mt-0.5">{r.error}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!runResult && !running && !error && (
        <div className={cn(panelCls, 'flex flex-col items-center gap-2 py-8 text-center text-[var(--muted-foreground)]')}>
          <p>{t('noResults')}</p>
        </div>
      )}
    </div>
  )
}
