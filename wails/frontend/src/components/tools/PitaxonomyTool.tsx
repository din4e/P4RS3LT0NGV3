'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
  Search, X, Copy, Check, ChevronDown, ChevronRight, Target, Wrench, Ghost,
  LogIn, BookOpen, ExternalLink, ShieldHalf, Lightbulb, FileText, Pin,
  Crosshair, ListTree, ChevronsDownUp, ChevronsUpDown, ArrowUp,
} from 'lucide-react'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { useHandoffStore } from '@/stores/useHandoffStore'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import {
  promptInjectionTaxonomy,
  type TaxonomyEntry,
} from '@/lib/data/promptInjectionTaxonomy'

// ---------------------------------------------------------------------------
// Section metadata
// ---------------------------------------------------------------------------

type SectionId = 'intents' | 'techniques' | 'evasions' | 'inputs'

const SECTIONS: SectionId[] = ['intents', 'techniques', 'evasions', 'inputs']

interface EntryWithSection extends TaxonomyEntry {
  section: SectionId
}

const SECTION_ICONS: Record<SectionId, typeof Target> = {
  intents: Target,
  techniques: Wrench,
  evasions: Ghost,
  inputs: LogIn,
}

function withSection(section: SectionId): EntryWithSection[] {
  return (promptInjectionTaxonomy[section] ?? []).map((entry) => ({
    ...entry,
    section,
  }))
}

function allEntries(): EntryWithSection[] {
  return SECTIONS.flatMap(withSection)
}

function formatEntryText(t: (key: string) => string, entry: EntryWithSection): string {
  const parts = [entry.title, entry.description, '', t('ideasHeading')]
  parts.push(...(entry.ideas ?? []).map((idea) => `- ${idea}`))
  if (entry.examples?.length) {
    parts.push('', t('examplesHeading'), ...entry.examples.map((ex) => `- ${ex}`))
  }
  return parts.join('\n')
}

