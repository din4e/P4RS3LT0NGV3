import type { ComponentPools, Scenario } from './types'

interface MemoryEntry {
  task: string
  scenario: Scenario
  rho: number
  vec: Map<string, number>
}

function tokenize(text: string): string[] {
  // Split on non-alphanumeric / non-CJK runs; keep tokens of length >= 2.
  return text.toLowerCase().split(/[^a-z0-9一-鿿]+/g).filter((t) => t.length > 1)
}

function tfVector(text: string): Map<string, number> {
  const v = new Map<string, number>()
  for (const tok of tokenize(text)) v.set(tok, (v.get(tok) ?? 0) + 1)
  return v
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0
  for (const [k, va] of a) {
    const vb = b.get(k)
    if (vb) dot += va * vb
  }
  let na = 0
  for (const v of a.values()) na += v * v
  let nb = 0
  for (const v of b.values()) nb += v * v
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

function scenarioText(s: Scenario): string {
  return [s.role, s.environment, s.directive, ...s.tips].join(' ')
}

/**
 * Memory buffer B (paper §4.3, eq.7).
 *
 * The paper retrieves similar scenarios with BGE embeddings; this client-side
 * implementation uses token-overlap (TF-cosine) instead, so no model download
 * is required. Component-pool donation on success is preserved verbatim.
 */
export class Memory {
  private entries: MemoryEntry[] = []

  add(scenario: Scenario, task: string, rho: number): void {
    this.entries.push({
      task,
      scenario,
      rho,
      vec: tfVector(`${task} ${scenarioText(scenario)}`),
    })
    if (this.entries.length > 200) this.entries.shift()
  }

  /** Retrieve the k most similar successful scenarios to warm-start from. */
  retrieve(task: string, k = 5): Scenario[] {
    if (this.entries.length === 0) return []
    const q = tfVector(task)
    return this.entries
      .map((e) => ({ e, sim: cosine(q, e.vec) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, k)
      .map((x) => x.e.scenario)
  }

  /** Donate a successful scenario's components back into the pools (eq.7). */
  donate(scenario: Scenario, pools: ComponentPools): void {
    const pushUnique = (arr: string[], val: string) => {
      if (val && !arr.includes(val)) arr.push(val)
    }
    pushUnique(pools.roles, scenario.role)
    pushUnique(pools.environments, scenario.environment)
    pushUnique(pools.directives, scenario.directive)
    for (const tip of scenario.tips) pushUnique(pools.tips, tip)
  }

  get size(): number {
    return this.entries.length
  }
}
