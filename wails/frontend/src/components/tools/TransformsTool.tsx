'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
  Star,
  Settings2,
  Search,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  X,
  RotateCcw,
  Shuffle,
  Clock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  allTransforms,
  transformsByCategory,
  type BaseTransformer,
  type ConfigurableOption,
  type TransformOptions,
} from '@/lib/transformers'
import { useAppStore } from '@/stores/useAppStore'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface LastUsedEntry {
  name: string
  timestamp: number
}

interface CollapsedState {
  [category: string]: boolean
}

/* ------------------------------------------------------------------ */
/* Category colour mapping                                             */
/* ------------------------------------------------------------------ */

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  ancient:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/40',  text: 'text-amber-400' },
  case:     { bg: 'bg-sky-500/10',    border: 'border-sky-500/40',    text: 'text-sky-400' },
  cipher:   { bg: 'bg-violet-500/10', border: 'border-violet-500/40', text: 'text-violet-400' },
  encoding: { bg: 'bg-emerald-500/10',border: 'border-emerald-500/40',text: 'text-emerald-400' },
  fantasy:  { bg: 'bg-rose-500/10',   border: 'border-rose-500/40',   text: 'text-rose-400' },
  format:   { bg: 'bg-orange-500/10', border: 'border-orange-500/40', text: 'text-orange-400' },
  special:  { bg: 'bg-fuchsia-500/10',border: 'border-fuchsia-500/40',text: 'text-fuchsia-400' },
  technical:{ bg: 'bg-cyan-500/10',   border: 'border-cyan-500/40',   text: 'text-cyan-400' },
  signwriting:{ bg: 'bg-amber-400/10', border: 'border-amber-400/40', text: 'text-amber-300' },
  unicode:  { bg: 'bg-indigo-500/10', border: 'border-indigo-500/40', text: 'text-indigo-400' },
  visual:   { bg: 'bg-pink-500/10',   border: 'border-pink-500/40',   text: 'text-pink-400' },
}

const LEGEND_ORDER = ['ancient', 'case', 'cipher', 'encoding', 'fantasy', 'format', 'signwriting', 'special', 'technical', 'unicode', 'visual']

/* ------------------------------------------------------------------ */
/* localStorage helpers                                                */
/* ------------------------------------------------------------------ */

function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch { /* ignore */ }
  return fallback
}

function saveToLS(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* ignore */ }
}

function loadOptionPrefs(): Record<string, TransformOptions> {
  return loadFromLS<Record<string, TransformOptions>>('transformOptionPrefs', {})
}

function loadFavorites(): string[] {
  return loadFromLS<string[]>('transformFavorites', [])
}

function loadLastUsed(): LastUsedEntry[] {
  return loadFromLS<LastUsedEntry[]>('transformLastUsed', [])
}

function loadCategoryOrder(): string[] | null {
  return loadFromLS<string[] | null>('transformCategoryOrder', null)
}

function loadCollapsed(): CollapsedState {
  return loadFromLS<CollapsedState>('transformCollapsed', {})
}

