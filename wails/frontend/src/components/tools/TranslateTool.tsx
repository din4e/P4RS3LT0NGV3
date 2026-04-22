// @ts-nocheck
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/utils'
import { chatCompletion, isWailsMode } from '@/lib/services/chatCompletion'

const TOOL_ID = 'translate'

// ── data ─────────────────────────────────────────────────────────────

const LANG_CODE_MAP: Record<string, string> = {
  'Spanish': 'es', 'French': 'fr', 'German': 'de', 'Chinese': 'zh',
  'Japanese': 'ja', 'Korean': 'ko', 'Arabic': 'ar', 'Russian': 'ru',
  'Hindi': 'hi', 'Portuguese': 'pt', 'Italian': 'it', 'Dutch': 'nl',
  'Turkish': 'tr', 'Vietnamese': 'vi', 'Thai': 'th', 'Polish': 'pl',
  'Latin': 'la', 'Sanskrit': 'sa', 'Ancient Greek': 'grc',
  'Egyptian Arabic': 'arz', 'Old English': 'ang', 'Sumerian': 'sux',
  'Akkadian': 'akk', 'Hawaiian': 'haw', 'Welsh': 'cy', 'Swahili': 'sw',
  'Hebrew': 'he', 'Persian': 'fa', 'Tamil': 'ta', 'Esperanto': 'eo',
  'Irish': 'ga', 'Basque': 'eu', 'Navajo': 'nv', 'Quechua': 'qu',
  'Nahuatl': 'nah', 'Tagalog': 'tl', 'Maori': 'mi', 'Yoruba': 'yo',
  'Zulu': 'zu', 'Catalan': 'ca', 'Romanian': 'ro', 'Czech': 'cs',
  'Indonesian': 'id', 'Malay': 'ms', 'Bengali': 'bn', 'Urdu': 'ur',
}

interface LangEntry {
  code: string
  name: string
  flag: string
  label?: string
}

const MAIN_LANGS: LangEntry[] = [
  { code: 'es', name: 'Spanish', flag: 'ES' },
  { code: 'fr', name: 'French', flag: 'FR' },
  { code: 'de', name: 'German', flag: 'DE' },
  { code: 'zh', name: 'Chinese', flag: 'CN' },
  { code: 'ja', name: 'Japanese', flag: 'JP' },
  { code: 'ko', name: 'Korean', flag: 'KR' },
  { code: 'ar', name: 'Arabic', flag: 'SA' },
  { code: 'ru', name: 'Russian', flag: 'RU' },
  { code: 'hi', name: 'Hindi', flag: 'IN' },
  { code: 'pt', name: 'Portuguese', flag: 'PT' },
]

const EXOTIC_LANGS: LangEntry[] = [
  { code: 'lzh', name: 'Classical Chinese', flag: 'CN', label: '文言文' },
  { code: 'la', name: 'Latin', flag: 'VA', label: 'Dead' },
  { code: 'sa', name: 'Sanskrit', flag: 'IN', label: 'Ancient' },
  { code: 'grc', name: 'Ancient Greek', flag: 'GR', label: 'Ancient' },
  { code: 'arz', name: 'Egyptian Arabic', flag: 'EG', label: 'Regional' },
  { code: 'ang', name: 'Old English', flag: 'GB', label: 'Dead' },
  { code: 'sux', name: 'Sumerian', flag: 'IQ', label: 'Dead' },
  { code: 'akk', name: 'Akkadian', flag: 'IQ', label: 'Dead' },
  { code: 'haw', name: 'Hawaiian', flag: 'US', label: 'Endangered' },
  { code: 'cy', name: 'Welsh', flag: 'GB', label: 'Celtic' },
  { code: 'sw', name: 'Swahili', flag: 'KE', label: 'African' },
]

const FALLBACK_MODELS = [
  { id: 'google/gemma-3-27b-it', name: 'Gemma 3 27B', note: 'Best quality' },
  { id: 'google/gemma-3-12b-it', name: 'Gemma 3 12B', note: 'Fast + good' },
  { id: 'google/gemma-3-4b-it', name: 'Gemma 3 4B', note: 'Fastest' },
  { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash', note: 'Google flagship' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', note: 'Stable' },
]

const FLAG_MAP: Record<string, string> = {
  ES: '\uD83C\uDDEA\uD83C\uDDF8', FR: '\uD83C\uDDEB\uD83C\uDDF7',
  DE: '\uD83C\uDDE9\uD83C\uDDEA', CN: '\uD83C\uDDE8\uD83C\uDDF3',
  JP: '\uD83C\uDDEF\uD83C\uDDF5', KR: '\uD83C\uDDF0\uD83C\uDDF7',
  SA: '\uD83C\uDDF8\uD83C\uDDE6', RU: '\uD83C\uDDF7\uD83C\uDDFA',
  IN: '\uD83C\uDDEE\uD83C\uDDF3', PT: '\uD83C\uDDF5\uD83C\uDDF9',
  VA: '\uD83C\uDDFB\uD83C\uDDE6', GR: '\uD83C\uDDEC\uD83C\uDDF7',
  EG: '\uD83C\uDDEA\uD83C\uDDEC', GB: '\uD83C\uDDEC\uD83C\uDDE7',
  IQ: '\uD83C\uDDEE\uD83C\uDDF6', US: '\uD83C\uDDFA\uD83C\uDDF8',
  KE: '\uD83C\uDDF0\uD83C\uDDEA', BR: '\uD83C\uDDE7\uD83C\uDDF7',
}

function getFlag(code: string): string {
  return FLAG_MAP[code] || '\uD83C\uDF10'
}

// ── component ────────────────────────────────────────────────────────

