'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { useAIConfig } from '@/hooks/useAIConfig'
import { cn } from '@/lib/utils'
import { isWailsMode } from '@/lib/services/chatCompletion'
import { CATEGORIES, BENCHMARK_DATA, runGuardrailsTest } from '@/lib/guardrails'
import { ModelConfigPanel } from '@/components/shared/ModelConfigPanel'
import type { GuardrailsReport } from '@/lib/guardrails'

const TOOL_ID = 'guardrails'

export default function Tool() {
  const t = useTranslations('guardrails')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const aiConfig = useAIConfig(TOOL_ID)

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(CATEGORIES.map((c) => c.id)))
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number; goal: string } | null>(null)
  const [report, setReport] = useState<GuardrailsReport | null>(null)
  const [error, setError] = useState('')
  const [temperature, setTemperature] = useState(0)
  const [maxTokens, setMaxTokens] = useState(500)
  const abortRef = useRef<AbortController | null>(null)

  const effectiveModel = useMemo(() => {
    if (aiConfig.availableModels.length === 0) return ''
    if (aiConfig.availableModels.some((m) => m === aiConfig.model)) return aiConfig.model
    return aiConfig.availableModels[0]
  }, [aiConfig.model, aiConfig.availableModels])

  const toggleCategory = useCallback((id: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => setSelectedCategories(new Set(CATEGORIES.map((c) => c.id))), [])
  const deselectAll = useCallback(() => setSelectedCategories(new Set()), [])

  const entries = useMemo(
    () => BENCHMARK_DATA.filter((e) => selectedCategories.has(e.category)),
    [selectedCategories],
  )

  const run = useCallback(async () => {
    if (entries.length === 0) { setError(t('noEntriesSelected')); return }
    if (!effectiveModel) { setError(t('noProvider')); return }

    setRunning(true)
    setError('')
    setReport(null)

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const result = await runGuardrailsTest(
        entries,
        effectiveModel,
        aiConfig.provider?.id,
        TOOL_ID,
        (done, total, entry) => setProgress({ done, total, goal: entry.goal }),
        abort.signal,
        { temperature, maxTokens },
      )
      if (!abort.signal.aborted) setReport(result)
    } catch (e: any) {
      if (!abort.signal.aborted) setError(e.message || 'Test failed')
    } finally {
      setRunning(false)
      setProgress(null)
      abortRef.current = null
    }
  }, [entries, effectiveModel, aiConfig.provider, temperature, maxTokens, t])

  const stop = useCallback(() => { abortRef.current?.abort() }, [])

  const exportReport = useCallback(() => {
    if (!report) return
    const json = JSON.stringify(report, null, 2)
    copyToClipboard(json)
    addHistoryItem(json, 'Guardrails')
  }, [report, copyToClipboard, addHistoryItem])

  // ── styles
  const btnPrimary = 'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50'
  const panelCls = 'rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5'
  const labelCls = 'text-xs font-medium text-[var(--muted-foreground)] mb-1'

  // ── radar chart data
  const radarPoints = useMemo(() => {
    if (!report) return []
    const cats = CATEGORIES.filter((c) => report.byCategory[c.id])
    if (cats.length < 3) return []
    const cx = 150, cy = 150, r = 110
    const points = cats.map((cat, i) => {
      const angle = (Math.PI * 2 * i) / cats.length - Math.PI / 2
      const val = report.byCategory[cat.id]?.passRate ?? 0
      return { x: cx + r * val * Math.cos(angle), y: cy + r * val * Math.sin(angle), cat, val }
    })
    return { points, cats, cx, cy, r }
  }, [report])

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{t('title')}</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">{t('description')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left: Categories + Run */}
        <section className={cn(panelCls, 'lg:col-span-3')}>
          <div className="flex items-center justify-between mb-3">
            <label className={labelCls}>{t('category')}</label>
            <div className="flex gap-2">
              <button className="text-xs text-[var(--primary)] hover:underline" onClick={selectAll}>{t('selectAll')}</button>
              <button className="text-xs text-[var(--muted-foreground)] hover:underline" onClick={deselectAll}>{t('deselectAll')}</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {CATEGORIES.map((cat) => {
              const count = BENCHMARK_DATA.filter((e) => e.category === cat.id).length
              const selected = selectedCategories.has(cat.id)
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-colors text-left',
                    selected
                      ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--foreground)]'
                      : 'bg-[var(--muted)] border-[var(--border)] text-[var(--muted-foreground)]',
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', selected ? 'bg-[var(--primary)]' : 'bg-[var(--muted-foreground)]')} />
                  <span className="flex-1">{cat.name}</span>
                  <span className="text-[10px] opacity-60">({count})</span>
                </button>
              )
            })}
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mb-3">
            {entries.length} prompts selected
          </div>
          <div className="flex gap-2">
            {!running ? (
              <button className={btnPrimary} onClick={run} disabled={entries.length === 0}>
                {t('runTest')}
              </button>
            ) : (
              <button className={btnPrimary} onClick={stop}>
                {t('stopTest')}
              </button>
            )}
            {report && (
              <button className={cn('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium border bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)] hover:bg-[var(--accent)] transition-colors')} onClick={exportReport}>
                {t('exportReport')}
              </button>
            )}
          </div>
          {progress && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1">
                <span>{t('progress', { current: progress.done + 1, total: progress.total })}</span>
                <span>{Math.round(((progress.done + 1) / progress.total) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--muted)]">
                <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${((progress.done + 1) / progress.total) * 100}%` }} />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 truncate">{progress.goal}</p>
            </div>
          )}
        </section>

        <ModelConfigPanel aiConfig={aiConfig} temperature={temperature} onTemperatureChange={setTemperature} maxTokens={maxTokens} onMaxTokensChange={setMaxTokens} />
      </div>

      {error && <div className="p-3 rounded-md bg-red-500/10 border border-red-500/40 text-red-400 text-sm">{error}</div>}

      {/* Results */}
      {report && (
        <div className="flex flex-col gap-4">
          {/* Radar Chart */}
          {radarPoints && 'points' in radarPoints && radarPoints.points.length >= 3 && (
            <div className={cn(panelCls, 'flex justify-center')}>
              <svg width="300" height="300" viewBox="0 0 300 300">
                {[0.25, 0.5, 0.75, 1].map((v) => (
                  <circle key={v} cx={radarPoints.cx} cy={radarPoints.cy} r={radarPoints.r * v} fill="none" stroke="var(--border)" strokeWidth="1" />
                ))}
                {radarPoints.cats.map((_, i) => {
                  const angle = (Math.PI * 2 * i) / radarPoints.cats.length - Math.PI / 2
                  return (
                    <line key={i} x1={radarPoints.cx} y1={radarPoints.cy}
                      x2={radarPoints.cx + radarPoints.r * Math.cos(angle)}
                      y2={radarPoints.cy + radarPoints.r * Math.sin(angle)}
                      stroke="var(--border)" strokeWidth="1" />
                  )
                })}
                <polygon
                  points={radarPoints.points.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="var(--primary)" fillOpacity="0.2" stroke="var(--primary)" strokeWidth="2"
                />
                {radarPoints.points.map((p, i) => {
                  const angle = (Math.PI * 2 * i) / radarPoints.cats.length - Math.PI / 2
                  const lx = radarPoints.cx + (radarPoints.r + 20) * Math.cos(angle)
                  const ly = radarPoints.cy + (radarPoints.r + 20) * Math.sin(angle)
                  return (
                    <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                      fill="var(--muted-foreground)" fontSize="10">
                      {p.cat.name} ({Math.round(p.val * 100)}%)
                    </text>
                  )
                })}
              </svg>
            </div>
          )}

          {/* Summary Table */}
          <div className={panelCls}>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">{t('results')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 px-3 text-[var(--muted-foreground)] font-medium">{t('category')}</th>
                    <th className="text-center py-2 px-3 text-[var(--muted-foreground)] font-medium">{t('total')}</th>
                    <th className="text-center py-2 px-3 text-[var(--muted-foreground)] font-medium">{t('passed')}</th>
                    <th className="text-center py-2 px-3 text-[var(--muted-foreground)] font-medium">{t('failed')}</th>
                    <th className="text-center py-2 px-3 text-[var(--muted-foreground)] font-medium">{t('passRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.filter((c) => report.byCategory[c.id]).map((cat) => {
                    const stats = report.byCategory[cat.id]
                    const rate = Math.round(stats.passRate * 100)
                    const color = rate >= 80 ? 'text-green-500' : rate >= 50 ? 'text-yellow-500' : 'text-red-500'
                    return (
                      <tr key={cat.id} className="border-b border-[var(--border)]/50">
                        <td className="py-2 px-3 text-[var(--foreground)]">{cat.name}</td>
                        <td className="text-center py-2 px-3">{stats.total}</td>
                        <td className="text-center py-2 px-3 text-green-500">{stats.passed}</td>
                        <td className="text-center py-2 px-3 text-red-400">{stats.refused}</td>
                        <td className={cn('text-center py-2 px-3 font-medium', color)}>{rate}%</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-medium">
                    <td className="py-2 px-3">Overall</td>
                    <td className="text-center py-2 px-3">{report.totalTested}</td>
                    <td className="text-center py-2 px-3 text-green-500">{report.results.filter((r) => !r.isRefused).length}</td>
                    <td className="text-center py-2 px-3 text-red-400">{report.results.filter((r) => r.isRefused).length}</td>
                    <td className="text-center py-2 px-3">{Math.round(report.overallPassRate * 100)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {!report && !running && !error && (
        <div className={cn(panelCls, 'flex flex-col items-center gap-2 py-8 text-center text-[var(--muted-foreground)]')}>
          <p>{t('noResults')}</p>
        </div>
      )}
    </div>
  )
}
