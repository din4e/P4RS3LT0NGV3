import type { AttackHandler, AttackDefinition, ClassifierHandler } from './types'

class FuzzerRegistry {
  private attacks = new Map<string, AttackHandler>()
  private classifiers = new Map<string, ClassifierHandler>()

  registerAttack(handler: AttackHandler): void {
    this.attacks.set(handler.definition.id, handler)
  }

  registerClassifier(handler: ClassifierHandler): void {
    this.classifiers.set(handler.id, handler)
  }

  getAttack(id: string): AttackHandler | undefined {
    return this.attacks.get(id)
  }

  getClassifier(id: string): ClassifierHandler | undefined {
    return this.classifiers.get(id)
  }

  getAllAttacks(): AttackHandler[] {
    return Array.from(this.attacks.values())
  }

  getAllClassifiers(): ClassifierHandler[] {
    return Array.from(this.classifiers.values())
  }

  getAttacksByComplexity(complexity: string): AttackHandler[] {
    return this.getAllAttacks().filter((a) => a.definition.complexity === complexity)
  }

  getAttackDefinitions(): AttackDefinition[] {
    return this.getAllAttacks().map((a) => a.definition)
  }
}

export const fuzzerRegistry = new FuzzerRegistry()
