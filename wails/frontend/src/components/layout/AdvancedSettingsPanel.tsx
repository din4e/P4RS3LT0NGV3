'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Save, Eye, EyeOff, KeyRound, Settings2, Globe, ChevronDown, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/utils'
import { setAPIKey as persistAPIKey, setAPIBaseURL as persistBaseUrl } from '@/lib/wails'
import { getChineseProviders, getNonChineseGlobalProviders, getInternationalChineseProviders, type APIProvider } from '@/lib/utils/apiProviders'

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

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
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
  ModelScope: SiliconCloud, // Fallback
}

/**
 * Slide-in sidebar panel for advanced settings.
 */
export function AdvancedSettingsPanel() {
  const t = useTranslations('header')

  const showAdvancedSettings = useAppStore((s) => s.showAdvancedSettings)
  const toggleAdvancedSettings = useAppStore((s) => s.toggleAdvancedSettings)

  const apiKey = useSettingsStore((s) => s.apiKey)
  const setApiKey = useSettingsStore((s) => s.setApiKey)
  const stegBitOrder = useSettingsStore((s) => s.stegBitOrder)

  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl)
  const setApiBaseUrl = useSettingsStore((s) => s.setApiBaseUrl)
  const [baseUrlInput, setBaseUrlInput] = useState(apiBaseUrl)

  const [showApiKey, setShowApiKey] = useState(false)
  const [keyInput, setKeyInput] = useState(apiKey)
  const [expandedSection, setExpandedSection] = useState<string | null>('provider')

  const handleSaveApiKey = async () => {
    setApiKey(keyInput)
    try { await persistAPIKey(keyInput) } catch {}
  }

  const handleSelectProvider = async (provider: APIProvider) => {
    setBaseUrlInput(provider.baseUrl)
    setApiBaseUrl(provider.baseUrl)
    try { await persistBaseUrl(provider.baseUrl) } catch {}
  }

  const handleSaveBaseUrl = async () => {
    const url = baseUrlInput.trim()
    setApiBaseUrl(url)
    try { await persistBaseUrl(url) } catch {}
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
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
        {/* ---- API Provider Section ---- */}
        <CollapsibleSection
          title={t('apiProvider')}
          icon={<Globe className="h-4 w-4" />}
          expanded={expandedSection === 'provider'}
          onToggle={() => toggleSection('provider')}
        >
          <div className="space-y-4">
            {/* Global Providers */}
            <ProviderGroup
              title={t('globalProviders')}
              providers={getNonChineseGlobalProviders()}
              selectedUrl={apiBaseUrl}
              onSelect={handleSelectProvider}
            />

            {/* International Chinese Providers */}
            <ProviderGroup
              title={t('chineseIntlProviders')}
              providers={getInternationalChineseProviders()}
              selectedUrl={apiBaseUrl}
              onSelect={handleSelectProvider}
            />

            {/* Chinese Domestic Providers */}
            <ProviderGroup
              title={t('chineseProviders')}
              providers={getChineseProviders()}
              selectedUrl={apiBaseUrl}
              onSelect={handleSelectProvider}
            />
          </div>
        </CollapsibleSection>

        {/* Divider */}
        <div className="h-px bg-[var(--border)] mx-4" />

        {/* ---- API Key Section ---- */}
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
                onClick={async () => {
                  setBaseUrlInput('')
                  setApiBaseUrl('')
                  try { await persistBaseUrl('') } catch {}
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
      </div>
    </aside>
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
}: {
  title: string
  icon: React.ReactNode
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-[var(--border)]">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          'text-sm font-medium text-[var(--foreground)]',
          'hover:bg-[var(--muted)]/50 transition-colors',
        )}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Provider Group Component                                            */
/* ------------------------------------------------------------------ */

function ProviderGroup({
  title,
  providers,
  selectedUrl,
  onSelect,
}: {
  title: string
  providers: APIProvider[]
  selectedUrl: string
  onSelect: (provider: APIProvider) => void
}) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] font-medium">
        {title}
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        {providers.map((provider) => {
          const IconComponent = provider.icon ? ICON_MAP[provider.icon] : null
          const isSelected = selectedUrl === provider.baseUrl

          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => onSelect(provider)}
              title={provider.description}
              className={cn(
                'flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg text-left',
                'border transition-all duration-200',
                isSelected
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] ring-1 ring-[var(--primary)]/20'
                  : 'border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--muted)]/50',
              )}
            >
              {IconComponent && (
                <IconComponent size={16} style={{ flexShrink: 0 }} />
              )}
              <span className="truncate">{provider.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
