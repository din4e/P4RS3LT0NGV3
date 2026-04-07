/**
 * useAIConfig Hook
 * Unified hook for AI tools to access provider and model configuration.
 *
 * Handles:
 * - Effective provider resolution (tool override → default → legacy)
 * - Effective model resolution
 * - API credentials retrieval
 */

import { useCallback, useMemo } from "react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { APIProvider } from "@/types/provider";

export interface AIConfig {
  /** Effective provider for this tool */
  provider: APIProvider | null;

  /** Effective model for this tool */
  model: string;

  /** API base URL (convenience) */
  baseUrl: string;

  /** API key (convenience) */
  apiKey: string;

  /** Whether configuration is ready for API calls */
  isConfigured: boolean;

  /** Available models for the provider */
  availableModels: string[];

  /** Set model for this tool */
  setModel: (model: string) => void;

  /** Set provider override for this tool */
  setProvider: (providerId: string | null) => void;

  /** Refresh models from provider */
  refreshModels: () => Promise<void>;
}

/**
 * Get AI configuration for a specific tool
 *
 * @param toolId - Unique identifier for the tool
 * @returns AIConfig object with provider, model, and helper functions
 */
export function useAIConfig(toolId: string): AIConfig {
  const providers = useSettingsStore((s) => s.providers);
  const defaultProviderId = useSettingsStore((s) => s.defaultProviderId);
  const toolProviders = useSettingsStore((s) => s.toolProviders);
  const selectedModels = useSettingsStore((s) => s.selectedModels);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);

  const setModel = useSettingsStore((s) => s.setModel);
  const setToolProvider = useSettingsStore((s) => s.setToolProvider);
  const setProviderModels = useSettingsStore((s) => s.setProviderModels);

  // Resolve effective provider
  const provider = useMemo((): APIProvider | null => {
    // Check tool override first
    const toolProviderId = toolProviders[toolId];
    if (toolProviderId && providers[toolProviderId]?.isEnabled) {
      return providers[toolProviderId];
    }

    // Fall back to default provider
    if (defaultProviderId && providers[defaultProviderId]?.isEnabled) {
      return providers[defaultProviderId];
    }

    // Legacy fallback
    if (apiKey) {
      return {
        id: "legacy",
        name: "Legacy",
        baseUrl: apiBaseUrl || "https://openrouter.ai/api/v1",
        apiKey,
        isEnabled: true,
        isDefault: true,
        models: [],
      };
    }

    return null;
  }, [toolId, toolProviders, providers, defaultProviderId, apiKey, apiBaseUrl]);

  // Resolve effective model
  const model = useMemo(() => {
    return selectedModels[toolId] ?? "";
  }, [toolId, selectedModels]);

  // Get available models for provider
  const availableModels = useMemo(() => {
    return provider?.models ?? [];
  }, [provider]);

  // Check if configured
  const isConfigured = useMemo(() => {
    return provider !== null && provider.apiKey.length > 0;
  }, [provider]);

  // Set model handler
  const handleSetModel = useCallback(
    (newModel: string) => {
      setModel(toolId, newModel);
    },
    [toolId, setModel]
  );

  // Set provider override handler
  const handleSetProvider = useCallback(
    (providerId: string | null) => {
      setToolProvider(toolId, providerId);
    },
    [toolId, setToolProvider]
  );

  // Refresh models handler
  const refreshModels = useCallback(async () => {
    if (!provider || provider.id === "legacy") return;

    try {
      const { fetchProviderModels } = await import("@/lib/services/modelFetcher");
      const models = await fetchProviderModels(provider.baseUrl, provider.apiKey);
      setProviderModels(provider.id, models);
    } catch (error) {
      console.error(`[useAIConfig] Failed to refresh models for ${provider.id}:`, error);
      throw error;
    }
  }, [provider, setProviderModels]);

  return {
    provider,
    model,
    baseUrl: provider?.baseUrl ?? "",
    apiKey: provider?.apiKey ?? "",
    isConfigured,
    availableModels,
    setModel: handleSetModel,
    setProvider: handleSetProvider,
    refreshModels,
  };
}

/**
 * Get list of all enabled providers for UI selectors
 */
export function useEnabledProviders(): APIProvider[] {
  const providers = useSettingsStore((s) => s.providers);
  const defaultProviderId = useSettingsStore((s) => s.defaultProviderId);

  return useMemo(() => {
    const enabled = Object.values(providers).filter((p) => p.isEnabled);
    // Sort: default first, then alphabetically
    return enabled.sort((a, b) => {
      if (a.id === defaultProviderId) return -1;
      if (b.id === defaultProviderId) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [providers, defaultProviderId]);
}

/**
 * Check if any provider is configured
 */
export function useHasProvider(): boolean {
  const providers = useSettingsStore((s) => s.providers);
  const apiKey = useSettingsStore((s) => s.apiKey);

  return Object.keys(providers).length > 0 || apiKey.length > 0;
}
