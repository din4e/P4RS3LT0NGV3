import { fuzzerRegistry } from '../../registry'
import { handler as artpromptHandler } from './artprompt'
import { handler as backToPastHandler } from './back_to_past'
import { handler as bonHandler } from './bon'
import { handler as shuffleHandler } from './shuffle'
import { handler as manyshotHandler } from './manyshot'

fuzzerRegistry.registerAttack(artpromptHandler)
fuzzerRegistry.registerAttack(backToPastHandler)
fuzzerRegistry.registerAttack(bonHandler)
fuzzerRegistry.registerAttack(shuffleHandler)
fuzzerRegistry.registerAttack(manyshotHandler)
