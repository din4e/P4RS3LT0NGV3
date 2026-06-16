'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Check, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { END_SEQUENCE_CATEGORIES } from '@/lib/utils/endSequences'

export default function Tool() {
  const t = useTranslations('endsequences')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)

  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    if (!search.trim()) return END_SEQUENCE_CATEGORIES
    const q = search.toLowerCase()
    return END_SEQUENCE_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.value.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.items.length > 0)
  }, [search])

  const flash = useCallback(
    (key: string, text: string) => {
      copyToClipboard(text)
      addHistoryItem(text, 'End Sequences')
      setCopied(key)
      setTimeout(() => setCopied(null), 1200)
    },
    [copyToClipboard, addHistoryItem]
  )

  const toggle = (title: string) =>
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }))

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {t('title')}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {t('description')}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <input
          className="w-full rounded-md pl-9 pr-3 py-2 text-sm outline-none transition-colors bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] placeholder:text-[var(--muted-foreground)]"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category list */}
      <div className="flex flex-col gap-3">
        {filtered.map((cat) => {
          const isCollapsed = collapsed[cat.title] === true
          return (
            <div
              key={cat.title}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden"
            >
              {/* Category header */}
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--accent)] transition-colors"
                onClick={() => toggle(cat.title)}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                )}
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {cat.title}
                </span>
                <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                  {cat.items.length}
                </span>
              </button>

              {/* Items */}
              {!isCollapsed && (
                <div className="border-t border-[var(--border)]">
                  {cat.items.map((item, idx) => {
                    const itemKey = `${cat.title}-${idx}`
                    const isCopied = copied === itemKey
                    const displayValue = item.value.replace(/\n/g, '\\n')
                    return (
                      <div
                        key={itemKey}
                        className="group flex items-center gap-3 px-4 py-2 hover:bg-[var(--accent)] transition-colors border-b border-[var(--border)] last:border-b-0"
                      >
                        <span className="text-xs font-mono text-[var(--muted-foreground)] w-48 shrink-0 truncate" title={item.label}>
                          {item.label}
                        </span>
                        <span className="flex-1 text-xs font-mono text-[var(--foreground)] truncate" title={item.value}>
                          {displayValue}
                        </span>
                        <button
                          className="shrink-0 p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                          onClick={() => flash(itemKey, item.value)}
                          title={tc('copy')}
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
          {tc('noResults')}
        </p>
      )}
    </div>
  )
}
