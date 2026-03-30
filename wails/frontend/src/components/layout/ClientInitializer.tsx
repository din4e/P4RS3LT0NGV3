'use client'

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

/**
 * Mount-only component that registers global keyboard-shortcut listeners.
 *
 * Drop this into a server-component tree (e.g. `page.tsx`) to activate
 * shortcuts without converting the page to a client component.
 */
export function ClientShortcuts() {
  useKeyboardShortcuts()
  return null
}
