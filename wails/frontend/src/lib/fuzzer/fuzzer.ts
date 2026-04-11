import type {
  AttackResult,
  ClassifyResult,
  FuzzerCallbacks,
  FuzzerConfig,
  FuzzerReport,
  FuzzerSummary,
  LLMCaller,
} from './types'
import { createLLMCaller } from './llmCaller'
import { fuzzerRegistry } from './registry'

function generateId(): string {
  return `fuzz-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createInitialSummary(total: number): FuzzerSummary {
  return {
    totalAttacks: total,
    completedAttacks: 0,
    failedAttacks: 0,
    jailbroken: 0,
    safe: 0,
    successRate: 0,
    byAttack: {},
  }
}

export async function runFuzzer(
  config: FuzzerConfig,
  callbacks: FuzzerCallbacks,
  abortSignal?: AbortSignal,
): Promise<FuzzerReport> {
  const startedAt = Date.now()
  const results: AttackResult[] = []
  const summary = createInitialSummary(config.attackIds.length)

  const targetLLM = createLLMCaller(config.targetModel, config.targetProvider)
  const auxiliaryLLM =
    config.auxiliaryModel && config.auxiliaryProvider
      ? createLLMCaller(config.auxiliaryModel, config.auxiliaryProvider)
      : undefined
  const classifierLLM =
    config.classifierModel && config.classifierProvider
      ? createLLMCaller(config.classifierModel, config.classifierProvider)
      : targetLLM

  for (const attackId of config.attackIds) {
    if (abortSignal?.aborted) break

    const handler = fuzzerRegistry.getAttack(attackId)
    if (!handler) {
      callbacks.onError(attackId, `Unknown attack: ${attackId}`)
      summary.failedAttacks++
      continue
    }

    callbacks.onAttackStart(attackId)
    const attackOptions = config.attackOptions[attackId] ?? {}

    let result: AttackResult
    try {
      result = await handler.execute(
        config.targetPrompt,
        targetLLM,
        handler.definition.requiresAuxiliaryModel ? auxiliaryLLM : undefined,
        attackOptions,
        (msg) => callbacks.onAttackProgress(attackId, msg),
      )

      // Run classifiers
      if (result.response && config.classifierIds.length > 0) {
        for (const classifierId of config.classifierIds) {
          if (abortSignal?.aborted) break

          const classifier = fuzzerRegistry.getClassifier(classifierId)
          if (!classifier) continue

          try {
            const classifyResult = await classifier.classify(
              result.response,
              config.targetPrompt,
              classifierLLM,
            )
            result.classifications[classifierId] = classifyResult
            callbacks.onClassifyComplete(attackId, classifierId, classifyResult)
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            result.classifications[classifierId] = {
              isJailbreak: false,
              score: 0,
              reasoning: `Classification error: ${msg}`,
            }
          }
        }
      }

      // Determine if jailbroken (any classifier says yes)
      result.isJailbroken = Object.values(result.classifications).some(
        (c) => c.isJailbreak,
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (abortSignal?.aborted && err instanceof DOMException && err.name === 'AbortError') {
        break
      }
      result = {
        attackId,
        originalPrompt: config.targetPrompt,
        transformedPrompt: '',
        response: '',
        classifications: {},
        isJailbroken: false,
        error: msg,
        timestamp: Date.now(),
      }
      callbacks.onError(attackId, msg)
      summary.failedAttacks++
    }

    results.push(result)
    callbacks.onAttackComplete(attackId, result)

    // Update summary
    if (!result.error) {
      summary.completedAttacks++
      if (result.isJailbroken) {
        summary.jailbroken++
      } else {
        summary.safe++
      }
    }

    if (!summary.byAttack[attackId]) {
      summary.byAttack[attackId] = { jailbroken: 0, safe: 0, total: 0 }
    }
    summary.byAttack[attackId].total++
    if (result.isJailbroken) {
      summary.byAttack[attackId].jailbroken++
    } else if (!result.error) {
      summary.byAttack[attackId].safe++
    }

    summary.successRate =
      summary.completedAttacks > 0
        ? summary.jailbroken / summary.completedAttacks
        : 0

    callbacks.onSummaryUpdate({ ...summary })
  }

  return {
    id: generateId(),
    config,
    results,
    summary,
    startedAt,
    completedAt: Date.now(),
  }
}
