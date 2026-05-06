'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useAppStore } from '@/stores/useAppStore'
import { useAIConfig, useEnabledProviders } from '@/hooks/useAIConfig'
import { cn } from '@/lib/utils'
import type { AIConfig } from '@/hooks/useAIConfig'

interface ModelConfigPanelProps {
  aiConfig: AIConfig
  temperature?: number
  onTemperatureChange?: (v: number) => void
  maxTokens?: number
  onMaxTokensChange?: (v: number) => void
  showTemperature?: boolean
  showMaxTokens?: boolean
}

const panelCls = 'rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5'
const labelCls = 'text-xs font-medium text-[var(--muted-foreground)] mb-1'
const selectCls = 'w-full rounded-md px-3 py-2 text-sm outline-none transition-colors bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'
const inputCls = 'w-full rounded-md px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--muted-foreground)] bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--border)]'

export function ModelConfigPanel({
  aiConfig,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  showTemperature = true,
  showMaxTokens = true,
}: ModelConfigPanelProps) {
  const tc = useTranslations('common')
  const toggleAdvancedSettings = useAppStore((s) => s.toggleAdvancedSettings)
  const enabledProviders = useEnabledProviders()
  const [refreshing, setRefreshing] = useState(false)

  const modelList = useMemo(() => {
    if (aiConfig.availableModels.length > 0) {
      return aiConfig.availableModels.map((id) => ({ id, name: id.split('/').pop() || id }))
    }
    return []
  }, [aiConfig.availableModels])

  const effectiveModel = useMemo(() => {
    if (modelList.some((m) => m.id === aiConfig.model)) return aiConfig.model
    return modelList[0]?.id || ''
  }, [aiConfig.model, modelList])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try { await aiConfig.refreshModels() } catch { /* silent */ }
    setRefreshing(false)
  }, [aiConfig])

  const handleProviderChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    aiConfig.setProvider(val === '' ? null : val)
  }, [aiConfig])

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    aiConfig.setModel(e.target.value)
  }, [aiConfig])

  // Not configured
  if (!aiConfig.provider) {
    return (
      <section className={cn(panelCls, 'lg:col-span-2')}>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">{tc('notConfigured')}</p>
          <button
            type="button"
            onClick={toggleAdvancedSettings}
            className="text-xs text-[var(--primary)] hover:underline"
          >
            {tc('openSettings')}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className={cn(panelCls, 'lg:col-span-2')}>
      <div className="grid grid-cols-1 gap-3">
        {/* Provider */}
        {enabledProviders.length > 1 && (
          <div className="flex flex-col gap-1">
            <label className={labelCls}>
              {tc('provider')} <span className="text-[var(--primary)]">({aiConfig.provider.name})</span>
            </label>
            <select className={selectCls} value={aiConfig.provider.id} onChange={handleProviderChange}>
              {enabledProviders.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Model */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className={labelCls}>
              {tc('model')} {enabledProviders.length <= 1 && <span className="text-[var(--primary)]">({aiConfig.provider.name})</span>}
            </label>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-[10px] text-[var(--primary)] hover:underline disabled:opacity-50"
            >
              {refreshing ? '...' : tc('refreshModels')}
            </button>
          </div>
          {modelList.length > 0 ? (
            <select className={selectCls} value={effectiveModel} onChange={handleModelChange}>
              {modelList.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          ) : (
            <div className="text-xs text-[var(--muted-foreground)] py-2">
              {tc('noModels')}
            </div>
          )}
        </div>

        {/* Max Tokens */}
        {showMaxTokens && onMaxTokensChange && maxTokens !== undefined && (
          <div className="flex flex-col gap-1">
            <label className={labelCls}>{tc('maxTokens')}</label>
            <input
              className={inputCls}
              type="number"
              min={100}
              max={32000}
              value={maxTokens}
              onChange={(e) => onMaxTokensChange(Math.max(100, Number(e.target.value)))}
            />
          </div>
        )}

        {/* Temperature */}
        {showTemperature && onTemperatureChange && temperature !== undefined && (
          <div className="flex flex-col gap-1">
            <label className={labelCls}>{tc('temperature')}: {temperature.toFixed(2)}</label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={temperature}
              onChange={(e) => onTemperatureChange(Number(e.target.value))}
              className="accent-[var(--primary)]"
            />
            <div className="flex justify-between text-[11px] text-[var(--muted-foreground)]">
              <span>0.00</span>
              <span>2.00</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
