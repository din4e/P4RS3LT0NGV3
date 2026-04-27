'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Check, Eye, EyeOff, Lock, Unlock, Smile, Info, ChevronDown, ChevronRight, Settings2 } from 'lucide-react'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { cn } from '@/lib/utils'
import {
  encodeEmoji,
  decodeEmoji,
  encodeInvisible,
  decodeInvisible,
  hasEmojiInText,
  carriers,
  getStegOptions,
  setStegOptions,
} from '@/lib/core/steganography'
import type { StegOptions } from '@/types/transformer'

// ---------------------------------------------------------------------------
// Emoji categories
// ---------------------------------------------------------------------------

interface EmojiCategory {
  name: string
  emojis: string[]
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: 'Animals',
    emojis: [
      '🐍', '🐉', '🦎', '🐊', '🐢', '🐌', '🐱', '🐺', '🐯', '🦁',
      '🐸', '🦊', '🦉', '🦋', '🦂', '🦟', '🦠', '🦡', '🦥', '🦛',
      '🦣', '🦌', '🦏', '🐘', '🦓', '🐫', '🦒', '🐃', '🐂', '🐄',
      '🐎', '🐖', '🐏', '🐑', '🐐', '🐕', '🐩', '🐈', '🐓', '🦃',
      '🕊', '🐇', '🐁', '🐀', '🐿', '🦔', '🐾', '🦜', '🦢', '🦩',
      '🦚', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟',
      '🐬', '🐳', '🐋', '🦈', '🐅', '🐆', '🦍', '🦧', '🐻',
    ],
  },
  {
    name: 'Nature',
    emojis: [
      '🔥', '💥', '⭐', '✨', '🌟', '💫', '🌊', '🌪', '🌈', '☀',
      '🌙', '⚡', '❄', '💧', '🌋', '🏔', '⛰', '🌄', '🌅', '🍃',
      '🌿', '🍀', '🌸', '🌺', '🌻', '🌹', '🌷', '🥀', '🍁', '🍂',
      '🌲', '🌳', '🌴', '🌵', '🪵', '🌾', '🪸', '🪶', '🧪', '🧬',
    ],
  },
  {
    name: 'Objects',
    emojis: [
      '🗿', '⚓', '🚀', '🔮', '🎲', '🧿', '📿', '🪬',
      '💎', '🗡', '⚔', '🛡', '🏹', '🎯', '🎪', '🎭', '🎰',
      '🧲', '🔑', '🗝', '🔒', '🔓', '🧰', '🔨', '⚙', '🧱', '🪨',
      '💰', '💳', '💣', '🧨', '🪓', '🔫', '🔭', '🔬', '🧫', '🪄',
    ],
  },
  {
    name: 'Faces & People',
    emojis: [
      '💀', '☠', '😁', '🤡', '👹', '👺', '👻', '👽', '🤖', '😱',
      '🥶', '🥵', '🤯', '🧐', '🥸', '😈', '👿', '💩', '🫠', '🫥',
      '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '🤤',
      '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤨', '🧐', '🕵',
    ],
  },
  {
    name: 'Symbols & Signs',
    emojis: [
      '💢', '⛔', '🚫', '📵', '☢', '☣', '⚠', '♻', '🔰', '💯',
      '⚜', '🔱', '💠', '🌀', '♾', '🔴', '🟠', '🟡', '🟢', '🔵',
      '🟣', '🟤', '⚫', '⚪', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻',
      '⬛', '⬜', '🏁', '🚩', '🎌', '🏴', '🏳', '🇺🇳', '🕉',
    ],
  },
  {
    name: 'Food & Drink',
    emojis: [
      '🍎', '🍊', '🍋', '🍇', '🍉', '🍓', '🍑', '🍒', '🥝', '🍌',
      '🍍', '🥥', '🥑', '🍆', '🥕', '🌽', '🌶', '🥒', '🥬', '🍄',
      '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥩', '🍗', '🍖', '🌮',
      '🍺', '🍻', '🥂', '🍷', '🍸', '🍹', '🧉', '🍵', '☕', '🫖',
    ],
  },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StegMode = 'emoji' | 'invisible'
type ViewMode = 'encode' | 'decode'

