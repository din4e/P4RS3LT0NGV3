'use client'

import { useTranslations } from 'next-intl'
import { X, Trash2, Copy, Clock, Inbox } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { cn } from '@/lib/utils'

/**
 * Slide-in sidebar panel that lists copy history items.
 *
 * Each entry displays a timestamp, source label, and a truncated content
 * preview.  Clicking the copy button re-copies the content to the
 * clipboard.
 */
export function CopyHistoryPanel() {
  const t = useTranslations('header')

  // Visibility comes from the app-level store
  const showCopyHistory = useAppStore((s) => s.showCopyHistory)
  const toggleCopyHistory = useAppStore((s) => s.toggleCopyHistory)

  // History data comes from the dedicated copy-history store
  const history = useCopyHistoryStore((s) => s.history)
  const clearAll = useCopyHistoryStore((s) => s.clearAll)
  const removeItem = useCopyHistoryStore((s) => s.removeItem)

  const handleRecopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch {
      // Fallback: textarea copy
      const ta = document.createElement('textarea')
      ta.value = content
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full border-l shrink-0 overflow-hidden',
        'transition-all duration-300 ease-in-out',
        showCopyHistory ? 'w-80' : 'w-0',
      )}
      style={{ borderLeftColor: 'var(--border)' }}
      aria-hidden={!showCopyHistory}
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
          <Clock className="h-4 w-4" />
          {t('copyHistory')}
        </h3>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              title={t('clearAll')}
              className={cn(
                'inline-flex items-center justify-center h-7 w-7 rounded',
                'text-[var(--muted-foreground)]',
                'hover:text-[var(--destructive)] hover:bg-[var(--muted)]',
                'transition-colors',
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleCopyHistory}
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
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <EmptyState />
        ) : (
          <ul>
            {history.map((item) => (
              <li
                key={item.id}
                className={cn(
                  'flex flex-col gap-1 px-4 py-3 border-b',
                  'hover:bg-[var(--muted)] transition-colors group',
                )}
                style={{ borderBottomColor: 'var(--border)' }}
              >
                {/* Meta row */}
                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span className="font-medium truncate max-w-[120px]">
                    {item.source}
                  </span>
                  <span>{formatTime(item.timestamp)}</span>
                </div>

                {/* Content preview */}
                <p className="text-sm text-[var(--foreground)] break-all line-clamp-3">
                  {item.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleRecopy(item.content)}
                    title={t('copyAgain')}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded',
                      'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
                      'hover:bg-[var(--accent)] transition-colors',
                    )}
                  >
                    <Copy className="h-3 w-3" />
                    {t('copyAgain')}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    title={t('remove')}
                    className={cn(
                      'inline-flex items-center justify-center h-6 w-6 rounded',
                      'text-[var(--muted-foreground)]',
                      'hover:text-[var(--destructive)] hover:bg-[var(--muted)]',
                      'transition-colors',
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function EmptyState() {
  const t = useTranslations('header')

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--muted-foreground)]">
      <Inbox className="h-8 w-8" />
      <p className="text-sm">{t('noHistory')}</p>
    </div>
  )
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}
