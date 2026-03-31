// @ts-nocheck
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { cn } from '@/lib/utils'
import { getAllEmojis } from '@/lib/utils/emoji'

// ── constants ────────────────────────────────────────────────────────

const QUICK_CARRIER_EMOJIS = [
  '\uD83D\uDC0D', '\uD83D\uDC09', '\uD83E\uDD8E', '\uD83D\uDC0A',
  '\uD83D\uDD25', '\uD83D\uDCA5', '\uD83D\uDDFF', '\u2693',
  '\u2B50', '\u2728', '\uD83D\uDE80', '\uD83D\uDC80',
  '\uD83E\uDEB8', '\uD83C\uDF43', '\uD83E\uDEB6', '\uD83D\uDD2E',
  '\uD83D\uDC22', '\uD83E\uDD8A',
]

const DANGER_THRESHOLD = 25_000_000

type Separator = 'zwj' | 'zwnj' | 'zwsp' | 'none'

const SEPARATOR_MAP: Record<Separator, string> = {
  zwj: '\u200D',
  zwnj: '\u200C',
  zwsp: '\u200B',
  none: '',
}

interface Preset {
  depth: number
  breadth: number
  repeats: number
  separator: Separator
  includeVS: boolean
  includeNoise: boolean
}

const PRESETS: Record<string, Preset & { label: string }> = {
  feather: { label: '\uD83E\uDEB6 Featherweight', depth: 1, breadth: 3, repeats: 2, separator: 'zwnj', includeVS: false, includeNoise: false },
  light: { label: '\uD83C\uDF43 Lightweight', depth: 2, breadth: 3, repeats: 3, separator: 'zwnj', includeVS: false, includeNoise: true },
  middle: { label: '\uD83E\uDEB8 Middleweight', depth: 3, breadth: 4, repeats: 6, separator: 'zwnj', includeVS: true, includeNoise: true },
  heavy: { label: '\uD83D\uDDFF Heavyweight', depth: 4, breadth: 6, repeats: 12, separator: 'zwnj', includeVS: true, includeNoise: true },
  super: { label: '\u2693 Super Heavyweight', depth: 5, breadth: 8, repeats: 18, separator: 'zwnj', includeVS: true, includeNoise: true },
}

// ── helpers ──────────────────────────────────────────────────────────

function pickEmojis(emojiList: string[], count: number, randomize: boolean): string[] {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const idx = randomize ? Math.floor(Math.random() * emojiList.length) : i % emojiList.length
    out.push(emojiList[idx])
  }
  return out
}

function addVariationSelectors(str: string): string {
  const vs16 = '\uFE0F'
  const vs15 = '\uFE0E'
  let out = ''
  for (let i = 0; i < str.length; i++) {
    out += str[i] + (i % 2 === 0 ? vs16 : vs15)
  }
  return out
}

function noise(): string {
  const parts = ['\u200B', '\u200C', '\u200D', '\u2060', '\u2062', '\u2063']
  let s = ''
  const n = 1 + Math.floor(Math.random() * 3)
  for (let i = 0; i < n; i++) s += parts[Math.floor(Math.random() * parts.length)]
  return s
}

function toTagSeqForEmojiChar(ch: string): string {
  const cp = ch.codePointAt(0)!
  const hex = cp.toString(16)
  let seq = ''
  for (const d of hex) {
    if (d >= '0' && d <= '9') {
      seq += String.fromCodePoint(0xE0030 + (d.charCodeAt(0) - '0'.charCodeAt(0)))
    } else {
      seq += String.fromCodePoint(0xE0061 + (d.charCodeAt(0) - 'a'.charCodeAt(0)))
    }
  }
  seq += String.fromCodePoint(0xE007F)
  return seq
}

