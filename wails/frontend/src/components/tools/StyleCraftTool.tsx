'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Feather, Copy, Check, Sparkles, ShieldCheck, Gauge } from 'lucide-react'
import { toast } from 'sonner'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { cn } from '@/lib/utils'
import {
  SC_USE_CASES, SC_WENYAN, SC_POETRY,
  generateCandidates, suggestLockedTerms, parseLockedTerms,
  type StyleCraftMode, type PoetryForm, type StyleCandidate, type CandidateOptions,
} from '@/lib/stylecraft/stylecraftEngine'

// localStorage persistence keys (namespaced under this tool).
const STORE = {
  mode: 'stylecraft-mode',
  useCase: 'stylecraft-use-case',
  wenyan: 'stylecraft-wenyan-template',
  poetry: 'stylecraft-poetry-template',
  form: 'stylecraft-poetry-form',
  level: 'stylecraft-style-level',
  auto: 'stylecraft-auto-protect',
  locks: 'stylecraft-locked-terms',
} as const

function scRead(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function scWrite(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore quota errors */
  }
}

export default function Tool() {
  const t = useTranslations('stylecraft')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)

  const [input, setInput] = useState('')
  const [mode, setMode] = useState<StyleCraftMode>(
    scRead(STORE.mode, 'wenyan') === 'poetry' ? 'poetry' : 'wenyan'
  )
  const [useCase, setUseCase] = useState(scRead(STORE.useCase, 'general'))
  const [wenyanTemplate, setWenyanTemplate] = useState(scRead(STORE.wenyan, 'balanced'))
  const [poetryTemplate, setPoetryTemplate] = useState(scRead(STORE.poetry, 'freeverse'))
  const [poetryForm, setPoetryForm] = useState<PoetryForm>(
    (['freeverse', 'quatrain', 'regulated'] as const).includes(scRead(STORE.form, 'freeverse') as PoetryForm)
      ? (scRead(STORE.form, 'freeverse') as PoetryForm)
      : 'freeverse'
  )
  const [styleLevel, setStyleLevel] = useState(() =>
    Math.max(1, Math.min(3, Number(scRead(STORE.level, '2')) || 2))
  )
  const [autoProtect, setAutoProtect] = useState(scRead(STORE.auto, '1') !== '0')
  const [lockedTermsInput, setLockedTermsInput] = useState(scRead(STORE.locks, ''))
  const [candidates, setCandidates] = useState<StyleCandidate[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  // Persist settings on change.
  useEffect(() => { scWrite(STORE.mode, mode) }, [mode])
  useEffect(() => { scWrite(STORE.useCase, useCase) }, [useCase])
  useEffect(() => { scWrite(STORE.wenyan, wenyanTemplate) }, [wenyanTemplate])
  useEffect(() => { scWrite(STORE.poetry, poetryTemplate) }, [poetryTemplate])
  useEffect(() => { scWrite(STORE.form, poetryForm) }, [poetryForm])
  useEffect(() => { scWrite(STORE.level, String(styleLevel)) }, [styleLevel])
  useEffect(() => { scWrite(STORE.auto, autoProtect ? '1' : '0') }, [autoProtect])
  useEffect(() => { scWrite(STORE.locks, lockedTermsInput) }, [lockedTermsInput])

  const parsedLockedTerms = useMemo(() => parseLockedTerms(lockedTermsInput), [lockedTermsInput])

  const suggestedTerms = useMemo(() => suggestLockedTerms(input), [input])

  const allLockedTerms = useMemo(
    () =>
      Array.from(
        new Set((autoProtect ? suggestedTerms : []).concat(parsedLockedTerms)),
      ).slice(0, 24),
    [autoProtect, suggestedTerms, parsedLockedTerms],
  )

  const templates = mode === 'poetry' ? SC_POETRY : SC_WENYAN
  const selectedTemplateId = mode === 'poetry' ? poetryTemplate : wenyanTemplate
  const selectedTemplate = templates.find((tpl) => tpl.id === selectedTemplateId) ?? templates[0]
  const selectedUseCase = SC_USE_CASES.find((uc) => uc.id === useCase) ?? SC_USE_CASES[0]

  const toggleSuggestedTerm = (term: string) => {
    const next = parsedLockedTerms.includes(term)
      ? parsedLockedTerms.filter((tt) => tt !== term)
      : parsedLockedTerms.concat(term)
    setLockedTermsInput(next.join('，'))
  }

  const generate = useCallback(() => {
    if (!input.trim()) {
      setError(t('emptyInput'))
      return
    }
    setError('')
    const opts: CandidateOptions = {
      mode,
      useCase,
      wenyanTemplate,
      poetryTemplate,
      poetryForm,
      styleLevel,
      lockedTerms: allLockedTerms,
    }
    const result = generateCandidates(input, opts)
    setCandidates(result)
    setSelectedIndex(0)
    setOutput(result[0]?.text ?? '')
    if (result.length) toast.success(t('generated'))
  }, [input, mode, useCase, wenyanTemplate, poetryTemplate, poetryForm, styleLevel, allLockedTerms, t])

  const applyCandidate = (index: number) => {
    const candidate = candidates[index]
    if (!candidate) return
    setSelectedIndex(index)
    setOutput(candidate.text)
  }

  const flash = (key: string, text: string) => {
    copyToClipboard(text)
    addHistoryItem(text, 'StyleCraft')
    setCopied(key)
    setTimeout(() => setCopied(null), 1200)
  }

  const selectClass =
    'rounded-md px-3 py-2 text-sm bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] outline-none focus:border-[var(--primary)]'

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
          <Feather className="w-5 h-5 text-[var(--primary)]" />
          {t('title')}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">{t('description')}</p>
      </div>

      {/* Options */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* Mode */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--muted-foreground)]">{t('modeLabel')}</span>
            <div className="flex rounded-md border border-[var(--border)] overflow-hidden">
              {(['wenyan', 'poetry'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={cn(
                    'px-3 py-2 text-sm transition-colors',
                    mode === m
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]'
                  )}
                  onClick={() => setMode(m)}
                >
                  {t(`mode_${m}`)}
                </button>
              ))}
            </div>
          </label>

          {/* Use case */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--muted-foreground)]">{t('useCaseLabel')}</span>
            <select className={selectClass} value={useCase} onChange={(e) => setUseCase(e.target.value)}>
              {SC_USE_CASES.map((uc) => (
                <option key={uc.id} value={uc.id}>{uc.title}</option>
              ))}
            </select>
          </label>

          {/* Template */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--muted-foreground)]">{t('templateLabel')}</span>
            <select
              className={selectClass}
              value={selectedTemplateId}
              onChange={(e) =>
                mode === 'poetry'
                  ? setPoetryTemplate(e.target.value)
                  : setWenyanTemplate(e.target.value)
              }
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>{tpl.title}</option>
              ))}
            </select>
          </label>

          {/* Poetry form */}
          {mode === 'poetry' && (
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--muted-foreground)]">{t('formLabel')}</span>
              <select
                className={selectClass}
                value={poetryForm}
                onChange={(e) => setPoetryForm(e.target.value as PoetryForm)}
              >
                {SC_POETRY.map((form) => (
                  <option key={form.id} value={form.id}>{form.title}</option>
                ))}
              </select>
            </label>
          )}

          {/* Style level */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--muted-foreground)]">{t('levelLabel')}</span>
            <div className="flex rounded-md border border-[var(--border)] overflow-hidden">
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={cn(
                    'px-3 py-2 text-sm transition-colors',
                    styleLevel === lvl
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]'
                  )}
                  onClick={() => setStyleLevel(lvl)}
                >
                  {t(`level_${lvl}`)}
                </button>
              ))}
            </div>
          </label>
        </div>

        <p className="text-xs text-[var(--muted-foreground)]">
          {[selectedUseCase.desc, selectedTemplate.hint].filter(Boolean).join(' · ')}
        </p>

        {/* Locked terms */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                className="accent-[var(--primary)]"
                checked={autoProtect}
                onChange={(e) => setAutoProtect(e.target.checked)}
              />
              <ShieldCheck className="w-4 h-4 text-[var(--muted-foreground)]" />
              {t('autoProtect')}
            </label>
            <span className="text-xs text-[var(--muted-foreground)]">
              {allLockedTerms.length
                ? t('protectedCount', { count: allLockedTerms.length })
                : t('noProtected')}
            </span>
          </div>
          {suggestedTerms.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestedTerms.map((term) => {
                const active = parsedLockedTerms.includes(term)
                return (
                  <button
                    key={term}
                    type="button"
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full border transition-colors',
                      active
                        ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]'
                    )}
                    onClick={() => toggleSuggestedTerm(term)}
                  >
                    {term}
                  </button>
                )
              })}
            </div>
          )}
          <textarea
            className="w-full min-h-[44px] rounded-md px-3 py-2 text-sm bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--muted-foreground)]"
            placeholder={t('lockedTermsPlaceholder')}
            value={lockedTermsInput}
            onChange={(e) => setLockedTermsInput(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--foreground)]">{tc('input')}</label>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            onClick={generate}
          >
            <Sparkles className="w-4 h-4" />
            {t('generate')}
          </button>
        </div>
        <textarea
          className="w-full min-h-[140px] rounded-md px-3 py-2 text-sm bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--muted-foreground)]"
          placeholder={t('inputPlaceholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
        />
        {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
      </div>

      {/* Candidates */}
      {candidates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {candidates.map((candidate, index) => (
            <button
              key={candidate.title}
              type="button"
              className={cn(
                'text-left rounded-lg border p-3 flex flex-col gap-2 transition-colors',
                index === selectedIndex
                  ? 'border-[var(--primary)] bg-[var(--accent)]'
                  : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]'
              )}
              onClick={() => applyCandidate(index)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {t(candidate.title)}
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                  {t(candidate.note)}
                </span>
              </div>
              <p className="text-xs text-[var(--foreground)] line-clamp-4 whitespace-pre-wrap">
                {candidate.text}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
                <Gauge className="w-3.5 h-3.5" />
                <span>{t('metricFidelity', { value: candidate.metrics.fidelity })}</span>
                <span>{t('metricStyle', { value: candidate.metrics.style })}</span>
                {candidate.metrics.protectedTerms && (
                  <span>
                    {t('metricProtected', { value: candidate.metrics.protectedTerms })}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Output */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--foreground)]">{tc('output')}</label>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-colors"
            onClick={() => output.trim() && flash('output', output)}
          >
            {copied === 'output' ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied === 'output' ? tc('copied') : tc('copy')}
          </button>
        </div>
        <textarea
          className="w-full min-h-[140px] rounded-md px-3 py-2 text-sm bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] outline-none focus:border-[var(--primary)]"
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          rows={6}
        />
      </div>
    </div>
  )
}
