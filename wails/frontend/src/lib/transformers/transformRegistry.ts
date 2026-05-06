import type { BaseTransformer } from './BaseTransformer'

let registry: Record<string, BaseTransformer> = {}

export function setTransformRegistry(map: Record<string, BaseTransformer>): void {
  registry = map
}

export function getTransformRegistry(): Record<string, BaseTransformer> {
  return registry
}
