import { create } from "zustand";

/**
 * Persisted application settings.
 *
 * The API key is intentionally excluded from the selector surface; downstream
 * consumers should only interact with it through {@link setApiKey} so the key
 * is never accidentally rendered or logged by a component.
 */
interface SettingsState {
  /** Whether an API key has been configured (non-empty). */
  apiKeyConfigured: boolean;

  /** The raw API key. Prefer NOT reading this from components. */
  apiKey: string;

  /** Map of tool identifiers to selected model names. */
  selectedModels: Record<string, string>;

  /** Map of tool identifiers to temperature values (0-2). */
  temperatures: Record<string, number>;

  /** Steganography bit-order setting (e.g. "LSB" or "MSB"). */
  stegBitOrder: string;

  /** Store (or clear) the API key. Passing an empty string marks it as unconfigured. */
  setApiKey: (key: string) => void;

  /** Retrieve the model selected for a given tool. Returns an empty string if unset. */
  getModel: (toolId: string) => string;

  /** Set the model for a given tool. */
  setModel: (toolId: string, model: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiKeyConfigured: false,
  apiKey: "",
  selectedModels: {},
  temperatures: {},
  stegBitOrder: "LSB",

  setApiKey: (key: string) =>
    set({
      apiKey: key,
      apiKeyConfigured: key.length > 0,
    }),

  getModel: (toolId: string): string => {
    return get().selectedModels[toolId] ?? "";
  },

  setModel: (toolId: string, model: string) =>
    set((state) => ({
      selectedModels: { ...state.selectedModels, [toolId]: model },
    })),
}));
