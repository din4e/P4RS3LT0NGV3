/**
 * Model Fetching Service
 * Fetches available models from API provider endpoints with caching.
 * Browser-only: direct fetch to provider endpoints.
 */

import { useSettingsStore } from "@/stores/useSettingsStore";
import type { APIProvider } from "@/types/provider";

/** Cache duration in milliseconds (1 hour) */
const CACHE_DURATION = 60 * 60 * 1000;

/** Rate limit delay between fetches (ms) */
const RATE_LIMIT_DELAY = 2000;

/** In-flight requests to prevent duplicates */
const inflightRequests = new Map<string, Promise<string[]>>();

/** Last fetch timestamp per provider */
const lastFetchTime = new Map<string, number>();

/**
 * Fetch models from a provider's /models endpoint
 */
export async function fetchProviderModels(
  baseUrl: string,
  apiKey: string
): Promise<string[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/models`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey && apiKey !== "local-no-key") {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const isLocal = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
    if (isLocal && (response.status === 0 || response.status >= 500)) {
      throw new Error(
        `Cannot connect to local server at ${baseUrl}. Make sure it is running.`
      );
    }
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return parseModelList(data);
}

/**
 * Parse model list from various API response formats
 */
function parseModelList(data: unknown): string[] {
  let models: string[] = [];

  if (Array.isArray((data as any)?.data)) {
    models = ((data as any).data as Array<{ id?: string; name?: string }>)
      .map((m) => m.id || m.name)
      .filter((m): m is string => typeof m === "string")
      .sort();
  } else if (Array.isArray((data as any)?.models)) {
    models = ((data as any).models as Array<{ id?: string; name?: string } | string>)
      .map((m) =>
        typeof m === "string" ? m : m.id || m.name
      )
      .filter((m): m is string => typeof m === "string")
      .sort();
  } else if (Array.isArray(data)) {
    models = (data as Array<{ id?: string; name?: string } | string>)
      .map((m) =>
        typeof m === "string" ? m : m.id || m.name
      )
      .filter((m): m is string => typeof m === "string")
      .sort();
  }

  return models;
}

/**
 * Get models for a provider with caching
 * Returns cached models if fresh, otherwise fetches new ones
 */
export async function getProviderModels(
  provider: APIProvider,
  forceRefresh = false
): Promise<string[]> {
  const { id, baseUrl, apiKey, models: cachedModels, lastFetched } = provider;

  // Check cache validity
  const now = Date.now();
  const cacheAge = lastFetched ? now - lastFetched : Infinity;
  const isCacheValid = cacheAge < CACHE_DURATION;

  // Return cached if valid and not forcing refresh
  if (!forceRefresh && cachedModels && cachedModels.length > 0 && isCacheValid) {
    return cachedModels;
  }

  // Check rate limiting
  const lastFetch = lastFetchTime.get(id) || 0;
  if (now - lastFetch < RATE_LIMIT_DELAY) {
    // Return cached even if stale rather than hit rate limit
    if (cachedModels && cachedModels.length > 0) {
      return cachedModels;
    }
  }

  // Check for in-flight request
  const existingRequest = inflightRequests.get(id);
  if (existingRequest) {
    return existingRequest;
  }

  // Fetch new models
  const fetchPromise = (async () => {
    try {
      lastFetchTime.set(id, now);
      const models = await fetchProviderModels(baseUrl, apiKey);

      // Update store with new models
      useSettingsStore.getState().setProviderModels(id, models);

      return models;
    } catch (error) {
      console.error(`[modelFetcher] Failed to fetch models for ${id}:`, error);

      // Return cached on error if available
      if (cachedModels && cachedModels.length > 0) {
        return cachedModels;
      }

      throw error;
    } finally {
      inflightRequests.delete(id);
    }
  })();

  inflightRequests.set(id, fetchPromise);
  return fetchPromise;
}

/**
 * Refresh models for all enabled providers
 */
export async function refreshAllProviderModels(): Promise<Record<string, string[]>> {
  const { providers } = useSettingsStore.getState();
  const results: Record<string, string[]> = {};

  const enabledProviders = Object.values(providers).filter((p) => p.isEnabled);

  // Fetch in parallel with concurrency limit
  const concurrencyLimit = 3;
  for (let i = 0; i < enabledProviders.length; i += concurrencyLimit) {
    const batch = enabledProviders.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.allSettled(
      batch.map(async (p) => {
        const models = await getProviderModels(p, true);
        return { id: p.id, models };
      })
    );

    batchResults.forEach((result) => {
      if (result.status === "fulfilled") {
        results[result.value.id] = result.value.models;
      }
    });
  }

  return results;
}

/**
 * Test provider connection by fetching models
 */
export async function testProviderConnection(
  baseUrl: string,
  apiKey: string
): Promise<{ success: boolean; models?: string[]; error?: string }> {
  try {
    const models = await fetchProviderModels(baseUrl, apiKey);
    return { success: true, models: models.slice(0, 10) };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isLocal = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
    if (isLocal && (msg.includes("fetch") || msg.includes("connect") || msg.includes("ECONNREFUSED"))) {
      return {
        success: false,
        error: `Cannot reach local server at ${baseUrl}. Please ensure it is running.`,
      };
    }
    return { success: false, error: msg };
  }
}