interface CarrierInfo {
  emoji: string
  name: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Tool() {
  const t = useTranslations('steganography')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('encode')

  // Encode state
  const [message, setMessage] = useState('')
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierInfo | null>(null)
  const [stegMode, setStegMode] = useState<StegMode | null>(null)
  const [encodedOutput, setEncodedOutput] = useState('')
  const [copiedEncoded, setCopiedEncoded] = useState(false)

  // Decode state
  const [decodeInput, setDecodeInput] = useState('')
  const [decodedOutput, setDecodedOutput] = useState('')
  const [decodedMethod, setDecodedMethod] = useState('')
  const [copiedDecoded, setCopiedDecoded] = useState(false)

  // Steganography advanced options
  const [showStegOptions, setShowStegOptions] = useState(false)
  const [stegOpts, setStegOptsState] = useState<StegOptions>(() => getStegOptions())

  // Collapsible categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    EMOJI_CATEGORIES.forEach((cat, i) => {
      initial[cat.name] = i > 2 // collapse all except first 3
    })
    return initial
  })

  // Custom emoji input
  const [customEmoji, setCustomEmoji] = useState('')

  // Sync local state to core engine
  useEffect(() => { setStegOptions(stegOpts) }, [stegOpts])

  // Re-encode when steg options change
  useEffect(() => {
    if (viewMode === 'encode' && message) {
      autoEncode(message, stegMode, selectedCarrier)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stegOpts])

  // Build a merged list: named carriers from core module
  const namedCarriers = useMemo(() => {
    return carriers.map((c) => ({ emoji: c.emoji, name: c.name }))
  }, [])

  // ----- Encoding logic -----

  const autoEncode = useCallback((msg: string, mode: StegMode | null, carrier: CarrierInfo | null) => {
    if (!msg) {
      setEncodedOutput('')
      return
    }

    if (mode === 'invisible') {
      setEncodedOutput(encodeInvisible(msg))
    } else if (carrier) {
      setEncodedOutput(encodeEmoji(carrier.emoji, msg))
    } else {
      setEncodedOutput('')
    }
  }, [])

  const selectCarrier = useCallback((emoji: string, name: string) => {
    const carrier: CarrierInfo = { emoji, name }
    setSelectedCarrier(prev => {
      const next = prev?.emoji === emoji ? null : carrier
      setStegMode(prevMode => {
        const nextMode = next ? 'emoji' : null
        autoEncode(message, nextMode, next)
        return nextMode
      })
      return next
    })
  }, [message, autoEncode])

  const handleSelectCarrier = useCallback((carrier: CarrierInfo) => {
    selectCarrier(carrier.emoji, carrier.name)
  }, [selectCarrier])

  const handleApplyCustomEmoji = useCallback(() => {
    const emoji = customEmoji.trim()
    if (!emoji) return
    // Extract first grapheme cluster (single emoji)
    const grapheme = [...new Intl.Segmenter().segment(emoji)][0]?.segment || emoji
    selectCarrier(grapheme, 'Custom')
    setCustomEmoji('')
  }, [customEmoji, selectCarrier])

  const handleToggleInvisible = useCallback(() => {
    setStegMode(prev => {
      if (prev === 'invisible') {
        autoEncode(message, null, null)
        return null
      }
      setSelectedCarrier(null)
      autoEncode(message, 'invisible', null)
      return 'invisible'
    })
  }, [message, autoEncode])

  // Re-encode when message changes
  const handleMessageChange = useCallback((value: string) => {
    setMessage(value)
    autoEncode(value, stegMode, selectedCarrier)
  }, [stegMode, selectedCarrier, autoEncode])

  // ----- Decoding logic -----

  const handleDecodeInput = useCallback((value: string) => {
    setDecodeInput(value)
    if (!value) {
      setDecodedOutput('')
      setDecodedMethod('')
      return
    }

    if (hasEmojiInText(value)) {
      const emojiResult = decodeEmoji(value)
      if (emojiResult) {
        setDecodedOutput(emojiResult)
        setDecodedMethod('Emoji Steganography')
        return
      }
    }

    const invisibleResult = decodeInvisible(value)
    if (invisibleResult) {
      setDecodedOutput(invisibleResult)
      setDecodedMethod('Invisible Text')
      return
    }

    setDecodedOutput('')
    setDecodedMethod('')
  }, [])

  // ----- Copy helpers -----

  const handleCopy = useCallback(async (text: string, source: string, setCopied: (v: boolean) => void) => {
    const ok = await copyToClipboard(text)
    if (ok) {
      addHistoryItem(text, source)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [copyToClipboard, addHistoryItem])

  const toggleCategory = useCallback((name: string) => {
    setCollapsedCategories(prev => ({ ...prev, [name]: !prev[name] }))
  }, [])

  // ----- Render helpers -----

  const renderEmojiButton = (emoji: string, name: string, reactKey?: string) => (
    <button
      key={reactKey ?? emoji}
      type="button"
      onClick={() => selectCarrier(emoji, name)}
      title={`${name} - click to ${selectedCarrier?.emoji === emoji ? 'deselect' : 'select'}`}
      className={cn(
        'flex items-center justify-center h-9 w-9 rounded-md text-lg',
        'border transition-all duration-150',
        'hover:scale-110',
        selectedCarrier?.emoji === emoji
          ? 'bg-[var(--primary)]/20 border-[var(--primary)] ring-1 ring-[var(--primary)]'
          : 'bg-[var(--background)] border-[var(--border)] hover:bg-[var(--accent)]',
      )}
    >
      {emoji}
    </button>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle: Encode / Decode */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setViewMode('encode')}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md',
            'border transition-colors',
            viewMode === 'encode'
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
              : 'bg-[var(--background)] text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--accent)]',
          )}
        >
          <Lock className="h-3.5 w-3.5" />
          {t('encode')}
        </button>
        <button
          type="button"
          onClick={() => setViewMode('decode')}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md',
            'border transition-colors',
            viewMode === 'decode'
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
              : 'bg-[var(--background)] text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--accent)]',
          )}
        >
          <Unlock className="h-3.5 w-3.5" />
          {t('decode')}
        </button>
      </div>

      {/* ============================== ENCODE ============================== */}
      {viewMode === 'encode' && (
        <>
          {/* Advanced Steganography Options */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowStegOptions(!showStegOptions)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors text-left"
            >
              {showStegOptions ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <Settings2 className="h-3.5 w-3.5" />
              {t('stegOptions')}
            </button>
            {showStegOptions && (
              <div className="px-3 py-3 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">{t('initialPresentation')}</label>
                  <select
                    className="rounded-md px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    value={stegOpts.initialPresentation}
                    onChange={(e) => setStegOptsState(prev => ({ ...prev, initialPresentation: e.target.value as StegOptions['initialPresentation'] }))}
                  >
                    <option value="emoji">Emoji (VS16)</option>
                    <option value="text">Text (VS15)</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">{t('bitOrder')}</label>
                  <select
                    className="rounded-md px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    value={stegOpts.bitOrder}
                    onChange={(e) => setStegOptsState(prev => ({ ...prev, bitOrder: e.target.value as 'msb' | 'lsb' }))}
                  >
                    <option value="msb">MSB (Most Significant Bit first)</option>
                    <option value="lsb">LSB (Least Significant Bit first)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">{t('bitZeroSelector')}</label>
                  <select
                    className="rounded-md px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    value={stegOpts.bitZeroVS}
                    onChange={(e) => setStegOptsState(prev => ({ ...prev, bitZeroVS: e.target.value }))}
                  >
                    <option value={'︎'}>VS15 (Text Presentation)</option>
                    <option value={'️'}>VS16 (Emoji Presentation)</option>
                    <option value={'​'}>ZWSP (Zero-Width Space)</option>
                    <option value={'‌'}>ZWNJ (Zero-Width Non-Joiner)</option>
                    <option value={'‍'}>ZWJ (Zero-Width Joiner)</option>
                    <option value={'⁠'}>WJ (Word Joiner)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">{t('bitOneSelector')}</label>
                  <select
                    className="rounded-md px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    value={stegOpts.bitOneVS}
                    onChange={(e) => setStegOptsState(prev => ({ ...prev, bitOneVS: e.target.value }))}
                  >
                    <option value={'️'}>VS16 (Emoji Presentation)</option>
                    <option value={'︎'}>VS15 (Text Presentation)</option>
                    <option value={'​'}>ZWSP (Zero-Width Space)</option>
                    <option value={'‌'}>ZWNJ (Zero-Width Non-Joiner)</option>
                    <option value={'‍'}>ZWJ (Zero-Width Joiner)</option>
                    <option value={'⁠'}>WJ (Word Joiner)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">{t('interBitZW')}</label>
                  <select
                    className="rounded-md px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    value={stegOpts.interBitZW ?? ''}
                    onChange={(e) => setStegOptsState(prev => ({ ...prev, interBitZW: e.target.value || null }))}
                  >
                    <option value="">None</option>
                    <option value={'​'}>ZWSP (Zero-Width Space)</option>
                    <option value={'‌'}>ZWNJ (Zero-Width Non-Joiner)</option>
                    <option value={'‍'}>ZWJ (Zero-Width Joiner)</option>
                    <option value={'⁠'}>WJ (Word Joiner)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">{t('interBitEvery')}</label>
                  <input
                    type="number"
                    min={1}
                    max={64}
                    value={stegOpts.interBitEvery}
                    onChange={(e) => setStegOptsState(prev => ({ ...prev, interBitEvery: Math.max(1, Number(e.target.value)) }))}
                    className="rounded-md px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] w-20"
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-medium text-[var(--muted-foreground)]">{t('trailingZW')}</label>
                  <select
                    className="rounded-md px-2 py-1.5 text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                    value={stegOpts.trailingZW ?? ''}
                    onChange={(e) => setStegOptsState(prev => ({ ...prev, trailingZW: e.target.value || null }))}
                  >
                    <option value="">None</option>
                    <option value={'​'}>ZWSP (Zero-Width Space)</option>
                    <option value={'‌'}>ZWNJ (Zero-Width Non-Joiner)</option>
                    <option value={'‍'}>ZWJ (Zero-Width Joiner)</option>
                    <option value={'⁠'}>WJ (Word Joiner)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Message input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="steg-input" className="text-sm font-medium text-[var(--foreground)]">
              <Smile className="inline h-3.5 w-3.5 mr-1.5 text-[var(--primary)]" />
              {t('inputPlaceholder').split('...')[0]}
            </label>
            <textarea
              id="steg-input"
              value={message}
              onChange={(e) => handleMessageChange(e.target.value)}
              placeholder={t('inputPlaceholder')}
              className={cn(
                'w-full min-h-[100px] p-3 rounded-lg border resize-y',
                'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]',
                'placeholder:text-[var(--muted-foreground)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
                'text-sm font-mono',
              )}
            />
          </div>

          {/* Carrier selection + Invisible toggle */}
          <div className="flex flex-col gap-3 p-3 rounded-lg border bg-[var(--card)] border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--foreground)]">
                {t('selectCarrier')}
              </span>
              <button
                type="button"
                onClick={handleToggleInvisible}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md',
                  'border transition-colors',
                  stegMode === 'invisible'
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                    : 'bg-[var(--background)] text-[var(--muted-foreground)] border-[var(--border)] hover:bg-[var(--accent)]',
                )}
              >
                {stegMode === 'invisible' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {t('invisibleText')}
              </button>
            </div>

            {/* Selected carrier indicator */}
            {selectedCarrier && (
              <div className="flex items-center gap-2 px-1 text-xs">
                <span className="text-lg">{selectedCarrier.emoji}</span>
                <span className="text-[var(--muted-foreground)]">
                  {t('selected')} <strong className="text-[var(--foreground)]">{selectedCarrier.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => { setSelectedCarrier(null); setStegMode(null); autoEncode(message, null, null) }}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] ml-1"
                  title={t('clearSelection')}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Named carriers (from core) */}
            {namedCarriers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {namedCarriers.map((carrier) => renderEmojiButton(carrier.emoji, carrier.name))}
              </div>
            )}

            {/* Category sections (collapsible) */}
            {EMOJI_CATEGORIES.map((cat) => (
              <div key={cat.name} className="rounded-md border border-[var(--border)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.name)}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors text-left"
                >
                  {collapsedCategories[cat.name] ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {cat.name}
                  <span className="ml-auto text-[10px]">{cat.emojis.length}</span>
                </button>
                {!collapsedCategories[cat.name] && (
                  <div className="px-2.5 pb-2.5 flex flex-wrap gap-1">
                    {cat.emojis.map((emoji, i) => renderEmojiButton(emoji, `${cat.name} ${i}`, `${cat.name}-${i}`))}
                  </div>
                )}
              </div>
            ))}

            {/* Custom emoji input */}
            <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
              <input
                type="text"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                placeholder={t('customEmojiPlaceholder')}
                className={cn(
                  'flex-1 rounded-md px-2.5 py-1.5 text-sm',
                  'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]',
                  'placeholder:text-[var(--muted-foreground)]',
                  'focus:outline-none focus:ring-1 focus:ring-[var(--ring)]',
                )}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCustomEmoji() } }}
              />
              <button
                type="button"
                onClick={handleApplyCustomEmoji}
                disabled={!customEmoji.trim()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {t('useEmoji')}
              </button>
            </div>
          </div>

          {/* Encoded output */}
          {encodedOutput && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  {t('encodedMessage')}
                  {selectedCarrier && (
                    <span className="text-xs text-[var(--muted-foreground)] ml-1.5 font-normal">
                      {t('using')} {selectedCarrier.name}
                    </span>
                  )}
                  {stegMode === 'invisible' && (
                    <span className="text-xs text-[var(--muted-foreground)] ml-1.5 font-normal">
                      {t('using')} {t('invisibleText')}
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(encodedOutput, 'Steganography', setCopiedEncoded)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md',
                    'border transition-colors',
                    copiedEncoded
                      ? 'bg-green-500/10 text-green-500 border-green-500/30'
                      : 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)] hover:bg-[var(--accent)]',
                  )}
                >
                  {copiedEncoded ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedEncoded ? tc('copied') : tc('copy')}
                </button>
              </div>
              <textarea
                readOnly
                value={encodedOutput}
                className={cn(
                  'w-full min-h-[80px] p-3 rounded-lg border resize-y',
                  'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]',
                  'text-sm font-mono',
                )}
              />
              <div className="flex items-start gap-1.5 text-xs text-[var(--muted-foreground)]">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{t('shareHint')}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================== DECODE ============================== */}
      {viewMode === 'decode' && (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor="steg-decode-input" className="text-sm font-medium text-[var(--foreground)]">
              <Unlock className="inline h-3.5 w-3.5 mr-1.5 text-[var(--primary)]" />
              {t('decodeLabel')}
            </label>
            <textarea
              id="steg-decode-input"
              value={decodeInput}
              onChange={(e) => handleDecodeInput(e.target.value)}
              placeholder={t('decodePlaceholder')}
              className={cn(
                'w-full min-h-[100px] p-3 rounded-lg border resize-y',
                'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]',
                'placeholder:text-[var(--muted-foreground)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
                'text-sm font-mono',
              )}
            />
          </div>

          {decodedOutput && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  {t('decodedMessage')}
                  {decodedMethod && (
                    <span className="text-xs text-[var(--muted-foreground)] ml-1.5 font-normal">
                      {t('via')} {decodedMethod}
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => handleCopy(decodedOutput, 'Steganography Decode', setCopiedDecoded)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md',
                    'border transition-colors',
                    copiedDecoded
                      ? 'bg-green-500/10 text-green-500 border-green-500/30'
                      : 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)] hover:bg-[var(--accent)]',
                  )}
                >
                  {copiedDecoded ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedDecoded ? tc('copied') : tc('copy')}
                </button>
              </div>
              <textarea
                readOnly
                value={decodedOutput}
                className={cn(
                  'w-full min-h-[80px] p-3 rounded-lg border resize-y',
                  'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]',
                  'text-sm font-mono',
                )}
              />
            </div>
          )}

          {decodeInput && !decodedOutput && (
            <div className="text-sm text-[var(--muted-foreground)] p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]">
              {t('noHiddenMessage')}
            </div>
          )}
        </>
      )}
    </div>
  )
}
