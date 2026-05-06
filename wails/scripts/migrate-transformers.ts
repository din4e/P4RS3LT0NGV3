/**
 * Migration script: Convert src/transformers/*.js -> frontend/src/lib/transformers/*.ts
 *
 * Usage: npx tsx scripts/migrate-transformers.ts
 */
import * as fs from 'fs'
import * as path from 'path'

const SRC = path.resolve(__dirname, '../../P4RS3LT0NGV3/src/transformers')
const DST = path.resolve(__dirname, '../frontend/src/lib/transformers')

const CATEGORIES = ['ancient', 'case', 'cipher', 'encoding', 'fantasy', 'format', 'special', 'technical', 'unicode', 'visual']

let converted = 0
let errors = 0

function convertFile(srcPath: string, dstPath: string) {
  let code = fs.readFileSync(srcPath, 'utf-8')

  // 0. Add ts-nocheck header for migrated files (types are preserved from JS)
  if (!code.startsWith('// @ts-nocheck')) {
    code = '// @ts-nocheck\n' + code
  }

  // 1. Replace import
  code = code.replace(
    /import\s+BaseTransformer\s+from\s+['"]\.\.\/BaseTransformer\.js['"];?/g,
    "import { BaseTransformer } from '../BaseTransformer';"
  )

  // 2. Replace `export default` with named export
  const fileName = path.basename(srcPath, '.js')
  // Convert snake_case and hyphen-case to camelCase
  const exportName = fileName
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^[a-z]/, c => c)

  // Pattern A: export default new BaseTransformer({
  code = code.replace(
    /export\s+default\s+new\s+BaseTransformer\s*\(\s*\{/,
    `export const ${exportName} = new BaseTransformer({`
  )

  // Pattern B: export default (() => { ... return new BaseTransformer({...}); })();
  // Wrap the IIFE result in a named const
  code = code.replace(
    /export\s+default\s+\(\s*\(\)\s*=>\s*\{/,
    `export const ${exportName} = (() => {`
  )

  // Pattern C: export default (function() { ... return new BaseTransformer({...}); })() or (function(){...})()
  code = code.replace(
    /export\s+default\s+\(\s*function\s*\(\s*\)\s*\{/,
    `export const ${exportName} = (function() {`
  )

  // 3. Add return type annotations to function bodies
  // func: function(text) { -> func: function(text: string): string {
  code = code.replace(
    /(func|reverse|preview):\s*function\s*\(\s*text\s*\)\s*\{/g,
    '$1: function(text: string): string {'
  )
  // func: function(text, options) { -> func: function(text: string, options?: TransformOptions): string {
  code = code.replace(
    /(func|reverse|preview):\s*function\s*\(\s*text\s*,\s*options\s*\)\s*\{/g,
    '$1: function(text: string, options?: TransformOptions): string {'
  )

  // 4. Detector function typing
  code = code.replace(
    /detector:\s*function\s*\(\s*text\s*\)\s*\{/g,
    'detector: function(text: string): boolean {'
  )

  // 5. Fix `this.map` access in transformers that use map (non-null assertion)
  code = code.replace(/Object\.entries\(this\.map\)/g, 'Object.entries(this.map!)')
  code = code.replace(/this\.map\[([^\]]+)\]/g, 'this.map![$1]')
  code = code.replace(/for\s*\(\s*const\s+\w+\s+of\s+Object\.values\(this\.map/g, 'for (const v of Object.values(this.map!')

  // 6. Fix revMap/reverseMap type annotations
  code = code.replace(/const revMap = \{\}/g, 'const revMap: Record<string, string> = {}')
  code = code.replace(/const reverseMap = \{\}/g, 'const reverseMap: Record<string, string> = {}')

  // 7. Fix `this.alphabet` and similar array/object accesses
  code = code.replace(/this\.(\w+)\[([^\]]+)\]\s*=/g, '(this as any).$1[$2] =')

  // 8. Fix `this.customMethod()` calls - cast this to any for custom methods
  code = code.replace(/this\.(reverseMap|getAlphabet|buildKey|encodeChar|decodeChar|getGrid|getMapping|getTable|generateKey|getMorseMap|getBrailleMap|getNatoMap|getIcaoMap|getItuMap|getSemaphoreMap|getTapMap|getMaritimeMap)\(\)/g,
    '(this as any).$1()')

  // 9. Add types to common lambda parameters (.map(c =>, .split(), etc.)
  code = code.replace(/\.map\(\s*\(([a-z])\)\s*=>/g, '.map(($1: string) =>')
  code = code.replace(/\.map\(\s*\(([a-z]),\s*([a-z])\)\s*=>/g, '.map(($1: string, $2: number) =>')
  code = code.replace(/\.forEach\(\s*\(([a-z])\)\s*=>/g, '.forEach(($1: string) =>')
  code = code.replace(/\.filter\(\s*\(([a-z])\)\s*=>/g, '.filter(($1: string) =>')
  code = code.replace(/\.find\(\s*\(([a-z])\)\s*=>/g, '.find(($1: string) =>')
  code = code.replace(/\.some\(\s*\(([a-z])\)\s*=>/g, '.some(($1: string) =>')
  code = code.replace(/\.every\(\s*\(([a-z])\)\s*=>/g, '.every(($1: string) =>')
  code = code.replace(/\.reduce\(\s*\(\(([a-z]),\s*([a-z])\)\s*=>/g, '.reduce(($1: any, $2: any) =>')
  code = code.replace(/\.split\(\s*""\)\)\.map\(\s*\(([a-z])\)/g, '.split("")).map(($1: string)')
  code = code.replace(/\.replace\(\s*\/[^\/]+\/[gim]*\,\s*\(([a-z])\)\s*=>/g, '.replace(/pattern/g, ($1: string) =>')

  // 10. Fix implicit any in for-of loops
  code = code.replace(/for\s*\(\s*const\s+\[([a-z]+),\s*([a-z]+)\]\s+of\s+Object\.entries/g,
    'for (const [$1, $2] of Object.entries')

  // 6. Ensure output directory exists
  fs.mkdirSync(path.dirname(dstPath), { recursive: true })

  fs.writeFileSync(dstPath, code, 'utf-8')
  converted++
}

// Process each category
for (const cat of CATEGORIES) {
  const srcDir = path.join(SRC, cat)
  const dstDir = path.join(DST, cat)

  if (!fs.existsSync(srcDir)) {
    console.log(`Skipping ${cat}/ (not found)`)
    continue
  }

  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'))
  console.log(`${cat}/: ${files.length} files`)

  for (const file of files) {
    const srcPath = path.join(srcDir, file)
    const dstPath = path.join(dstDir, file.replace('.js', '.ts'))

    try {
      convertFile(srcPath, dstPath)
    } catch (err) {
      console.error(`  ERROR: ${cat}/${file}: ${err}`)
      errors++
    }
  }
}

// Generate barrel index.ts
const indexLines: string[] = [
  '// Auto-generated barrel export - do not edit manually',
  "import { BaseTransformer } from './BaseTransformer'",
  '',
  'export { BaseTransformer } from "./BaseTransformer"',
  'export type { TransformerConfig, ConfigurableOption, TransformOptions, SelectOption } from "./BaseTransformer"',
  '',
]

const allExports: string[] = []

for (const cat of CATEGORIES) {
  const dstDir = path.join(DST, cat)
  if (!fs.existsSync(dstDir)) continue

  const files = fs.readdirSync(dstDir).filter(f => f.endsWith('.ts'))
  indexLines.push(`// ${cat}`)
  for (const file of files) {
    const name = file.replace('.ts', '')
    const exportName = name.replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    // Import into scope so allTransforms can reference them
    indexLines.push(`import { ${exportName} } from './${cat}/${name}'`)
    allExports.push(exportName)
  }
  indexLines.push('')
}

// Re-export all
indexLines.push('// Re-export all transformers')
for (const name of allExports) {
  indexLines.push(`export { ${name} }`)
}
indexLines.push('')

// Add the allTransforms map
indexLines.push('// All transforms as a map')
indexLines.push('export const allTransforms: Record<string, BaseTransformer> = {')
for (const name of allExports) {
  indexLines.push(`  ${name},`)
}
indexLines.push('}')
indexLines.push('')
indexLines.push(`export const transformList: BaseTransformer[] = Object.values(allTransforms)`)
indexLines.push('')

// Category map
indexLines.push('export const transformsByCategory: Record<string, BaseTransformer[]> = {')
for (const cat of CATEGORIES) {
  const dstDir = path.join(DST, cat)
  if (!fs.existsSync(dstDir)) continue
  const files = fs.readdirSync(dstDir).filter(f => f.endsWith('.ts'))
  const names = files.map(f => {
    const n = f.replace('.ts', '')
    return n.replace(/[-_](.)/g, (_, c) => c.toUpperCase())
  })
  if (names.length > 0) {
    indexLines.push(`  '${cat}': [${names.join(', ')}],`)
  }
}
indexLines.push('}')

fs.writeFileSync(path.join(DST, 'index.ts'), indexLines.join('\n'), 'utf-8')

console.log(`\nDone! ${converted} transformers converted, ${errors} errors.`)
console.log(`Generated index.ts with ${allExports.length} exports.`)