function buildLevel(
  level: number,
  breadth: number,
  sep: string,
  includeVS: boolean,
  includeNoise: boolean,
  emojiList: string[],
): string {
  if (level === 0) {
    const base = pickEmojis(emojiList, breadth, true).join('')
    return includeVS ? addVariationSelectors(base) : base
  }
  const items: string[] = []
  for (let i = 0; i < breadth; i++) {
    const inner = buildLevel(level - 1, breadth, sep, includeVS, includeNoise, emojiList)
    items.push(inner + (includeNoise ? noise() : ''))
  }
  return items.join(sep)
}

function estimateLength(
  depth: number,
  breadth: number,
  repeats: number,
  separator: Separator,
  includeVS: boolean,
  includeNoise: boolean,
  singleCarrier: boolean,
): number {
  const sepLen = separator === 'none' ? 0 : 1
  const vsPerEmoji = includeVS ? 1 : 0
  const noiseAvg = includeNoise ? 2 : 0

  function lenLevel(level: number): number {
    if (level === 0) return breadth * (1 + vsPerEmoji)
    const inner = lenLevel(level - 1)
    return breadth * (inner + noiseAvg) + Math.max(0, breadth - 1) * sepLen
  }

  if (singleCarrier) {
    function countUnits(level: number): number {
      return level === 0 ? breadth : breadth * countUnits(level - 1)
    }
    const unitsPerBlock = countUnits(depth - 1)
    const totalUnits = Math.max(1, repeats * unitsPerBlock)
    const avgDigits = 5
    const perUnit = avgDigits + 1 + sepLen + (includeNoise ? 2 : 0)
    const carrierLen = 1 + (includeVS ? 1 : 0)
    return carrierLen + totalUnits * perUnit
  }
  const blockLen = lenLevel(depth - 1)
  return repeats * (blockLen + noiseAvg) + Math.max(0, repeats - 1) * sepLen
}

// ── component ────────────────────────────────────────────────────────

