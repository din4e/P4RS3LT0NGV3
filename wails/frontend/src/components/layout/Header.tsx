'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
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
  Languages,
  Check,
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
const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
]

export function Header() {
  const t = useTranslations('header')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const isDarkTheme = useAppStore((s) => s.isDarkTheme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const toggleCopyHistory = useAppStore((s) => s.toggleCopyHistory)
  const toggleAdvancedSettings = useAppStore((s) => s.toggleAdvancedSettings)
  const [isMaximised, setIsMaximised] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    WindowIsMaximised().then(setIsMaximised).catch(() => {})
  }, [])

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleMaximise = async () => {
    await WindowToggleMaximise()
    const maximised = await WindowIsMaximised()
    setIsMaximised(maximised)
  }

  const handleSwitchLanguage = (newLocale: string) => {
    if (newLocale === locale) {
      setShowLangMenu(false)
      return
    }
    // Replace the locale segment in the path
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
    setShowLangMenu(false)
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
          href="https://github.com/din4e/P4RS3LT0NGV3"
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

        {/* Language Switcher */}
        <div className="relative" ref={langMenuRef}>
          <HeaderButton
            onClick={() => setShowLangMenu((v) => !v)}
            title={t('language')}
            ariaLabel={t('language')}
          >
            <Languages className="h-4 w-4" />
          </HeaderButton>
          {showLangMenu && (
            <div
              className={cn(
                'absolute right-0 top-full mt-1 z-50',
                'min-w-[140px] py-1 rounded-md shadow-lg',
                'border',
              )}
              style={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
              }}
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSwitchLanguage(lang.code)}
                  className={cn(
                    'w-full px-3 py-1.5 text-sm text-left',
                    'flex items-center justify-between gap-2',
                    'hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]',
                    'transition-colors',
                    locale === lang.code && 'text-[var(--primary)] font-medium',
                  )}
                >
                  <span>{lang.nativeName}</span>
                  {locale === lang.code && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

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
