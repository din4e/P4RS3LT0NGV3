'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { X, Eye, EyeOff, Save, Loader2, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { testProviderConnection, fetchProviderModels } from '@/lib/services/modelFetcher'
import { API_PROVIDERS, type APIProvider as PresetProvider } from '@/lib/utils/apiProviders'
import type { APIProvider } from '@/types/provider'

interface ProviderModalProps {
  isOpen: boolean
  onClose: () => void
  editProvider?: APIProvider | null
}

export function ProviderModal({ isOpen, onClose, editProvider }: ProviderModalProps) {
  const t = useTranslations('settings.providers')
  const setProvider = useSettingsStore((s) => s.setProvider)

  // Form state
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  // UI state
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  // Initialize form when editing
  useEffect(() => {
    if (editProvider) {
      setName(editProvider.name)
      setBaseUrl(editProvider.baseUrl)
      setApiKey(editProvider.apiKey)
      setSelectedPreset(null)
    } else {
      setName('')
      setBaseUrl('')
      setApiKey('')
      setSelectedPreset(null)
    }
    setTestResult(null)
  }, [editProvider, isOpen])

  // Apply preset
  const handlePresetSelect = (preset: PresetProvider) => {
    setSelectedPreset(preset.id)
    setName(preset.name)
    setBaseUrl(preset.baseUrl)
    setTestResult(null)
    // Local providers don't need an API key
    if (preset.requiresApiKey === false) {
      setApiKey('local-no-key')
    } else {
      setApiKey('')
    }
  }

  const isLocalPreset = selectedPreset
    ? API_PROVIDERS.find((p) => p.id === selectedPreset)?.requiresApiKey === false
    : false

  // Test connection
  const handleTest = async () => {
    if (!baseUrl || !apiKey) {
      setTestResult({ success: false, error: t('testErrorMissing') })
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const result = await testProviderConnection(baseUrl, apiKey)
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : t('testErrorUnknown'),
      })
    } finally {
      setIsTesting(false)
    }
  }

  // Save provider
  const handleSave = async () => {
    if (!name.trim() || !baseUrl.trim()) return
    if (!isLocalPreset && !apiKey.trim()) return

    const isNew = !editProvider
    const provider: APIProvider = {
      id: editProvider?.id || `provider_${Date.now()}`,
      name: name.trim(),
      baseUrl: baseUrl.trim().replace(/\/$/, ''),
      apiKey: isLocalPreset ? '' : apiKey.trim(),
      isEnabled: true,
      isDefault: editProvider?.isDefault ?? false,
      region: selectedPreset ? API_PROVIDERS.find((p) => p.id === selectedPreset)?.region : 'global',
      requiresApiKey: isLocalPreset ? false : undefined,
      isLocal: isLocalPreset ? true : undefined,
    }

    setProvider(provider)

    // Auto-set as default if no default exists yet
    if (isNew && !useSettingsStore.getState().defaultProviderId) {
      useSettingsStore.getState().setDefaultProvider(provider.id)
    }

    // Auto-fetch models for new providers
    if (isNew) {
      try {
        const models = await fetchProviderModels(provider.baseUrl, provider.apiKey)
        useSettingsStore.getState().setProviderModels(provider.id, models)
      } catch {
        // Silent — user can refresh manually later
      }
    }

    onClose()
  }

  if (!isOpen) return null

  const inputCls = cn(
    'w-full px-2.5 py-1.5 text-sm rounded-md',
    'bg-[var(--muted)] text-[var(--foreground)]',
    'border border-[var(--border)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
    'placeholder:text-[var(--muted-foreground)]'
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          'w-full max-w-md mx-4 rounded-lg shadow-xl',
          'bg-[var(--background)] border border-[var(--border)]'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between px-4 py-3',
            'border-b border-[var(--border)]'
          )}
        >
          <h3 className="text-sm font-semibold">
            {editProvider ? t('editProvider') : t('addProvider')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'inline-flex items-center justify-center h-6 w-6 rounded',
              'text-[var(--muted-foreground)]',
              'hover:text-[var(--foreground)] hover:bg-[var(--muted)]',
              'transition-colors'
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-4">
          {/* Presets */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--muted-foreground)]">
              {t('presets')}
            </label>
            {/* Local providers */}
            {API_PROVIDERS.filter((p) => p.region === 'local').length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{t('localProviders')}</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {API_PROVIDERS.filter((p) => p.region === 'local').map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        'px-2 py-1 text-xs rounded truncate',
                        'border transition-colors',
                        selectedPreset === preset.id
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      )}
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Global providers */}
            {API_PROVIDERS.filter((p) => p.region === 'global' && !['zhipu-global', 'minimax-global', 'moonshot-global'].includes(p.id)).length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{t('globalProviders')}</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {API_PROVIDERS.filter((p) => p.region === 'global' && !['zhipu-global', 'minimax-global', 'moonshot-global'].includes(p.id)).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        'px-2 py-1 text-xs rounded truncate',
                        'border transition-colors',
                        selectedPreset === preset.id
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      )}
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Chinese domestic providers */}
            {API_PROVIDERS.filter((p) => p.region === 'china').length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{t('chineseProviders')}</span>
                <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                  {API_PROVIDERS.filter((p) => p.region === 'china').map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        'px-2 py-1 text-xs rounded truncate',
                        'border transition-colors',
                        selectedPreset === preset.id
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      )}
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Chinese international providers */}
            {API_PROVIDERS.filter((p) => ['zhipu-global', 'minimax-global', 'moonshot-global'].includes(p.id)).length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{t('chineseIntlProviders')}</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {API_PROVIDERS.filter((p) => ['zhipu-global', 'minimax-global', 'moonshot-global'].includes(p.id)).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        'px-2 py-1 text-xs rounded truncate',
                        'border transition-colors',
                        selectedPreset === preset.id
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      )}
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--muted-foreground)]">
              {t('name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className={inputCls}
            />
          </div>

          {/* Base URL */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--muted-foreground)]">
              {t('baseUrl')}
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => {
                setBaseUrl(e.target.value)
                setSelectedPreset(null)
                setTestResult(null)
              }}
              placeholder="https://openrouter.ai/api/v1"
              className={inputCls}
            />
          </div>

          {/* API Key */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--muted-foreground)]">
              {t('apiKey')}
            </label>
            {isLocalPreset ? (
              <div className="flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30">
                <Check className="h-3.5 w-3.5 shrink-0" />
                {t('noKeyRequired')}
              </div>
            ) : (
            <div className="flex items-center gap-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setTestResult(null)
                }}
                placeholder="sk-..."
                autoComplete="off"
                className={cn(inputCls, 'flex-1')}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className={cn(
                  'inline-flex items-center justify-center h-8 w-8 rounded-md',
                  'text-[var(--muted-foreground)]',
                  'hover:bg-[var(--muted)] transition-colors'
                )}
                title={showKey ? t('hideKey') : t('showKey')}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-xs',
                testResult.success
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              )}
            >
              {testResult.success ? (
                <>
                  <Check className="h-4 w-4" />
                  {t('testSuccess')}
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="truncate">{testResult.error}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={cn(
            'flex items-center justify-end gap-2 px-4 py-3',
            'border-t border-[var(--border)]'
          )}
        >
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || !baseUrl || !apiKey}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md',
              'border border-[var(--border)]',
              'hover:bg-[var(--muted)] transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isTesting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            {t('testConnection')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md',
              'border border-[var(--border)]',
              'hover:bg-[var(--muted)] transition-colors'
            )}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || !baseUrl.trim() || (!isLocalPreset && !apiKey.trim())}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md',
              'bg-[var(--primary)] text-[var(--primary-foreground)]',
              'hover:opacity-90 transition-opacity',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Save className="h-3 w-3" />
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
