'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dices, Copy, Check, Eraser, Download, ArrowRight, RotateCcw, Dice5,
} from 'lucide-react'
import { toast } from 'sonner'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { useHandoffStore } from '@/stores/useHandoffStore'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import {
  listCategories,
  generateFixtures,
  serializeBatch,
  downloadBatch,
  type InjectionLanguage,
  type GeneratedFixture,
  type GenerationBatch,
  type ExportFormat,
} from '@/lib/injection/generator'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Tool() {
  const t = useTranslations('injectiongen')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const setHandoff = useHandoffStore((s) => s.setHandoff)
  const switchTab = useAppStore((s) => s.switchTab)

  const [language, setLanguage] = useState<InjectionLanguage>('zh')
  const [category, setCategory] = useState('all')
  const [count, setCount] = useState(3)
  const [custom, setCustom] = useState('')
  const [seed, setSeed] = useState('')
  const [fixtures, setFixtures] = useState<GeneratedFixture[]>([])
  const [batch, setBatch] = useState<GenerationBatch | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const categories = useMemo(() => listCategories(language), [language])

  const setLanguageAndReset = useCallback((lang: InjectionLanguage) => {
    setLanguage(lang)
    setCategory((prev) =>
      listCategories(lang).some((c) => c.id === prev) ? prev : 'all',
    )
    setFixtures([])
    setBatch(null)
  }, [])

  const generate = useCallback(() => {
    try {
      const result = generateFixtures({
        language,
        category,
        count,
        custom,
        seed,
      })
      setFixtures(result.fixtures)
      setBatch(result.batch)
      toast.success(t('toast.generated', { count: result.fixtures.length }))
    } catch (err) {
      const message = err instanceof Error ? err.message : t('toast.failed')
      toast.error(message)
    }
  }, [language, category, count, custom, seed, t])

  const flash = useCallback(
    (key: string, text: string) => {
      copyToClipboard(text)
      addHistoryItem(text, 'Injection Gen')
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1200)
    },
    [copyToClipboard, addHistoryItem],
  )

  const copyAll = useCallback(() => {
    if (!batch || fixtures.length === 0) return
    flash('all', serializeBatch(batch, fixtures, 'txt'))
  }, [batch, fixtures, flash])

  const exportAs = useCallback(
    (format: ExportFormat) => {
      if (!batch || fixtures.length === 0) return
      downloadBatch(batch, fixtures, format)
    },
    [batch, fixtures],
  )

  const sendToTransform = useCallback(
    (text: string) => {
      if (!text.trim()) return
      // Hand the text to the transforms tab; TransformsTool consumes the
      // handoff store and prefills its input.
      setHandoff({
        fromTool: 'injectiongen',
        title: t('handoffTitle'),
        content: text,
      })
      switchTab('transforms')
    },
    [setHandoff, switchTab, t],
  )

  const updateFixtureText = useCallback((index: number, text: string) => {
    setFixtures((prev) =>
      prev.map((f, i) => (i === index ? { ...f, text } : f)),
    )
  }, [])

  const restoreFixture = useCallback((index: number) => {
    setFixtures((prev) =>
      prev.map((f, i) => (i === index ? { ...f, text: f.generated } : f)),
    )
  }, [])

  const inputClass =
    'rounded-md px-3 py-2 text-sm bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--muted-foreground)]'
  const secondaryBtn =
    'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50 disabled:pointer-events-none'

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
          <Dices className="w-5 h-5 text-[var(--primary)]" />
          {t('title')}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {t('description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 items-start">
        {/* Controls */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {t('configure')}
          </h3>

          {/* Language */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[var(--muted-foreground)]">
              {t('languageLabel')}
            </span>
            <div className="flex rounded-md border border-[var(--border)] overflow-hidden w-fit">
              {(['zh', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  aria-pressed={language === lang}
                  className={cn(
                    'px-3 py-1.5 text-sm transition-colors',
                    language === lang
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]',
                  )}
                  onClick={() => setLanguageAndReset(lang)}
                >
                  {lang === 'zh' ? t('langZh') : t('langEn')}
                </button>
              ))}
            </div>
          </div>

          {/* Category + count */}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 min-w-0">
              <span className="text-xs text-[var(--muted-foreground)]">
                {t('categoryLabel')}
              </span>
              <select
                className={inputClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">{t('categoryAll')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--muted-foreground)]">
                {t('countLabel')}
              </span>
              <input
                type="number"
                min={1}
                max={20}
                step={1}
                className={inputClass}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </label>
          </div>

          {/* Custom instruction */}
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--muted-foreground)]">
              {t('customLabel')}
            </span>
            <textarea
              className={cn(inputClass, 'min-h-[72px]')}
              rows={3}
              placeholder={t('customPlaceholder')}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </label>

          {/* Reproducibility */}
          <details className="rounded-md border border-[var(--border)] px-3 py-2">
            <summary className="text-xs font-medium text-[var(--foreground)] cursor-pointer select-none">
              {t('advancedSummary')}
            </summary>
            <label className="flex flex-col gap-1 mt-2">
              <span className="text-xs text-[var(--muted-foreground)]">
                {t('seedLabel')}
              </span>
              <input
                className={inputClass}
                placeholder={t('seedPlaceholder')}
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
            </label>
          </details>

          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
              onClick={generate}
            >
              <Dice5 className="w-4 h-4" />
              {t('generate')}
            </button>
            <button
              type="button"
              className={secondaryBtn}
              disabled={fixtures.length === 0}
              onClick={() => {
                setFixtures([])
                setBatch(null)
              }}
            >
              <Eraser className="w-4 h-4" />
              {t('clearResults')}
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              {t('workspace')}
            </h3>
            {fixtures.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" className={secondaryBtn} onClick={copyAll}>
                  {copiedKey === 'all' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {t('copyAll')}
                </button>
                {(['txt', 'json', 'jsonl'] as const).map((format) => (
                  <button
                    key={format}
                    type="button"
                    className={secondaryBtn}
                    onClick={() => exportAs(format)}
                  >
                    <Download className="w-4 h-4" />
                    {t('exportFormat', { format: format.toUpperCase() })}
                  </button>
                ))}
              </div>
            )}
          </div>

          {batch && (
            <p className="text-xs text-[var(--muted-foreground)]">
              {t('batchSeed', { seed: batch.seed })}
            </p>
          )}

          <p className="text-xs text-[var(--muted-foreground)]" aria-live="polite">
            {fixtures.length === 0 ? t('noResults') : t('resultCount', { count: fixtures.length })}
          </p>

          {fixtures.map((fixture, index) => {
            const key = `fixture-${index}`
            const edited = fixture.text !== fixture.generated
            return (
              <div
                key={key}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">
                    {t('sampleTitle', { index: index + 1, category: fixture.categories })}
                  </h4>
                  <span className="text-[11px] text-[var(--muted-foreground)]">
                    {t('charCount', { count: fixture.text.length })}
                    {fixture.duplicate ? ` · ${t('duplicateFlag')}` : ''}
                    {edited ? ` · ${t('editedFlag')}` : ''}
                  </span>
                </div>

                <details className="rounded-md bg-[var(--muted)] px-3 py-2">
                  <summary className="text-xs text-[var(--muted-foreground)] cursor-pointer select-none">
                    {t('viewOriginal')}
                  </summary>
                  <pre className="mt-2 text-xs text-[var(--foreground)] whitespace-pre-wrap break-words font-mono">
                    {fixture.original}
                  </pre>
                </details>

                <label
                  htmlFor={`ig-result-${index}`}
                  className="text-xs text-[var(--muted-foreground)]"
                >
                  {t('editableLabel')}
                </label>
                <textarea
                  id={`ig-result-${index}`}
                  className={cn(inputClass, 'min-h-[120px] font-mono')}
                  rows={6}
                  value={fixture.text}
                  onChange={(e) => updateFixtureText(index, e.target.value)}
                />

                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none"
                    disabled={!fixture.text.trim()}
                    onClick={() => sendToTransform(fixture.text)}
                  >
                    <ArrowRight className="w-4 h-4" />
                    {t('sendToTransform')}
                  </button>
                  <button
                    type="button"
                    className={secondaryBtn}
                    disabled={!fixture.text.trim()}
                    onClick={() => flash(key, fixture.text)}
                  >
                    {copiedKey === key ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copiedKey === key ? tc('copied') : tc('copy')}
                  </button>
                  <button
                    type="button"
                    className={secondaryBtn}
                    onClick={() => restoreFixture(index)}
                  >
                    <RotateCcw className="w-4 h-4" />
                    {t('restore')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
