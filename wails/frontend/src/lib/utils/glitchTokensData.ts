// @ts-nocheck
/**
 * Glitch token data - AGGREGLITCH library.
 * Migrated from js/data/glitchTokens.js to TypeScript ES module.
 *
 * The raw JSON was extracted into glitchTokensData.json to keep this
 * module tiny. Import the named export wherever the data is needed.
 */

import _rawData from './glitchTokensData.json'

export interface GlitchTokenMetadata {
  name: string
  version: string
  description: string
  tagline?: string
  total_tokens_cataloged: number
  last_updated: string
  sources?: string[]
  usage?: string
}

export const glitchTokensMetadata: GlitchTokenMetadata = _rawData._metadata

export const behaviorCategories: Record<string, string> = _rawData.behavior_categories

export const tokenizers: Record<string, any> = _rawData.tokenizers

export const glitchTokens: Record<string, any> = _rawData.glitch_tokens

export const exploitationTechniques: Record<string, any> = _rawData.exploitation_techniques

export const detectionTools: Record<string, any> = _rawData.detection_tools

export const statistics: Record<string, any> = _rawData.statistics

export const centroidPhenomenon: Record<string, any> = _rawData.centroid_phenomenon

export const specialSystemTokens: Record<string, any> = _rawData.special_system_tokens

/**
 * The complete dataset as a single object (mirrors the original window.glitchTokensData).
 */
const glitchTokensData: Record<string, any> = _rawData

export default glitchTokensData
