export interface BenchmarkCategory {
  id: string
  name: string
  description: string
}

export interface BenchmarkEntry {
  goal: string
  category: string
}

export interface GuardrailsTestResult {
  entry: BenchmarkEntry
  response: string
  isRefused: boolean
  error?: string
}

export interface GuardrailsReport {
  results: GuardrailsTestResult[]
  byCategory: Record<string, { total: number; refused: number; passed: number; passRate: number }>
  overallPassRate: number
  totalTested: number
  startedAt: number
  completedAt: number
  meta?: {
    model: string
    provider: string
    temperature: number
    maxTokens: number
  }
}
