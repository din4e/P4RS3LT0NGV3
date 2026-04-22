export interface InjectionRule {
  id: string
  name: string
  pattern: RegExp
  severity: 'low' | 'medium' | 'high'
  description: string
}

export interface InjectionMatch {
  rule: InjectionRule
  match: string
  index: number
}

export interface InjectionResult {
  matches: InjectionMatch[]
  ruleScore: number       // 0-1 from rule-based detection
  llmScore: number | null // 0-1 from LLM analysis, null if not run
  overallScore: number    // combined
  llmReasoning?: string
}
