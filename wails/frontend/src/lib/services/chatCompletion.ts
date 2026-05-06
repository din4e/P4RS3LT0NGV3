/**
 * Chat Completion Service
 * Makes API calls using provider-specific credentials from the settings store.
 * In Wails mode, routes through Go backend to avoid CORS issues.
 */

import { useSettingsStore } from "@/stores/useSettingsStore";

export function isWailsMode(): boolean {
  return (
    typeof window !== "undefined" &&
    (!!(window as any).runtime || !!(window as any).go?.main?.App)
  );
}

/**
 * Call Go backend method through Wails bindings
 */
async function wailsCall(method: string, ...args: unknown[]): Promise<string> {
  // Try dynamic import of Wails binding first
  try {
    const wailsApp: any = await import("@/../../wailsjs/go/main/App");
    if (wailsApp[method]) {
      return await wailsApp[method](...args);
    }
  } catch {
    // Fallback to window.go
  }
  // Direct window.go call
  const app: any = (window as any).go?.main?.App;
  if (app?.[method]) {
    return await app[method](...args);
  }
  throw new Error(`Wails backend method ${method} not available`);
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

  const isKeyless = provider.requiresApiKey === false;
  if (!isKeyless && !provider.apiKey) {
    throw new Error(`Provider "${provider.name}" has no API key configured.`);
  }

  // In Wails mode, use Go backend to avoid CORS issues
  if (isWailsMode()) {
    const apiKeyToSend = isKeyless ? "" : provider.apiKey;
    try {
      const result = await wailsCall("CallChatAPI",
        provider.baseUrl,
        apiKeyToSend,
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
    } catch (e) {
      // If Go backend call fails with a meaningful error, throw it
      if (e instanceof Error && !e.message.includes("Wails backend")) {
        throw e;
      }
      // Otherwise fall through to browser fetch
    }
  }

  // Browser mode: direct fetch (may have CORS issues with some providers)
  const baseUrl = provider.baseUrl.replace(/\/$/, "");
  const ic = provider.interactionConfig;
  const chatPath = ic?.chatEndpoint || "/chat/completions";
  const endpoint = `${baseUrl}${chatPath.startsWith("/") ? chatPath : "/" + chatPath}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
    "X-Title": "P4RS3LT0NGV3",
  };

  if (!isKeyless && provider.apiKey) {
    headers["Authorization"] = `Bearer ${provider.apiKey}`;
  }

  if (ic?.customHeaders) {
    Object.assign(headers, ic.customHeaders);
  }

  // Build request body with optional field mapping
  const modelField = ic?.fieldMapping?.modelField || "model";
  const messagesField = ic?.fieldMapping?.messagesField || "messages";
  const bodyObj: Record<string, unknown> = {
    [modelField]: model,
    [messagesField]: messages,
    temperature,
    max_tokens: maxTokens,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(bodyObj),
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

  // Support custom content path from interactionConfig
  let content: string | undefined;
  if (ic?.responseParsing?.contentPath) {
    const parts = ic.responseParsing.contentPath.split(".");
    let node: any = data;
    for (const part of parts) {
      node = node?.[part];
    }
    content = typeof node === "string" ? node : undefined;
  } else {
    content = data.choices?.[0]?.message?.content;
  }

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
