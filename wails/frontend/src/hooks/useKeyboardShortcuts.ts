'use client'

import { useEffect, useCallback } from 'react'
import { useAppStore, TOOL_CONFIGS } from '@/stores/useAppStore'

/**
 * Keyboard shortcut configuration.
 * Maps a single key character to the tool id it activates.
 */
const SHORTCUT_MAP: Record<string, string> = {}
for (const tool of TOOL_CONFIGS) {
  SHORTCUT_MAP[tool.shortcut.toLowerCase()] = tool.id
}

/**
 * Global keyboard-shortcut listener.
 *
 * Register once in a top-level client component (e.g. the home page).
 *
 * Shortcuts:
 *  - Single letter keys (T, D, H, ...)  switch to the matching tool tab.
 *  - Ctrl / Cmd + K                     focuses the search input in the
 *                                        active transforms tool.
 *  - Escape                              closes copy-history and
 *                                        advanced-settings panels.
 *
 * All shortcuts are **disabled** while the user is typing inside an
 * `<input>`, `<textarea>`, or `[contenteditable]` element.
 */
export function useKeyboardShortcuts(): void {
  const switchTab = useAppStore((s) => s.switchTab)
  const toggleCopyHistory = useAppStore((s) => s.toggleCopyHistory)
  const toggleAdvancedSettings = useAppStore((s) => s.toggleAdvancedSettings)
  const showCopyHistory = useAppStore((s) => s.showCopyHistory)
  const showAdvancedSettings = useAppStore((s) => s.showAdvancedSettings)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isEditable =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable

      // --- Escape: close open panels ------------------------------------
      if (e.key === 'Escape') {
        if (showCopyHistory) {
          toggleCopyHistory()
          return
        }
        if (showAdvancedSettings) {
          toggleAdvancedSettings()
          return
        }
        // Blur the active element (close virtual keyboards, deselect text)
        if (target && typeof target.blur === 'function') {
          target.blur()
        }
        return
      }

      // --- Ctrl/Cmd + K: focus search in transforms --------------------
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        // Switch to transforms tab first
        switchTab('transforms')
        // Defer focus so the transforms component has time to mount
        requestAnimationFrame(() => {
          const searchInput = document.querySelector<HTMLInputElement>(
            '[data-search-input]'
          )
          searchInput?.focus()
        })
        return
      }

      // --- Single-key tab shortcuts (only when NOT typing) --------------
      if (!isEditable && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const toolId = SHORTCUT_MAP[e.key.toLowerCase()]
        if (toolId) {
          e.preventDefault()
          switchTab(toolId)
          return
        }
      }
    },
    [
      switchTab,
      toggleCopyHistory,
      toggleAdvancedSettings,
      showCopyHistory,
      showAdvancedSettings,
    ],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
