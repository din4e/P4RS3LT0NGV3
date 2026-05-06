import { create } from "zustand";

/**
 * A single entry in the copy-history list.
 */
export interface CopyHistoryEntry {
  /** Unique identifier for this entry. */
  id: string;
  /** The text content that was copied. */
  content: string;
  /** Identifier of the source tool or transform that produced the content. */
  source: string;
  /** Unix timestamp (ms) when the entry was created. */
  timestamp: number;
}

/**
 * State shape for the copy-history store.
 */
interface CopyHistoryState {
  /** Ordered list of copy-history entries (newest first). */
  history: CopyHistoryEntry[];

  /** Maximum number of items to retain. Older items are pruned automatically. */
  maxItems: number;

  /**
   * Add a new item to the history.
   * The `id` is generated automatically. Items exceeding `maxItems` are
   * trimmed from the tail (oldest entries).
   */
  addItem: (content: string, source: string) => void;

  /** Remove a specific entry by its id. */
  removeItem: (id: string) => void;

  /** Clear the entire history. */
  clearAll: () => void;
}

let nextId = 0;

/**
 * Generate a unique, monotonic id string for a history entry.
 * Uses an in-memory counter combined with a random suffix for uniqueness.
 */
function generateId(): string {
  return `copy-${Date.now()}-${++nextId}`;
}

export const useCopyHistoryStore = create<CopyHistoryState>((set) => ({
  history: [],
  maxItems: 100,

  addItem: (content: string, source: string) =>
    set((state) => {
      const entry: CopyHistoryEntry = {
        id: generateId(),
        content,
        source,
        timestamp: Date.now(),
      };

      const updated = [entry, ...state.history];

      // Trim oldest entries that exceed the limit.
      if (updated.length > state.maxItems) {
        return { history: updated.slice(0, state.maxItems) };
      }

      return { history: updated };
    }),

  removeItem: (id: string) =>
    set((state) => ({
      history: state.history.filter((entry) => entry.id !== id),
    })),

  clearAll: () => set({ history: [] }),
}));
