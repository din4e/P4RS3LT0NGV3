// @ts-nocheck
/**
 * Focus management utilities.
 * Migrated from js/utils/focus.js to TypeScript ES module.
 */

/**
 * Focus an element without scrolling the viewport.
 */
export function focusWithoutScroll(element: HTMLElement | null): void {
  if (!element) return

  try {
    const scrollX = window.pageXOffset || window.scrollX || 0
    const scrollY = window.pageYOffset || window.scrollY || 0
    element.focus()
    window.scrollTo(scrollX, scrollY)
  } catch (_e) {
    try {
      element.focus()
    } catch (err) {
      console.warn('Failed to focus element:', err)
    }
  }
}

/**
 * Clear focus and any active text selection.
 */
export function clearFocusAndSelection(): void {
  if (document.activeElement && (document.activeElement as HTMLElement).blur) {
    ;(document.activeElement as HTMLElement).blur()
  }
  if (window.getSelection) {
    window.getSelection()!.removeAllRanges()
  }
  document.body.focus()
}
