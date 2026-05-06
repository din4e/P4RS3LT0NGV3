// @ts-nocheck
/**
 * Theme utilities.
 * Migrated from js/utils/theme.js to TypeScript ES module.
 *
 * NOTE: The original code toggled CSS classes on document.body and read/wrote
 * localStorage. In the React/Wails version the theme state is managed by
 * Zustand / React context. These utilities preserve the localStorage
 * persistence logic but DOM manipulation is left to the consumer.
 */

/**
 * Derive the initial theme from localStorage.
 * Returns `true` for dark (default), `false` for light.
 */
export function initializeTheme(): boolean {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light') return false
    if (saved === 'dark') return true
  } catch (_e) {
    console.warn('Failed to load theme preference:', _e)
  }
  return true // default dark
}

/**
 * Persist a theme preference and return the new value.
 * The caller is responsible for applying CSS classes / React state.
 */
export function persistTheme(currentIsDark: boolean): boolean {
  const newIsDark = !currentIsDark
  try {
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
  } catch (_e) {
    console.warn('Failed to save theme preference:', _e)
  }
  return newIsDark
}
