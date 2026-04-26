'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { useAIConfig } from '@/hooks/useAIConfig'
import { cn } from '@/lib/utils'
import { downloadFile } from '@/lib/wails'
import { CATEGORIES, BENCHMARK_DATA, runGuardrailsTest } from '@/lib/guardrails'
import { ModelConfigPanel } from '@/components/shared/ModelConfigPanel'
import type { GuardrailsReport } from '@/lib/guardrails'

const TOOL_ID = 'guardrails'
const STORAGE_KEY = 'guardrails-custom-prompts'

function loadCustomPrompts(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCustomPrompts(prompts: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts))
}

function ts() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

function buildMarkdown(report: GuardrailsReport): string {
  const lines: string[] = [
    '# Guardrails Test Report',
    '',
    `- **Model**: ${report.meta?.model ?? 'N/A'}`,
    `- **Provider**: ${report.meta?.provider ?? 'N/A'}`,
    `- **Temperature**: ${report.meta?.temperature ?? 0}`,
    `- **Max Tokens**: ${report.meta?.maxTokens ?? 500}`,
    `- **Overall Pass Rate**: ${Math.round(report.overallPassRate * 100)}%`,
    `- **Total Tested**: ${report.totalTested}`,
    `- **Started**: ${new Date(report.startedAt).toISOString()}`,
    `- **Completed**: ${new Date(report.completedAt).toISOString()}`,
    '',
    '## Summary by Category',
    '',
    '| Category | Total | Passed | Failed | Pass Rate |',
    '|----------|-------|--------|--------|-----------|',
  ]
  for (const cat of CATEGORIES) {
    const s = report.byCategory[cat.id]
    if (!s) continue
    lines.push(`| ${cat.name} | ${s.total} | ${s.passed} | ${s.refused} | ${Math.round(s.passRate * 100)}% |`)
  }
  const totalPassed = report.results.filter(r => !r.isRefused).length
  const totalRefused = report.results.filter(r => r.isRefused).length
  lines.push(`| **Overall** | **${report.totalTested}** | **${totalPassed}** | **${totalRefused}** | **${Math.round(report.overallPassRate * 100)}%** |`)

  lines.push('', '## Detailed Results', '')
  for (const r of report.results) {
    const status = r.isRefused ? 'BLOCKED' : 'PASSED'
    lines.push(`### [${status}] ${r.entry.category} — ${r.entry.goal.slice(0, 80)}`)
    if (r.error) lines.push(`> Error: ${r.error}`)
    lines.push('', `**Response**: ${r.response || '(empty)'}`, '')
  }
  return lines.join('\n')
}

