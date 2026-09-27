/**
 * Injection fixture generation engine.
 *
 * Ported from icesky InjectionGeneratorTool (js/tools/InjectionGeneratorTool.js).
 * Draws random templates from the built-in library (optionally appending a
 * custom instruction) to build reproducible prompt-injection test batches.
 * The seeded PRNG matches icesky byte-for-byte so a given seed reproduces the
 * same batch across ports.
 */

import {
  INJECTION_TEMPLATES,
  type InjectionLanguage,
  type InjectionTemplate,
} from './templates'

export type { InjectionLanguage, InjectionTemplate }

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export interface InjectionCategory {
  id: string
  /** Chinese display name (kept verbatim from icesky). */
  name: string
}

/** Unique template categories for a language, in library order. */
export function listCategories(language: InjectionLanguage): InjectionCategory[] {
  const byId = new Map<string, InjectionCategory>()
  for (const tpl of INJECTION_TEMPLATES) {
    if (tpl.language !== language) continue
    if (!byId.has(tpl.category)) {
      byId.set(tpl.category, { id: tpl.category, name: tpl.categoryName })
    }
  }
  return Array.from(byId.values())
}

// ---------------------------------------------------------------------------
// Seeded PRNG (must stay identical to icesky for reproducible batches)
// ---------------------------------------------------------------------------

/** FNV-1a 32-bit hash of the seed string, matching icesky's initialization. */
function hashSeed(seed: string): number {
  let h = 2166136261
  for (const ch of seed) {
    h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  }
  return h
}

/**
 * Incremental xorshift-style generator state.
 * Returns a uniform float in [0, 1); replicates icesky's exact arithmetic.
 */
function makeRng(seed: string): () => number {
  let state = hashSeed(seed)
  return () => {
    state += 1831565813
    let x = Math.imul(state ^ (state >>> 15), 1 | state)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export interface GenerateOptions {
  language: InjectionLanguage
  /** Category id, or 'all'. */
  category: string
  /** Number of samples (clamped to 1..20). */
  count: number
  /** Optional extra instruction appended to every result. */
  custom?: string
  /** Random seed; empty/undefined derives one from the clock. */
  seed?: string
}

export interface GeneratedFixture {
  /** Original template text before the custom instruction was appended. */
  original: string
  /** Template + custom instruction, as generated. */
  generated: string
  /** Current (editable) text — may drift from `generated` after user edits. */
  text: string
  /** True when an earlier draw in the same batch produced identical text. */
  duplicate: boolean
  /** Display name of the template category. */
  categories: string
}

export interface GenerationBatch {
  /** Seed string used for this batch (reproducible). */
  seed: string
  language: InjectionLanguage
  category: string
  count: number
  custom: string
}

export interface GenerationResult {
  batch: GenerationBatch
  fixtures: GeneratedFixture[]
}

/** Resolve the effective seed string (explicit seed or a clock-derived one). */
export function resolveSeed(seed: string | undefined): string {
  const s = String(seed ?? '').trim()
  return s || String(Date.now())
}

/**
 * Generate a batch of injection fixtures.
 *
 * Templates are drawn without replacement from the filtered pool; when the
 * pool is smaller than the requested count it is refilled (duplicate draws
 * are flagged). Throws when no template matches the filter.
 */
export function generateFixtures(options: GenerateOptions): GenerationResult {
  const language = options.language
  const category = options.category || 'all'
  const count = Math.max(
    1,
    Math.min(20, Math.floor(Number.isFinite(options.count) ? options.count : 3)),
  )
  const custom = String(options.custom ?? '').trim()
  const seed = resolveSeed(options.seed)

  const pool0 = INJECTION_TEMPLATES.filter(
    (tpl) =>
      tpl.language === language &&
      (category === 'all' || tpl.category === category),
  )
  if (pool0.length === 0) {
    throw new Error('No template matches the selected language/category')
  }

  const batch: GenerationBatch = {
    seed,
    language,
    category,
    count,
    custom,
  }

  const rng = makeRng(seed)
  const seen = new Set<string>()
  let pool: InjectionTemplate[] = []

  const fixtures: GeneratedFixture[] = Array.from({ length: count }, () => {
    if (pool.length === 0) pool = pool0.slice()
    const tpl = pool.splice(Math.floor(rng() * pool.length), 1)[0]
    const generated =
      tpl.text + (custom ? '\n\n' + custom : '')
    const duplicate = seen.has(generated)
    seen.add(generated)
    return {
      original: tpl.text,
      generated,
      text: generated,
      duplicate,
      categories: tpl.categoryName,
    }
  })

  return { batch, fixtures }
}

// ---------------------------------------------------------------------------
// Serialization & export
// ---------------------------------------------------------------------------

export type ExportFormat = 'txt' | 'json' | 'jsonl'

interface SerializedFixture extends GeneratedFixture {
  id: number
  edited: boolean
}

function enrich(batch: GenerationBatch, fixtures: GeneratedFixture[]): SerializedFixture[] {
  return fixtures.map((f, i) => ({
    id: i + 1,
    ...f,
    edited: f.text !== f.generated,
  }))
}

/** Serialize a batch to txt / json / jsonl, matching icesky's export shape. */
export function serializeBatch(
  batch: GenerationBatch,
  fixtures: GeneratedFixture[],
  format: ExportFormat,
): string {
  if (format === 'txt') {
    return fixtures.map((f) => f.text).join('\n\n---\n\n')
  }
  const enriched = enrich(batch, fixtures)
  if (format === 'jsonl') {
    return enriched
      .map((f) => JSON.stringify({ version: 1, config: batch, ...f }))
      .join('\n')
  }
  return JSON.stringify(
    { version: 1, config: batch, results: enriched },
    null,
    2,
  )
}

/** Download a serialized batch as `injection-fixtures.<format>`. */
export function downloadBatch(
  batch: GenerationBatch,
  fixtures: GeneratedFixture[],
  format: ExportFormat,
): void {
  const blob = new Blob([serializeBatch(batch, fixtures, format)], {
    type: 'text/plain;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `injection-fixtures.${format}`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
