// @ts-nocheck
/**
 * Utils barrel export.
 */
export { copy } from './clipboard'
export {
  setEmojiData,
  splitEmojis,
  joinEmojis,
  getAllEmojis,
  getCompatibleEmojis,
} from './emoji'
export { parseEscapeSequence } from './escapeParser'
export { focusWithoutScroll, clearFocusAndSelection } from './focus'
export {
  setGlitchTokensData,
  loadGlitchTokens,
  getAllGlitchTokens,
  getTokensByBehavior,
  getTokensByTokenizer,
  searchGlitchTokens,
} from './glitchTokens'
export {
  addToHistory,
  clearHistory,
  removeFromHistory,
  getHistorySource,
} from './history'
export {
  showNotification,
  showCopiedPopup,
  setNotificationHandler,
} from './notifications'
export type { NotificationType } from './notifications'
export { initializeTheme, persistTheme } from './theme'

// Data exports
export {
  loadCache as loadEmojiCompatCache,
  saveCache as saveEmojiCompatCache,
  clearCache as clearEmojiCompatCache,
  testEmojiRenders,
  shouldShowInPicker,
  getCompatibleEmojis as getCompatibleEmojisFromChecker,
  getStats as getEmojiCompatStats,
} from './emojiCompatibility'
export { OPENROUTER_MODELS } from './openrouterModels'
export { END_SEQUENCE_CATEGORIES } from './endSequences'
export { ANTICLASSIFIER_SYSTEM_PROMPT } from './anticlassifierPrompt'
export { default as glitchTokensData } from './glitchTokensData'
