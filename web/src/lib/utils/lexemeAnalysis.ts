/**
 * Shared Latin-root lexeme analysis and neutral rewrite generation.
 */

import { POLICIES, DOMAIN_ALIASES, type AffixPolicy } from '@/lib/data/latinAffixPolicies'

// ── types ──────────────────────────────────────────────────────────

export interface LexemeFinding {
  id: string
  term: string
  normalizedTerm: string
  family: string
  policyId: string
  affixes: string[]
  partOfSpeech: string
  extractedRoot: string
  semanticDomain: string
  severity: string
  confidence: number
  semanticShift: string
  rationale: string
  rewrites: string[]
  primaryRewrite: string
  matchIndex: number
}

export interface LexemeAnalysis {
  sourceText: string
  totalFindings: number
  findings: LexemeFinding[]
  families: string[]
  summary: string
}

// ── helpers ────────────────────────────────────────────────────────

function uniq(values: (string | undefined)[]): string[] {
  return Array.from(new Set(values.filter(Boolean) as string[]))
}

function titleCase(text: string): string {
  return String(text || '').replace(/\b[a-z]/g, (m) => m.toUpperCase())
}

function preserveCase(source: string, replacement: string): string {
  if (!source) return replacement
  if (source === source.toUpperCase()) return replacement.toUpperCase()
  if (
    source[0] === source[0].toUpperCase() &&
    source.slice(1) === source.slice(1).toLowerCase()
  ) {
    return titleCase(replacement)
  }
  return replacement
}

function normalizeRoot(rawRoot: string, aliases: Record<string, string>): string {
  const rootText = String(rawRoot || '').toLowerCase()
  if (!rootText) return ''
  if (aliases[rootText]) return aliases[rootText]

  const variants = [
    rootText.endsWith('i') ? rootText.slice(0, -1) : '',
    rootText.endsWith('ic') ? rootText.slice(0, -2) : '',
    rootText.endsWith('o') ? rootText.slice(0, -1) : '',
    rootText.endsWith('al') ? rootText.slice(0, -2) : '',
  ].filter(Boolean)

  for (const variant of variants) {
    if (aliases[variant]) return aliases[variant]
  }
  return ''
}

function materializeTemplates(
  templates: string[] | undefined,
  domain: string,
): string[] {
  return uniq(
    (templates || []).map((t) =>
      String(t || '').replace(/\{domain\}/g, domain || 'risk'),
    ),
  )
}

function resolveSuggestions(
  policy: AffixPolicy,
  domain: string,
): string[] {
  if (domain) return materializeTemplates(policy.rewriteTemplates, domain)
  return uniq(policy.fallbackTemplates || [])
}

function escapeRegExp(value: string): string {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── public API ─────────────────────────────────────────────────────

export function analyze(text: string): LexemeAnalysis {
  const input = String(text || '')

  if (!input.trim()) {
    return {
      sourceText: input,
      totalFindings: 0,
      findings: [],
      families: [],
      summary: 'No Latin-root wording findings.',
    }
  }

  const findings: LexemeFinding[] = []
  const seen = new Set<string>()

  for (const policy of POLICIES) {
    for (const pattern of policy.patterns) {
      let match: RegExpExecArray | null
      while ((match = pattern.exec(input)) !== null) {
        const term = match[0]
        const key = policy.id + '::' + term.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)

        const rootCandidate = match[1] || ''
        const semanticDomain = normalizeRoot(rootCandidate, DOMAIN_ALIASES)
        const rewrites = resolveSuggestions(policy, semanticDomain)

        findings.push({
          id: key,
          term,
          normalizedTerm: term.toLowerCase(),
          family: policy.family,
          policyId: policy.id,
          affixes: policy.affixes || [],
          partOfSpeech: policy.partOfSpeech,
          extractedRoot: rootCandidate || '',
          semanticDomain: semanticDomain || '',
          severity: policy.severity,
          confidence: policy.confidence,
          semanticShift: policy.semanticShift,
          rationale: policy.explanation,
          rewrites,
          primaryRewrite: rewrites[0] || '',
          matchIndex: match.index,
        })
      }
      // Reset regex state for reused patterns
      pattern.lastIndex = 0
    }
  }

  findings.sort((a, b) => a.matchIndex - b.matchIndex)

  return {
    sourceText: input,
    totalFindings: findings.length,
    findings,
    families: uniq(findings.map((f) => f.family)),
    summary: findings.length
      ? `Detected ${findings.length} Latin-root wording pattern${findings.length === 1 ? '' : 's'}.`
      : 'No Latin-root wording findings.',
  }
}

export function neutralizeText(text: string, analysis: LexemeAnalysis): string {
  const input = String(text || '')
  if (!analysis?.findings?.length) return input

  let output = input
  for (const finding of analysis.findings) {
    if (!finding.primaryRewrite) continue
    const matcher = new RegExp('\\b' + escapeRegExp(finding.term) + '\\b', 'gi')
    output = output.replace(matcher, (match) =>
      preserveCase(match, finding.primaryRewrite),
    )
  }
  return output
}
