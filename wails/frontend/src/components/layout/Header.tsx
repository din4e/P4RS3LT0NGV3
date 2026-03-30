'use client'

import { useTranslations } from 'next-intl'
import {
  History,
  Moon,
  Sun,
  Github,
  Settings,
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

/**
 * Main header bar displayed at the top of the application.
 *
 * Left side: dragon emoji logo + app title.
 * Right side: History, Theme toggle, GitHub link, Settings gear.
 */
export function Header() {
  const t = useTranslations('header')
  const isDarkTheme = useAppStore((s) => s.isDarkTheme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const toggleCopyHistory = useAppStore((s) => s.toggleCopyHistory)
  const toggleAdvancedSettings = useAppStore((s) => s.toggleAdvancedSettings)

  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 py-2',
        'border-b shrink-0',
        'select-none',
      )}
      style={{
        backgroundColor: 'var(--card)',
        borderBottomColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-2xl" role="img" aria-label="dragon">
          🐉
        </span>
        <h1 className="text-lg font-bold tracking-tight">
          P4RS3LT0NGV3
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <HeaderButton
          onClick={toggleCopyHistory}
          title={t('history')}
          ariaLabel={t('history')}
        >
          <History className="h-4 w-4" />
        </HeaderButton>

        <HeaderButton
          onClick={toggleTheme}
          title={t('toggleTheme')}
          ariaLabel={t('toggleTheme')}
        >
          {isDarkTheme ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </HeaderButton>

        <a
          href="https://github.com/elder-plinius/P4RS3LT0NGV3"
          target="_blank"
          rel="noopener noreferrer"
          title={t('github')}
          aria-label={t('github')}
          className={cn(
            'inline-flex items-center justify-center',
            'h-8 w-8 rounded-md',
            'text-[var(--muted-foreground)]',
            'hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
            'transition-colors duration-150',
          )}
        >
          <Github className="h-4 w-4" />
        </a>

        <HeaderButton
          onClick={toggleAdvancedSettings}
          title={t('settings')}
          ariaLabel={t('settings')}
        >
          <Settings className="h-4 w-4" />
        </HeaderButton>
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* Internal utility component                                         */
/* ------------------------------------------------------------------ */

function HeaderButton({
  onClick,
  title,
  ariaLabel,
  children,
}: {
  onClick: () => void
  title: string
  ariaLabel: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center',
        'h-8 w-8 rounded-md',
        'text-[var(--muted-foreground)]',
        'hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
      )}
    >
      {children}
    </button>
  )
}
