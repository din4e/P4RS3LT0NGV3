'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Check, ArrowRight, Loader2, Languages, AlertTriangle, ChevronDown, ChevronUp, KeyRound } from 'lucide-react'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/utils'
import { universalDecode } from '@/lib/core/decoder'
import { allTransforms } from '@/lib/transformers'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DecodeResult {
  text: string
  method: string
  priority: number
  alternatives: Array<{ text: string; method: string }>
}

interface LangDetection {
  detected: true
  language: string
  confidence: 'high' | 'medium'
}

// ---------------------------------------------------------------------------
// Language detection (ported from DecodeTool.js)
// ---------------------------------------------------------------------------

const SCRIPT_RANGES = [
  { name: 'Arabic', re: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/ },
  { name: 'Chinese', re: /[\u4E00-\u9FFF\u3400-\u4DBF]/ },
  { name: 'Japanese', re: /[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF]/ },
  { name: 'Korean', re: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/ },
  { name: 'Cyrillic', re: /[\u0400-\u04FF\u0500-\u052F]/ },
  { name: 'Devanagari', re: /[\u0900-\u097F]/ },
  { name: 'Thai', re: /[\u0E00-\u0E7F]/ },
  { name: 'Hebrew', re: /[\u0590-\u05FF\uFB1D-\uFB4F]/ },
  { name: 'Greek', re: /[\u0370-\u03FF\u1F00-\u1FFF]/ },
  { name: 'Tamil', re: /[\u0B80-\u0BFF]/ },
  { name: 'Bengali', re: /[\u0980-\u09FF]/ },
  { name: 'Georgian', re: /[\u10A0-\u10FF\u2D00-\u2D2F]/ },
  { name: 'Armenian', re: /[\u0530-\u058F]/ },
  { name: 'Ethiopic', re: /[\u1200-\u137F]/ },
  { name: 'Tibetan', re: /[\u0F00-\u0FFF]/ },
  { name: 'Khmer', re: /[\u1780-\u17FF]/ },
  { name: 'Lao', re: /[\u0E80-\u0EFF]/ },
  { name: 'Myanmar', re: /[\u1000-\u109F]/ },
  { name: 'Sinhala', re: /[\u0D80-\u0DFF]/ },
  { name: 'Telugu', re: /[\u0C00-\u0C7F]/ },
  { name: 'Kannada', re: /[\u0C80-\u0CFF]/ },
  { name: 'Malayalam', re: /[\u0D00-\u0D7F]/ },
  { name: 'Gujarati', re: /[\u0A80-\u0AFF]/ },
  { name: 'Gurmukhi', re: /[\u0A00-\u0A7F]/ },
]