export default function Tool() {
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const apiKeyConfigured = useSettingsStore((s) => s.apiKeyConfigured)
  const getEffectiveProvider = useSettingsStore((s) => s.getEffectiveProvider)
  const getEffectiveModel = useSettingsStore((s) => s.getEffectiveModel)
  const setModel = useSettingsStore((s) => s.setModel)

  const provider = useMemo(() => getEffectiveProvider('translate'), [getEffectiveProvider])
  const hasProvider = !!provider

  // Build model options from provider or fallback
  const modelOptions = useMemo(() => {
    if (provider?.models?.length) {
      return provider.models.map((id) => ({ id, name: id.split('/').pop() || id, note: '' }))
    }
    return FALLBACK_MODELS
  }, [provider])

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [model, setLocalModel] = useState(() => {
    if (typeof window === 'undefined') return FALLBACK_MODELS[0].id
    const saved = localStorage.getItem('translate-model')
    if (saved) return saved
    // Try to use the system-configured model for this tool
    const sysModel = useSettingsStore.getState().getEffectiveModel('translate')
    return sysModel || FALLBACK_MODELS[0].id
  })
  const [loading, setLoading] = useState(false)
  const [activeLang, setActiveLang] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Ensure model is valid when provider changes
  const effectiveModel = useMemo(() => {
    if (modelOptions.some((m) => m.id === model)) return model
    return modelOptions[0]?.id || ''
  }, [model, modelOptions])

  const handleModelChange = useCallback((newModel: string) => {
    setLocalModel(newModel)
    localStorage.setItem('translate-model', newModel)
    setModel('translate', newModel)
  }, [setModel])

  const flash = useCallback(
    async (text: string) => {
      const ok = await copyToClipboard(text)
      if (ok) {
        addHistoryItem(text, 'Translate')
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }
    },
    [copyToClipboard, addHistoryItem],
  )

  const translateTo = useCallback(async (lang: LangEntry) => {
    if (!input.trim()) {
      setError('Enter text to translate.')
      return
    }
    if (!apiKeyConfigured && !isWailsMode() && !hasProvider) {
      setError('No API key. Configure a provider in Settings.')
      return
    }

    setLoading(true)
    setActiveLang(lang.name)
    setError('')
    setOutput('')

    localStorage.setItem('translate-model', effectiveModel)

    const prompt =
      `You are a professional English (en) to ${lang.name} (${lang.code}) translator. ` +
      `Your goal is to accurately convey the meaning and nuances of the original English text ` +
      `while adhering to ${lang.name} grammar, vocabulary, and cultural sensitivities. ` +
      `Produce only the ${lang.name} translation, without any additional explanations or commentary. ` +
      `Please translate the following English text into ${lang.name}:\n\n${input}`

    try {
      const result = await chatCompletion({
        model: effectiveModel,
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator using the TranslateGemma translation protocol. Output ONLY the translated text. No explanations, notes, preamble, or alternatives. Preserve all formatting, line breaks, and structure.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        maxTokens: 4096,
        toolId: TOOL_ID,
      })
      setOutput(result)
      flash(result)
    } catch (e: any) {
      setError(e.message || 'Translation failed.')
    } finally {
      setLoading(false)
      setActiveLang('')
    }
  }, [input, effectiveModel, apiKeyConfigured, hasProvider, flash])

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

  const labelCls = 'text-xs font-medium text-[var(--muted-foreground)] mb-1'

  // ── render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Translate
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {hasProvider
            ? `AI-powered translation via ${provider.name}`
            : 'AI-powered translation via OpenRouter'}
        </p>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Text to translate</label>
        <textarea
          className={cn(inputCls, 'min-h-[80px] resize-y')}
          placeholder="Enter text to translate..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
        />
      </div>

      {/* Model */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>
          Model {hasProvider && <span className="text-[var(--primary)]">({provider.name})</span>}
        </label>
        <select className={selectCls} value={effectiveModel} onChange={(e) => handleModelChange(e.target.value)}>
          {modelOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}{m.note ? ` (${m.note})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Main language buttons */}
      <div className="flex flex-col gap-2">
        <label className={labelCls}>Major Languages</label>
        <div className="flex flex-wrap gap-1.5">
          {MAIN_LANGS.map((lang) => (
            <button
              key={lang.code}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors',
                loading && activeLang === lang.name
                  ? 'bg-[var(--primary)]/50 text-[var(--primary-foreground)] border-[var(--primary)] animate-pulse'
                  : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--accent)]',
              )}
              onClick={() => translateTo(lang)}
              disabled={loading}
            >
              <span>{getFlag(lang.flag)}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Exotic language buttons */}
      <div className="flex flex-col gap-2">
        <label className={labelCls}>Exotic / Dead Languages</label>
        <div className="flex flex-wrap gap-1.5">
          {EXOTIC_LANGS.map((lang) => (
            <button
              key={lang.code}
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border transition-colors',
                loading && activeLang === lang.name
                  ? 'bg-[var(--primary)]/50 text-[var(--primary-foreground)] border-[var(--primary)] animate-pulse'
                  : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--accent)]',
              )}
              onClick={() => translateTo(lang)}
              disabled={loading}
              title={lang.label}
            >
              <span>{getFlag(lang.flag)}</span>
              <span>{lang.name}</span>
              {lang.label && (
                <span className="text-[10px] text-[var(--muted-foreground)]">({lang.label})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/40 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className={labelCls}>Translation</label>
            <button
              type="button"
              onClick={() => flash(output)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors',
                copied
                  ? 'bg-green-500/10 text-green-500 border-green-500/30'
                  : 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)] hover:bg-[var(--accent)]',
              )}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            readOnly
            value={output}
            className={cn(inputCls, 'min-h-[60px] resize-y')}
            rows={4}
          />
        </div>
      )}
    </div>
  )
}
