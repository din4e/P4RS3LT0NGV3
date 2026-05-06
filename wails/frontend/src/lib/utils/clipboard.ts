// @ts-nocheck
/**
 * Clipboard utility.
 * Migrated from js/utils/clipboard.js to TypeScript ES module.
 */

import type { ClipboardOptions } from '@/types/transformer'

/**
 * Copy text to clipboard using the Clipboard API.
 *
 * NOTE: Notifications are handled by the caller (React layer / toast store)
 * rather than via DOM manipulation.
 */
export async function copy(text: string, options: ClipboardOptions = {}): Promise<boolean> {
  if (!text) return false

  const {
    onSuccess,
    onError,
    suppressNotification = false,
  } = options

  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    const errorMsg = 'Clipboard API not available'
    console.error(errorMsg)
    if (onError) onError(new Error(errorMsg))
    return false
  }

  try {
    await navigator.clipboard.writeText(text)
    if (onSuccess) onSuccess()
    return true
  } catch (err) {
    console.error('Clipboard copy failed:', err)
    if (onError) onError(err as Error)
    return false
  }
}