function buildHtml(report: GuardrailsReport): string {
  const catRows = CATEGORIES
    .filter(c => report.byCategory[c.id])
    .map(c => {
      const s = report.byCategory[c.id]
      const rate = Math.round(s.passRate * 100)
      const color = rate >= 80 ? '#22c55e' : rate >= 50 ? '#eab308' : '#ef4444'
      return `<tr><td>${c.name}</td><td style="text-align:center">${s.total}</td><td style="text-align:center;color:#22c55e">${s.passed}</td><td style="text-align:center;color:#ef4444">${s.refused}</td><td style="text-align:center;font-weight:600;color:${color}">${rate}%</td></tr>`
    }).join('\n')

  const totalPassed = report.results.filter(r => !r.isRefused).length
  const totalRefused = report.results.filter(r => r.isRefused).length

  const detailRows = report.results.map(r => {
    const badge = r.isRefused
      ? '<span style="background:#fecaca;color:#991b1b;padding:2px 8px;border-radius:4px;font-size:12px">BLOCKED</span>'
      : '<span style="background:#bbf7d0;color:#166534;padding:2px 8px;border-radius:4px;font-size:12px">PASSED</span>'
    return `<tr><td>${badge}</td><td>${r.entry.category}</td><td>${r.entry.goal.slice(0, 100)}</td><td style="max-width:400px;word-break:break-word;font-size:13px">${r.error ? `<em style="color:#ef4444">${r.error}</em>` : (r.response || '(empty)').slice(0, 300)}</td></tr>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Guardrails Report</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:960px;margin:2em auto;padding:0 1em;color:#1a1a1a;background:#fff}
  h1{font-size:1.5rem;border-bottom:2px solid #e5e7eb;padding-bottom:.5rem}
  table{width:100%;border-collapse:collapse;margin:1em 0}
  th,td{padding:8px 12px;border:1px solid #e5e7eb;text-align:left}
  th{background:#f9fafb;font-weight:600;font-size:13px}
  .meta{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:.5em 1.5em;margin:1em 0;font-size:14px}
  .meta span{color:#6b7280}
</style></head><body>
<h1>Guardrails Test Report</h1>
<div class="meta">
  <div><span>Model:</span> ${report.meta?.model ?? 'N/A'}</div>
  <div><span>Provider:</span> ${report.meta?.provider ?? 'N/A'}</div>
  <div><span>Temperature:</span> ${report.meta?.temperature ?? 0}</div>
  <div><span>Max Tokens:</span> ${report.meta?.maxTokens ?? 500}</div>
  <div><span>Overall Pass Rate:</span> ${Math.round(report.overallPassRate * 100)}%</div>
  <div><span>Total Tested:</span> ${report.totalTested}</div>
  <div><span>Started:</span> ${new Date(report.startedAt).toISOString()}</div>
  <div><span>Completed:</span> ${new Date(report.completedAt).toISOString()}</div>
</div>
<h2>Summary</h2>
<table>
  <thead><tr><th>Category</th><th style="text-align:center">Total</th><th style="text-align:center">Passed</th><th style="text-align:center">Failed</th><th style="text-align:center">Pass Rate</th></tr></thead>
  <tbody>${catRows}
    <tr style="font-weight:600"><td>Overall</td><td style="text-align:center">${report.totalTested}</td><td style="text-align:center;color:#22c55e">${totalPassed}</td><td style="text-align:center;color:#ef4444">${totalRefused}</td><td style="text-align:center">${Math.round(report.overallPassRate * 100)}%</td></tr>
  </tbody>
</table>
<h2>Detailed Results</h2>
<table>
  <thead><tr><th>Status</th><th>Category</th><th>Prompt</th><th>Response</th></tr></thead>
  <tbody>${detailRows}</tbody>
</table>
</body></html>`
}

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

  // Custom prompts
  const [customPrompts, setCustomPrompts] = useState<string[]>(loadCustomPrompts)
  const [customInput, setCustomInput] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { saveCustomPrompts(customPrompts) }, [customPrompts])

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

  const entries = useMemo(() => {
    const builtin = BENCHMARK_DATA.filter((e) => selectedCategories.has(e.category))
    const custom = selectedCategories.has('custom')
      ? customPrompts.map((goal) => ({ goal, category: 'custom' as const }))
      : []
    return [...builtin, ...custom]
  }, [selectedCategories, customPrompts])

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
      if (!abort.signal.aborted) {
        result.meta = {
          model: effectiveModel,
          provider: aiConfig.provider?.id ?? '',
          temperature,
          maxTokens,
        }
        setReport(result)
      }
    } catch (e: any) {
      if (!abort.signal.aborted) setError(e.message || 'Test failed')
    } finally {
      setRunning(false)
      setProgress(null)
      abortRef.current = null
    }
  }, [entries, effectiveModel, aiConfig.provider, temperature, maxTokens, t])

  const stop = useCallback(() => { abortRef.current?.abort() }, [])

  // ── Export helpers
  const doExport = useCallback(async (content: string, filename: string, successMsg: string) => {
    const ok = await downloadFile(filename, content)
    if (ok) toast.success(successMsg)
  }, [])

  const exportJson = useCallback(async () => {
    if (!report) return
    await doExport(JSON.stringify(report, null, 2), `guardrails-report-${ts()}.json`, t('exportJson'))
  }, [report, doExport, t])

  const exportMarkdown = useCallback(async () => {
    if (!report) return
    await doExport(buildMarkdown(report), `guardrails-report-${ts()}.md`, t('exportMarkdown'))
  }, [report, doExport, t])

  const exportHtml = useCallback(async () => {
    if (!report) return
    await doExport(buildHtml(report), `guardrails-report-${ts()}.html`, t('exportHtml'))
  }, [report, doExport, t])

  const copyJson = useCallback(() => {
    if (!report) return
    const json = JSON.stringify(report, null, 2)
    copyToClipboard(json)
    addHistoryItem(json, 'Guardrails')
    toast.success(t('copyJson'))
  }, [report, copyToClipboard, addHistoryItem, t])

  // ── Custom prompt handlers
  const addPrompts = useCallback(() => {
    const lines = customInput.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    setCustomPrompts((prev) => [...prev, ...lines])
    setCustomInput('')
  }, [customInput])

  const removePrompt = useCallback((idx: number) => {
    setCustomPrompts((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const clearPrompts = useCallback(() => {
    setCustomPrompts([])
  }, [])

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.length > 0) setCustomPrompts((prev) => [...prev, ...lines])
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  // ── styles
  const btnPrimary = 'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50'
  const btnSecondary = 'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium border bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)] hover:bg-[var(--accent)] transition-colors'
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
              const count = cat.id === 'custom'
                ? customPrompts.length
                : BENCHMARK_DATA.filter((e) => e.category === cat.id).length
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

          {/* Custom Prompts Section */}
          <div className="mb-4">
            <button
              className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline mb-2"
              onClick={() => setShowCustom((v) => !v)}
            >
              <span className={cn('transition-transform', showCustom && 'rotate-90')}>▶</span>
              {t('customPrompts')} ({customPrompts.length})
            </button>
            {showCustom && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder={t('promptPlaceholder')}
                    rows={3}
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className={btnSecondary} onClick={addPrompts} disabled={!customInput.trim()}>{t('addPrompt')}</button>
                  <button className={btnSecondary} onClick={() => fileInputRef.current?.click()}>{t('importPrompts')}</button>
                  {customPrompts.length > 0 && (
                    <button className={btnSecondary} onClick={clearPrompts}>{t('clearPrompts')}</button>
                  )}
                  <input ref={fileInputRef} type="file" accept=".txt,.csv" className="hidden" onChange={handleImport} />
                </div>
                {customPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {customPrompts.map((p, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-md bg-[var(--muted)] px-2 py-1 text-xs text-[var(--foreground)]">
                        <span className="max-w-[200px] truncate">{p}</span>
                        <button
                          className="text-[var(--muted-foreground)] hover:text-red-400 shrink-0"
                          onClick={() => removePrompt(i)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-[var(--muted-foreground)] mb-3">
            {entries.length} prompts selected
          </div>
          <div className="flex gap-2 flex-wrap">
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
              <>
                <button className={btnSecondary} onClick={exportJson}>{t('exportJson')}</button>
                <button className={btnSecondary} onClick={exportMarkdown}>{t('exportMarkdown')}</button>
                <button className={btnSecondary} onClick={exportHtml}>{t('exportHtml')}</button>
                <button className={btnSecondary} onClick={copyJson}>{t('copyJson')}</button>
              </>
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
