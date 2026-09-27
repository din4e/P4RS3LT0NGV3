'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  BookOpen, Search, Terminal, FolderOpen, Github, Copy, Check, Download,
  ArrowLeftRight, RotateCcw, PenLine, FileWarning,
} from 'lucide-react'
import { toast } from 'sonner'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { useHandoffStore } from '@/stores/useHandoffStore'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { JAILBREAK_LIBRARY, type JailbreakLibraryEntry } from '@/lib/data/jailbreakLibrary'
import { loadDrafts, clearDraft, upsertDraft, type JailbreakDrafts } from '@/lib/injection/jailbreakLibraryStore'

/** Entries are edited as plain text even when the body is HTML markup. */
function isRepoEntry(entry: JailbreakLibraryEntry): boolean {
  return entry.kind === 'repository'
}

export default function Tool() {
  const t = useTranslations('jailbreak')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const setHandoff = useHandoffStore((s) => s.setHandoff)
  const switchTab = useAppStore((s) => s.switchTab)

  const [modelFilter, setModelFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(JAILBREAK_LIBRARY[0].id)
  const [text, setText] = useState(JAILBREAK_LIBRARY[0].text)
  const [drafts, setDrafts] = useState<JailbreakDrafts>({})
  const [resetPending, setResetPending] = useState(false)
  const [copied, setCopied] = useState(false)

  // Load persisted drafts on mount (client-only store).
  useEffect(() => {
    setDrafts(loadDrafts())
  }, [])

  const models = useMemo(
    () => [...new Set(JAILBREAK_LIBRARY.flatMap((e) => e.model.split(' / ')))],
    []
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return JAILBREAK_LIBRARY.filter(
      (entry) =>
        (modelFilter === 'all' ||
          entry.id === modelFilter ||
          entry.model.split(' / ').includes(modelFilter)) &&
        `${entry.model} ${entry.title} ${entry.text} ${entry.repo}`.toLowerCase().includes(q)
    )
  }, [modelFilter, query])

  const groups = useMemo(() => {
    const groupDefs = [
      {
        kind: 'prompt' as const,
        titleKey: 'groupPromptTitle',
        noteKey: 'groupPromptNote',
        kickerKey: 'groupPromptKicker',
        items: filtered.filter((e) => !isRepoEntry(e)),
      },
      {
        kind: 'repository' as const,
        titleKey: 'groupRepoTitle',
        noteKey: 'groupRepoNote',
        kickerKey: 'groupRepoKicker',
        items: filtered.filter(isRepoEntry),
      },
    ]
    return groupDefs.filter((g) => g.items.length > 0)
  }, [filtered])

  const selected = useMemo(
    () => JAILBREAK_LIBRARY.find((e) => e.id === selectedId) ?? JAILBREAK_LIBRARY[0],
    [selectedId]
  )

  const isModified = text !== selected.text

  const hasDraft = useCallback(
    (entry: JailbreakLibraryEntry) =>
      entry.id === selectedId
        ? isModified
        : Object.prototype.hasOwnProperty.call(drafts, entry.id) && drafts[entry.id] !== entry.text,
    [selectedId, isModified, drafts]
  )

  const selectEntry = useCallback(
    (entry: JailbreakLibraryEntry) => {
      if (entry.id === selectedId) return
      // Persist the current editor content as a draft before switching.
      setDrafts((prev) =>
        isModified ? upsertDraft(prev, selectedId, text) : clearDraft(prev, selectedId)
      )
      setSelectedId(entry.id)
      setText(Object.prototype.hasOwnProperty.call(drafts, entry.id) ? drafts[entry.id] : entry.text)
      setResetPending(false)
    },
    [selectedId, isModified, text, drafts]
  )

  const restore = useCallback(() => {
    setText(selected.text)
    setDrafts((prev) => clearDraft(prev, selected.id))
    setResetPending(false)
    toast.success(t('restoredToast'))
  }, [selected, t])

  const copyText = useCallback(() => {
    if (!text.trim()) return
    copyToClipboard(text)
    addHistoryItem(text, 'Jailbreak Library')
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
    toast.success(isRepoEntry(selected) ? t('copiedRepoToast') : t('copiedToast'))
  }, [text, copyToClipboard, addHistoryItem, selected, t])

  const exportTxt = useCallback(() => {
    if (!text.trim()) return
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'jailbreak-prompt.txt'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, [text])

  const sendToTransform = useCallback(() => {
    if (!text.trim()) return
    setHandoff({ fromTool: 'jailbreak', title: selected.title, content: text })
    switchTab('transforms')
  }, [text, selected, setHandoff, switchTab])

  const clearFilters = () => {
    setModelFilter('all')
    setQuery('')
  }

  const actionButtonClass =
    'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none'

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[var(--primary)]" />
          {t('title')}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">{t('description')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
        {/* Catalog */}
        <aside className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 flex flex-col gap-3 lg:max-h-[calc(100vh-160px)] lg:overflow-auto">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[var(--foreground)]">{t('catalogTitle')}</h4>
            <span className="text-xs text-[var(--muted-foreground)]">
              {t('builtinCount', { count: JAILBREAK_LIBRARY.length })}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="search"
                className="w-full rounded-md pl-9 pr-3 py-2 text-sm outline-none transition-colors bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] placeholder:text-[var(--muted-foreground)]"
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchLabel')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-xs text-[var(--muted-foreground)] shrink-0">{t('modelLabel')}</span>
              <select
                className="flex-1 rounded-md px-2 py-1.5 text-sm bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] outline-none focus:border-[var(--primary)]"
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
              >
                <option value="all">{t('modelAll')}</option>
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]" role="status">
              {t('resultCount', { count: filtered.length })}
            </span>
            {(query || modelFilter !== 'all') && (
              <button
                type="button"
                className="text-xs text-[var(--primary)] hover:underline"
                onClick={clearFilters}
              >
                {t('clearFilters')}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3" aria-label={t('catalogTitle')}>
            {groups.map((group) => (
              <section key={group.kind} className="flex flex-col gap-1.5">
                <header className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)] flex items-center gap-1">
                      {group.kind === 'repository' ? (
                        <FolderOpen className="w-3 h-3" />
                      ) : (
                        <Terminal className="w-3 h-3" />
                      )}
                      {t(group.kickerKey)}
                    </span>
                    <strong className="text-sm text-[var(--foreground)]">{t(group.titleKey)}</strong>
                    <span className="text-[11px] text-[var(--muted-foreground)]">{t(group.noteKey)}</span>
                  </div>
                  <b className="text-xs text-[var(--muted-foreground)]">{group.items.length}</b>
                </header>
                <div className="flex flex-col gap-1">
                  {group.items.map((item, itemIndex) => {
                    const isActive = item.id === selectedId
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={isActive}
                        className={cn(
                          'text-left rounded-md border p-2 flex gap-2 transition-colors',
                          isActive
                            ? 'border-[var(--primary)] bg-[var(--accent)]'
                            : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--accent)]'
                        )}
                        onClick={() => selectEntry(item)}
                      >
                        <span className="text-[11px] font-mono text-[var(--muted-foreground)] pt-0.5" aria-hidden="true">
                          {String(itemIndex + 1).padStart(2, '0')}
                        </span>
                        <span className="flex flex-col gap-1 min-w-0 flex-1">
                          <strong className="text-xs text-[var(--foreground)] truncate">{item.title}</strong>
                          <span className="flex items-center gap-1.5 flex-wrap text-[10px] text-[var(--muted-foreground)]">
                            <span className="px-1 py-px rounded bg-[var(--muted)]">
                              {isRepoEntry(item) ? t('kindLabelRepo') : t('kindLabelPrompt')}
                            </span>
                            <span>{item.model}</span>
                            {isActive && (
                              <span className="inline-flex items-center gap-0.5 text-[var(--primary)]">
                                <Check className="w-3 h-3" />
                                {t('currentLabel')}
                              </span>
                            )}
                            {!isActive && hasDraft(item) && (
                              <span className="px-1 py-px rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                                {t('draftLabel')}
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)] min-w-0">
                            <Github className="w-3 h-3 shrink-0" />
                            <span className="truncate">{item.repo}</span>
                          </span>
                          {item.updatedAt && (
                            <span className="text-[10px] text-[var(--muted-foreground)]">
                              {t('updatedLabel')} {item.updatedAt}
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}

            {filtered.length === 0 && (
              <div className="rounded-md border border-dashed border-[var(--border)] p-4 flex flex-col items-center gap-1.5 text-center">
                <FileWarning className="w-6 h-6 text-[var(--muted-foreground)]" />
                <strong className="text-sm text-[var(--foreground)]">{t('emptyTitle')}</strong>
                <p className="text-xs text-[var(--muted-foreground)]">{t('emptyHint')}</p>
                <button
                  type="button"
                  className="text-xs text-[var(--primary)] hover:underline"
                  onClick={clearFilters}
                >
                  {t('emptyAction')}
                </button>
              </div>
            )}
          </div>

          <p className="text-[11px] text-[var(--muted-foreground)] flex items-start gap-1.5 border-t border-[var(--border)] pt-2">
            <PenLine className="w-3.5 h-3.5 shrink-0 mt-px" />
            {t('catalogNote')}
          </p>
        </aside>

        {/* Editor */}
        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col gap-3">
          <header className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-xs rounded-md bg-[var(--primary)] text-[var(--primary-foreground)]">
                {selected.model}
              </span>
              <span
                className={cn(
                  'text-xs',
                  isModified ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'
                )}
                role="status"
              >
                {isModified
                  ? t('stateModified')
                  : isRepoEntry(selected)
                    ? t('stateRepo')
                    : t('stateOriginal')}
              </span>
            </div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">{selected.title}</h3>
            <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5 flex-wrap">
              <Github className="w-3.5 h-3.5" />
              <span>{t('sourceRepoLabel')}</span>
              <a
                className="font-mono text-[var(--primary)] hover:underline break-all"
                href={`https://github.com/${selected.repo}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {selected.repo}
              </a>
            </p>
            {selected.updatedAt && (
              <p className="text-xs text-[var(--muted-foreground)]">
                {t('lastCommit', { date: selected.updatedAt })}
              </p>
            )}
            {isRepoEntry(selected) && (
              <p className="text-xs text-[var(--muted-foreground)] break-all">{selected.source}</p>
            )}
          </header>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={!text.trim()}
              className={cn(
                actionButtonClass,
                'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90'
              )}
              onClick={copyText}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {isRepoEntry(selected) ? t('copyRepo') : t('copyPrompt')}
            </button>
            <button
              type="button"
              disabled={!text.trim()}
              className={cn(
                actionButtonClass,
                'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)]'
              )}
              onClick={exportTxt}
            >
              <Download className="w-4 h-4" />
              {t('exportTxt')}
            </button>
            <button
              type="button"
              disabled={!text.trim()}
              className={cn(
                actionButtonClass,
                'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)]'
              )}
              onClick={sendToTransform}
            >
              <ArrowLeftRight className="w-4 h-4" />
              {t('sendToTransform')}
            </button>
          </div>

          {/* Text editor */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="jl-text">
              {isRepoEntry(selected) ? t('textLabelRepo') : t('textLabelPrompt')}
            </label>
            <button
              type="button"
              disabled={!isModified}
              aria-expanded={resetPending}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => setResetPending((v) => !v)}
            >
              <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
              {t('restore')}
            </button>
          </div>

          {resetPending && (
            <div
              className="rounded-md bg-[var(--muted)] border border-[var(--border)] px-3 py-2 flex items-center gap-3 flex-wrap"
              role="group"
              aria-label={t('restoreAria')}
            >
              <span className="text-xs text-[var(--foreground)]">{t('restoreConfirmHint')}</span>
              <button type="button" className="text-xs text-[var(--primary)] hover:underline" onClick={restore}>
                {t('restoreConfirm')}
              </button>
              <button type="button" className="text-xs text-[var(--muted-foreground)] hover:underline" onClick={() => setResetPending(false)}>
                {tc('cancel')}
              </button>
            </div>
          )}

          <textarea
            id="jl-text"
            className="w-full min-h-[380px] rounded-md px-3 py-2 text-sm font-mono bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] outline-none focus:border-[var(--primary)]"
            rows={20}
            spellCheck={false}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-describedby="jl-editor-hint"
          />

          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
            <span id="jl-editor-hint">{t('editorHint')}</span>
            <span>{t('charCount', { count: text.length.toLocaleString() })}</span>
          </div>
        </section>
      </div>
    </div>
  )
}
