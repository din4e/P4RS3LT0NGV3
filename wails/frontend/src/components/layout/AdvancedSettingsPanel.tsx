'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { X, Save, Eye, EyeOff, KeyRound, UserRound, SlidersHorizontal } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/utils'

/**
 * Slide-in sidebar panel for advanced settings.
 *
 * Contains:
 * - OpenRouter API Key input with show/hide and save
 * - Steganography options (bit order, VS selectors, zero-width chars)
 */
export function AdvancedSettingsPanel() {
  const t = useTranslations('header')

  // Visibility toggle comes from the app-level store
  const showAdvancedSettings = useAppStore((s) => s.showAdvancedSettings)
  const toggleAdvancedSettings = useAppStore((s) => s.toggleAdvancedSettings)

  // Settings data comes from the dedicated settings store
  const apiKey = useSettingsStore((s) => s.apiKey)
  const setApiKey = useSettingsStore((s) => s.setApiKey)
  const stegBitOrder = useSettingsStore((s) => s.stegBitOrder)

  // Local UI state for the password visibility toggle
  const [showApiKey, setShowApiKey] = useState(false)
  const [keyInput, setKeyInput] = useState(apiKey)

  const handleSaveApiKey = () => {
    setApiKey(keyInput)
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
          <SlidersHorizontal className="h-4 w-4" />
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
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* ---- API Key Section ---- */}
        <section className="space-y-3">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            <KeyRound className="h-3.5 w-3.5" />
            {t('apiKey')}
          </h4>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t('apiKeyHint')}
          </p>

          {/* Input row */}
          <div className="flex items-center gap-1">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-or-..."
              autoComplete="off"
              spellCheck={false}
              className={cn(
                'flex-1 min-w-0 px-2.5 py-1.5 text-sm rounded-md',
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
                'inline-flex items-center justify-center h-8 w-8 rounded-md',
                'text-[var(--muted-foreground)]',
                'hover:bg-[var(--muted)] transition-colors',
              )}
            >
              {showApiKey ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSaveApiKey}
            disabled={!keyInput}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md',
              'bg-[var(--primary)] text-[var(--primary-foreground)]',
              'hover:opacity-90 transition-opacity',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <Save className="h-3 w-3" />
            {t('saveKey')}
          </button>
        </section>

        {/* ---- Divider ---- */}
        <hr className="border-[var(--border)]" />

        {/* ---- Steganography Options ---- */}
        <section className="space-y-3">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            <UserRound className="h-3.5 w-3.5" />
            {t('stegOptions')}
          </h4>

          <SelectField
            label={t('bitOrder')}
            value={stegBitOrder}
            onChange={(value) =>
              useSettingsStore.setState({ stegBitOrder: value })
            }
            options={[
              { value: 'MSB', label: 'MSB First' },
              { value: 'LSB', label: 'LSB First' },
            ]}
          />
        </section>
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* Internal reusable select field                                     */
/* ------------------------------------------------------------------ */

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-[var(--muted-foreground)]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full px-2.5 py-1.5 text-sm rounded-md',
          'bg-[var(--muted)] text-[var(--foreground)]',
          'border border-[var(--border)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
