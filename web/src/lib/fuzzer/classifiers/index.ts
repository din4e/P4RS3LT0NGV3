import { fuzzerRegistry } from '../registry'
import { harmfulLlmClassifier } from './harmful_llm'
import { ratingClassifier } from './rating'
import { genericClassifier } from './generic'
import { obviousNegativeClassifier } from './obvious_negative'
import { disapprovalClassifier } from './disapproval'
import { harmScoreClassifier } from './harm_score'
import { committeeClassifier } from './committee'

fuzzerRegistry.registerClassifier(harmfulLlmClassifier)
fuzzerRegistry.registerClassifier(ratingClassifier)
fuzzerRegistry.registerClassifier(genericClassifier)
fuzzerRegistry.registerClassifier(obviousNegativeClassifier)
fuzzerRegistry.registerClassifier(disapprovalClassifier)
fuzzerRegistry.registerClassifier(harmScoreClassifier)
fuzzerRegistry.registerClassifier(committeeClassifier)
