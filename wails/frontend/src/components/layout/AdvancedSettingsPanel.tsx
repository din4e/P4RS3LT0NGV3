'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  X, Save, Eye, EyeOff, KeyRound, Settings2, Globe, ChevronDown, ChevronRight,
  Plus, Pencil, Trash2, Star, RefreshCw, Check
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/utils'
import { ProviderModal } from './ProviderModal'
import { getProviderModels, testProviderConnection } from '@/lib/services/modelFetcher'
import type { APIProvider } from '@/types/provider'

// Dynamic icon imports from @lobehub/icons
import OpenAI from '@lobehub/icons/es/OpenAI'
import Anthropic from '@lobehub/icons/es/Anthropic'
import Google from '@lobehub/icons/es/Google'
import DeepSeek from '@lobehub/icons/es/DeepSeek'
import Qwen from '@lobehub/icons/es/Qwen'
import Moonshot from '@lobehub/icons/es/Moonshot'
import ChatGLM from '@lobehub/icons/es/ChatGLM'
import Minimax from '@lobehub/icons/es/Minimax'
import Yi from '@lobehub/icons/es/Yi'
import Baichuan from '@lobehub/icons/es/Baichuan'
import Baidu from '@lobehub/icons/es/Baidu'
import Spark from '@lobehub/icons/es/Spark'
import Hunyuan from '@lobehub/icons/es/Hunyuan'
import SiliconCloud from '@lobehub/icons/es/SiliconCloud'
import OpenRouter from '@lobehub/icons/es/OpenRouter'

// Icon mapping based on provider name keywords
function getProviderIcon(name: string): React.ComponentType<{ size?: number }> | null {
  const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
    OpenAI,
    Anthropic,
    Google,
    DeepSeek,
    Qwen,
    Moonshot,
    ChatGLM,
    Minimax,
    Yi,
    Baichuan,
    Baidu,
    Spark,
    Hunyuan,
    SiliconCloud,
    OpenRouter,
  }

  const key = Object.keys(iconMap).find(k => name.toLowerCase().includes(k.toLowerCase()))
  return key ? iconMap[key] : null
}

/**
 * Slide-in sidebar panel for advanced settings with multi-provider support.
 */
