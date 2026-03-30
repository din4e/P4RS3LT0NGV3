// @ts-nocheck
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Check, Eye, EyeOff, Lock, Unlock, Smile, Info } from 'lucide-react'
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
} from '@/lib/core/steganography'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUICK_CARRIER_EMOJIS = [
  '\uD83D\uDC0D', // snake
  '\uD83D\uDC09', // dragon
  '\uD83E\uDD8E', // lizard
  '\uD83D\uDC0A', // crocodile
  '\uD83D\uDD25', // fire
  '\uD83D\uDCA5', // explosion
  '\uD83D\uDDFF', // moyai
  '\u2693',       // anchor
  '\u2B50',       // star
  '\u2728',       // sparkles
  '\uD83D\uDE80', // rocket
  '\uD83D\uDC80', // skull
  '\uD83E\uDEB8', // rock
  '\uD83C\uDF43', // leaf
  '\uD83E\uDEB6', // feather
  '\uD83D\uDD2E', // crystal ball
  '\uD83D\uDC22', // turtle
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

  // Build a merged list: named carriers + quick extras (deduplicated by emoji)
  const allCarriers = useMemo(() => {
    const seen = new Set<string>()
    const result: CarrierInfo[] = []

    // Named carriers from core
    for (const c of carriers) {
      if (!seen.has(c.emoji)) {
        seen.add(c.emoji)
        result.push({ emoji: c.emoji, name: c.name })
      }
    }

    // Quick carriers that are not already in the named list
    for (const emoji of QUICK_CARRIER_EMOJIS) {
      if (!seen.has(emoji)) {
        seen.add(emoji)
        result.push({ emoji, name: `Carrier ${emoji}` })
      }
    }

    return result
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

  const handleSelectCarrier = useCallback((carrier: CarrierInfo) => {
    setSelectedCarrier(prev => {
      const next = prev?.emoji === carrier.emoji ? null : carrier
      setStegMode(prevMode => {
        const nextMode = next ? 'emoji' : null
        autoEncode(message, nextMode, next)
        return nextMode
      })
      return next
    })
  }, [message, autoEncode])

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

    // Try emoji steganography first
    if (hasEmojiInText(value)) {
      const emojiResult = decodeEmoji(value)
      if (emojiResult) {
        setDecodedOutput(emojiResult)
        setDecodedMethod('Emoji Steganography')
        return
      }
    }

    // Try invisible text
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

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto">
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
          Encode
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
          Decode
        </button>
      </div>

      {/* ============================== ENCODE ============================== */}
      {viewMode === 'encode' && (
        <>
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

            {/* Carrier emoji grid */}
            <div className="grid grid-cols-9 gap-1.5 sm:grid-cols-12">
              {allCarriers.map((carrier) => (
                <button
                  key={carrier.emoji}
                  type="button"
                  onClick={() => handleSelectCarrier(carrier)}
                  title={`${carrier.name} - click to ${selectedCarrier?.emoji === carrier.emoji ? 'deselect' : 'select'}`}
                  className={cn(
                    'flex items-center justify-center h-9 w-9 rounded-md text-lg',
                    'border transition-all duration-150',
                    'hover:scale-110',
                    selectedCarrier?.emoji === carrier.emoji
                      ? 'bg-[var(--primary)]/20 border-[var(--primary)] ring-1 ring-[var(--primary)]'
                      : 'bg-[var(--background)] border-[var(--border)] hover:bg-[var(--accent)]',
                  )}
                >
                  {carrier.emoji}
                </button>
              ))}
            </div>

            {selectedCarrier && (
              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                <span>
                  Selected: <strong className="text-[var(--foreground)]">{selectedCarrier.emoji} {selectedCarrier.name}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Encoded output */}
          {encodedOutput && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  {t('encodedMessage')}
                  {selectedCarrier && (
                    <span className="text-xs text-[var(--muted-foreground)] ml-1.5 font-normal">
                      using {selectedCarrier.name}
                    </span>
                  )}
                  {stegMode === 'invisible' && (
                    <span className="text-xs text-[var(--muted-foreground)] ml-1.5 font-normal">
                      using Invisible Text
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
                <span>Copy this text and share it. Only people who know how to decode it will be able to read your message.</span>
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
              Paste encoded text to reveal the hidden message
            </label>
            <textarea
              id="steg-decode-input"
              value={decodeInput}
              onChange={(e) => handleDecodeInput(e.target.value)}
              placeholder="Paste steganographic text here..."
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
                      via {decodedMethod}
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
              No hidden message detected in the pasted text.
            </div>
          )}
        </>
      )}
    </div>
  )
}
