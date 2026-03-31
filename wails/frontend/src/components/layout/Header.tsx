'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import {
  History,
  Moon,
  Sun,
  Github,
  Settings,
  Minus,
  Square,
  X,
  Copy,
} from 'lucide-react'
import {
  WindowMinimise,
  WindowToggleMaximise,
  WindowIsMaximised,
  Quit,
} from '../../../wailsjs/runtime/runtime'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

/**
 * Custom title bar that replaces the system frame.
 *
 * Left side: dragon emoji logo + app title.
 * Right side: History, Theme toggle, GitHub link, Settings gear,
 *             then window controls (minimize, maximize, close).
 *
 * The entire bar is a Wails drag region (`--wails-draggable: drag`).
 */
export function Header() {
  const t = useTranslations('header')
  const isDarkTheme = useAppStore((s) => s.isDarkTheme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const toggleCopyHistory = useAppStore((s) => s.toggleCopyHistory)
  const toggleAdvancedSettings = useAppStore((s) => s.toggleAdvancedSettings)
  const [isMaximised, setIsMaximised] = useState(false)

  useEffect(() => {
    WindowIsMaximised().then(setIsMaximised).catch(() => {})
  }, [])

  const handleToggleMaximise = async () => {
    await WindowToggleMaximise()
    const maximised = await WindowIsMaximised()
    setIsMaximised(maximised)
  }

  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 py-1.5',
        'border-b shrink-0',
        'select-none',
      )}
      style={{
        backgroundColor: 'var(--card)',
        borderBottomColor: 'var(--border)',
        // @ts-expect-error Wails custom property for frameless window dragging
        '--wails-draggable': 'drag',
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
      <div
        className="flex items-center gap-1"
        // @ts-expect-error Wails: children of drag region must opt-out
        style={{ '--wails-draggable': 'no-drag' }}
      >
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

        {/* Separator between app actions and window controls */}
        <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border)' }} />

        {/* Window controls */}
        <HeaderButton onClick={WindowMinimise} title="Minimize" ariaLabel="Minimize">
          <Minus className="h-4 w-4" />
        </HeaderButton>

        <HeaderButton onClick={handleToggleMaximise} title={isMaximised ? 'Restore' : 'Maximize'} ariaLabel={isMaximised ? 'Restore' : 'Maximize'}>
          {isMaximised ? (
            <Copy className="h-3.5 w-3.5" />
          ) : (
            <Square className="h-3.5 w-3.5" />
          )}
        </HeaderButton>

        <HeaderButton
          onClick={Quit}
          title="Close"
          ariaLabel="Close"
          className="hover:bg-red-500/80 hover:text-white"
        >
          <X className="h-4 w-4" />
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
  className,
  children,
}: {
  onClick: () => void
  title: string
  ariaLabel: string
  className?: string
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
        className,
      )}
    >
      {children}
    </button>
  )
}
