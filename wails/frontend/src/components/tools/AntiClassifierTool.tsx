// @ts-nocheck
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/utils'
import { OPENROUTER_MODELS } from '@/lib/utils/openrouterModels'
import { ANTICLASSIFIER_SYSTEM_PROMPT } from '@/lib/utils/anticlassifierPrompt'
import { chatCompletion, isWailsMode } from '@/lib/services/chatCompletion'

const TOOL_ID = 'anticlassifier'
const FALLBACK_MODEL = 'anthropic/claude-sonnet-4.6'

// ── component ────────────────────────────────────────────────────────

export default function Tool() {
  const t = useTranslations('anticlassifier')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const apiKeyConfigured = useSettingsStore((s) => s.apiKeyConfigured)
  const getEffectiveProvider = useSettingsStore((s) => s.getEffectiveProvider)

  const provider = useMemo(() => getEffectiveProvider(TOOL_ID), [getEffectiveProvider])
  const hasProviderConfigured = !!provider

  // Build model options from provider or fallback to hardcoded list
  const modelOptions = useMemo(() => {
    if (provider?.models?.length) {
      return provider.models.map((id) => ({ id, name: id.split('/').pop() || id, provider: provider.name }))
    }
    return OPENROUTER_MODELS.map((m) => ({ id: m.id, name: m.name, provider: m.provider }))
  }, [provider])

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const [model, setModel] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('ac-model') || FALLBACK_MODEL
    return FALLBACK_MODEL
  })
  const [temperature, setTemperature] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = parseFloat(localStorage.getItem('ac-temperature') || '')
      return Number.isFinite(saved) ? Math.min(2, Math.max(0, saved)) : 0.7
    }
    return 0.7
  })
  const [maxTokens, setMaxTokens] = useState(2000)

  // Ensure model is valid when provider changes
  const effectiveModel = useMemo(() => {
    if (modelOptions.some((m) => m.id === model)) return model
    return modelOptions[0]?.id || FALLBACK_MODEL
  }, [model, modelOptions])

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
      setError(t('errorNoInput'))
      return
    }
    if (!apiKeyConfigured && !isWailsMode() && !hasProviderConfigured) {
      setError(t('errorNoProvider'))
      return
    }

    setLoading(true)
    setError('')
    setOutput('')

    try {
      localStorage.setItem('ac-model', effectiveModel)
      localStorage.setItem('ac-temperature', String(temperature))
    } catch { /* ignore */ }

    try {
      const result = await chatCompletion({
        model: effectiveModel,
        messages: [
          { role: 'system', content: ANTICLASSIFIER_SYSTEM_PROMPT },
          { role: 'user', content: input },
        ],
        temperature: Math.min(2, Math.max(0, temperature)),
        maxTokens: Math.max(100, Math.min(32000, maxTokens)),
        toolId: TOOL_ID,
      })
      setOutput(result)
    } catch (e: any) {
      setError(e.message || t('errorRequestFailed'))
    } finally {
      setLoading(false)
    }
  }, [input, effectiveModel, temperature, maxTokens, apiKeyConfigured, hasProviderConfigured, t])

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

  const panelCls = 'rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5'
  const labelCls = 'text-xs font-medium text-[var(--muted-foreground)] mb-1'

  // ── render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {t('title')}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {t('description')}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Input + Action */}
        <section className={cn(panelCls, 'lg:col-span-3')}>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>{t('inputLabel')}</label>
            <textarea
              className={cn(inputCls, 'min-h-[140px] resize-y')}
              placeholder={t('inputPlaceholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={btnPrimary} onClick={run} disabled={loading}>
              {loading ? t('analyzing') : t('rewriteButton')}
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
                {copied ? tc('copied') : t('copyOutput')}
              </button>
            )}
          </div>
        </section>

        {/* Controls */}
        <section className={cn(panelCls, 'lg:col-span-2')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>
                {tc('model')} {hasProviderConfigured && <span className="text-[var(--primary)]">({provider.name})</span>}
              </label>
              <select
                className={selectCls}
                value={effectiveModel}
                onChange={(e) => {
                  setModel(e.target.value)
                  localStorage.setItem('ac-model', e.target.value)
                }}
              >
                {modelOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>{t('maxTokens')}</label>
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
              <label className={labelCls}>{t('temperature', { value: temperature.toFixed(2) })}</label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="accent-[var(--primary)]"
              />
              <div className="flex justify-between text-[11px] text-[var(--muted-foreground)]">
                <span>0.00</span>
                <span>2.00</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/40 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Output */}
      {output && (
        <div className={cn(panelCls, 'flex flex-col gap-1')}>
          <label className={labelCls}>{t('result')}</label>
          <textarea
            readOnly
            value={output}
            className={cn(inputCls, 'min-h-[220px] resize-y')}
            rows={6}
          />
        </div>
      )}

      {/* Empty state */}
      {!output && !loading && !error && (
        <div className={cn(panelCls, 'flex flex-col items-center gap-2 py-8 text-center text-[var(--muted-foreground)]')}>
          <p>{t('emptyState')}</p>
          <p className="text-xs">{t('emptyHint')}</p>
        </div>
      )}
    </div>
  )
}
