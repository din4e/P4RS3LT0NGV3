/**
 * TRACE — Task-Aware Adaptive Self-Evolving Agentic Jailbreaking.
 * Core type definitions.
 *
 * Reference: ZJU-LLM-Safety/TRACE (arXiv:2605.30883), Algorithm 1.
 *
 * Faithful re-implementation of the paper's core loop (scenario wrapping +
 * Q-learning self-evolution + memory) for a single configured chat model.
 * See TOOL_ARCHITECTURE / the tool's "About" panel for documented
 * simplifications (population=1, target = chat model, TF-cosine memory).
 */

/** Which scenario component an action targets. */
export type ActionComponent = 'role' | 'environment' | 'directive' | 'tips'

/**
 * A TRACE scenario = four task-aware components (paper §4.2.2).
 *   role        — task-relevant persona for the agent
 *   environment — execution setting (resources, interfaces, constraints)
 *   directive   — execution procedure / tool-use rules
 *   tips        — fine-grained heuristics (the "h" component, 3–5 of them)
 */
export interface Scenario {
  role: string
  environment: string
  directive: string
  tips: string[]
}

/** Component pools P = {P_r, P_e, P_d, P_h}; seeded once, grown via donation. */
export interface ComponentPools {
  roles: string[]
  environments: string[]
  directives: string[]
  tips: string[]
}

export type LLMRole = 'system' | 'user' | 'assistant'
export interface LLMMessage {
  role: LLMRole
  content: string
}

/**
 * Caller-supplied LLM callable. The UI wraps `chatCompletion` into this shape
 * so the runner stays environment-agnostic.
 */
export type LLMCaller = (
  messages: LLMMessage[],
  options?: { temperature?: number; maxTokens?: number },
) => Promise<string>

/** A single transformation action (paper Appendix A.2). */
export interface ActionDef {
  id: string
  component: ActionComponent
  description: string
}

/** Hyperparameters (code defaults; paper §4 + Appendix A.3). */
export interface TraceHyperparams {
  /** Iteration budget L (paper: 50; code default: 5). */
  maxIterations: number
  /** Acceptance / early-stop threshold τ_mem. */
  tauMem: number
  /** Refusal weight λ_rej. */
  lambdaRej: number
  /** Q-learning rate α. */
  alpha: number
  /** Q-learning discount γ. */
  gamma: number
  /** Temperature schedule bounds. */
  tMin: number
  tMax: number
  /** Decay factor η. */
  eta: number
  /** Reheat factor β. */
  beta: number
  /** Entropy collapse ratio for the reheat trigger. */
  collapseRatio: number
  /** Shrink-toward-uniform factor λ. */
  shrinkLambda: number
  /** Tips-count bounds. */
  minTips: number
  maxTips: number
}

export const DEFAULT_HYPERPARAMS: TraceHyperparams = {
  maxIterations: 5,
  tauMem: 0.95,
  lambdaRej: 1,
  alpha: 0.2,
  gamma: 0.9,
  tMin: 0.5,
  tMax: 2,
  eta: 0.99,
  beta: 1.5,
  collapseRatio: 0.4,
  shrinkLambda: 0.05,
  minTips: 3,
  maxTips: 5,
}

export interface TraceConfig {
  goal: string
  hyper: TraceHyperparams
  attackerLLM: LLMCaller
  targetLLM: LLMCaller
  judgeLLM: LLMCaller
  /** Stage-1 task decomposition (paper §4.1). */
  decompose: boolean
  /** Memory buffer (paper §4.3, eq.7). */
  useMemory: boolean
}

export interface IterationLog {
  iter: number
  action: string
  rhoBefore: number
  rhoAfter: number
  delta: number
  score: number
  refusal: number
  response: string
  scenario: Scenario
}

export interface TraceResult {
  bestScenario: Scenario | null
  bestPrompt: string
  bestRho: number
  jailbroken: boolean
  iterations: number
  logs: IterationLog[]
  subtasks?: string[]
}

export interface TraceCallbacks {
  onInit?: (info: { scenario: Scenario; rho: number; task: string; subtasks?: string[] }) => void
  onIteration?: (log: IterationLog) => void
  /** `prompt` is the scenario rendered against the exact task it was scored on. */
  onBestUpdate?: (scenario: Scenario, rho: number, prompt: string) => void
  onComplete?: (result: TraceResult) => void
  onError?: (message: string) => void
}