export default function Tool() {
  const t = useTranslations('pitaxonomy')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const setHandoff = useHandoffStore((s) => s.setHandoff)
  const switchTab = useAppStore((s) => s.switchTab)

  const [search, setSearch] = useState('')
  const [section, setSection] = useState<'all' | SectionId>('all')
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<{ section: SectionId; id: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const entriesBySection = useMemo(
    () => Object.fromEntries(SECTIONS.map((s) => [s, withSection(s)])) as Record<SectionId, EntryWithSection[]>,
    []
  )

  const filteredEntries = useMemo(() => {
    const pool =
      section === 'all' ? allEntries() : entriesBySection[section]
    const q = search.trim().toLowerCase()
    if (!q) return pool
    return pool.filter((entry) => {
      const ideas = entry.ideas?.join(' ') ?? ''
      const examples = entry.examples?.join(' ') ?? ''
      return `${entry.title} ${entry.description} ${ideas} ${examples}`.toLowerCase().includes(q)
    })
  }, [section, search, entriesBySection])

  const catalogGroups = useMemo(() => {
    const sections = section === 'all' ? SECTIONS : [section]
    return sections
      .map((s) => ({
        section: s,
        entries: filteredEntries.filter((entry) => entry.section === s),
      }))
      .filter((group) => group.entries.length > 0)
  }, [section, filteredEntries])

  // Keep the selected entry valid whenever filters change.
  useEffect(() => {
    setSelected((prev) => {
      if (prev && filteredEntries.some((e) => e.id === prev.id && e.section === prev.section)) {
        return prev
      }
      const first = filteredEntries[0]
      return first ? { section: first.section, id: first.id } : null
    })
  }, [filteredEntries])

  // Back-to-top visibility tracks the scrollable ToolPanel ancestor.
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    // The tool panel (not this root div) is the element that actually scrolls.
    let scroller: HTMLElement | null = el.parentElement
    while (scroller && scroller.scrollHeight <= scroller.clientHeight) {
      scroller = scroller.parentElement
    }
    if (!scroller) return
    const onScroll = () => setShowBackToTop(scroller!.scrollTop > 320)
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller?.removeEventListener('scroll', onScroll)
  }, [])

  const selectedEntry = useMemo(() => {
    if (!selected) return null
    return (
      allEntries().find((e) => e.id === selected.id && e.section === selected.section) ?? null
    )
  }, [selected])

  const flashCopied = useCallback(
    (key: string, text: string, label: string) => {
      copyToClipboard(text)
      addHistoryItem(text, label)
      setCopied(key)
      setTimeout(() => setCopied(null), 1200)
    },
    [copyToClipboard, addHistoryItem]
  )

  const scrollToEntry = useCallback((entry: EntryWithSection) => {
    setSelected({ section: entry.section, id: entry.id })
    requestAnimationFrame(() => {
      document.getElementById(`pit-entry-${entry.section}-${entry.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [])

  const bringToSampleBuilder = useCallback(
    (entry: EntryWithSection) => {
      setHandoff({
        fromTool: 'pitaxonomy',
        title: entry.title,
        content: formatEntryText(t, entry),
      })
      switchTab('multiturn')
    },
    [setHandoff, switchTab, t]
  )

  const toggleGroup = (s: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [s]: !prev[s] }))

  const setAllGroups = (collapsed: boolean) =>
    setCollapsedGroups(
      Object.fromEntries(catalogGroups.map((g) => [g.section, collapsed]))
    )

  const copyButton = (key: string, text: string, label: string) => (
    <button
      type="button"
      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-colors"
      onClick={(e) => {
        e.stopPropagation()
        flashCopied(key, text, label)
      }}
    >
      {copied === key ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      <span>{copied === key ? tc('copied') : tc('copy')}</span>
    </button>
  )

  const totalEntries = useMemo(() => allEntries().length, [])

  return (
    <div className="flex flex-col gap-4" ref={scrollContainerRef}>
      {/* Header + filters */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <ListTree className="w-5 h-5 text-[var(--primary)]" />
            {t('title')}
          </h2>
          <span className="text-xs text-[var(--muted-foreground)]">
            {t('entryCount', { count: totalEntries, sections: SECTIONS.length })}
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[var(--muted-foreground)]">{t('sectionLabel')}</span>
            <select
              className="rounded-md px-3 py-2 text-sm bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] outline-none focus:border-[var(--primary)]"
              value={section}
              onChange={(e) => setSection(e.target.value as 'all' | SectionId)}
            >
              <option value="all">{t('sectionAll')}</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {t(`section_${s}`)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
            <span className="text-xs text-[var(--muted-foreground)]">{t('searchLabel')}</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                ref={searchInputRef}
                type="search"
                className="w-full rounded-md pl-9 pr-8 py-2 text-sm outline-none transition-colors bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] placeholder:text-[var(--muted-foreground)]"
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  onClick={() => {
                    setSearch('')
                    searchInputRef.current?.focus()
                  }}
                  title={t('clearSearch')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-[11px] text-[var(--muted-foreground)]" role="status">
              {search
                ? t('searchResultCount', { count: filteredEntries.length })
                : t('searchHint')}
            </span>
          </div>
        </div>
      </div>

      {/* Source notes */}
      {promptInjectionTaxonomy.sourceNotes.length > 0 && (
        <section
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 flex flex-col gap-3"
          aria-label={t('sourceNotesLabel')}
        >
          <div className="flex items-center gap-2">
            <ShieldHalf className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              {t('sourceNotesTitle')}
            </h3>
          </div>
          {promptInjectionTaxonomy.sourceNotes.map((note) => (
            <article
              key={note.source}
              className="flex items-start justify-between gap-3 rounded-md bg-[var(--muted)] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">{note.title}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{note.summary}</p>
              </div>
              <a
                className="shrink-0 inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
                href={note.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t('viewSource')}
              </a>
            </article>
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 items-start">
        {/* Directory */}
        <aside className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 flex flex-col gap-3 lg:sticky lg:top-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[var(--foreground)]">{t('directory')}</h4>
            <small className="text-xs text-[var(--muted-foreground)]">
              {filteredEntries.length}
            </small>
          </div>
          <nav className="flex flex-col gap-1">
            {(['all', ...SECTIONS] as const).map((s) => {
              const Icon = s === 'all' ? BookOpen : SECTION_ICONS[s]
              const count = s === 'all' ? totalEntries : entriesBySection[s].length
              return (
                <button
                  key={s}
                  type="button"
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    section === s
                      ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
                  )}
                  onClick={() => setSection(s)}
                >
                  <Icon className="w-4 h-4 shrink-0 text-[var(--muted-foreground)]" />
                  <span className="flex-1 truncate">
                    {s === 'all' ? t('sectionAllEntries') : t(`section_${s}`)}
                  </span>
                  <small className="text-xs text-[var(--muted-foreground)]">{count}</small>
                </button>
              )
            })}
          </nav>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-md bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-colors"
              onClick={() => setAllGroups(false)}
            >
              <ChevronsDownUp className="w-3.5 h-3.5" />
              {t('expandAll')}
            </button>
            <button
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-md bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-colors"
              onClick={() => setAllGroups(true)}
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              {t('collapseAll')}
            </button>
          </div>
          {selectedEntry && (
            <div className="rounded-md border border-[var(--border)] p-2 flex flex-col gap-2">
              <small className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                {t('currentEntry')}
              </small>
              <strong className="text-xs text-[var(--foreground)] line-clamp-3">
                {selectedEntry.title}
              </strong>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                onClick={() => bringToSampleBuilder(selectedEntry)}
              >
                <Pin className="w-3.5 h-3.5" />
                {t('sendToSampleBuilder')}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-colors"
                onClick={() => scrollToEntry(selectedEntry)}
              >
                <Crosshair className="w-3.5 h-3.5" />
                {t('locateEntry')}
              </button>
            </div>
          )}
        </aside>

        {/* Catalog */}
        <div className="flex flex-col gap-3 relative">
          <div className="flex items-center justify-between" aria-live="polite">
            <h4 className="text-sm font-semibold text-[var(--foreground)]">
              {section === 'all' ? t('sectionAllEntries') : t(`section_${section}`)}
            </h4>
            <small className="text-xs text-[var(--muted-foreground)]">
              {search ? t('searchResults') : t('fullCatalog')} · {filteredEntries.length}
            </small>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] p-8 flex flex-col items-center gap-2 text-center">
              <BookOpen className="w-8 h-8 text-[var(--muted-foreground)]" />
              <p className="text-sm font-medium text-[var(--foreground)]">{t('noResults')}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{t('noResultsHint')}</p>
              <button
                type="button"
                className="mt-1 px-3 py-1.5 text-xs rounded-md bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-colors"
                onClick={() => {
                  setSearch('')
                  setSection('all')
                }}
              >
                {t('resetFilters')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {catalogGroups.map((group) => {
                const Icon = SECTION_ICONS[group.section]
                const isCollapsed = collapsedGroups[group.section] === true
                return (
                  <section
                    key={group.section}
                    id={`pit-section-${group.section}`}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden"
                  >
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--accent)] transition-colors"
                      aria-expanded={!isCollapsed}
                      onClick={() => toggleGroup(group.section)}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="p-1.5 rounded-md bg-[var(--muted)]">
                          <Icon className="w-4 h-4 text-[var(--primary)]" />
                        </span>
                        <span className="min-w-0">
                          <strong className="text-sm text-[var(--foreground)] block truncate">
                            {t(`section_${group.section}`)}
                          </strong>
                          <span className="text-xs text-[var(--muted-foreground)] block truncate">
                            {t(`sectionDescription_${group.section}`)}
                          </span>
                        </span>
                      </span>
                      <span className="ml-auto flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {group.entries.length}
                        </span>
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                        )}
                      </span>
                    </button>

                    {!isCollapsed && (
                      <div className="border-t border-[var(--border)] flex flex-col divide-y divide-[var(--border)]">
                        {group.entries.map((entry) => {
                          const isSelected =
                            selected?.id === entry.id && selected?.section === entry.section
                          return (
                            <article
                              key={`${entry.section}-${entry.id}`}
                              id={`pit-entry-${entry.section}-${entry.id}`}
                              className={cn(
                                'p-4 flex flex-col gap-3 cursor-pointer transition-colors',
                                isSelected ? 'bg-[var(--accent)]' : 'hover:bg-[var(--accent)]'
                              )}
                              onClick={() => setSelected({ section: entry.section, id: entry.id })}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-sm font-semibold text-[var(--foreground)]">
                                  {entry.title}
                                </h5>
                                <div className="flex gap-2 shrink-0">
                                  <small className="text-[11px] text-[var(--muted-foreground)]">
                                    {t('ideaCount', { count: entry.ideas?.length ?? 0 })}
                                  </small>
                                  <small className="text-[11px] text-[var(--muted-foreground)]">
                                    {t('exampleCount', { count: entry.examples?.length ?? 0 })}
                                  </small>
                                </div>
                              </div>
                              <p className="text-sm text-[var(--muted-foreground)]">
                                {entry.description}
                              </p>

                              {entry.ideas && entry.ideas.length > 0 && (
                                <div className="flex flex-col gap-1">
                                  <h6 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] flex items-center gap-1">
                                    <Lightbulb className="w-3.5 h-3.5" />
                                    {t('ideasHeading')}
                                  </h6>
                                  <ul className="flex flex-col gap-0.5">
                                    {entry.ideas.map((idea) => (
                                      <li
                                        key={idea}
                                        className="text-xs text-[var(--foreground)] flex gap-2"
                                      >
                                        <span className="text-[var(--muted-foreground)]">–</span>
                                        <span>{idea}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {entry.examples && entry.examples.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                  <h6 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5" />
                                    {t('examplesHeading')}
                                  </h6>
                                  {entry.examples.map((example, idx) => (
                                    <div
                                      key={idx}
                                      className="rounded-md bg-[var(--muted)] p-2 flex flex-col gap-1.5"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <small className="text-[11px] text-[var(--muted-foreground)]">
                                          {t('exampleIndex', { index: idx + 1 })}
                                        </small>
                                        {copyButton(
                                          `${entry.section}-${entry.id}-ex-${idx}`,
                                          example,
                                          'Pitaxonomy Example'
                                        )}
                                      </div>
                                      <pre className="text-xs text-[var(--foreground)] whitespace-pre-wrap break-words font-mono">
                                        {example}
                                      </pre>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-2">
                                <small className="text-[11px] text-[var(--muted-foreground)]">
                                  {t(`section_${entry.section}`)}
                                </small>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      bringToSampleBuilder(entry)
                                    }}
                                  >
                                    <Pin className="w-3.5 h-3.5" />
                                    {t('sendToSampleBuilder')}
                                  </button>
                                  {copyButton(
                                    `${entry.section}-${entry.id}`,
                                    formatEntryText(t, entry),
                                    'Pitaxonomy Entry'
                                  )}
                                </div>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )}

          {showBackToTop && (
            <button
              type="button"
              className="fixed bottom-6 right-6 z-10 inline-flex items-center gap-1 px-3 py-2 text-xs rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg hover:opacity-90 transition-opacity"
              onClick={() =>
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
              }
            >
              <ArrowUp className="w-3.5 h-3.5" />
              {t('backToTop')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
