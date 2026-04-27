'use client'

import { useState, useCallback } from 'react'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'

// ── helpers ──────────────────────────────────────────────────────────

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function seededRandomFactory(seedStr: string): () => number {
  if (!seedStr) return Math.random
  let h = 1779033703 ^ seedStr.length
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

// ── component ────────────────────────────────────────────────────────

export default function Tool() {
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const [copied, setCopied] = useState<string | null>(null)

  // mode
  const [mode, setMode] = useState<'dictionary' | 'removal'>('dictionary')

  // dictionary state
  const [gibInput, setGibInput] = useState('')
  const [gibSeed, setGibSeed] = useState('')
  const [gibChars, setGibChars] = useState(
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  )
  const [gibOutput, setGibOutput] = useState('')
  const [gibDictionary, setGibDictionary] = useState('')

  // removal state
  const [removalSubMode, setRemovalSubMode] = useState<'random' | 'specific'>(
    'random'
  )
  const [removalInput, setRemovalInput] = useState('')
  const [removalVariations, setRemovalVariations] = useState(10)
  const [removalMinLetters, setRemovalMinLetters] = useState(1)
  const [removalMaxLetters, setRemovalMaxLetters] = useState(3)
  const [removalSeed, setRemovalSeed] = useState('')
  const [removalOutputs, setRemovalOutputs] = useState<string[]>([])

  // specific removal state
  const [removalSpecificInput, setRemovalSpecificInput] = useState('')
  const [removalCharsToRemove, setRemovalCharsToRemove] = useState('')
  const [removalSpecificOutput, setRemovalSpecificOutput] = useState('')

  const flash = useCallback(
    (key: string, text: string) => {
      copyToClipboard(text)
      addHistoryItem(text, 'Gibberish')
      setCopied(key)
      setTimeout(() => setCopied(null), 1200)
    },
    [copyToClipboard, addHistoryItem]
  )

  // ── Dictionary generation ──────────────────────────────────────

  const generateGibberish = useCallback(() => {
    const src = gibInput
    if (!src) {
      setGibOutput('')
      setGibDictionary('')
      return
    }

    const words = src.match(/\b\w+\b/g) || []
    const dictionary: Record<string, string> = {}
    let wordIndex = 0

    const seed =
      gibSeed === '' ? Math.random() * 100 : Number(gibSeed)

    words.forEach((word) => {
      const lower = word.toLowerCase()
      if (!dictionary[lower]) {
        const length = Math.max(4, word.length)
        let gib = ''
        const wordSeed = seed + wordIndex * 100
        for (let i = 0; i < length; i++) {
          const rv = seededRandom(wordSeed + i * 0.1)
          gib += gibChars[Math.floor(rv * gibChars.length)]
        }
        dictionary[lower] = gib
        wordIndex++
      }
    })

    let result = ''
    for (let i = 0; i < src.length; i++) {
      const char = src[i]
      if (/\w/.test(char)) {
        let j = i
        while (j < src.length && /\w/.test(src[j])) j++
        const word = src.substring(i, j).toLowerCase()
        result += dictionary[word] || ''
        i = j - 1
      } else {
        result += char
      }
    }

    setGibOutput(result)
    setGibDictionary(
      '{' +
        Object.entries(dictionary)
          .map(([k, v]) => `"${k}": "${v}"`)
          .join(', ') +
        '}'
    )
  }, [gibInput, gibSeed, gibChars])

  // ── Random removal ─────────────────────────────────────────────

  const generateRandomRemovals = useCallback(() => {
    if (!removalInput.trim()) return

    const seed = removalSeed ? String(removalSeed) : String(Date.now())
    const rng = seededRandomFactory(seed)
    const words = removalInput.split(/\s+/)
    const results: string[] = []

    for (let v = 0; v < removalVariations; v++) {
      const modified = words.map((word) => {
        if (word.length <= 1 || !/[a-zA-Z]/.test(word)) return word

        const minR = Math.max(0, removalMinLetters)
        const maxR = Math.min(word.length - 1, removalMaxLetters)
        const numRemove = minR + Math.floor(rng() * (maxR - minR + 1))
        if (numRemove === 0) return word

        const letters = word
          .split('')
          .map((c, i) => ({ char: c, index: i }))
          .filter((item) => /[a-zA-Z]/.test(item.char))

        const toRemove = new Set<number>()
        let attempts = 0
        while (
          toRemove.size < Math.min(numRemove, letters.length) &&
          attempts < numRemove * 3
        ) {
          const idx = Math.floor(rng() * letters.length)
          toRemove.add(letters[idx].index)
          attempts++
        }

        return word
          .split('')
          .filter((_, i) => !toRemove.has(i))
          .join('')
      })
      results.push(modified.join(' '))
    }

    setRemovalOutputs(results)
  }, [removalInput, removalVariations, removalMinLetters, removalMaxLetters, removalSeed])

  // ── Specific removal ───────────────────────────────────────────

  const generateSpecificRemoval = useCallback(() => {
    if (!removalSpecificInput.trim() || !removalCharsToRemove) return
    const chars = new Set(removalCharsToRemove.split(''))
    setRemovalSpecificOutput(
      removalSpecificInput
        .split('')
        .filter((c) => !chars.has(c))
        .join('')
    )
  }, [removalSpecificInput, removalCharsToRemove])

  const copyAllRemovals = useCallback(() => {
    if (removalOutputs.length === 0) return
    flash('all-removals', removalOutputs.join('\n'))
  }, [removalOutputs, flash])

  // ── styles ─────────────────────────────────────────────────────

  const inputCls =
    'w-full rounded-md px-3 py-2 text-sm outline-none transition-colors ' +
    'placeholder:text-[var(--muted-foreground)] ' +
    'bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] ' +
    'focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'

  const btnPrimary =
    'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium ' +
    'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity'

  const btnSecondary =
    'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium ' +
    'bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)] ' +
    'hover:bg-[var(--accent)] transition-colors'

  const labelCls = 'text-xs font-medium text-[var(--muted-foreground)] mb-1'

  // ── render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Gibberish Generator
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Generate gibberish text with consistent word mappings or create
          variations with random character removal.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        <button
          className={mode === 'dictionary' ? btnPrimary : btnSecondary}
          onClick={() => setMode('dictionary')}
        >
          Dictionary
        </button>
        <button
          className={mode === 'removal' ? btnPrimary : btnSecondary}
          onClick={() => setMode('removal')}
        >
          Character Removal
        </button>
      </div>

      {/* ── Dictionary mode ─────────────────────────────────────── */}
      {mode === 'dictionary' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Input Text</label>
            <textarea
              className={inputCls + ' min-h-[100px] resize-y'}
              placeholder="Enter sentence to generate gibberish..."
              value={gibInput}
              onChange={(e) => setGibInput(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>
                Seed (optional &mdash; for reproducible results)
              </label>
              <input
                className={inputCls}
                type="text"
                placeholder="Leave empty for random"
                value={gibSeed}
                onChange={(e) => setGibSeed(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Character Set</label>
              <input
                className={inputCls}
                type="text"
                placeholder="abcdefg..."
                value={gibChars}
                onChange={(e) => setGibChars(e.target.value)}
              />
            </div>
          </div>

          <button className={btnPrimary + ' self-start'} onClick={generateGibberish}>
            Generate Gibberish
          </button>

          {gibOutput && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>Gibberish Output</label>
                  <button
                    className="text-xs text-[var(--primary)] hover:underline"
                    onClick={() => flash('gib-out', gibOutput)}
                  >
                    {copied === 'gib-out' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <textarea
                  className={inputCls + ' min-h-[80px] resize-y'}
                  readOnly
                  value={gibOutput}
                  rows={4}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>Dictionary</label>
                  <button
                    className="text-xs text-[var(--primary)] hover:underline"
                    onClick={() => flash('gib-dict', gibDictionary)}
                  >
                    {copied === 'gib-dict' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <textarea
                  className={inputCls + ' min-h-[60px] resize-y'}
                  readOnly
                  value={gibDictionary}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Removal mode ────────────────────────────────────────── */}
      {mode === 'removal' && (
        <div className="flex flex-col gap-4">
          {/* Sub-mode tabs */}
          <div className="flex gap-2">
            <button
              className={removalSubMode === 'random' ? btnPrimary : btnSecondary}
              onClick={() => setRemovalSubMode('random')}
            >
              Random Removal
            </button>
            <button
              className={removalSubMode === 'specific' ? btnPrimary : btnSecondary}
              onClick={() => setRemovalSubMode('specific')}
            >
              Specific Characters
            </button>
          </div>

          {/* Random removal */}
          {removalSubMode === 'random' && (
            <>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Input Text</label>
                <textarea
                  className={inputCls + ' min-h-[100px] resize-y'}
                  placeholder="Enter text for random character removal..."
                  value={removalInput}
                  onChange={(e) => setRemovalInput(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Variations</label>
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    max={100}
                    value={removalVariations}
                    onChange={(e) =>
                      setRemovalVariations(Math.max(1, Number(e.target.value)))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Min Remove</label>
                  <input
                    className={inputCls}
                    type="number"
                    min={0}
                    max={10}
                    value={removalMinLetters}
                    onChange={(e) =>
                      setRemovalMinLetters(Math.max(0, Number(e.target.value)))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Max Remove</label>
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    max={20}
                    value={removalMaxLetters}
                    onChange={(e) =>
                      setRemovalMaxLetters(Math.max(1, Number(e.target.value)))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelCls}>Seed (optional)</label>
                  <input
                    className={inputCls}
                    type="text"
                    placeholder="Leave empty for random"
                    value={removalSeed}
                    onChange={(e) => setRemovalSeed(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button className={btnPrimary} onClick={generateRandomRemovals}>
                  Generate Variations
                </button>
                {removalOutputs.length > 0 && (
                  <button className={btnSecondary} onClick={copyAllRemovals}>
                    Copy All
                  </button>
                )}
              </div>

              {removalOutputs.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {removalOutputs.length} variation
                    {removalOutputs.length !== 1 ? 's' : ''}
                  </span>
                  <div className="grid gap-2">
                    {removalOutputs.map((output, i) => (
                      <div
                        key={i}
                        className="rounded-md border border-[var(--border)] bg-[var(--card)] overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--muted)] border-b border-[var(--border)]">
                          <span className="text-xs font-medium text-[var(--muted-foreground)]">
                            Variation {i + 1}
                          </span>
                          <button
                            className="text-xs text-[var(--primary)] hover:underline"
                            onClick={() => flash(`rem-${i}`, output)}
                          >
                            {copied === `rem-${i}` ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <div className="px-3 py-2 text-sm text-[var(--foreground)] break-all">
                          {output}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Specific removal */}
          {removalSubMode === 'specific' && (
            <>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Input Text</label>
                <textarea
                  className={inputCls + ' min-h-[100px] resize-y'}
                  placeholder="Enter text..."
                  value={removalSpecificInput}
                  onChange={(e) => setRemovalSpecificInput(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelCls}>Characters to Remove</label>
                <input
                  className={inputCls}
                  type="text"
                  placeholder="e.g., aeiou"
                  value={removalCharsToRemove}
                  onChange={(e) => setRemovalCharsToRemove(e.target.value)}
                />
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  Enter the specific characters you want to remove
                </span>
              </div>

              <button className={btnPrimary + ' self-start'} onClick={generateSpecificRemoval}>
                Remove Characters
              </button>

              {removalSpecificOutput && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Result</label>
                    <button
                      className="text-xs text-[var(--primary)] hover:underline"
                      onClick={() => flash('spec-out', removalSpecificOutput)}
                    >
                      {copied === 'spec-out' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <textarea
                    className={inputCls + ' min-h-[80px] resize-y'}
                    readOnly
                    value={removalSpecificOutput}
                    rows={4}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
