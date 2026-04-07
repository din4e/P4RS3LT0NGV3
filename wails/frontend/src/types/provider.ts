/**
 * API Provider Configuration
 * Represents a configured AI API provider with its credentials and cached models.
 */

export interface APIProvider {
  /** Unique identifier for this provider configuration */
  id: string

  /** Display name shown in UI */
  name: string

  /** API base URL (e.g., https://openrouter.ai/api/v1) */
  baseUrl: string

  /** API key for authentication */
  apiKey: string

  /** Whether this provider is active */
  isEnabled: boolean

  /** Whether this is the global default provider */
  isDefault: boolean

  /** Cached list of available model IDs */
  models?: string[]

  /** Timestamp of last model list fetch (ms since epoch) */
  lastFetched?: number

  /** Last fetch timestamp for rate limiting */
  lastFetchAttempt?: number

  /** Optional description */
  description?: string

  /** Provider region for categorization */
  region?: 'china' | 'global'
}

/**
 * Preset provider template (without credentials)
 * Used for quick-add from predefined list
 */
export interface ProviderPreset {
  id: string
  name: string
  baseUrl: string
  description: string
  region: 'china' | 'global'
}

/**
 * Tool-specific provider configuration
 */
export interface ToolProviderConfig {
  /** Tool identifier */
  toolId: string

  /** Selected provider ID (null = use default) */
  providerId: string | null

  /** Selected model ID */
  modelId: string | null
}
