import { fuzzerRegistry } from '../../registry'
import { handler as crescendoHandler } from './crescendo'
import { handler as wordGameHandler } from './word_game'
import { handler as taxonomyHandler } from './taxonomy'
import { handler as pairHandler } from './pair'

// Register all advanced attack handlers
fuzzerRegistry.registerAttack(crescendoHandler)
fuzzerRegistry.registerAttack(wordGameHandler)
fuzzerRegistry.registerAttack(taxonomyHandler)
fuzzerRegistry.registerAttack(pairHandler)

export { handler as crescendo } from './crescendo'
export { handler as wordGame } from './word_game'
export { handler as taxonomy } from './taxonomy'
export { handler as pair } from './pair'
