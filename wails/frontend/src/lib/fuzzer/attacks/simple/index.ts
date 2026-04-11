import { fuzzerRegistry } from '../../registry'
import { defaultHandler } from './default'
import { danHandler } from './dan'
import { pleaseHandler } from './please'
import { thoughtExperimentHandler } from './thought_experiment'
import { piglatinHandler } from './piglatin'
import { asciiSmugglingHandler } from './ascii_smuggling'
import { hallucinationsHandler } from './hallucinations'

fuzzerRegistry.registerAttack(defaultHandler)
fuzzerRegistry.registerAttack(danHandler)
fuzzerRegistry.registerAttack(pleaseHandler)
fuzzerRegistry.registerAttack(thoughtExperimentHandler)
fuzzerRegistry.registerAttack(piglatinHandler)
fuzzerRegistry.registerAttack(asciiSmugglingHandler)
fuzzerRegistry.registerAttack(hallucinationsHandler)
