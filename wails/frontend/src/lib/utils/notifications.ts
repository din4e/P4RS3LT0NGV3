// @ts-nocheck
/**
 * Notification utilities.
 * Migrated from js/utils/notifications.js to TypeScript ES module.
 *
 * NOTE: The original code manipulated the DOM directly. In the React/Wails
 * version notifications are surfaced via a toast / notification store.
 * These helpers are thin wrappers that can be wired to whichever
 * notification system the UI adopts.
 */

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

let _handler: ((message: string, type: NotificationType, iconClass?: string | null) => void) | null = null

/**
 * Register a notification handler (e.g. React toast function).
 * Call once at app bootstrap.
 */
export function setNotificationHandler(
  handler: (message: string, type: NotificationType, iconClass?: string | null) => void
): void {
  _handler = handler
}

/**
 * Show a notification. If no handler has been registered this is a no-op
 * (falls back to console.log).
 */
export function showNotification(
  message: string,
  type: NotificationType = 'success',
  iconClass: string | null = null
): void {
  if (_handler) {
    _handler(message, type, iconClass)
  } else {
    console.log(`[Notification][${type}] ${message}`)
  }
}

/**
 * Convenience: "Copied!" notification.
 */
export function showCopiedPopup(): void {
  showNotification('Copied!', 'success', 'fas fa-check')
}
