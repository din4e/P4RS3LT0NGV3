'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { getAPIKeyStatus } from '@/lib/wails'

const THEME_STORAGE_KEY = 'theme'
const THEME_DARK = 'dark'
const THEME_LIGHT = 'light'
const THEME_SYSTEM = 'system'

/**
 * Application-level provider that handles:
 *
 * 1. **Theme synchronisation** -- applies or removes the `dark` CSS class on
 *    `<html>` so that Tailwind's `dark:` variant and the CSS custom-property
 *    overrides in `globals.css` take effect.
 *
 * 2. **Persistence** -- writes the user's theme preference to `localStorage`
 *    whenever it changes.
 *
 * 3. **System preference** -- on mount, reads `localStorage` first. If no
 *    stored preference exists, falls back to `prefers-color-scheme: dark`.
 *    Also listens for OS-level theme changes and applies them when the user
 *    has not explicitly chosen a preference.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const isDarkTheme = useAppStore((s) => s.isDarkTheme)

  // --- Load persisted state on mount ----------------------------------------
  useEffect(() => {
    async function init() {
      try {
        const configured = await getAPIKeyStatus()
        if (configured) {
          useSettingsStore.setState({ apiKeyConfigured: true })
        }
      } catch { /* ignore */ }

      try {
        const baseUrl = localStorage.getItem('api_base_url')
        if (baseUrl) {
          useSettingsStore.setState({ apiBaseUrl: baseUrl })
        }
      } catch { /* ignore */ }
    }
    init()
  }, [])

  // --- Apply the `dark` class to <html> whenever isDarkTheme changes -------
  useEffect(() => {
    const root = document.documentElement
    if (isDarkTheme) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkTheme])

  // --- Persist user preference to localStorage ------------------------------
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDarkTheme ? THEME_DARK : THEME_LIGHT)
    } catch {
      // localStorage may be unavailable (SSR, iframe sandbox, etc.)
    }
  }, [isDarkTheme])

  // --- Restore theme on mount: localStorage > system preference ------------
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)

      if (stored === THEME_LIGHT) {
        // Store says light but default state is dark -- toggle to light
        if (useAppStore.getState().isDarkTheme) {
          useAppStore.getState().toggleTheme()
        }
      } else if (stored === THEME_DARK) {
        // Store says dark and default is already dark -- nothing to do
        if (!useAppStore.getState().isDarkTheme) {
          useAppStore.getState().toggleTheme()
        }
      }
      // No stored preference → keep default dark theme (no action needed)
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Listen for OS-level theme changes (only when no user preference) -----
  useEffect(() => {
    let cleanup: (() => void) | undefined

    try {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')

      const handler = (e: MediaQueryListEvent) => {
        // Only follow system preference when user hasn't set one explicitly
        const stored = localStorage.getItem(THEME_STORAGE_KEY)
        if (stored) return // user has an explicit preference; skip

        const state = useAppStore.getState()
        if (e.matches && !state.isDarkTheme) {
          state.toggleTheme()
        } else if (!e.matches && state.isDarkTheme) {
          state.toggleTheme()
        }
      }

      mql.addEventListener('change', handler)
      cleanup = () => mql.removeEventListener('change', handler)
    } catch {
      // matchMedia not supported; ignore
    }

    return () => cleanup?.()
  }, [])

  return <>{children}</>
}
