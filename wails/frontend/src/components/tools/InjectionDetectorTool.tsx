'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { useAIConfig } from '@/hooks/useAIConfig'
import { cn } from '@/lib/utils'
import { chatCompletion, isWailsMode } from '@/lib/services/chatCompletion'
import { INJECTION_RULES, runRuleDetection } from '@/lib/injection/rules'
import { detectInjection } from '@/lib/injection/llm-detector'
import { ModelConfigPanel } from '@/components/shared/ModelConfigPanel'
import type { InjectionResult } from '@/lib/injection/types'

const TOOL_ID = 'injection'

export default function Tool() {
  const t = useTranslations('injection')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const aiConfig = useAIConfig(TOOL_ID)

  const [input, setInput] = useState('')
  const [result, setResult] = useState<InjectionResult | null>(null)
  const [useLLM, setUseLLM] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [temperature, setTemperature] = useState(0)
  const [maxTokens, setMaxTokens] = useState(200)

  const effectiveModel = useMemo(() => {
    if (aiConfig.availableModels.length === 0) return ''
    if (aiConfig.availableModels.some((m) => m === aiConfig.model)) return aiConfig.model
    return aiConfig.availableModels[0]
  }, [aiConfig.model, aiConfig.availableModels])

  const run = useCallback(async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    const llm = useLLM && (aiConfig.isConfigured || isWailsMode()) && effectiveModel
      ? async (messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, opts?: { temperature?: number; maxTokens?: number }) => {
          return chatCompletion({ model: effectiveModel, messages, temperature: opts?.temperature ?? temperature, maxTokens: opts?.maxTokens ?? maxTokens, toolId: TOOL_ID, providerId: aiConfig.provider?.id })
        }
      : undefined

    try {
      const res = await detectInjection(input, llm || (async () => ''), useLLM && !!llm)
      setResult(res)
    } catch (e: any) {
      const { matches, score } = runRuleDetection(input)
      setResult({ matches, ruleScore: score, llmScore: null, overallScore: score })
    } finally {
      setLoading(false)
    }
  }, [input, effectiveModel, useLLM, aiConfig, temperature, maxTokens])

  // ── styles
  const inputCls = 'w-full rounded-md px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--border)]'
  const btnPrimary = 'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50'
  const panelCls = 'rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5'
  const labelCls = 'text-xs font-medium text-[var(--muted-foreground)] mb-1'

  const scoreColor = (s: number) => s >= 0.7 ? 'text-red-500' : s >= 0.4 ? 'text-yellow-500' : 'text-green-500'

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className={panelCls}>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{t('title')}</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">{t('description')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className={cn(panelCls, 'lg:col-span-3 flex flex-col gap-3')}>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>{t('inputLabel')}</label>
            <textarea className={cn(inputCls, 'min-h-[140px] resize-y')} placeholder={t('inputPlaceholder')} value={input} onChange={(e) => setInput(e.target.value)} rows={6} />
          </div>
          <div className="flex items-center gap-3">
            <button className={btnPrimary} onClick={run} disabled={loading}>{loading ? tc('loading') : t('analyzeButton')}</button>
            <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <input type="checkbox" checked={useLLM} onChange={(e) => setUseLLM(e.target.checked)} className="accent-[var(--primary)]" />
              {t('useLLM')}
            </label>
          </div>
        </section>

        <ModelConfigPanel aiConfig={aiConfig} temperature={temperature} onTemperatureChange={setTemperature} maxTokens={maxTokens} onMaxTokensChange={setMaxTokens} />
      </div>

      {error && <div className="p-3 rounded-md bg-red-500/10 border border-red-500/40 text-red-400 text-sm">{error}</div>}

      {result && (
        <div className="flex flex-col gap-4">
          {/* Score */}
          <div className={panelCls}>
            <div className="flex items-center gap-4">
              <div className={cn('text-3xl font-bold', scoreColor(result.overallScore))}>
                {Math.round(result.overallScore * 100)}%
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{t('injectionRisk')}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {t('ruleScore')}: {Math.round(result.ruleScore * 100)}%
                  {result.llmScore !== null && ` | ${t('llmScore')}: ${Math.round(result.llmScore * 100)}%`}
                </p>
              </div>
            </div>
            {result.llmReasoning && (
              <p className="text-xs text-[var(--muted-foreground)] mt-2 italic">{result.llmReasoning}</p>
            )}
          </div>

          {/* Matches */}
          {result.matches.length > 0 && (
            <div className={panelCls}>
              <label className={labelCls}>{t('detectedPatterns')} ({result.matches.length})</label>
              <div className="space-y-2 mt-2">
                {result.matches.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={cn('shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded uppercase', m.rule.severity === 'high' ? 'bg-red-500/20 text-red-400' : m.rule.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400')}>
                      {m.rule.severity}
                    </span>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{m.rule.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{m.rule.description}</p>
                      <code className="text-xs text-[var(--primary)]">"{m.match}"</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
