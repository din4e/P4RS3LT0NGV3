// @ts-nocheck
'use client'

import { useState, useCallback } from 'react'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { allTransforms } from '@/lib/transformers'
import { cn } from '@/lib/utils'

// ── helpers ──────────────────────────────────────────────────────────

function seededRandomFactory(seedStr: string): () => number {
  if (!seedStr) return Math.random
  let h = 1779033703 ^ seedStr.length
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h ^= h >>> 16
    h = Math.imul(h, 2246822507)
    h ^= h >>> 13
    h = Math.imul(h, 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function pick(arr: string[], rnd: () => number): string {
  return arr[Math.floor(rnd() * arr.length)]
}

function injectZeroWidth(text: string, rnd: () => number): string {
  const zw = ['\u200B', '\u200C', '\u200D', '\u2060']
  return [...text]
    .map((ch) => (rnd() < 0.2 ? ch + pick(zw, rnd) : ch))
    .join('')
}

function injectUnicodeNoise(text: string, rnd: () => number): string {
  const marks = [
    '\u0301', '\u0300', '\u0302', '\u0303',
    '\u0308', '\u0307', '\u0304',
  ]
  return [...text]
    .map((ch) => (rnd() < 0.15 ? ch + pick(marks, rnd) : ch))
    .join('')
}

function whitespaceChaos(text: string, rnd: () => number): string {
  return text.replace(/\s/g, (m) =>
    rnd() < 0.5 ? m : rnd() < 0.5 ? '\t' : '\u00A0'
  )
}

function casingChaos(text: string, rnd: () => number): string {
  return [...text]
    .map((c) =>
      /[a-z]/i.test(c) ? (rnd() < 0.5 ? c.toUpperCase() : c.toLowerCase()) : c
    )
    .join('')
}

function encodeShuffle(text: string, rnd: () => number): string {
  const map: Record<string, string> = {
    A: '\u0391', B: '\u0392', C: '\u03F9', E: '\u0395', H: '\u0397',
    I: '\u0399', K: '\u039A', M: '\u039C', N: '\u039D', O: '\u039F',
    P: '\u03A1', T: '\u03A4', X: '\u03A7', Y: '\u03A5',
    a: '\u0430', c: '\u0441', e: '\u0435', i: '\u0456', j: '\u0458',
    o: '\u043E', p: '\u0440', s: '\u0455', x: '\u0445', y: '\u0443',
  }
  return [...text]
    .map((ch) => {
      if (map[ch] && rnd() < 0.25) return map[ch]
      return ch
    })
    .join('')
}

// ── component ────────────────────────────────────────────────────────

export default function Tool() {
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const [copied, setCopied] = useState<string | null>(null)

  const [input, setInput] = useState('')
  const [count, setCount] = useState(20)
  const [seed, setSeed] = useState('')
  const [outputs, setOutputs] = useState<string[]>([])

  // toggles
  const [useRandomMix, setUseRandomMix] = useState(true)
  const [zeroWidth, setZeroWidth] = useState(true)
  const [unicodeNoise, setUnicodeNoise] = useState(true)
  const [zalgo, setZalgo] = useState(false)
  const [whitespace, setWhitespace] = useState(true)
  const [casing, setCasing] = useState(true)
  const [encodeShuffleOn, setEncodeShuffle] = useState(false)

  const flash = useCallback(
    (key: string, text: string) => {
      copyToClipboard(text)
      addHistoryItem(text, 'Fuzzer')
      setCopied(key)
      setTimeout(() => setCopied(null), 1200)
    },
    [copyToClipboard, addHistoryItem],
  )

  const generateCases = useCallback(() => {
    const src = input
    if (!src) {
      setOutputs([])
      return
    }

    const rnd = seededRandomFactory(String(seed || ''))
    const result: string[] = []
    const total = Math.max(1, Math.min(500, count || 1))

    for (let i = 0; i < total; i++) {
      let s = src

      if (useRandomMix) {
        try {
          const randomizerT = allTransforms['randomizer']
          if (randomizerT) {
            s = randomizerT.func(s, { minTransforms: 2, maxTransforms: 4 })
          }
        } catch {
          // ignore transform errors
        }
      }

      if (zeroWidth) s = injectZeroWidth(s, rnd)
      if (unicodeNoise) s = injectUnicodeNoise(s, rnd)
      if (whitespace) s = whitespaceChaos(s, rnd)
      if (casing) s = casingChaos(s, rnd)
      if (zalgo) {
        try {
          const zalgoT = allTransforms['zalgo']
          if (zalgoT) s = zalgoT.func(s)
        } catch {
          // ignore
        }
      }
      if (encodeShuffleOn) s = encodeShuffle(s, rnd)

      result.push(s)
    }

    setOutputs(result)
  }, [input, count, seed, useRandomMix, zeroWidth, unicodeNoise, zalgo, whitespace, casing, encodeShuffleOn])

  const copyAllFuzz = useCallback(() => {
    if (outputs.length === 0) return
    flash('all-fuzz', outputs.join('\n'))
  }, [outputs, flash])

  const downloadFuzz = useCallback(() => {
    const lines = outputs.map((s, i) => `#${i + 1}\t${s}`).join('\n')
    const strategies = [
      useRandomMix ? 'randomMix' : null,
      zeroWidth ? 'zeroWidth' : null,
      unicodeNoise ? 'unicodeNoise' : null,
      whitespace ? 'whitespace' : null,
      casing ? 'casing' : null,
      zalgo ? 'zalgo' : null,
      encodeShuffleOn ? 'encodeShuffle' : null,
    ]
      .filter(Boolean)
      .join(',')
    const header = `# Parseltongue Fuzzer Output\n# count=${outputs.length}\n# seed=${seed || ''}\n# strategies=${strategies}\n`
    const blob = new Blob([header + lines + '\n'], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fuzz_cases.txt'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 200)
  }, [outputs, seed, useRandomMix, zeroWidth, unicodeNoise, whitespace, casing, zalgo, encodeShuffleOn])

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
    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ' +
    'bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)] ' +
    'hover:bg-[var(--accent)] transition-colors'

  const labelCls = 'text-xs font-medium text-[var(--muted-foreground)] mb-1'

  const toggleCls =
    'inline-flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer select-none'

  // ── render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 ">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Mutation Lab
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Generate mutated text payloads for testing. Multiple fuzzing strategies applied in combination.
        </p>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Base text</label>
        <textarea
          className={cn(inputCls, 'min-h-[80px] resize-y')}
          placeholder="Enter seed text to fuzz..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
        />
      </div>

      {/* Count / Seed */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Cases</label>
          <input
            className={inputCls}
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Seed (optional)</label>
          <input
            className={inputCls}
            type="text"
            placeholder="e.g., 1337"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className={toggleCls}>
          <input
            type="checkbox"
            className="accent-[var(--primary)]"
            checked={useRandomMix}
            onChange={(e) => setUseRandomMix(e.target.checked)}
          />
          Random Mix (transforms)
        </label>
        <label className={toggleCls}>
          <input
            type="checkbox"
            className="accent-[var(--primary)]"
            checked={zeroWidth}
            onChange={(e) => setZeroWidth(e.target.checked)}
          />
          Zero-width pepper
        </label>
        <label className={toggleCls}>
          <input
            type="checkbox"
            className="accent-[var(--primary)]"
            checked={unicodeNoise}
            onChange={(e) => setUnicodeNoise(e.target.checked)}
          />
          Unicode noise
        </label>
        <label className={toggleCls}>
          <input
            type="checkbox"
            className="accent-[var(--primary)]"
            checked={zalgo}
            onChange={(e) => setZalgo(e.target.checked)}
          />
          Zalgo
        </label>
        <label className={toggleCls}>
          <input
            type="checkbox"
            className="accent-[var(--primary)]"
            checked={whitespace}
            onChange={(e) => setWhitespace(e.target.checked)}
          />
          Whitespace chaos
        </label>
        <label className={toggleCls}>
          <input
            type="checkbox"
            className="accent-[var(--primary)]"
            checked={casing}
            onChange={(e) => setCasing(e.target.checked)}
          />
          Casing chaos
        </label>
        <label className={toggleCls}>
          <input
            type="checkbox"
            className="accent-[var(--primary)]"
            checked={encodeShuffleOn}
            onChange={(e) => setEncodeShuffle(e.target.checked)}
          />
          Homoglyph confusables
        </label>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <button className={btnPrimary} onClick={generateCases}>
          Generate Cases
        </button>
        {outputs.length > 0 && (
          <>
            <button className={btnSecondary} onClick={copyAllFuzz}>
              {copied === 'all-fuzz' ? 'Copied!' : 'Copy All'}
            </button>
            <button className={btnSecondary} onClick={downloadFuzz}>
              Download
            </button>
          </>
        )}
      </div>

      {/* Output list */}
      {outputs.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-[var(--muted-foreground)]">
            {outputs.length} mutated case{outputs.length !== 1 ? 's' : ''}
          </span>
          <div className="grid gap-2">
            {outputs.map((out, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] overflow-hidden"
              >
                <span className="shrink-0 px-2 py-2 text-xs font-mono text-[var(--muted-foreground)] bg-[var(--muted)] border-r border-[var(--border)] self-stretch flex items-center">
                  #{i + 1}
                </span>
                <textarea
                  className={
                    'flex-1 min-h-[40px] py-2 pr-1 text-sm text-[var(--foreground)] bg-transparent ' +
                    'outline-none resize-y border-none'
                  }
                  readOnly
                  value={out}
                  rows={1}
                />
                <button
                  className="shrink-0 self-center px-2 text-xs text-[var(--primary)] hover:underline"
                  onClick={() => flash(`fz-${i}`, out)}
                >
                  {copied === `fz-${i}` ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
