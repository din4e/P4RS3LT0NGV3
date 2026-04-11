import { fuzzerRegistry } from '../registry'
import { harmfulLlmClassifier } from './harmful_llm'
import { ratingClassifier } from './rating'
import { genericClassifier } from './generic'

fuzzerRegistry.registerClassifier(harmfulLlmClassifier)
fuzzerRegistry.registerClassifier(ratingClassifier)
fuzzerRegistry.registerClassifier(genericClassifier)
