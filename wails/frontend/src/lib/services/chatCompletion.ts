/**
 * Chat Completion Service
 * Makes API calls using provider-specific credentials from the settings store.
 * In Wails mode, routes through Go backend to avoid CORS issues.
 */

import { useSettingsStore } from "@/stores/useSettingsStore";

let _wailsApp: any = null;

async function getWailsApp(): Promise<any | null> {
  if (typeof window === "undefined") return null;
  if (_wailsApp) return _wailsApp;
  try {
    const wailsPath = ["../../", "../", "wailsjs/go/main/App"].join("");
    const mod = await import(/* webpackIgnore: true */ /* @vite-ignore */ wailsPath);
    _wailsApp = new mod.default();
    return _wailsApp;
  } catch {
    return null;
  }
}

export function isWailsMode(): boolean {
  return (
    typeof window !== "undefined" &&
    (!!(window as any).runtime || !!(window as any).go?.main?.App)
  );
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  /** Model ID to use */
  model: string;

  /** Chat messages */
  messages: ChatMessage[];

  /** Temperature (0-2) */
  temperature?: number;

  /** Max tokens */
  maxTokens?: number;

  /** Provider ID override (optional - uses default if not specified) */
  providerId?: string;

  /** Tool ID for provider resolution (defaults to "ccbos" for backward compat) */
  toolId?: string;
}

/**
 * Make a chat completion API call using provider-specific credentials
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<string> {
  const { model, messages, temperature = 0.7, maxTokens = 2000, providerId, toolId = "ccbos" } = options;

  const state = useSettingsStore.getState();

  // Resolve provider
  let provider = providerId
    ? state.providers[providerId]
    : state.getEffectiveProvider(toolId);

  // Fallback to legacy settings if no provider found
  if (!provider && state.apiKey) {
    provider = {
      id: "legacy",
      name: "Legacy",
      baseUrl: state.apiBaseUrl || "https://openrouter.ai/api/v1",
      apiKey: state.apiKey,
      isEnabled: true,
      isDefault: true,
    };
  }

  if (!provider) {
    throw new Error("No API provider configured. Please add a provider in Settings.");
  }

  if (!provider.apiKey) {
    throw new Error(`Provider "${provider.name}" has no API key configured.`);
  }

  // In Wails mode, use Go backend to avoid CORS issues
  const app = await getWailsApp();
  if (app && typeof app.CallChatAPI === "function") {
    const result = await app.CallChatAPI(
      provider.baseUrl,
      provider.apiKey,
      model,
      messages,
      temperature,
      maxTokens
    );

    // Parse response
    const data = JSON.parse(result);

    if (data.error) {
      throw new Error(
        typeof data.error === "string" ? data.error : data.error.message || "API error"
      );
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from model");
    }

    return content;
  }

  // Browser mode: direct fetch (may have CORS issues with some providers)
  const baseUrl = provider.baseUrl.replace(/\/$/, "");
  const endpoint = `${baseUrl}/chat/completions`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
      "X-Title": "P4RS3LT0NGV3",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API error: ${response.status}`;

    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      } else if (typeof errorJson.error === "string") {
        errorMessage = errorJson.error;
      }
    } catch {
      if (errorText) {
        errorMessage = errorText;
      }
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(
      typeof data.error === "string" ? data.error : data.error.message || "API error"
    );
  }

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from model");
  }

  return content;
}

/**
 * Check if any provider is configured
 */
export function hasProvider(): boolean {
  const state = useSettingsStore.getState();
  return (
    Object.keys(state.providers).length > 0 ||
    state.apiKey.length > 0
  );
}
