// @ts-nocheck
/**
 * History management utilities.
 * Migrated from js/utils/history.js to TypeScript ES module.
 */

import type { HistoryEntry } from '@/types/transformer'

/**
 * Add an entry to a history array, respecting a max-items limit.
 */
export function addToHistory(
  historyArray: HistoryEntry[],
  maxItems: number,
  source: string,
  content: string
): void {
  if (!historyArray || !Array.isArray(historyArray)) {
    console.warn('HistoryUtils.addToHistory: historyArray is not an array')
    return
  }
  if (!content) return

  const entry: HistoryEntry = {
    source: source || 'Unknown',
    content,
    timestamp: new Date().toISOString(),
    id: Date.now() + Math.random(),
  }

  historyArray.unshift(entry)
  if (historyArray.length > maxItems) {
    historyArray.splice(maxItems)
  }
}

/**
 * Clear all entries from a history array (mutates in-place).
 */
export function clearHistory(historyArray: HistoryEntry[]): void {
  if (historyArray && Array.isArray(historyArray)) {
    historyArray.splice(0, historyArray.length)
  }
}

/**
 * Remove a single entry by its `id`.
 */
export function removeFromHistory(historyArray: HistoryEntry[], id: number): void {
  if (!historyArray || !Array.isArray(historyArray)) return
  const index = historyArray.findIndex(item => item.id === id)
  if (index !== -1) {
    historyArray.splice(index, 1)
  }
}

/**
 * Build a human-readable source label from the current UI context.
 */
export function getHistorySource(
  activeTab: string,
  context: {
    activeTransform?: { name: string }
    activeSteg?: string
    selectedEmoji?: string
  } = {}
): string {
  if (activeTab === 'transforms' && context.activeTransform) {
    return `Transform: ${context.activeTransform.name}`
  } else if (activeTab === 'steganography') {
    if (context.activeSteg === 'invisible') return 'Invisible Text'
    if (context.selectedEmoji) return `Emoji: ${context.selectedEmoji}`
    return 'Steganography'
  } else if (activeTab === 'transforms') {
    return 'Transform'
  }
  return 'Unknown'
}
