/**
 * Interaction config for customizing how chat requests are built and parsed.
 * Allows non-standard providers to work with the system without code changes.
 */
export interface InteractionConfig {
  /** Override endpoint path (default: /chat/completions) */
  chatEndpoint?: string
  /** Custom headers to send with every request */
  customHeaders?: Record<string, string>
  /** Request body field mappings */
  fieldMapping?: {
    modelField?: string    // default: "model"
    messagesField?: string // default: "messages"
  }
  /** Response parsing */
  responseParsing?: {
    contentPath?: string   // default: "choices.0.message.content"
  }
}

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

  /** API key for authentication (empty for local providers) */
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
  region?: 'china' | 'global' | 'local'

  /** Whether this provider requires an API key (local providers set false) */
  requiresApiKey?: boolean

  /** Whether this is a local provider running on localhost */
  isLocal?: boolean

  /** JSON config for customizing model interaction */
  interactionConfig?: InteractionConfig
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
  region: 'china' | 'global' | 'local'
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
