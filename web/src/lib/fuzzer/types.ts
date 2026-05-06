// ── LLM Caller ────────────────────────────────────────────────────────

export type LLMCaller = (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { temperature?: number; maxTokens?: number },
) => Promise<string>

// ── Attack Definitions ────────────────────────────────────────────────

export type AttackComplexity = 'simple' | 'medium' | 'advanced'

export interface AttackOptionDef {
  key: string
  label: string
  type: 'boolean' | 'number' | 'string' | 'select'
  default: unknown
  options?: string[]
  min?: number
  max?: number
}

export interface AttackDefinition {
  id: string
  name: string
  description: string
  complexity: AttackComplexity
  requiresAuxiliaryModel: boolean
  options?: AttackOptionDef[]
}

// ── Attack Handler ────────────────────────────────────────────────────

export interface AttackHandler {
  readonly definition: AttackDefinition

  /** Simple attacks: transform the prompt string (no LLM needed for setup) */
  transform?(prompt: string, options?: Record<string, unknown>): string

  /** Full execution: transform + send to target + return result */
  execute(
    prompt: string,
    targetLLM: LLMCaller,
    auxiliaryLLM: LLMCaller | undefined,
    options: Record<string, unknown>,
    onProgress: (msg: string) => void,
  ): Promise<AttackResult>
}

// ── Classifier ────────────────────────────────────────────────────────

export interface ClassifierHandler {
  id: string
  name: string
  description: string
  classify(
    response: string,
    originalPrompt: string,
    llm: LLMCaller,
  ): Promise<ClassifyResult>
}

export interface ClassifyResult {
  isJailbreak: boolean
  score: number // 0-1 normalized
  reasoning?: string
  raw?: string
}

// ── Attack Result ─────────────────────────────────────────────────────

export interface AttackResult {
  attackId: string
  originalPrompt: string
  transformedPrompt: string
  response: string
  classifications: Record<string, ClassifyResult>
  isJailbroken: boolean
  metadata?: Record<string, unknown>
  error?: string
  timestamp: number
}

// ── Fuzzer Config ─────────────────────────────────────────────────────

export interface FuzzerConfig {
  targetPrompt: string
  attackIds: string[]
  classifierIds: string[]
  targetModel: string
  targetProvider?: string
  auxiliaryModel?: string
  auxiliaryProvider?: string
  classifierModel?: string
  classifierProvider?: string
  attackOptions: Record<string, Record<string, unknown>>
}

// ── Fuzzer Callbacks ──────────────────────────────────────────────────

export interface FuzzerCallbacks {
  onAttackStart: (attackId: string) => void
  onAttackProgress: (attackId: string, message: string) => void
  onAttackComplete: (attackId: string, result: AttackResult) => void
  onClassifyComplete: (attackId: string, classifierId: string, result: ClassifyResult) => void
  onError: (attackId: string, error: string) => void
  onSummaryUpdate: (summary: FuzzerSummary) => void
}

// ── Fuzzer Report ─────────────────────────────────────────────────────

export interface FuzzerReport {
  id: string
  config: FuzzerConfig
  results: AttackResult[]
  summary: FuzzerSummary
  startedAt: number
  completedAt: number
}

export interface FuzzerSummary {
  totalAttacks: number
  completedAttacks: number
  failedAttacks: number
  jailbroken: number
  safe: number
  successRate: number
  byAttack: Record<string, { jailbroken: number; safe: number; total: number }>
}
