'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, RefreshCw, Loader2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAIConfig, useEnabledProviders } from '@/hooks/useAIConfig'
import { useSettingsStore } from '@/stores/useSettingsStore'

interface ModelSelectorProps {
  /** Tool ID for configuration lookup */
  toolId: string

  /** Show provider selector (default: true) */
  showProvider?: boolean

  /** Allow "Use Default" option (default: true) */
  allowDefault?: boolean

  /** Compact mode (default: false) */
  compact?: boolean

  /** Additional class name */
  className?: string

  /** Callback when model changes */
  onModelChange?: (model: string) => void
}

export function ModelSelector({
  toolId,
  showProvider = true,
  allowDefault = true,
  compact = false,
  className,
  onModelChange,
}: ModelSelectorProps) {
  const t = useTranslations('common')
  const tSettings = useTranslations('settings.providers')

  const config = useAIConfig(toolId)
  const providers = useEnabledProviders()
  const defaultProviderId = useSettingsStore((s) => s.defaultProviderId)
  const setToolProvider = useSettingsStore((s) => s.setToolProvider)
  const toolProviders = useSettingsStore((s) => s.toolProviders)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showProviderDropdown, setShowProviderDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  // Current provider override for this tool
  const currentProviderId = toolProviders[toolId] ?? null

  // Handle provider change
  const handleProviderChange = useCallback(
    (providerId: string | null) => {
      setToolProvider(toolId, providerId)
      setShowProviderDropdown(false)
    },
    [toolId, setToolProvider]
  )

  // Handle model change
  const handleModelChange = useCallback(
    (model: string) => {
      config.setModel(model)
      setShowModelDropdown(false)
      onModelChange?.(model)
    },
    [config, onModelChange]
  )

  // Refresh models
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await config.refreshModels()
    } catch (error) {
      console.error('[ModelSelector] Failed to refresh models:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [config])

  // Styles
  const selectCls = cn(
    'flex items-center gap-1.5 px-2 py-1 text-xs rounded-md',
    'bg-[var(--muted)] border border-[var(--border)]',
    'hover:border-[var(--primary)]/50 transition-colors',
    'cursor-pointer select-none',
    compact ? 'text-xs' : 'text-sm'
  )

  const dropdownCls = cn(
    'absolute z-50 mt-1 py-1 rounded-md shadow-lg',
    'bg-[var(--popover)] border border-[var(--border)]',
    'max-h-48 overflow-y-auto min-w-[160px]'
  )

  const optionCls = cn(
    'px-3 py-1.5 text-xs cursor-pointer',
    'hover:bg-[var(--accent)] transition-colors'
  )

  if (!config.isConfigured) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 text-xs rounded-md',
          'bg-[var(--muted)] text-[var(--muted-foreground)]',
          'border border-[var(--border)] border-dashed',
          className
        )}
      >
        <Settings className="h-3 w-3" />
        {tSettings('noProvider')}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Provider Selector */}
      {showProvider && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProviderDropdown(!showProviderDropdown)}
            className={selectCls}
          >
            <span className="truncate max-w-[100px]">
              {currentProviderId
                ? providers.find((p) => p.id === currentProviderId)?.name ?? t('default')
                : t('default')}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </button>

          {showProviderDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProviderDropdown(false)} />
              <div className={dropdownCls}>
                {allowDefault && (
                  <div
                    className={cn(optionCls, !currentProviderId && 'bg-[var(--accent)]')}
                    onClick={() => handleProviderChange(null)}
                  >
                    {t('default')}
                    {defaultProviderId && (
                      <span className="text-[var(--muted-foreground)] ml-1">
                        ({providers.find((p) => p.id === defaultProviderId)?.name})
                      </span>
                    )}
                  </div>
                )}
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className={cn(
                      optionCls,
                      currentProviderId === provider.id && 'bg-[var(--accent)]'
                    )}
                    onClick={() => handleProviderChange(provider.id)}
                  >
                    {provider.name}
                    {provider.isDefault && (
                      <span className="text-[var(--primary)] ml-1">★</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Model Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowModelDropdown(!showModelDropdown)}
          className={selectCls}
        >
          <span className="truncate max-w-[140px]">
            {config.model || t('selectModel')}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0" />
        </button>

        {showModelDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowModelDropdown(false)} />
            <div className={dropdownCls}>
              {/* Refresh button */}
              <div
                className={cn(
                  optionCls,
                  'flex items-center gap-2 border-b border-[var(--border)] mb-1'
                )}
                onClick={handleRefresh}
              >
                {isRefreshing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {tSettings('refreshModels')}
              </div>

              {/* Model list */}
              {config.availableModels.length > 0 ? (
                config.availableModels.map((model) => (
                  <div
                    key={model}
                    className={cn(
                      optionCls,
                      config.model === model && 'bg-[var(--accent)]'
                    )}
                    onClick={() => handleModelChange(model)}
                  >
                    {model}
                  </div>
                ))
              ) : (
                <div className={cn(optionCls, 'text-[var(--muted-foreground)]')}>
                  {tSettings('noModels')}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