function getMergedOptions(
  transform: BaseTransformer,
  optionPrefs: Record<string, TransformOptions>,
): TransformOptions {
  const saved = optionPrefs[transform.name]
  if (!saved) return {}
  return saved
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function TransformsTool() {
  const t = useTranslations('transform')
  const activeTab = useAppStore((s) => s.activeTab)
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)

  /* ---- Local state ---- */
  const [input, setInput] = useState('Hello World')
  const [output, setOutput] = useState('')
  const [activeTransform, setActiveTransform] = useState<BaseTransformer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [lastUsed, setLastUsed] = useState<LastUsedEntry[]>([])
  const [optionPrefs, setOptionPrefs] = useState<Record<string, TransformOptions>>({})
  const [collapsed, setCollapsed] = useState<CollapsedState>({})
  const [copied, setCopied] = useState(false)
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [optionsModalTransform, setOptionsModalTransform] = useState<BaseTransformer | null>(null)
  const [optionsDraft, setOptionsDraft] = useState<TransformOptions>({})
  const [mounted, setMounted] = useState(false)

  /* ---- Hydrate from localStorage after mount ---- */
  useEffect(() => {
    setFavorites(loadFavorites())
    setLastUsed(loadLastUsed())
    setOptionPrefs(loadOptionPrefs())
    setCollapsed(loadCollapsed())
    setMounted(true)
  }, [])

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({})

  /* ---- Category order ---- */
  const categories = useMemo(() => {
    const allCats = Object.keys(transformsByCategory)
    if (!mounted) {
      const sorted = allCats.filter(c => c !== 'special').sort((a, b) => a.localeCompare(b))
      return [...sorted, 'special']
    }
    const savedOrder = loadCategoryOrder()
    if (!savedOrder || savedOrder.length === 0) {
      const sorted = allCats.filter(c => c !== 'special').sort((a, b) => a.localeCompare(b))
      return [...sorted, 'special']
    }
    // merge saved order with any new categories
    const valid = savedOrder.filter(c => allCats.includes(c))
    const newCats = allCats.filter(c => c !== 'special' && !valid.includes(c)).sort((a, b) => a.localeCompare(b))
    const merged = [...valid, ...newCats]
    // ensure special is last
    const withoutSpecial = merged.filter(c => c !== 'special')
    if (allCats.includes('special')) withoutSpecial.push('special')
    return withoutSpecial
  }, [mounted])

  /* ---- Persist side effects ---- */
  useEffect(() => { saveToLS('transformFavorites', favorites) }, [favorites])
  useEffect(() => { saveToLS('transformLastUsed', lastUsed) }, [lastUsed])
  useEffect(() => { saveToLS('transformOptionPrefs', optionPrefs) }, [optionPrefs])
  useEffect(() => { saveToLS('transformCollapsed', collapsed) }, [collapsed])

  /* ---- Save initial category order on first mount ---- */
  useEffect(() => {
    try {
      if (!localStorage.getItem('transformCategoryOrder')) {
        saveToLS('transformCategoryOrder', categories)
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- Auto-transform on input change ---- */
  useEffect(() => {
    if (activeTransform && activeTab === 'transforms' && input) {
      try {
        const opts = getMergedOptions(activeTransform, optionPrefs)
        const result = activeTransform.func(input, opts)
        setOutput(result)
      } catch {
        setOutput('')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input])

  /* ---- Helpers ---- */
  const isFavorite = useCallback(
    (name: string) => favorites.includes(name),
    [favorites],
  )

  const toggleFavorite = useCallback(
    (name: string) => {
      setFavorites(prev => {
        const idx = prev.indexOf(name)
        if (idx > -1) {
          toast(t('removedFromFavorites'))
          return prev.filter(n => n !== name)
        }
        toast(t('addedToFavorites'))
        return [...prev, name]
      })
    },
    [t],
  )

  const saveLastUsedEntry = useCallback((name: string) => {
    setLastUsed(prev => {
      const filtered = prev.filter(e => e.name !== name)
      return [{ name, timestamp: Date.now() }, ...filtered].slice(0, 5)
    })
  }, [])

  const applyTransform = useCallback(
    (transform: BaseTransformer) => {
      if (!input) return

      setActiveTransform(transform)
      saveLastUsedEntry(transform.name)

      try {
        const opts = getMergedOptions(transform, optionPrefs)
        const result = transform.func(input, opts)
        setOutput(result)

        // auto-copy to clipboard
        copyToClipboard(result).then(ok => {
          if (ok) {
            addHistoryItem(result, 'Transforms')
            toast(t('appliedAndCopied', { name: transform.name }))
          }
        })
      } catch (e) {
        setOutput('')
        console.error(`Error applying transform ${transform.name}:`, e)
      }

      // refocus input
      inputRef.current?.focus()
    },
    [input, optionPrefs, saveLastUsedEntry, copyToClipboard, addHistoryItem, t],
  )

  const handleCopyOutput = useCallback(async () => {
    const ok = await copyToClipboard(output)
    if (ok) {
      addHistoryItem(output, 'Transforms')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }, [output, copyToClipboard, addHistoryItem])

  const scrollToCategory = useCallback((category: string) => {
    const el = categoryRefs.current[category]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const toggleCollapsed = useCallback((category: string) => {
    setCollapsed(prev => ({ ...prev, [category]: !prev[category] }))
  }, [])

  const moveCategoryUp = useCallback(
    (idx: number) => {
      // handled by re-saving the categories order
      const newOrder = [...categories]
      if (idx <= 0) return
      ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
      saveToLS('transformCategoryOrder', newOrder)
      // Force re-render by updating a key or state
      window.location.reload()
    },
    [categories],
  )

  const moveCategoryDown = useCallback(
    (idx: number) => {
      const newOrder = [...categories]
      if (idx >= newOrder.length - 1) return
      ;[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]
      saveToLS('transformCategoryOrder', newOrder)
      window.location.reload()
    },
    [categories],
  )

  /* ---- Options modal ---- */
  const openOptionsModal = useCallback(
    (transform: BaseTransformer) => {
      if (!transform.configurableOptions || transform.configurableOptions.length === 0) return
      setOptionsModalTransform(transform)
      setOptionsDraft(getMergedOptions(transform, optionPrefs))
      setShowOptionsModal(true)
    },
    [optionPrefs],
  )

  const commitOptions = useCallback(() => {
    if (!optionsModalTransform) return
    setOptionPrefs(prev => ({
      ...prev,
      [optionsModalTransform.name]: { ...optionsDraft },
    }))
    toast(t('optionsSaved'))

    // if this transform is active, re-apply
    if (activeTransform && activeTransform.name === optionsModalTransform.name && input) {
      try {
        const result = activeTransform.func(input, optionsDraft)
        setOutput(result)
      } catch { /* ignore */ }
    }

    setShowOptionsModal(false)
    setOptionsModalTransform(null)
    setOptionsDraft({})
  }, [optionsModalTransform, optionsDraft, activeTransform, input])

  const resetOptionsToDefaults = useCallback(() => {
    if (!optionsModalTransform?.configurableOptions) return
    const defaults: TransformOptions = {}
    optionsModalTransform.configurableOptions.forEach(opt => {
      if (opt.default !== undefined && opt.default !== null) {
        defaults[opt.id] = opt.default
      } else if (opt.type === 'boolean') defaults[opt.id] = false
      else if (opt.type === 'select' && opt.options?.length) defaults[opt.id] = opt.options[0].value
      else if (opt.type === 'number') defaults[opt.id] = 0
      else defaults[opt.id] = ''
    })
    setOptionsDraft(defaults)
  }, [optionsModalTransform])

  /* ---- Search filtering ---- */
  const filteredByCategory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const result: Record<string, BaseTransformer[]> = {}

    for (const cat of categories) {
      const transforms = transformsByCategory[cat] || []
      const filtered = q
        ? transforms.filter(t => t.name.toLowerCase().includes(q))
        : transforms
      if (filtered.length > 0) {
        result[cat] = filtered
      }
    }
    return result
  }, [categories, searchQuery])

  /* ---- Favorite transforms ---- */
  const favoriteTransforms = useMemo(() => {
    return favorites
      .map(name => Object.values(allTransforms).find(t => t.name === name))
      .filter((t): t is BaseTransformer => !!t)
  }, [favorites])

  /* ---- Last-used transforms ---- */
  const lastUsedTransforms = useMemo(() => {
    return lastUsed
      .map(e => {
        const transform = Object.values(allTransforms).find(t => t.name === e.name)
        return transform || null
      })
      .filter((t): t is BaseTransformer => !!t)
  }, [lastUsed])

  /* ---- Keyboard shortcut ---- */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Ctrl/Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  /* ---- Body class for modal ---- */
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('transform-options-modal-open', showOptionsModal)
    }
    return () => {
      document.body.classList.remove('transform-options-modal-open')
    }
  }, [showOptionsModal])

  /* ---- Render helpers ---- */
  const renderTransformButton = (transform: BaseTransformer, extraClass?: string) => {
    const catColor = CATEGORY_COLORS[transform.category || 'format'] || CATEGORY_COLORS.format
    const isActive = activeTransform?.name === transform.name
    const hasOptions = !!(transform.configurableOptions && transform.configurableOptions.length > 0)
    const fav = isFavorite(transform.name)
    let preview = ''
    if (mounted && input) {
      try {
        preview = transform.preview(input.slice(0, 10), getMergedOptions(transform, optionPrefs))
      } catch { /* ignore */ }
    }

    return (
      <div key={transform.name} className="flex-shrink-0">
        <button
          type="button"
          onClick={() => applyTransform(transform)}
          title={`Click to transform and copy: ${transform.name}`}
          className={cn(
            'group relative flex flex-col items-start gap-0.5',
            'px-2.5 py-1.5 rounded-md border text-left text-xs font-medium',
            'transition-all duration-150',
            catColor.bg, catColor.border, catColor.text,
            'hover:brightness-125 hover:scale-[1.02]',
            isActive && 'ring-2 ring-[var(--ring)] brightness-125',
            extraClass,
          )}
        >
          <span className="flex items-center gap-1 w-full">
            <span className="truncate flex-1">{transform.name}</span>
            {hasOptions && (
              <Settings2
                className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-70 transition-opacity"
                onClick={(e) => { e.stopPropagation(); openOptionsModal(transform) }}
                aria-label={`Options for ${transform.name}`}
              />
            )}
            <Star
              className={cn(
                'h-3 w-3 shrink-0 cursor-pointer transition-colors',
                fav ? 'fill-yellow-400 text-yellow-400' : 'opacity-0 group-hover:opacity-50',
              )}
              onClick={(e) => { e.stopPropagation(); toggleFavorite(transform.name) }}
              aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
            />
          </span>
          {preview && (
            <span className={cn(
              'text-[10px] opacity-60 truncate w-full',
              transform.category === 'signwriting' && 'signwriting-preview',
            )}>{preview}</span>
          )}
        </button>
      </div>
    )
  }

  const renderCategorySection = (category: string, transforms: BaseTransformer[], isSpecial = false) => {
    const catColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.format
    const isCollapsed = collapsed[category]
    const catIdx = categories.indexOf(category)
    // Filter out favorites from the category display (they appear in favorites section)
    const displayTransforms = favorites.length > 0
      ? transforms.filter(t => !isFavorite(t.name))
      : transforms

    return (
      <div
        key={category}
        ref={(el) => { categoryRefs.current[category] = el }}
        className={cn(
          'rounded-lg border overflow-hidden transition-colors',
          'bg-[var(--card)] border-[var(--border)]',
        )}
      >
        {/* Category header */}
        <div className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold hover:bg-[var(--muted)] transition-colors">
          <button
            type="button"
            onClick={() => toggleCollapsed(category)}
            className={cn('flex items-center gap-2 text-left', catColor.text)}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {isSpecial ? (
              <>
                <Shuffle className="h-3.5 w-3.5" />
                {t('randomizerTitle')}
              </>
            ) : (
              <>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </>
            )}
          </button>
          {!isSpecial && (
            <span className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => moveCategoryUp(catIdx)}
                className="p-0.5 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
                title="Move category up"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => moveCategoryDown(catIdx)}
                className="p-0.5 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)]"
                title="Move category down"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        {/* Transform buttons */}
        {!isCollapsed && (
          <div className={cn(
            isSpecial ? 'p-3 space-y-3' : 'p-2',
          )}>
            {isSpecial ? (
              <>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {t('randomizerDesc')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {displayTransforms.map(tr => renderTransformButton(tr, 'fuchsia'))}
                </div>
                <div className="text-[10px] text-[var(--muted-foreground)] space-y-1">
                  <p className="font-semibold">{t('randomizerHow')}</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Each word gets a random transform</li>
                    <li>Mixes fantasy, ancient, and modern encodings</li>
                    <li>Preserves punctuation and spacing</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {displayTransforms.map(tr => renderTransformButton(tr))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  /* ================================================================ */
  /* RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">

      {/* ---- Left panel: Input / Output ---- */}
      <div className="flex flex-col gap-3 lg:w-[360px] shrink-0 lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
        {/* Input */}
        <div className="flex flex-col gap-1">
          <label htmlFor="transform-input" className="text-xs font-medium text-[var(--muted-foreground)]">
            Input
          </label>
          <textarea
            ref={inputRef}
            id="transform-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('inputPlaceholder')}
            spellCheck={false}
            className={cn(
              'w-full h-36 lg:h-48 resize-y rounded-lg border px-3 py-2 text-sm',
              'bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]',
              'placeholder:text-[var(--muted-foreground)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
            )}
          />
        </div>

        {/* Output */}
        {output && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--muted-foreground)]">
                {t('output')}
                {activeTransform && (
                  <span className="ml-1 font-normal">({activeTransform.name})</span>
                )}
              </label>
              <button
                type="button"
                onClick={handleCopyOutput}
                title="Copy output"
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                  'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
                  'hover:bg-[var(--accent)] transition-colors',
                )}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              aria-label="Transformed text output"
              className={cn(
                'w-full h-32 lg:h-40 resize-y rounded-lg border px-3 py-2 text-sm',
                'bg-[var(--muted)] border-[var(--border)] text-[var(--foreground)]',
                'focus:outline-none',
                activeTransform?.category === 'signwriting' && 'signwriting-output',
              )}
            />
            <p className="text-[10px] text-[var(--muted-foreground)]">
              {t('outputHint')}
            </p>
          </div>
        )}
      </div>

      {/* ---- Right panel: Category legend + Transform list ---- */}
      <div className="flex-1 flex flex-col gap-2 min-h-0 min-w-0">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
          <input
            ref={searchRef}
            data-search-input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            spellCheck={false}
            className={cn(
              'w-full pl-8 pr-3 py-1.5 rounded-lg border text-sm',
              'bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]',
              'placeholder:text-[var(--muted-foreground)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); searchRef.current?.focus() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category legend */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            {t('categories')}:
          </span>
          {LEGEND_ORDER.filter(c => transformsByCategory[c]).map(cat => {
            const col = CATEGORY_COLORS[cat] || CATEGORY_COLORS.format
            return (
              <button
                key={cat}
                type="button"
                onClick={() => scrollToCategory(cat)}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-medium border',
                  col.bg, col.border, col.text,
                  'hover:brightness-125 transition-all',
                )}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Scrollable transform list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
          {/* Favorites section */}
          {favoriteTransforms.length > 0 && !searchQuery && (
            <div
              ref={(el) => { categoryRefs.current['favorites'] = el }}
              className={cn(
                'rounded-lg border overflow-hidden',
                'bg-[var(--card)] border-yellow-500/30',
              )}
            >
              <button
                type="button"
                onClick={() => toggleCollapsed('favorites')}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-yellow-400 hover:bg-[var(--muted)] transition-colors text-left"
              >
                {collapsed['favorites'] ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                <Star className="h-3.5 w-3.5 fill-yellow-400" />
                {t('favorites')}
              </button>
              {!collapsed['favorites'] && (
                <div className="p-2 flex flex-wrap gap-1.5">
                  {favoriteTransforms.map(tr => renderTransformButton(tr))}
                </div>
              )}
            </div>
          )}

          {/* Last Used section */}
          {lastUsedTransforms.length > 0 && !searchQuery && (
            <div
              ref={(el) => { categoryRefs.current['lastUsed'] = el }}
              className={cn(
                'rounded-lg border overflow-hidden',
                'bg-[var(--card)] border-[var(--border)]',
              )}
            >
              <button
                type="button"
                onClick={() => toggleCollapsed('lastUsed')}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors text-left"
              >
                {collapsed['lastUsed'] ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                <Clock className="h-3.5 w-3.5" />
                {t('lastUsed')}
              </button>
              {!collapsed['lastUsed'] && (
                <div className="p-2 flex flex-wrap gap-1.5">
                  {lastUsedTransforms.map(tr => renderTransformButton(tr))}
                </div>
              )}
            </div>
          )}

          {/* Category sections */}
          {categories.map(cat => {
            const transforms = filteredByCategory[cat]
            if (!transforms || transforms.length === 0) return null
            return renderCategorySection(cat, transforms, cat === 'special')
          })}
        </div>
      </div>

      {/* ---- Options Modal ---- */}
      {showOptionsModal && optionsModalTransform && (
        <OptionsModal
          transform={optionsModalTransform}
          draft={optionsDraft}
          setDraft={setOptionsDraft}
          onCommit={commitOptions}
          onCancel={() => {
            setShowOptionsModal(false)
            setOptionsModalTransform(null)
            setOptionsDraft({})
          }}
          onReset={resetOptionsToDefaults}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Options Modal                                                       */
/* ------------------------------------------------------------------ */

function OptionsModal({
  transform,
  draft,
  setDraft,
  onCommit,
  onCancel,
  onReset,
}: {
  transform: BaseTransformer
  draft: TransformOptions
  setDraft: React.Dispatch<React.SetStateAction<TransformOptions>>
  onCommit: () => void
  onCancel: () => void
  onReset: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transform-options-title"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-md mx-4 rounded-xl border shadow-xl',
          'bg-[var(--card)] border-[var(--border)] text-[var(--card-foreground)]',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 id="transform-options-title" className="text-sm font-semibold">
            {transform.name} - Options
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded hover:bg-[var(--muted)] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3 max-h-[60vh] overflow-y-auto">
          {transform.configurableOptions?.map(opt => (
            <OptionField key={opt.id} option={opt} draft={draft} setDraft={setDraft} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onReset}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md',
              'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
              'hover:bg-[var(--accent)] transition-colors',
            )}
          >
            <RotateCcw className="h-3 w-3 inline mr-1" />
            Reset defaults
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md',
              'bg-[var(--secondary)] text-[var(--secondary-foreground)]',
              'hover:bg-[var(--accent)] transition-colors',
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCommit}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md',
              'bg-[var(--primary)] text-[var(--primary-foreground)]',
              'hover:opacity-90 transition-colors',
            )}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Option field                                                        */
/* ------------------------------------------------------------------ */

function OptionField({
  option,
  draft,
  setDraft,
}: {
  option: ConfigurableOption
  draft: TransformOptions
  setDraft: React.Dispatch<React.SetStateAction<TransformOptions>>
}) {
  const value = draft[option.id] ?? option.default

  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={`opt-${option.id}`} className="text-xs font-medium">
        {option.label}
      </label>

      {option.type === 'boolean' && (
        <input
          id={`opt-${option.id}`}
          type="checkbox"
          checked={!!value}
          onChange={(e) => setDraft(d => ({ ...d, [option.id]: e.target.checked }))}
          className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
        />
      )}

      {option.type === 'select' && (
        <select
          id={`opt-${option.id}`}
          value={String(value)}
          onChange={(e) => setDraft(d => ({ ...d, [option.id]: e.target.value }))}
          className={cn(
            'rounded-md border px-2 py-1 text-xs',
            'bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
          )}
        >
          {option.options?.map(o => (
            <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
          ))}
        </select>
      )}

      {option.type === 'text' && (
        <input
          id={`opt-${option.id}`}
          type="text"
          value={String(value)}
          onChange={(e) => setDraft(d => ({ ...d, [option.id]: e.target.value }))}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            'w-40 rounded-md border px-2 py-1 text-xs',
            'bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
          )}
        />
      )}

      {option.type === 'number' && (
        <input
          id={`opt-${option.id}`}
          type="number"
          value={Number(value)}
          min={option.min}
          max={option.max}
          step={option.step ?? 1}
          inputMode="numeric"
          onChange={(e) => setDraft(d => ({
            ...d,
            [option.id]: e.target.value === '' ? option.default : Number(e.target.value),
          }))}
          className={cn(
            'w-24 rounded-md border px-2 py-1 text-xs',
            'bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
          )}
        />
      )}
    </div>
  )
}