const LATIN_LANG_MARKERS = [
  { name: 'Spanish', markers: /\b(el|la|los|las|de|del|en|con|por|para|que|una?|es|está|son|como|pero|más|tiene|esta|puede|este|cada|desde|según|también|porque|entre|ya|muy|otro|otra|sobre|después|mismo|donde|cuando|hasta|aquí|ser|hacer|tiene|todas?|todos?|nos|nuestro|hemos)\b/i },
  { name: 'French', markers: /\b(le|la|les|des|une?|est|sont|avec|dans|pour|sur|pas|que|qui|cette?|mais|nous|vous|leur|très|être|avoir|faire|tout|comme|ses|aux|peut|aussi|plus|encore|même|entre|après|sans|ici|notre|autre|deux|bien)\b/i },
  { name: 'German', markers: /\b(der|die|das|ein|eine|ist|sind|und|oder|für|mit|auf|nicht|von|den|dem|des|sich|kann|werden|wird|haben|sein|auch|nach|über|wie|noch|aber|wenn|nur|mehr|schon|hier|sehr|alle|diese[rms]?|jede[rms]?|mein|dein)\b/i },
  { name: 'Portuguese', markers: /\b(o|os|uma?|uns|umas|é|são|com|em|para|por|que|não|como|mas|mais|tem|está|pode|este|esta|cada|desde|também|porque|entre|muito|outro|outra|sobre|depois|mesmo|onde|quando|até|aqui|ser|fazer|nosso|nossa|todos|todas)\b/i },
  { name: 'Italian', markers: /\b(il|lo|la|gli|le|un|una|è|sono|di|del|della|in|con|per|che|non|come|ma|più|ha|sta|può|questo|questa|ogni|anche|perché|tra|fra|molto|altro|altra|dopo|stesso|dove|quando|fino|qui|essere|fare|nostro|nostra|tutti|tutte)\b/i },
  { name: 'Dutch', markers: /\b(de|het|een|is|zijn|en|of|voor|met|op|niet|van|dat|die|maar|ook|als|kan|worden|wordt|heeft|nog|naar|bij|uit|tot|wel|veel|meer|deze|alle|dit|wat|hoe|waar|hier|zeer|ons|onze|hun)\b/i },
  { name: 'Turkish', markers: /\b(bir|ve|bu|için|ile|var|olan|gibi|daha|çok|ama|ancak|sonra|değil|olarak|kadar|hem|her|bütün|hiç|nasıl|neden|nere[dy]e|şimdi|zaman|büyük|küçük|iyi|kötü|yeni|eski)\b/i },
  { name: 'Polish', markers: /\b(jest|nie|się|na|to|za|ale|jak|już|tak|czy|może|tylko|jeszcze|bardzo|jego|jej|ich|ten|tego|więc|przez|pod|nad|między|tutaj|teraz|zawsze|nigdy|każdy|wszystko)\b/i },
  { name: 'Vietnamese', markers: /\b(là|và|của|có|được|không|một|những|các|này|cho|đã|với|người|trong|từ|đến|về|theo|như|khi|nếu|nhưng|cũng|rất|nhiều|hay|bởi|tại|đây|nào)\b/i },
  { name: 'Indonesian', markers: /\b(dan|yang|di|ini|itu|untuk|dengan|dari|tidak|adalah|pada|ke|juga|akan|sudah|ada|oleh|karena|mereka|kami|bisa|harus|lebih|sangat|satu|dua|banyak|semua|setiap|atau)\b/i },
  { name: 'Swahili', markers: /\b(na|ya|wa|ni|kwa|katika|hii|hiyo|lakini|pia|sana|mtu|watu|nyumba|kazi|nchi|jambo|mambo|habari|rafiki|asante|karibu|kwamba|ambaye|kila|yote)\b/i },
  { name: 'Romanian', markers: /\b(este|sunt|și|sau|pentru|cu|în|din|la|pe|nu|care|acest|această|dar|mai|poate|aici|acolo|foarte|toate|fiecare|nostru|noastră|după|când|unde|cum|despre|între)\b/i },
]

