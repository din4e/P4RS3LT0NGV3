import { ACTION_IDS } from './actions'
import type { TraceHyperparams } from './types'

// Fixed constants from TRACE/action_policy.py (ActionPolicy dataclass defaults;
// execute_step.py exposes no CLI override for either).
const INIT_Q = 1.0 // init_q: all Q entries equal → uniform initial policy.
const INIT_TEMPERATURE = 1.5 // temperature: per-action temp init AND the fixed temp of the "init" row.

function softmaxStable(row: number[], temperature: number): number[] {
  const t = Math.max(1e-6, temperature)
  const m = Math.max(...row.map((v) => v / t))
  const exps = row.map((v) => Math.exp(v / t - m))
  const sum = exps.reduce((a, b) => a + b, 0) + 1e-12
  return exps.map((e) => e / sum)
}

function sample(probs: number[]): number {
  const r = Math.random()
  let acc = 0
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i]
    if (r <= acc) return i
  }
  return probs.length - 1
}

/** Policy entropy with the source's `safe_probs = probs + 1e-12` stabilization. */
function rowEntropy(probs: number[]): number {
  let h = 0
  for (const p of probs) {
    const sp = p + 1e-12
    h -= sp * Math.log(sp)
  }
  return h
}

/**
 * Q-learning action-selection policy over the 15 transformation actions
 * (paper §4.3; dynamics verbatim from TRACE/action_policy.py:ActionPolicy).
 *
 * `G` is (n+1)×n: the extra synthetic `"init"` row (last row) seeds the first
 * action when there is no predecessor (Algorithm 1, line 7). `actionTemp` is a
 * per-ACTION adaptive temperature (length n); the init row uses the fixed
 * `INIT_TEMPERATURE` and is never adapted or decayed (mirrors
 * `select_initial_action` using the global `temperature`).
 */
export class ActionPolicy {
  readonly n: number
  /** G[u][v] = utility of taking action v after action/init u. */
  G: number[][]
  /** Per-action adaptive temperature (excludes the init row). */
  actionTemp: number[]
  private hyper: TraceHyperparams
  private updates = 0

  constructor(hyper: TraceHyperparams) {
    this.hyper = hyper
    this.n = ACTION_IDS.length
    const rows = this.n + 1
    this.G = Array.from({ length: rows }, () => new Array(this.n).fill(INIT_Q))
    this.actionTemp = new Array(this.n).fill(INIT_TEMPERATURE)
  }

  /** Index of the synthetic "init" row (last row). */
  private get initRow(): number {
    return this.n
  }

  /** Row index for a previous action id (null/fallback → init row). */
  private rowIndex(prevAction: string | null): number {
    if (!prevAction) return this.initRow
    const idx = ACTION_IDS.indexOf(prevAction)
    return idx >= 0 ? idx : this.initRow
  }

  actionIndex(action: string): number {
    return ACTION_IDS.indexOf(action)
  }

  /**
   * Adaptive temperature (action_policy.py:adaptive_temperature). If the row's
   * policy has collapsed (entropy < collapse_ratio·log n), reheat toward tMax;
   * otherwise keep the current temperature. Both clamped to tMin.
   */
  private adaptiveTemperature(base: number, qValues: number[]): number {
    const probs = softmaxStable(qValues, base)
    const h = rowEntropy(probs)
    const hMax = Math.log(this.n)
    if (h < this.hyper.collapseRatio * hMax) {
      return Math.max(this.hyper.tMin, Math.min(base * this.hyper.beta, this.hyper.tMax))
    }
    return Math.max(this.hyper.tMin, base)
  }

  /**
   * eq.3 — sample the next action given the previous one (null = first action).
   * Mirrors select_next_action / select_initial_action:
   *   adapt temperature (collapse → reheat) → softmax with the adapted temp →
   *   decay by η. The first action uses the fixed init-row temperature.
   */
  selectNextAction(prevAction: string | null): { action: string; index: number } {
    if (!prevAction) {
      // select_initial_action: fixed global temperature, no adapt/decay.
      const probs = softmaxStable(this.G[this.initRow], INIT_TEMPERATURE)
      const v = sample(probs)
      return { action: ACTION_IDS[v], index: v }
    }
    const u = this.rowIndex(prevAction)
    // ① adapt (reheat when the row policy has collapsed).
    this.actionTemp[u] = this.adaptiveTemperature(this.actionTemp[u], this.G[u])
    // ② softmax with the adapted temperature.
    const probs = softmaxStable(this.G[u], this.actionTemp[u])
    // ③ decay by η (clamped to tMin).
    this.actionTemp[u] = Math.max(this.hyper.tMin, this.actionTemp[u] * this.hyper.eta)
    const v = sample(probs)
    return { action: ACTION_IDS[v], index: v }
  }

  /** eq.6 — Q-learning update, with reward halving (code: `reward /= 2`). */
  update(prevAction: string | null, actionIndex: number, delta: number): void {
    const u = this.rowIndex(prevAction)
    const v = actionIndex
    const reward = delta / 2
    const maxNext = Math.max(...this.G[v])
    const target = reward + this.hyper.gamma * maxNext
    this.G[u][v] += this.hyper.alpha * (target - this.G[u][v])

    this.updates++
    if (this.updates % 50 === 0) this.shrinkTowardUniform()
  }

  /** Periodic shrink toward row means (code: shrink_q_table_toward_uniform, λ). */
  shrinkTowardUniform(): void {
    const lam = this.hyper.shrinkLambda
    for (const row of this.G) {
      const mean = row.reduce((a, b) => a + b, 0) / row.length
      for (let i = 0; i < row.length; i++) row[i] = (1 - lam) * row[i] + lam * mean
    }
  }
}
