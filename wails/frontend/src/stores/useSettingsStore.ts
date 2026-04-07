import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { APIProvider } from "@/types/provider";

/**
 * Persisted application settings with multi-provider support.
 */
interface SettingsState {
  // ===== NEW: Multi-provider system =====

  /** Configured API providers (id -> provider) */
  providers: Record<string, APIProvider>;

  /** ID of the global default provider */
  defaultProviderId: string | null;

  /** Per-tool provider overrides (toolId -> providerId) */
  toolProviders: Record<string, string>;

  // ===== LEGACY (kept for migration) =====

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

  /** Custom API base URL (empty = use default OpenRouter). */
  apiBaseUrl: string;

  // ===== Provider Actions =====

  /** Add or update a provider */
  setProvider: (provider: APIProvider) => void;

  /** Remove a provider by ID */
  removeProvider: (id: string) => void;

  /** Set the default provider */
  setDefaultProvider: (id: string) => void;

  /** Update provider's model list */
  setProviderModels: (id: string, models: string[]) => void;

  /** Set provider for a specific tool (null = use default) */
  setToolProvider: (toolId: string, providerId: string | null) => void;

  /** Get effective provider for a tool (override or default) */
  getEffectiveProvider: (toolId: string) => APIProvider | null;

  /** Get effective model for a tool */
  getEffectiveModel: (toolId: string) => string;

  // ===== Legacy Actions =====

  /** Store (or clear) the API key. Passing an empty string marks it as unconfigured. */
  setApiKey: (key: string) => void;

  /** Set the custom API base URL. Pass empty string to reset to default. */
  setApiBaseUrl: (url: string) => void;

  /** Retrieve the model selected for a given tool. Returns an empty string if unset. */
  getModel: (toolId: string) => string;

  /** Set the model for a given tool. */
  setModel: (toolId: string, model: string) => void;
}

/**
 * Migrate legacy single-provider settings to multi-provider
 */
function migrateFromLegacy(state: Partial<SettingsState>): Partial<SettingsState> {
  // Skip if already migrated
  if (state.providers && Object.keys(state.providers).length > 0) {
    return state;
  }

  // Create default provider from legacy settings
  if (state.apiKey && state.apiKey.length > 0) {
    const defaultProvider: APIProvider = {
      id: "default",
      name: "Default",
      baseUrl: state.apiBaseUrl || "https://openrouter.ai/api/v1",
      apiKey: state.apiKey,
      isEnabled: true,
      isDefault: true,
      region: "global",
    };

    return {
      ...state,
      providers: { default: defaultProvider },
      defaultProviderId: "default",
    };
  }

  // No legacy config, start fresh
  return {
    ...state,
    providers: {},
    defaultProviderId: null,
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // ===== Initial State =====
      providers: {},
      defaultProviderId: null,
      toolProviders: {},

      apiKeyConfigured: false,
      apiKey: "",
      selectedModels: {},
      temperatures: {},
      stegBitOrder: "LSB",
      apiBaseUrl: "",

      // ===== Provider Actions =====

      setProvider: (provider: APIProvider) =>
        set((state) => {
          const providers = { ...state.providers, [provider.id]: provider };

          // If this is the first provider or marked as default, ensure it's the default
          let defaultProviderId = state.defaultProviderId;
          if (provider.isDefault || !defaultProviderId) {
            defaultProviderId = provider.id;
            // Ensure only one default
            Object.keys(providers).forEach((id) => {
              if (id !== provider.id && providers[id].isDefault) {
                providers[id] = { ...providers[id], isDefault: false };
              }
            });
          }

          return { providers, defaultProviderId };
        }),

      removeProvider: (id: string) =>
        set((state) => {
          const { [id]: removed, ...rest } = state.providers;
          const defaultProviderId =
            state.defaultProviderId === id ? null : state.defaultProviderId;

          return {
            providers: rest,
            defaultProviderId,
          };
        }),

      setDefaultProvider: (id: string) =>
        set((state) => {
          if (!state.providers[id]) return state;

          const providers = { ...state.providers };
          Object.keys(providers).forEach((pid) => {
            providers[pid] = { ...providers[pid], isDefault: pid === id };
          });

          return { providers, defaultProviderId: id };
        }),

      setProviderModels: (id: string, models: string[]) =>
        set((state) => {
          if (!state.providers[id]) return state;

          return {
            providers: {
              ...state.providers,
              [id]: {
                ...state.providers[id],
                models,
                lastFetched: Date.now(),
              },
            },
          };
        }),

      setToolProvider: (toolId: string, providerId: string | null) =>
        set((state) => {
          const toolProviders = { ...state.toolProviders };
          if (providerId === null) {
            delete toolProviders[toolId];
          } else {
            toolProviders[toolId] = providerId;
          }
          return { toolProviders };
        }),

      getEffectiveProvider: (toolId: string): APIProvider | null => {
        const state = get();

        // Check tool override first
        const toolProviderId = state.toolProviders[toolId];
        if (toolProviderId && state.providers[toolProviderId]?.isEnabled) {
          return state.providers[toolProviderId];
        }

        // Fall back to default provider
        if (state.defaultProviderId && state.providers[state.defaultProviderId]?.isEnabled) {
          return state.providers[state.defaultProviderId];
        }

        // Legacy fallback
        if (state.apiKey) {
          return {
            id: "legacy",
            name: "Legacy",
            baseUrl: state.apiBaseUrl || "https://openrouter.ai/api/v1",
            apiKey: state.apiKey,
            isEnabled: true,
            isDefault: true,
          };
        }

        return null;
      },

      getEffectiveModel: (toolId: string): string => {
        const state = get();
        return state.selectedModels[toolId] ?? "";
      },

      // ===== Legacy Actions =====

      setApiKey: (key: string) =>
        set({
          apiKey: key,
          apiKeyConfigured: key.length > 0,
        }),

      setApiBaseUrl: (url: string) => set({ apiBaseUrl: url }),

      getModel: (toolId: string): string => {
        return get().selectedModels[toolId] ?? "";
      },

      setModel: (toolId: string, model: string) =>
        set((state) => ({
          selectedModels: { ...state.selectedModels, [toolId]: model },
        })),
    }),
    {
      name: "p4rs3lt0ngv3-settings",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle future migrations here
        if (version === 0) {
          // Migrate from version 0 to 1
          const state = migrateFromLegacy(persistedState);
          return state;
        }
        return persistedState;
      },
      partialize: (state) => ({
        // Only persist these fields (exclude actions)
        providers: state.providers,
        defaultProviderId: state.defaultProviderId,
        toolProviders: state.toolProviders,
        apiKey: state.apiKey,
        apiKeyConfigured: state.apiKeyConfigured,
        selectedModels: state.selectedModels,
        temperatures: state.temperatures,
        stegBitOrder: state.stegBitOrder,
        apiBaseUrl: state.apiBaseUrl,
      }),
    }
  )
);

// Run migration on store initialization (for legacy data)
const initialState = useSettingsStore.getState();
const migratedState = migrateFromLegacy(initialState);
if (
  migratedState.providers &&
  Object.keys(migratedState.providers).length > 0 &&
  (!initialState.providers || Object.keys(initialState.providers).length === 0)
) {
  useSettingsStore.setState(migratedState);
}