export function AdvancedSettingsPanel() {
  const t = useTranslations('header')
  const tProv = useTranslations('settings.providers')

  const showAdvancedSettings = useAppStore((s) => s.showAdvancedSettings)
  const toggleAdvancedSettings = useAppStore((s) => s.toggleAdvancedSettings)

  // Provider state
  const providers = useSettingsStore((s) => s.providers)
  const defaultProviderId = useSettingsStore((s) => s.defaultProviderId)
  const setDefaultProvider = useSettingsStore((s) => s.setDefaultProvider)
  const removeProvider = useSettingsStore((s) => s.removeProvider)
  const setProviderModels = useSettingsStore((s) => s.setProviderModels)

  // Legacy state (for backward compatibility)
  const apiKey = useSettingsStore((s) => s.apiKey)
  const setApiKey = useSettingsStore((s) => s.setApiKey)
  const stegBitOrder = useSettingsStore((s) => s.stegBitOrder)

  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl)
  const setApiBaseUrl = useSettingsStore((s) => s.setApiBaseUrl)
  const [baseUrlInput, setBaseUrlInput] = useState(apiBaseUrl)

  const [showApiKey, setShowApiKey] = useState(false)
  const [keyInput, setKeyInput] = useState(apiKey)
  const [expandedSection, setExpandedSection] = useState<string | null>('providers')

  // Modal state
  const [showProviderModal, setShowProviderModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<APIProvider | null>(null)
  const [refreshingProvider, setRefreshingProvider] = useState<string | null>(null)

  // Provider actions
  const handleAddProvider = () => {
    setEditingProvider(null)
    setShowProviderModal(true)
  }

  const handleEditProvider = (provider: APIProvider) => {
    setEditingProvider(provider)
    setShowProviderModal(true)
  }

  const handleDeleteProvider = (id: string) => {
    if (confirm(tProv('confirmDelete'))) {
      removeProvider(id)
    }
  }

  const handleSetDefault = (id: string) => {
    setDefaultProvider(id)
  }

  const handleRefreshModels = async (provider: APIProvider) => {
    setRefreshingProvider(provider.id)
    try {
      const models = await getProviderModels(provider, true)
      setProviderModels(provider.id, models)
    } catch (error) {
      console.error('[AdvancedSettingsPanel] Failed to refresh models:', error)
    } finally {
      setRefreshingProvider(null)
    }
  }

  // Legacy actions
  const handleSaveApiKey = async () => {
    setApiKey(keyInput)
  }

  const handleSaveBaseUrl = async () => {
    const url = baseUrlInput.trim()
    setApiBaseUrl(url)
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  // Get provider list
  const providerList = Object.values(providers)
  const hasProviders = providerList.length > 0

  return (
    <>
      <aside
        className={cn(
          'flex flex-col h-full border-l shrink-0 overflow-hidden',
          'transition-all duration-300 ease-in-out',
          showAdvancedSettings ? 'w-80' : 'w-0',
        )}
        style={{ borderLeftColor: 'var(--border)' }}
        aria-hidden={!showAdvancedSettings}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between px-4 py-3 shrink-0',
            'border-b',
          )}
          style={{ borderBottomColor: 'var(--border)' }}
        >
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Settings2 className="h-4 w-4" />
            {t('advancedSettings')}
          </h3>
          <button
            type="button"
            onClick={toggleAdvancedSettings}
            title={t('close')}
            className={cn(
              'inline-flex items-center justify-center h-7 w-7 rounded',
              'text-[var(--muted-foreground)]',
              'hover:text-[var(--foreground)] hover:bg-[var(--muted)]',
              'transition-colors',
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* ---- My Providers Section ---- */}
          <CollapsibleSection
            title={tProv('myProviders')}
            icon={<Globe className="h-4 w-4" />}
            expanded={expandedSection === 'providers'}
            onToggle={() => toggleSection('providers')}
            rightElement={
              <button
                type="button"
                onClick={handleAddProvider}
                className={cn(
                  'inline-flex items-center justify-center h-6 w-6 rounded',
                  'text-[var(--primary)] hover:bg-[var(--primary)]/10',
                  'transition-colors'
                )}
                title={tProv('addProvider')}
              >
                <Plus className="h-4 w-4" />
              </button>
            }
          >
            <div className="space-y-2">
              {hasProviders ? (
                providerList.map((provider) => {
                  const IconComponent = getProviderIcon(provider.name)
                  const isDefault = provider.id === defaultProviderId
                  const isRefreshing = refreshingProvider === provider.id
                  const modelCount = provider.models?.length ?? 0

                  return (
                    <div
                      key={provider.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg',
                        'border border-[var(--border)]',
                        isDefault && 'border-[var(--primary)]/50 bg-[var(--primary)]/5'
                      )}
                    >
                      {/* Icon */}
                      {IconComponent ? (
                        <IconComponent size={18} />
                      ) : (
                        <Globe className="h-[18px] w-[18px] text-[var(--muted-foreground)]" />
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium truncate">{provider.name}</span>
                          {isDefault && (
                            <Star className="h-3 w-3 text-[var(--primary)] fill-current" />
                          )}
                        </div>
                        <div className="text-[10px] text-[var(--muted-foreground)] truncate">
                          {modelCount > 0
                            ? tProv('modelCount', { count: modelCount })
                            : tProv('noModelsFetched')}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleRefreshModels(provider)}
                          disabled={isRefreshing}
                          className={cn(
                            'inline-flex items-center justify-center h-6 w-6 rounded',
                            'text-[var(--muted-foreground)]',
                            'hover:text-[var(--foreground)] hover:bg-[var(--muted)]',
                            'transition-colors',
                            'disabled:opacity-50'
                          )}
                          title={tProv('refreshModels')}
                        >
                          <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
                        </button>
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(provider.id)}
                            className={cn(
                              'inline-flex items-center justify-center h-6 w-6 rounded',
                              'text-[var(--muted-foreground)]',
                              'hover:text-[var(--primary)] hover:bg-[var(--muted)]',
                              'transition-colors'
                            )}
                            title={tProv('setDefault')}
                          >
                            <Star className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEditProvider(provider)}
                          className={cn(
                            'inline-flex items-center justify-center h-6 w-6 rounded',
                            'text-[var(--muted-foreground)]',
                            'hover:text-[var(--foreground)] hover:bg-[var(--muted)]',
                            'transition-colors'
                          )}
                          title={tProv('editProvider')}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProvider(provider.id)}
                          className={cn(
                            'inline-flex items-center justify-center h-6 w-6 rounded',
                            'text-[var(--muted-foreground)]',
                            'hover:text-[var(--destructive)] hover:bg-[var(--muted)]',
                            'transition-colors'
                          )}
                          title={tProv('deleteProvider')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-[var(--muted-foreground)] mb-3">
                    {tProv('noProviders')}
                  </p>
                  <button
                    type="button"
                    onClick={handleAddProvider}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md',
                      'bg-[var(--primary)] text-[var(--primary-foreground)]',
                      'hover:opacity-90 transition-opacity'
                    )}
                  >
                    <Plus className="h-3 w-3" />
                    {tProv('addFirstProvider')}
                  </button>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Divider */}
          <div className="h-px bg-[var(--border)] mx-4" />

          {/* ---- Steganography Options ---- */}
          <CollapsibleSection
            title={t('stegOptions')}
            icon={<Settings2 className="h-4 w-4" />}
            expanded={expandedSection === 'steg'}
            onToggle={() => toggleSection('steg')}
          >
            <div className="space-y-2">
              <label className="text-xs text-[var(--muted-foreground)]">{t('bitOrder')}</label>
              <select
                value={stegBitOrder}
                onChange={(e) => useSettingsStore.setState({ stegBitOrder: e.target.value })}
                className={cn(
                  'w-full px-3 py-2 text-sm rounded-lg',
                  'bg-[var(--muted)] text-[var(--foreground)]',
                  'border border-[var(--border)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
                )}
              >
                <option value="MSB">MSB First</option>
                <option value="LSB">LSB First</option>
              </select>
            </div>
          </CollapsibleSection>

          {/* Divider */}
          <div className="h-px bg-[var(--border)] mx-4" />

          {/* ---- Legacy API Key Section (shown when no providers) ---- */}
          {!hasProviders && (
            <>
              <CollapsibleSection
                title={t('apiKey')}
                icon={<KeyRound className="h-4 w-4" />}
                expanded={expandedSection === 'apikey'}
                onToggle={() => toggleSection('apikey')}
              >
                <div className="space-y-3">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {t('apiKeyHint')}
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="sk-or-..."
                      autoComplete="off"
                      spellCheck={false}
                      className={cn(
                        'flex-1 min-w-0 px-3 py-2 text-sm rounded-lg',
                        'bg-[var(--muted)] text-[var(--foreground)]',
                        'border border-[var(--border)]',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
                        'placeholder:text-[var(--muted-foreground)]',
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((v) => !v)}
                      title={showApiKey ? t('hideKey') : t('showKey')}
                      className={cn(
                        'inline-flex items-center justify-center h-9 w-9 rounded-lg',
                        'text-[var(--muted-foreground)]',
                        'hover:bg-[var(--muted)] transition-colors',
                      )}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    disabled={!keyInput}
                    className={cn(
                      'w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg',
                      'bg-[var(--primary)] text-[var(--primary-foreground)]',
                      'hover:opacity-90 transition-opacity',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                  >
                    <Save className="h-4 w-4" />
                    {t('saveKey')}
                  </button>
                </div>
              </CollapsibleSection>

              {/* Divider */}
              <div className="h-px bg-[var(--border)] mx-4" />

              {/* ---- Custom URL Section ---- */}
              <CollapsibleSection
                title={t('apiBaseUrl')}
                icon={<Globe className="h-4 w-4" />}
                expanded={expandedSection === 'url'}
                onToggle={() => toggleSection('url')}
              >
                <div className="space-y-3">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {t('apiBaseUrlHint')}
                  </p>

                  <input
                    type="text"
                    value={baseUrlInput}
                    onChange={(e) => setBaseUrlInput(e.target.value)}
                    placeholder="https://openrouter.ai/api/v1"
                    autoComplete="off"
                    spellCheck={false}
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-lg',
                      'bg-[var(--muted)] text-[var(--foreground)]',
                      'border border-[var(--border)]',
                      'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
                      'placeholder:text-[var(--muted-foreground)]',
                    )}
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveBaseUrl}
                      className={cn(
                        'flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg',
                        'bg-[var(--primary)] text-[var(--primary-foreground)]',
                        'hover:opacity-90 transition-opacity',
                      )}
                    >
                      <Save className="h-4 w-4" />
                      {t('saveKey')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBaseUrlInput('')
                        setApiBaseUrl('')
                      }}
                      className={cn(
                        'inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg',
                        'text-[var(--muted-foreground)]',
                        'hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors',
                      )}
                    >
                      {t('resetDefaults')}
                    </button>
                  </div>
                </div>
              </CollapsibleSection>
            </>
          )}
        </div>
      </aside>

      {/* Provider Modal */}
      <ProviderModal
        isOpen={showProviderModal}
        onClose={() => {
          setShowProviderModal(false)
          setEditingProvider(null)
        }}
        editProvider={editingProvider}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Collapsible Section Component                                       */
/* ------------------------------------------------------------------ */

function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
  rightElement,
}: {
  title: string
  icon: React.ReactNode
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
  rightElement?: React.ReactNode
}) {
  return (
    <div className="border-b border-[var(--border)]">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex-1 flex items-center gap-2',
            'text-sm font-medium text-[var(--foreground)]',
            'hover:bg-[var(--muted)]/50 transition-colors',
            '-ml-4 px-4 -my-3 py-3 rounded',
          )}
        >
          {icon}
          {title}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)] ml-auto" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] ml-auto" />
          )}
        </button>
        {rightElement && (
          <div className="shrink-0 ml-1">
            {rightElement}
          </div>
        )}
      </div>
      {expanded && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}
