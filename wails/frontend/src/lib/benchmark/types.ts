export interface BenchmarkEntry {
  id: string
  prompt: string
  category: string
}

export interface BenchmarkRunEntry {
  entry: BenchmarkEntry
  response: string
  isRefused: boolean
  error?: string
}

export interface BenchmarkRun {
  id: string
  datasetName: string
  model: string
  provider: string
  totalPrompts: number
  successfulAttacks: number
  asr: number
  results: BenchmarkRunEntry[]
  startedAt: number
  completedAt: number
}

export interface BenchmarkDataset {
  name: string
  description: string
  entries: BenchmarkEntry[]
}