function detectLanguage(text: string): LangDetection | null {
  if (!text || text.length < 8) return null

  const clean = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim()
  if (!clean) return null

  // Check non-Latin scripts via Unicode blocks
  for (const script of SCRIPT_RANGES) {
    const matches = clean.match(new RegExp(script.re.source, 'g'))
    if (matches && matches.length >= 3) {
      const ratio = matches.length / clean.replace(/\s/g, '').length
      if (ratio > 0.3) {
        return { detected: true, language: script.name, confidence: 'high' }
      }
    }
  }

  // Check Latin-script languages
  const latinChars = clean.match(/[a-zA-ZÀ-ÿ]/g)
  if (!latinChars || latinChars.length / clean.replace(/\s/g, '').length < 0.5) return null

  const words = clean.split(/\s+/).filter(w => w.length > 0)
  if (words.length < 3) return null

  // Check if text looks English first
  const englishMarkers = /\b(the|is|are|was|were|have|has|had|will|would|could|should|can|do|does|did|this|that|these|those|with|from|they|their|them|been|being|which|where|when|what|who|how|but|and|not|for|all|any|our|your|its|his|her|some|into|very|just|about|then|than|more|also|here|each|every|only|most|both|such|much|many|other|after|before|between|under|over|again|once|during|without)\b/gi
  const engMatches = clean.match(englishMarkers)
  const engRatio = engMatches ? engMatches.length / words.length : 0
  if (engRatio > 0.15) return null

  let bestLang: string | null = null
  let bestScore = 0

  for (const lang of LATIN_LANG_MARKERS) {
    const langMatches = clean.match(new RegExp(lang.markers.source, 'gi'))
    if (langMatches) {
      const score = langMatches.length / words.length
      if (score > bestScore) {
        bestScore = score
        bestLang = lang.name
      }
    }
  }

  if (bestLang && bestScore > 0.1) {
    return {
      detected: true,
      language: bestLang,
      confidence: bestScore > 0.25 ? 'high' : 'medium',
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Build list of transforms that have a `reverse` method
// ---------------------------------------------------------------------------

function getTransformsWithReverse(): Array<{ key: string; name: string }> {
  return Object.entries(allTransforms)
    .filter(([, t]) => t && typeof t.reverse === 'function')
    .map(([key, t]) => ({ key, name: t.name }))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Tool() {
  const t = useTranslations('decoder')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)
  const apiKeyConfigured = useSettingsStore((s) => s.apiKeyConfigured)
  const apiKey = useSettingsStore((s) => s.apiKey)

  // State
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [result, setResult] = useState<DecodeResult | null>(null)
  const [selectedDecoder, setSelectedDecoder] = useState('auto')
  const [langDetected, setLangDetected] = useState<LangDetection | null>(null)
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState('')
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [copied, setCopied] = useState(false)

  // Memoized list of transforms that support reverse
  const transformsList = useMemo(() => getTransformsWithReverse(), [])

  // Run decode whenever input or selected method changes
  const runDecode = useCallback((text: string, method: string) => {
    setLangDetected(null)
    setTranslateError('')

    if (!text) {
      setOutput('')
      setResult(null)
      return
    }

    let decodeResult: DecodeResult | null = null

    if (method !== 'auto') {
      // Manual: use a specific transform's reverse
      const entry = transformsList.find(tr => tr.name === method)
      if (entry) {
        const transform = allTransforms[entry.key]
        if (transform?.reverse) {
          try {
            const decoded = transform.reverse(text, {})
            if (decoded && decoded !== text) {
              decodeResult = {
                text: decoded,
                method: transform.name,
                priority: 0,
                alternatives: [],
              }
            }
          } catch {
            // skip
          }
        }
      }
    } else {
      // Auto-detect using the universal decoder
      const raw = universalDecode(text, allTransforms, {})
      if (raw) {
        decodeResult = {
          text: raw.text,
          method: raw.method,
          priority: raw.priority,
          alternatives: raw.alternatives ?? [],
        }
      }
    }

    setResult(decodeResult)
    setOutput(decodeResult ? decodeResult.text : '')

    // Language detection
    let lang = detectLanguage(text)
    if (!lang && decodeResult && decodeResult.text && decodeResult.text !== text) {
      lang = detectLanguage(decodeResult.text)
    }
    if (lang) {
      setLangDetected(lang)
    }
  }, [transformsList])

  // Effect: re-decode on input or method change
  useEffect(() => {
    runDecode(input, selectedDecoder)
  }, [input, selectedDecoder, runDecode])

  // Copy helper
  const handleCopy = useCallback(async (text: string) => {
    const ok = await copyToClipboard(text)
    if (ok) {
      addHistoryItem(text, 'Decoder')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [copyToClipboard, addHistoryItem])

  // Use an alternative decoding
  const useAlternative = useCallback((alt: { text: string; method: string }) => {
    if (!result || !alt.text) return
    setOutput(alt.text)
    setResult({
      method: alt.method,
      text: alt.text,
      priority: 0,
      alternatives: result.alternatives.filter(a => a.method !== alt.method),
    })
  }, [result])

  // Translate to English via OpenRouter
  const translateToEnglish = useCallback(async () => {
    if (!apiKey) {
      setTranslateError('No API key configured. Set your OpenRouter key in Settings.')
      return
    }

    const textToTranslate = output || input
    const lang = langDetected?.language ?? 'Unknown'

    setTranslating(true)
    setTranslateError('')

    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'P4RS3LT0NGV3 Decoder',
        },
        body: JSON.stringify({
          model: 'google/gemma-3-27b-it',
          messages: [
            {
              role: 'system',
              content:
                'You are a professional translator. Translate the following text to English. ' +
                'Output ONLY the English translation. No explanations, notes, or alternatives. ' +
                'Preserve formatting, line breaks, and structure.',
            },
            {
              role: 'user',
              content: `Translate this ${lang} text to English:\n\n${textToTranslate}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 4096,
        }),
      })

      const data = await resp.json()
      if (data.error) {
        setTranslateError(data.error.message || 'API error')
      } else if (data.choices?.[0]) {
        const translated = data.choices[0].message.content.trim()
        setOutput(translated)
        setResult(prev => prev ? {
          ...prev,
          text: translated,
          method: `${lang} -> English (AI)`,
        } : {
          text: translated,
          method: `${lang} -> English (AI)`,
          priority: 0,
          alternatives: [],
        })
        handleCopy(translated)
      }
    } catch (e) {
      setTranslateError(`Translation failed: ${(e as Error).message}`)
    } finally {
      setTranslating(false)
    }
  }, [apiKey, input, output, langDetected, handleCopy])

  return (
    <div className="flex flex-col gap-4 ">
      {/* Input section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="decoder-input" className="text-sm font-medium text-[var(--foreground)]">
            <KeyRound className="inline h-3.5 w-3.5 mr-1.5 text-[var(--primary)]" />
            {t('inputPlaceholder').split('...')[0]}
          </label>
          <select
            value={selectedDecoder}
            onChange={(e) => setSelectedDecoder(e.target.value)}
            className={cn(
              'text-xs px-2 py-1 rounded-md border',
              'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
            )}
          >
            <option value="auto">Auto-detect</option>
            {transformsList.map(tr => (
              <option key={tr.key} value={tr.name}>
                {tr.name}
              </option>
            ))}
          </select>
        </div>
        <textarea
          id="decoder-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('inputPlaceholder')}
          className={cn(
            'w-full min-h-[120px] p-3 rounded-lg border resize-y',
            'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]',
            'placeholder:text-[var(--muted-foreground)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
            'text-sm font-mono',
          )}
        />
      </div>

      {/* Language detection banner */}
      {langDetected && (
        <div className={cn(
          'flex flex-col gap-2 p-3 rounded-lg border',
          'bg-[var(--card)] border-[var(--border)]',
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Languages className="h-4 w-4 text-[var(--primary)]" />
              <span>
                <strong className="text-[var(--foreground)]">{langDetected.language}</strong>
                <span className="text-[var(--muted-foreground)] ml-1">detected</span>
                {langDetected.confidence === 'medium' && (
                  <span className="text-[var(--muted-foreground)] ml-1 text-xs">(likely)</span>
                )}
              </span>
            </div>
            {apiKeyConfigured && (
              <button
                type="button"
                onClick={translateToEnglish}
                disabled={translating}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md',
                  'bg-[var(--primary)] text-[var(--primary-foreground)]',
                  'hover:opacity-90 transition-opacity',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {translating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                {translating ? 'Translating...' : t('translateToEnglish')}
              </button>
            )}
          </div>
          {translateError && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--destructive)]">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {translateError}
            </div>
          )}
        </div>
      )}

      {/* Output section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--foreground)]">
            {result?.method ? (
              <>
                Decoded using: <strong className="text-[var(--primary)]">{result.method}</strong>
              </>
            ) : (
              'Decoded Output'
            )}
          </label>
          {output && (
            <button
              type="button"
              onClick={() => handleCopy(output)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md',
                'border transition-colors',
                copied
                  ? 'bg-green-500/10 text-green-500 border-green-500/30'
                  : 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)] hover:bg-[var(--accent)]',
              )}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? tc('copied') : tc('copy')}
            </button>
          )}
        </div>
        <textarea
          readOnly
          value={output}
          placeholder="Decoded text will appear here..."
          className={cn(
            'w-full min-h-[120px] p-3 rounded-lg border resize-y',
            'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]',
            'placeholder:text-[var(--muted-foreground)]',
            'text-sm font-mono',
          )}
        />

        {/* Alternatives section */}
        {result && result.alternatives.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setShowAlternatives(prev => !prev)}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              {showAlternatives ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {result.alternatives.length} Alternative{result.alternatives.length !== 1 ? 's' : ''}
            </button>
            {showAlternatives && (
              <div className="flex flex-col gap-1.5">
                {result.alternatives.map((alt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => useAlternative(alt)}
                    className={cn(
                      'flex flex-col gap-0.5 p-2.5 rounded-md border text-left',
                      'bg-[var(--card)] border-[var(--border)]',
                      'hover:bg-[var(--accent)] transition-colors',
                    )}
                  >
                    <span className="text-xs font-medium text-[var(--primary)]">{alt.method}</span>
                    <span className="text-xs text-[var(--foreground)] font-mono truncate">
                      {alt.text.substring(0, 150)}{alt.text.length > 150 ? '...' : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
