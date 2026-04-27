'use client'

import { useMemo } from 'react'
import { analyze, neutralizeText, type LexemeAnalysis } from '@/lib/utils/lexemeAnalysis'

interface LexemeAnalysisPanelProps {
  text: string
  onApplyRewrite: (rewritten: string) => void
  label?: string
}

export default function LexemeAnalysisPanel({
  text,
  onApplyRewrite,
  label = 'Latin-root Analysis',
}: LexemeAnalysisPanelProps) {
  const analysis: LexemeAnalysis = useMemo(() => analyze(text), [text])

  if (!text.trim() || analysis.totalFindings === 0) return null

  const severityColor = (s: string) => {
    if (s === 'high') return 'text-red-400 bg-red-500/10 border-red-500/30'
    if (s === 'medium') return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--muted)] border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
            {analysis.totalFindings}
          </span>
        </div>
        <button
          className="text-xs text-[var(--primary)] hover:underline"
          onClick={() => onApplyRewrite(neutralizeText(text, analysis))}
        >
          Neutralize all
        </button>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {analysis.findings.map((f) => (
          <div key={f.id} className="flex items-center gap-2 px-3 py-2">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase ${severityColor(f.severity)}`}
            >
              {f.severity}
            </span>
            <span className="text-sm font-mono text-[var(--foreground)]">{f.term}</span>
            <span className="text-xs text-[var(--muted-foreground)]">&rarr;</span>
            {f.primaryRewrite && (
              <span className="text-sm font-mono text-green-400">{f.primaryRewrite}</span>
            )}
            <span className="text-[11px] text-[var(--muted-foreground)] ml-auto">
              {f.family.replace(/_/g, ' ')}
            </span>
            {f.primaryRewrite && (
              <button
                className="text-[11px] text-[var(--primary)] hover:underline shrink-0"
                onClick={() => {
                  const re = new RegExp('\\b' + f.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi')
                  onApplyRewrite(text.replace(re, f.primaryRewrite))
                }}
              >
                Apply
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
