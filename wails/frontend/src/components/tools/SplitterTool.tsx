// @ts-nocheck
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { cn } from '@/lib/utils'
import { allTransforms, transformsByCategory } from '@/lib/transformers'
import type { BaseTransformer, TransformOptions } from '@/lib/transformers'

// ── types ────────────────────────────────────────────────────────────

type SplitMode = 'chunk' | 'word' | 'sentence' | 'line' | 'pattern' | 'token'

// ── helper: category order ───────────────────────────────────────────

function getCategoryOrder(): string[] {
  const allCats = Object.keys(transformsByCategory)
  const sorted = allCats.filter((c) => c !== 'special').sort((a, b) => a.localeCompare(b))
  return [...sorted, 'special']
}

// ── component ────────────────────────────────────────────────────────

export default function Tool() {
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const [copied, setCopied] = useState<string | null>(null)

  // Input
  const [input, setInput] = useState('')

  // Mode
  const [mode, setMode] = useState<SplitMode>('word')

  // Chunk mode
  const [chunkSize, setChunkSize] = useState(6)

  // Word mode
  const [wordSplitSide, setWordSplitSide] = useState<'left' | 'right'>('left')
  const [wordSkip, setWordSkip] = useState(0)
  const [minWordLength, setMinWordLength] = useState(2)
  const [splitFirstWord, setSplitFirstWord] = useState(true)

  // Sentence/line mode
  const [preserveEmptyLines, setPreserveEmptyLines] = useState(false)

  // Pattern mode
  const [customPattern, setCustomPattern] = useState('')
  const [patternIncludeDelimiter, setPatternIncludeDelimiter] = useState(false)

  // Token mode
  const [tokenCount, setTokenCount] = useState(3)

  // Transform chain
  const [transforms, setTransforms] = useState<string[]>([''])

  // Encapsulation
  const [iteratorMarker, setIteratorMarker] = useState('{n}')
  const [startWrap, setStartWrap] = useState('')
  const [endWrap, setEndWrap] = useState('')

  // Output
  const [copyAsSingleLine, setCopyAsSingleLine] = useState(false)
  const [messages, setMessages] = useState<string[]>([])

  const categories = useMemo(() => getCategoryOrder(), [])

  const flash = useCallback(
    (key: string, text: string) => {
      copyToClipboard(text)
      addHistoryItem(text, 'Splitter')
      setCopied(key)
      setTimeout(() => setCopied(null), 1200)
    },
    [copyToClipboard, addHistoryItem],
  )

  const handleTransformChange = useCallback((index: number, value: string) => {
    setTransforms((prev) => {
      const next = [...prev]
      next[index] = value
      if (value && index === prev.length - 1) {
        next.push('')
      } else if (!value && index > 0 && !prev[index - 1]) {
        next.splice(index, 1)
      } else if (!value && index === 0 && prev.length > 1 && !prev[1]) {
        next.splice(0, 1)
      }
      if (next.length === 0) next.push('')
      return next
    })
  }, [])

  const setEncapsulation = useCallback((start: string, end: string) => {
    setStartWrap(start)
    setEndWrap(end)
  }, [])

  const generateMessages = useCallback(() => {
    if (!input) {
      setMessages([])
      return
    }

    let chunks: string[] = []

    if (mode === 'chunk') {
      const sz = Math.max(1, Math.min(500, chunkSize))
      for (let i = 0; i < input.length; i += sz) {
        chunks.push(input.slice(i, i + sz))
      }
    } else if (mode === 'sentence') {
      const sentenceRegex = /[.!?]+/g
      const sentences = input.split(sentenceRegex).filter((s) => s.trim().length > 0)
      chunks = sentences.map((s) => s.trim())
    } else if (mode === 'line') {
      chunks = input
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0 || preserveEmptyLines)
    } else if (mode === 'pattern') {
      const pattern = customPattern || '\\s+'
      try {
        const regex = new RegExp(pattern, 'g')
        chunks = input
          .split(regex)
          .filter((p) => (patternIncludeDelimiter ? p.length > 0 : p.trim().length > 0))
      } catch {
        setMessages([])
        return
      }
    } else if (mode === 'token') {
      // Simple character-based token splitting (no external tokenizer in Wails build)
      const tc = Math.max(1, Math.min(1000, tokenCount))
      // Approximate by splitting into character groups
      const words = input.match(/\S+/g) || []
      let current = ''
      let wordCount = 0
      for (const word of words) {
        if (current) current += ' '
        current += word
        wordCount++
        if (wordCount >= tc) {
          chunks.push(current)
          current = ''
          wordCount = 0
        }
      }
      if (current) chunks.push(current)
    } else if (mode === 'word') {
      const words = input.match(/\S+/g) || []
      if (words.length === 0) {
        setMessages([])
        return
      }

      const skipCount = Math.max(0, Math.min(20, wordSkip))
      const minLen = Math.max(1, minWordLength)

      let wordsToProcess: string[] = words as string[]
      let prependToFirst: string[] = []

      if (!splitFirstWord && words.length > 0) {
        prependToFirst = [words[0]!]
        wordsToProcess = words.slice(1)
      }

      const wordData = wordsToProcess.map((word, idx) => ({
        word,
        canSplit: word.length >= minLen && word.length > 1,
        index: idx,
      }))

      const splittableWords = wordData.filter((w) => w.canSplit)
      if (splittableWords.length === 0) {
        chunks.push([...prependToFirst, ...wordsToProcess].join(' '))
        // fall through to transform/encapsulation
      } else {
        const splitIndexes = new Set<number>()
        for (let i = 0; i < splittableWords.length; i++) {
          if (i % (skipCount + 1) === 0) {
            splitIndexes.add(splittableWords[i].index)
          }
        }

        const processed = wordData.map((wd) => {
          if (splitIndexes.has(wd.index) && wd.canSplit) {
            let splitPos: number
            if (wd.word.length % 2 === 0) {
              splitPos = wd.word.length / 2
            } else {
              splitPos = wordSplitSide === 'left'
                ? Math.ceil(wd.word.length / 2)
                : Math.floor(wd.word.length / 2)
            }
            return { firstHalf: wd.word.slice(0, splitPos), secondHalf: wd.word.slice(splitPos), split: true }
          }
          return { whole: wd.word, split: false }
        })

        let currentMessage = [...prependToFirst]
        let messageStarted = false

        for (const item of processed) {
          if (item.split) {
            if (!messageStarted) {
              currentMessage.push(item.firstHalf)
              chunks.push(currentMessage.join(' '))
              currentMessage = [item.secondHalf]
              messageStarted = true
            } else {
              currentMessage.push(item.firstHalf)
              chunks.push(currentMessage.join(' '))
              currentMessage = [item.secondHalf]
            }
          } else {
            currentMessage.push((item as { whole: string }).whole)
          }
        }

        if (currentMessage.length > 0) {
          chunks.push(currentMessage.join(' '))
        }
      }
    }

    // Apply transform chain
    let processedChunks = chunks
    const activeTransforms = transforms.filter((t) => t && t !== '')
    if (activeTransforms.length > 0) {
      for (const transformName of activeTransforms) {
        const selectedTransform: BaseTransformer | undefined = Object.values(allTransforms).find(
          (t) => t.name === transformName,
        )
        if (!selectedTransform?.func) continue
        processedChunks = processedChunks.map((chunk) => {
          try {
            return selectedTransform.func(chunk, {})
          } catch {
            return chunk
          }
        })
      }
    }

    // Apply encapsulation
    const marker = iteratorMarker || '{n}'
    const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const markerRegex = new RegExp(escapedMarker, 'g')

    const result = processedChunks.map((chunk, index) => {
      const num = String(index + 1)
      const start = startWrap.replace(markerRegex, num)
      const end = endWrap.replace(markerRegex, num)
      return `${start}${chunk}${end}`
    })

    setMessages(result)
  }, [input, mode, chunkSize, wordSplitSide, wordSkip, minWordLength, splitFirstWord, preserveEmptyLines, customPattern, patternIncludeDelimiter, tokenCount, transforms, iteratorMarker, startWrap, endWrap])

  const copyAll = useCallback(() => {
    if (messages.length === 0) return
    const text = copyAsSingleLine ? messages.join('') : messages.join('\n')
    flash('all', text)
  }, [messages, copyAsSingleLine, flash])

  // ── styles ─────────────────────────────────────────────────────

  const inputCls =
    'w-full rounded-md px-3 py-2 text-sm outline-none transition-colors ' +
    'placeholder:text-[var(--muted-foreground)] ' +
    'bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] ' +
    'focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'

  const selectCls =
    'w-full rounded-md px-3 py-2 text-sm outline-none transition-colors ' +
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
          Message Splitter
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Split text into multiple copyable chunks. Each message can be transformed and encapsulated individually.
        </p>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Input</label>
        <textarea
          className={cn(inputCls, 'min-h-[80px] resize-y')}
          placeholder="Enter text to split..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
        />
      </div>

      {/* Mode */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Mode</label>
        <select
          className={selectCls}
          value={mode}
          onChange={(e) => setMode(e.target.value as SplitMode)}
        >
          <option value="chunk">Character Chunks</option>
          <option value="word">Split Words</option>
          <option value="sentence">Sentences</option>
          <option value="line">Lines</option>
          <option value="pattern">Custom Pattern (Regex)</option>
          <option value="token">Token-Based (approx)</option>
        </select>
      </div>

      {/* Mode-specific options */}
      <div className="grid grid-cols-2 gap-4">
        {mode === 'chunk' && (
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Chunk Size</label>
            <input
              className={inputCls}
              type="number"
              min={1}
              max={500}
              value={chunkSize}
              onChange={(e) => setChunkSize(Math.max(1, Number(e.target.value)))}
            />
          </div>
        )}

        {mode === 'word' && (
          <>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Split Side (odd length)</label>
              <select
                className={selectCls}
                value={wordSplitSide}
                onChange={(e) => setWordSplitSide(e.target.value as 'left' | 'right')}
              >
                <option value="left">Left (larger first half)</option>
                <option value="right">Right (larger second half)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Words to Skip</label>
              <input
                className={inputCls}
                type="number"
                min={0}
                max={20}
                value={wordSkip}
                onChange={(e) => setWordSkip(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Min Word Length</label>
              <input
                className={inputCls}
                type="number"
                min={1}
                value={minWordLength}
                onChange={(e) => setMinWordLength(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <label className={toggleCls}>
              <input type="checkbox" className="accent-[var(--primary)]" checked={splitFirstWord} onChange={(e) => setSplitFirstWord(e.target.checked)} />
              Split First Word
            </label>
          </>
        )}

        {(mode === 'sentence' || mode === 'line') && (
          <label className={toggleCls}>
            <input type="checkbox" className="accent-[var(--primary)]" checked={preserveEmptyLines} onChange={(e) => setPreserveEmptyLines(e.target.checked)} />
            Preserve Empty Lines
          </label>
        )}

        {mode === 'pattern' && (
          <>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Regex Pattern</label>
              <input
                className={inputCls}
                type="text"
                value={customPattern}
                onChange={(e) => setCustomPattern(e.target.value)}
                placeholder="\\s+"
              />
            </div>
            <label className={toggleCls}>
              <input type="checkbox" className="accent-[var(--primary)]" checked={patternIncludeDelimiter} onChange={(e) => setPatternIncludeDelimiter(e.target.checked)} />
              Include Delimiter
            </label>
          </>
        )}

        {mode === 'token' && (
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Tokens Per Chunk</label>
            <input
              className={inputCls}
              type="number"
              min={1}
              max={1000}
              value={tokenCount}
              onChange={(e) => setTokenCount(Math.max(1, Number(e.target.value)))}
            />
          </div>
        )}
      </div>

      {/* Transform Chain */}
      <div className="flex flex-col gap-2">
        <label className={labelCls}>
          Transform Chain
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {transforms.map((t, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <select
                className={selectCls}
                value={t}
                onChange={(e) => handleTransformChange(idx, e.target.value)}
              >
                <option value="">None</option>
                {categories.map((cat) => {
                  const transformsInCat = transformsByCategory[cat] || []
                  if (transformsInCat.length === 0) return null
                  return (
                    <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                      {transformsInCat.map((tr) => (
                        <option key={tr.name} value={tr.name}>
                          {tr.name}
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </select>
              {idx < transforms.length - 1 && (
                <span className="text-[var(--muted-foreground)]">&rarr;</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Encapsulation */}
      <div className="flex flex-col gap-2 p-3 rounded-lg border bg-[var(--card)] border-[var(--border)]">
        <label className="text-xs font-semibold text-[var(--foreground)]">Encapsulation</label>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Iterator Marker</label>
            <input
              className={inputCls}
              type="text"
              value={iteratorMarker}
              onChange={(e) => setIteratorMarker(e.target.value)}
              placeholder="{n}"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Start String</label>
            <input
              className={inputCls}
              type="text"
              value={startWrap}
              onChange={(e) => setStartWrap(e.target.value)}
              placeholder="e.g., Message {n}: "
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>End String</label>
            <input
              className={inputCls}
              type="text"
              value={endWrap}
              onChange={(e) => setEndWrap(e.target.value)}
              placeholder="e.g., $, >, ]"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <span className="text-[10px] text-[var(--muted-foreground)]">Presets:</span>
          {[
            ['$', '$'], ['<', '>'], ['[', ']'], ['(', ')'],
            ['{', '}'], ['`', '`'], ['"', '"'], ['', ''],
          ].map(([s, e]) => (
            <button
              key={`${s}${e}`}
              className="px-2 py-0.5 text-xs rounded border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] transition-colors text-[var(--foreground)]"
              onClick={() => setEncapsulation(s, e)}
            >
              {s && e ? `${s}...${e}` : 'Clear'}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <button className={btnPrimary} onClick={generateMessages}>
          Split Messages
        </button>
        {messages.length > 0 && (
          <>
            <button className={btnSecondary} onClick={copyAll}>
              {copied === 'all' ? 'Copied!' : 'Copy All'}
            </button>
            <label className={toggleCls}>
              <input
                type="checkbox"
                className="accent-[var(--primary)]"
                checked={copyAsSingleLine}
                onChange={(e) => setCopyAsSingleLine(e.target.checked)}
              />
              Single Line
            </label>
          </>
        )}
      </div>

      {/* Output */}
      {messages.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)]">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid gap-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] overflow-hidden"
              >
                <span className="shrink-0 px-2 py-2 text-xs font-mono text-[var(--muted-foreground)] bg-[var(--muted)] border-r border-[var(--border)] self-stretch flex items-center">
                  #{i + 1}
                </span>
                <div className="flex-1 px-2 py-2 text-sm text-[var(--foreground)] break-all whitespace-pre-wrap min-w-0">
                  {msg}
                </div>
                <button
                  className="shrink-0 self-center px-2 text-xs text-[var(--primary)] hover:underline"
                  onClick={() => flash(`msg-${i}`, msg)}
                >
                  {copied === `msg-${i}` ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
