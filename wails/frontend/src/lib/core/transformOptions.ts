// @ts-nocheck
/**
 * Transform option merge utilities.
 * Migrated from js/core/transformOptions.js to TypeScript ES module.
 */

/**
 * Merge configurable option defaults with localStorage (transformOptionPrefs).
 */
export function getMergedTransformOptions(transform: Record<string, any>): Record<string, any> {
  if (!transform || !transform.configurableOptions || !transform.configurableOptions.length) {
    return {}
  }
  const merged: Record<string, any> = {}
  transform.configurableOptions.forEach(function(opt: Record<string, any>) {
    let v = opt.default
    if (v === undefined || v === null) {
      if (opt.type === 'boolean') {
        v = false
      } else if (opt.type === 'select' && opt.options && opt.options.length) {
        v = opt.options[0].value
      } else if (opt.type === 'number') {
        v = 0
      } else {
        v = ''
      }
    }
    merged[opt.id] = v
  })
  let saved: Record<string, any> = {}
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      const raw = localStorage.getItem('transformOptionPrefs')
      if (raw) {
        const all = JSON.parse(raw)
        if (all && typeof all === 'object' && transform.name && all[transform.name]) {
          saved = all[transform.name]
        }
      }
    }
  } catch (_e) {
    /* ignore */
  }
  return Object.assign({}, merged, saved)
}

/**
 * Resolve merged options for a transform by display name (same prefs as Transform tab).
 */
export function getMergedTransformOptionsForName(
  transformName: string,
  vueTransforms?: Array<Record<string, any>>,
  transformsRegistry?: Record<string, any>
): Record<string, any> {
  if (!transformName) {
    return {}
  }
  let t: Record<string, any> | null = null
  if (Array.isArray(vueTransforms) && vueTransforms.length) {
    t = vueTransforms.find(function(tr) {
      return tr && tr.name === transformName
    }) || null
  }
  if ((!t || !t.configurableOptions || !t.configurableOptions.length) && transformsRegistry) {
    const full = Object.values(transformsRegistry).find(function(tr: any) {
      return tr && tr.name === transformName
    })
    if (full) {
      t = full as Record<string, any>
    }
  }
  if (!t || !t.configurableOptions || !t.configurableOptions.length) {
    return {}
  }
  return getMergedTransformOptions(t)
}