export default function Tool() {
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)

  // Token bomb state
  const [depth, setDepth] = useState(3)
  const [breadth, setBreadth] = useState(4)
  const [repeats, setRepeats] = useState(5)
  const [separator, setSeparator] = useState<Separator>('zwnj')
  const [includeVS, setIncludeVS] = useState(true)
  const [includeNoise, setIncludeNoise] = useState(true)
  const [autoCopy, setAutoCopy] = useState(true)
  const [singleCarrier, setSingleCarrier] = useState(true)
  const [carrier, setCarrier] = useState('')
  const [carrierManual, setCarrierManual] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  // Text payload state
  const [tpBase, setTpBase] = useState('')
  const [tpRepeat, setTpRepeat] = useState(100)
  const [tpCombining, setTpCombining] = useState(true)
  const [tpZW, setTpZW] = useState(false)
  const [textPayload, setTextPayload] = useState('')

  const emojiList = useMemo(() => {
    const all = getAllEmojis()
    return all.length > 0 ? all : QUICK_CARRIER_EMOJIS
  }, [])

  const estLength = useMemo(
    () => estimateLength(depth, breadth, repeats, separator, includeVS, includeNoise, singleCarrier),
    [depth, breadth, repeats, separator, includeVS, includeNoise, singleCarrier],
  )

  const isDanger = estLength > DANGER_THRESHOLD

  const flash = useCallback(
    (key: string, text: string) => {
      copyToClipboard(text)
      addHistoryItem(text, 'Tokenade')
      setCopied(key)
      setTimeout(() => setCopied(null), 1200)
    },
    [copyToClipboard, addHistoryItem],
  )

  const applyPreset = useCallback((key: string) => {
    const p = PRESETS[key]
    if (!p) return
    setDepth(p.depth)
    setBreadth(p.breadth)
    setRepeats(p.repeats)
    setSeparator(p.separator)
    setIncludeVS(p.includeVS)
    setIncludeNoise(p.includeNoise)
  }, [])

  const generate = useCallback(() => {
    const d = Math.max(1, Math.min(8, depth))
    const b = Math.max(1, Math.min(10, breadth))
    const r = Math.max(1, Math.min(50, repeats))
    const sep = SEPARATOR_MAP[separator]

    let result: string

    if (singleCarrier) {
      const manual = carrierManual.trim()
      const c = manual || carrier || '\uD83D\uDCA5'
      function countUnits(level: number): number {
        return level === 0 ? b : b * countUnits(level - 1)
      }
      const unitsPerBlock = countUnits(d - 1)
      const totalUnits = Math.max(1, r * unitsPerBlock)
      const payload = pickEmojis(emojiList, totalUnits, true)
      const vs16 = includeVS ? '\uFE0F' : ''
      let out = c + vs16
      for (let i = 0; i < payload.length; i++) {
        out += sep + toTagSeqForEmojiChar(payload[i]) + (includeNoise ? noise() : '')
      }
      result = out
    } else {
      const block = buildLevel(d - 1, b, sep, includeVS, includeNoise, emojiList)
      const blocks: string[] = []
      for (let i = 0; i < r; i++) {
        blocks.push(block + (includeNoise ? noise() : ''))
      }
      result = blocks.join(sep)
    }

    setOutput(result)
    if (autoCopy && result) {
      flash('tokenade', result)
    }
  }, [depth, breadth, repeats, separator, includeVS, includeNoise, singleCarrier, carrier, carrierManual, emojiList, autoCopy, flash])

  const generateTextPayload = useCallback(() => {
    const base = tpBase || 'A'
    const count = Math.max(1, Math.min(10000, tpRepeat))
    const marks = ['\u0301', '\u0300', '\u0302', '\u0303', '\u0308', '\u0307', '\u0304']
    const zw = ['\u200B', '\u200C', '\u200D', '\u2060']
    let out = ''
    for (let i = 0; i < count; i++) {
      let token = base
      if (tpCombining) token += marks[i % marks.length]
      if (tpZW) token += zw[i % zw.length]
      out += token
    }
    setTextPayload(out)
  }, [tpBase, tpRepeat, tpCombining, tpZW])

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

  const sliderBlockCls = 'flex flex-col gap-1'

  // ── render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Tokenade Generator
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Craft dense token payloads with emojis and zero-width characters
        </p>
      </div>

      {/* Disclaimer */}
      <div
        className={cn(
          'flex items-start gap-2 p-3 rounded-md text-sm',
          isDanger
            ? 'bg-red-500/10 border border-red-500/40 text-red-400'
            : 'bg-amber-500/10 border border-amber-500/40 text-amber-400',
        )}
      >
        {isDanger ? (
          <span>DANGER ZONE: Estimated length {estLength.toLocaleString()} chars exceeds safe threshold ({DANGER_THRESHOLD.toLocaleString()}). This may freeze or crash your browser.</span>
        ) : (
          <span>DISCLAIMER: Tokenade payloads can severely degrade model performance and crash UIs. Use for testing only.</span>
        )}
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button key={key} className={btnSecondary} onClick={() => applyPreset(key)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className={sliderBlockCls}>
          <label className={labelCls}>Depth (nesting): {depth}</label>
          <input
            type="range"
            min={1}
            max={8}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="accent-[var(--primary)]"
          />
        </div>
        <div className={sliderBlockCls}>
          <label className={labelCls}>Breadth: {breadth}</label>
          <input
            type="range"
            min={1}
            max={10}
            value={breadth}
            onChange={(e) => setBreadth(Number(e.target.value))}
            className="accent-[var(--primary)]"
          />
        </div>
        <div className={sliderBlockCls}>
          <label className={labelCls}>Repeats: {repeats}</label>
          <input
            type="range"
            min={1}
            max={50}
            value={repeats}
            onChange={(e) => setRepeats(Number(e.target.value))}
            className="accent-[var(--primary)]"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className={toggleCls}>
          <input type="checkbox" className="accent-[var(--primary)]" checked={includeVS} onChange={(e) => setIncludeVS(e.target.checked)} />
          Variation Selectors
        </label>
        <label className={toggleCls}>
          <input type="checkbox" className="accent-[var(--primary)]" checked={includeNoise} onChange={(e) => setIncludeNoise(e.target.checked)} />
          Invisible Noise
        </label>
        <label className={toggleCls}>
          <input type="checkbox" className="accent-[var(--primary)]" checked={autoCopy} onChange={(e) => setAutoCopy(e.target.checked)} />
          Auto-copy
        </label>
        <label className={toggleCls}>
          <input type="checkbox" className="accent-[var(--primary)]" checked={singleCarrier} onChange={(e) => setSingleCarrier(e.target.checked)} />
          Single emoji carrier mode
        </label>
      </div>

      {/* Separator */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Separator</label>
        <div className="flex gap-1">
          {(['zwj', 'zwnj', 'zwsp', 'none'] as Separator[]).map((s) => (
            <button
              key={s}
              onClick={() => setSeparator(s)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md border transition-colors',
                separator === s
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                  : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--accent)]',
              )}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Estimated length */}
      <div className="text-xs text-[var(--muted-foreground)]">
        Estimated length: {estLength.toLocaleString()} chars
      </div>

      {/* Carrier options */}
      {singleCarrier && (
        <>
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Quick carrier pick</label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_CARRIER_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setCarrier(em)}
                  title={`Use ${em}`}
                  className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-md text-lg border transition-all',
                    carrier === em
                      ? 'bg-[var(--primary)]/20 border-[var(--primary)] ring-1 ring-[var(--primary)]'
                      : 'bg-[var(--background)] border-[var(--border)] hover:bg-[var(--accent)]',
                  )}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Custom carrier text</label>
            <input
              className={inputCls}
              type="text"
              value={carrierManual}
              onChange={(e) => setCarrierManual(e.target.value)}
              placeholder="e.g., a custom emoji or tag"
            />
          </div>
        </>
      )}

      {/* Generate */}
      <div className="flex flex-wrap gap-2 items-center">
        <button className={btnPrimary} onClick={generate}>
          Generate Tokenade
        </button>
        {output && (
          <button className={btnSecondary} onClick={() => flash('output', output)}>
            {copied === 'output' ? 'Copied!' : 'Copy'}
          </button>
        )}
        {output && (
          <span className="text-xs text-[var(--muted-foreground)]">
            Length: {output.length.toLocaleString()} chars
          </span>
        )}
      </div>

      {/* Output */}
      {output && (
        <textarea
          readOnly
          value={output}
          aria-label="Tokenade output"
          className={cn(inputCls, 'min-h-[60px] resize-y font-mono text-xs')}
          rows={3}
        />
      )}

      {/* ── Text Payload Generator ── */}
      <div className="border-t border-[var(--border)] pt-6 mt-4">
        <h3 className="text-md font-semibold text-[var(--foreground)] mb-3">
          Text Payload Generator
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Base text</label>
            <input
              className={inputCls}
              type="text"
              value={tpBase}
              onChange={(e) => setTpBase(e.target.value)}
              placeholder="e.g., hello"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Repeat count</label>
            <input
              className={inputCls}
              type="number"
              min={1}
              max={10000}
              value={tpRepeat}
              onChange={(e) => setTpRepeat(Math.max(1, Number(e.target.value)))}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
          <label className={toggleCls}>
            <input type="checkbox" className="accent-[var(--primary)]" checked={tpCombining} onChange={(e) => setTpCombining(e.target.checked)} />
            Add combining marks
          </label>
          <label className={toggleCls}>
            <input type="checkbox" className="accent-[var(--primary)]" checked={tpZW} onChange={(e) => setTpZW(e.target.checked)} />
            Add zero-width spacing
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button className={btnPrimary} onClick={generateTextPayload}>
            Generate Text Payload
          </button>
          {textPayload && (
            <button className={btnSecondary} onClick={() => flash('textpayload', textPayload)}>
              {copied === 'textpayload' ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
        {textPayload && (
          <textarea
            readOnly
            value={textPayload}
            aria-label="Text payload output"
            className={cn(inputCls, 'mt-3 min-h-[60px] resize-y font-mono text-xs')}
            rows={3}
          />
        )}
      </div>
    </div>
  )
}
