import { create } from 'zustand'

/**
 * Static tool configuration describing every tab in the navigation bar.
 */
export interface ToolConfig {
  id: string
  /** i18n key used with `useTranslations('tools')` to resolve the display name. */
  nameKey: string
  /** lucide-react icon component name. */
  icon: string
  /** Single keyboard shortcut character shown in tooltips. */
  shortcut: string
  /** Sort order (lower appears first). */
  order: number
}

export const TOOL_CONFIGS: ToolConfig[] = [
  { id: 'transforms', nameKey: 'transforms', icon: 'Type', shortcut: 'T', order: 1 },
  { id: 'decoder', nameKey: 'decoder', icon: 'KeyRound', shortcut: 'D', order: 2 },
  { id: 'steganography', nameKey: 'steganography', icon: 'Smile', shortcut: 'H', order: 3 },
  { id: 'tokenade', nameKey: 'tokenade', icon: 'Bomb', shortcut: 'K', order: 4 },
  { id: 'fuzzer', nameKey: 'fuzzer', icon: 'Bug', shortcut: 'F', order: 5 },
  { id: 'tokenizer', nameKey: 'tokenizer', icon: 'Layers', shortcut: 'O', order: 6 },
  { id: 'bijection', nameKey: 'bijection', icon: 'ArrowLeftRight', shortcut: 'B', order: 7 },
  { id: 'splitter', nameKey: 'splitter', icon: 'Split', shortcut: 'S', order: 8 },
  { id: 'gibberish', nameKey: 'gibberish', icon: 'MessageCircle', shortcut: 'G', order: 9 },
  { id: 'promptcraft', nameKey: 'promptcraft', icon: 'WandSparkles', shortcut: 'P', order: 10 },
  { id: 'translate', nameKey: 'translate', icon: 'Languages', shortcut: 'L', order: 11 },
  { id: 'anticlassifier', nameKey: 'anticlassifier', icon: 'Bot', shortcut: 'A', order: 12 },
  { id: 'ccbos', nameKey: 'ccbos', icon: 'Scroll', shortcut: 'C', order: 13 },
]

/**
 * Global application state managed by Zustand.
 *
 * Controls the active navigation tab, theme preference, and visibility
 * toggles for the copy-history drawer and advanced-settings panel.
 */
interface AppState {
  /** Currently active navigation tab identifier. */
  activeTab: string

  /** Whether the dark colour theme is active. */
  isDarkTheme: boolean

  /** Whether the copy-history drawer is visible. */
  showCopyHistory: boolean

  /** Whether the advanced-settings panel is visible. */
  showAdvancedSettings: boolean

  /** Switch the active navigation tab. */
  switchTab: (tab: string) => void

  /** Toggle between dark and light themes. */
  toggleTheme: () => void

  /** Toggle the copy-history drawer visibility. */
  toggleCopyHistory: () => void

  /** Toggle the advanced-settings panel visibility. */
  toggleAdvancedSettings: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'transforms',
  isDarkTheme: false, // Default to light theme
  showCopyHistory: false,
  showAdvancedSettings: false,

  switchTab: (tab: string) => set({ activeTab: tab }),

  toggleTheme: () => set((state) => ({ isDarkTheme: !state.isDarkTheme })),

  toggleCopyHistory: () =>
    set((state) => ({ showCopyHistory: !state.showCopyHistory })),

  toggleAdvancedSettings: () =>
    set((state) => ({ showAdvancedSettings: !state.showAdvancedSettings })),
}))
