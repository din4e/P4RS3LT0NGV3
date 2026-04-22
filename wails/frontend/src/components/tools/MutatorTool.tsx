'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { useAIConfig } from '@/hooks/useAIConfig'
import { cn } from '@/lib/utils'
import { chatCompletion } from '@/lib/services/chatCompletion'
import { mutatorRegistry } from '@/lib/mutators'
import { ModelConfigPanel } from '@/components/shared/ModelConfigPanel'
import type { MutatorHandler } from '@/lib/mutators'

const TOOL_ID = 'mutator'

export default function Tool() {
  const t = useTranslations('mutator')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const aiConfig = useAIConfig(TOOL_ID)

  const allMutators = useMemo(() => mutatorRegistry.getAll(), [])

  const [input, setInput] = useState('')
  const [activeChain, setActiveChain] = useState<MutatorHandler[]>([])
  const [stepOutputs, setStepOutputs] = useState<string[]>([])
  const [llmResponse, setLlmResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2000)

  const effectiveModel = useMemo(() => {
    if (aiConfig.availableModels.length === 0) return ''
    if (aiConfig.availableModels.some((m) => m === aiConfig.model)) return aiConfig.model
    return aiConfig.availableModels[0]
  }, [aiConfig.model, aiConfig.availableModels])

  const flash = useCallback((key: string, text: string) => {
    copyToClipboard(text)
    addHistoryItem(text, 'Mutator')
    setCopied(key)
    setTimeout(() => setCopied(null), 1200)
  }, [copyToClipboard, addHistoryItem])

  const addToChain = useCallback((m: MutatorHandler) => {
    setActiveChain((prev) => [...prev, m])
  }, [])

  const removeFromChain = useCallback((idx: number) => {
    setActiveChain((prev) => prev.filter((_, i) => i !== idx))
    setStepOutputs([])
  }, [])

  const moveInChain = useCallback((idx: number, dir: -1 | 1) => {
    setActiveChain((prev) => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
    setStepOutputs([])
  }, [])

  const createLLMCaller = useCallback(() => {
    return async (
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
      options?: { temperature?: number; maxTokens?: number },
    ) => {
      return chatCompletion({
        model: effectiveModel,
        messages,
        temperature: options?.temperature ?? temperature,
        maxTokens: options?.maxTokens ?? maxTokens,
        toolId: TOOL_ID,
        providerId: aiConfig.provider?.id,
      })
    }
  }, [effectiveModel, aiConfig.provider, temperature, maxTokens])

  const runChain = useCallback(async () => {
    if (!input.trim()) { setError(t('noInput')); return }
    setLoading(true)
    setError('')
    setStepOutputs([])
    setLlmResponse('')

    try {
      const llm = createLLMCaller()
      const outputs: string[] = []
      let current = input

      for (const mutator of activeChain) {
        current = await mutator.mutate(current, mutator.definition.requiresLLM ? llm : undefined)
        outputs.push(current)
      }

      setStepOutputs(outputs)
    } catch (e: any) {
      setError(e.message || 'Chain execution failed')
    } finally {
      setLoading(false)
    }
  }, [input, activeChain, createLLMCaller, t])

  const sendToLLM = useCallback(async () => {
    const text = stepOutputs.length > 0 ? stepOutputs[stepOutputs.length - 1] : input
    if (!text.trim()) { setError(t('noInput')); return }
    if (!aiConfig.isConfigured) { setError(t('noProvider')); return }

    setLoading(true)
    setError('')
    setLlmResponse('')

    try {
      const result = await chatCompletion({
        model: effectiveModel,
        messages: [{ role: 'user', content: text }],
        temperature,
        maxTokens,
        toolId: TOOL_ID,
        providerId: aiConfig.provider?.id,
      })
      setLlmResponse(result)
    } catch (e: any) {
      setError(e.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }, [stepOutputs, input, effectiveModel, aiConfig, temperature, maxTokens, t])

  // ── styles
  const inputCls = 'w-full rounded-md px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'
  const btnPrimary = 'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50'
  const panelCls = 'rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5'
  const labelCls = 'text-xs font-medium text-[var(--muted-foreground)] mb-1'

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
            <textarea className={cn(inputCls, 'min-h-[100px] resize-y')} placeholder={t('inputPlaceholder')} value={input} onChange={(e) => setInput(e.target.value)} rows={4} />
          </div>

          {/* Available mutators */}
          <div>
            <label className={labelCls}>{t('availableMutators')}</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {allMutators.map((m) => (
                <button key={m.definition.id} onClick={() => addToChain(m)}
                  className="px-2.5 py-1 text-xs rounded-md border border-[var(--border)] bg-[var(--muted)] hover:bg-[var(--accent)] transition-colors">
                  {m.definition.name} {m.definition.requiresLLM && <span className="text-[var(--primary)]">LLM</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Active chain */}
          <div>
            <label className={labelCls}>{t('activeChain')}</label>
            {activeChain.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{t('noMutators')}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {activeChain.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--primary)]/10 border border-[var(--primary)]/30">
                    <button onClick={() => moveInChain(i, -1)} className="opacity-50 hover:opacity-100" disabled={i === 0}>&#9664;</button>
                    {m.definition.name}
                    <button onClick={() => moveInChain(i, 1)} className="opacity-50 hover:opacity-100" disabled={i === activeChain.length - 1}>&#9654;</button>
                    <button onClick={() => removeFromChain(i)} className="opacity-50 hover:opacity-100 text-red-400">&#10005;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button className={btnPrimary} onClick={runChain} disabled={loading || activeChain.length === 0}>
              {loading ? tc('loading') : t('runChain')}
            </button>
            <button className={btnPrimary} onClick={sendToLLM} disabled={loading}>
              {t('sendToLLM')}
            </button>
          </div>
        </section>

        <ModelConfigPanel aiConfig={aiConfig} temperature={temperature} onTemperatureChange={setTemperature} maxTokens={maxTokens} onMaxTokensChange={setMaxTokens} />
      </div>

      {error && <div className="p-3 rounded-md bg-red-500/10 border border-red-500/40 text-red-400 text-sm">{error}</div>}

      {/* Step outputs */}
      {stepOutputs.length > 0 && (
        <div className={panelCls}>
          <label className={labelCls}>{t('preview')}</label>
          {stepOutputs.map((out, i) => (
            <div key={i} className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted-foreground)]">{t('stepOutput', { n: i + 1 })} — {activeChain[i]?.definition.name}</span>
                <button className="text-xs text-[var(--primary)] hover:underline" onClick={() => flash(`step-${i}`, out)}>
                  {copied === `step-${i}` ? tc('copied') : t('copyOutput')}
                </button>
              </div>
              <pre className="mt-1 text-xs whitespace-pre-wrap break-all rounded-md bg-[var(--muted)] p-3 max-h-[120px] overflow-auto">{out}</pre>
            </div>
          ))}
        </div>
      )}

      {/* LLM Response */}
      {llmResponse && (
        <div className={panelCls}>
          <div className="flex items-center justify-between">
            <label className={labelCls}>{t('llmResponse')}</label>
            <button className="text-xs text-[var(--primary)] hover:underline" onClick={() => flash('llm', llmResponse)}>
              {copied === 'llm' ? tc('copied') : t('copyOutput')}
            </button>
          </div>
          <pre className="mt-1 text-sm whitespace-pre-wrap break-all rounded-md bg-[var(--muted)] p-3 max-h-[300px] overflow-auto">{llmResponse}</pre>
        </div>
      )}
    </div>
  )
}
