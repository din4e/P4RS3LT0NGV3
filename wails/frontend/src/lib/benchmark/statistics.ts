import type { BenchmarkRun } from './types'

export function computeStats(run: BenchmarkRun) {
  const { results, totalPrompts, successfulAttacks, asr } = run

  const byCategory: Record<string, { total: number; success: number; asr: number }> = {}
  for (const r of results) {
    const cat = r.entry.category
    if (!byCategory[cat]) byCategory[cat] = { total: 0, success: 0, asr: 0 }
    byCategory[cat].total++
    if (!r.isRefused) byCategory[cat].success++
  }
  for (const cat of Object.values(byCategory)) {
    cat.asr = cat.total > 0 ? cat.success / cat.total : 0
  }

  // Wilson score interval for 95% confidence
  const z = 1.96
  const n = totalPrompts
  const p = asr
  const denom = 1 + z * z / n
  const center = (p + z * z / (2 * n)) / denom
  const spread = (z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)) / denom
  const ciLow = Math.max(0, center - spread)
  const ciHigh = Math.min(1, center + spread)

  return {
    byCategory,
    ciLow: n > 0 ? ciLow : 0,
    ciHigh: n > 0 ? ciHigh : 0,
    duration: run.completedAt - run.startedAt,
  }
}
