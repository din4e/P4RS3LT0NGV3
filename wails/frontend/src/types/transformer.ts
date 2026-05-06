// @ts-nocheck
export interface TransformOptions {
  [key: string]: unknown
}

export interface DecodeResult {
  text: string
  method: string
  priority: number
  alternatives: Array<{ text: string; method: string; priority: number }>
}

export interface DecodeContext {
  activeTab?: string
  activeTransform?: { name: string; [key: string]: unknown }
}

export interface CopyHistoryEntry {
  id: string
  content: string
  source: string
  timestamp: number
}

export interface StegOptions {
  bitOrder: 'msb' | 'lsb'
  bitZeroVS: string
  bitOneVS: string
  initialPresentation: 'emoji' | 'text' | 'none'
  trailingZW: string | null
  interBitZW: string | null
  interBitEvery: number
  [key: string]: unknown
}

export interface HistoryEntry {
  source: string
  content: string
  timestamp: string
  id: number
}

export interface ClipboardOptions {
  onSuccess?: () => void
  onError?: (err: Error) => void
  suppressNotification?: boolean
}

export interface GlitchToken {
  token?: string
  token_id?: number
  behavior?: string
  category?: string
  categoryDescription?: string
  origin?: string
  observed_output?: string
  note?: string
  distance_from_centroid?: number
  rank?: number
  [key: string]: unknown
}

export interface OpenRouterModel {
  id: string
  name: string
  provider: string
}

export interface EndSequenceCategory {
  title: string
  items: Array<{ label: string; value: string }>
}
