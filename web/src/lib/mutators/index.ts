import type { MutatorHandler } from './types'
import { rephraseMutator } from './rephrase'
import { summarizeMutator } from './summarize'
import { randropMutator } from './randrop'
import { mightBeHarmfulMutator } from './might_be_harmful'
import { characterScrambleMutator } from './character_scramble'

const mutators = new Map<string, MutatorHandler>()

function register(handler: MutatorHandler) { mutators.set(handler.definition.id, handler) }
function getAll(): MutatorHandler[] { return Array.from(mutators.values()) }
function get(id: string): MutatorHandler | undefined { return mutators.get(id) }

register(rephraseMutator)
register(summarizeMutator)
register(randropMutator)
register(mightBeHarmfulMutator)
register(characterScrambleMutator)

export const mutatorRegistry = { getAll, get }
export type { MutatorHandler, MutatorDefinition } from './types'
