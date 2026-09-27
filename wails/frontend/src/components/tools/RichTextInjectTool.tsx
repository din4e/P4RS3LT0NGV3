'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
  Copy,
  Check,
  Sparkles,
  GitCompare,
  FileCode,
  FileJson,
  Download,
  Upload,
  Eraser,
  Eye,
  Zap,
  Info,
  ListChecks,
  AlertTriangle,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useClipboard } from '@/hooks/useClipboard'
import { useCopyHistoryStore } from '@/stores/useCopyHistoryStore'
import { cn } from '@/lib/utils'
import {
  RICHTEXT_UPLOAD_MAX_BYTES,
  RICHTEXT_UPLOAD_ACCEPT,
  RICHTEXT_UPLOAD_EXTENSIONS,
  RICHTEXT_PRESETS,
  RICHTEXT_EXAMPLES,
  buildGeneratedPayload,
  buildUploadPayload,
  buildPreviewDocument,
  downloadBlob,
  buildDownloadBaseName,
  detectUploadKind,
  getExtension,
  formatBytes,
  shorten,
  type RichTextTechnique,
  type RichTextUploadKind,
  type RichTextPayload,
} from '@/lib/injection/richtextInject'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UploadState {
  name: string
  size: number
  type: string
  kind: RichTextUploadKind
  source: string
}

interface RouteRow {
  title: string
  value: string
  description: string
}

type CopyTarget = 'html' | 'markdown' | 'plain' | 'expected'
type DownloadTarget = 'html' | 'markdown' | 'json'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Tool() {
  const t = useTranslations('richtextinject')
  const tc = useTranslations('common')
  const { copyToClipboard } = useClipboard()
  const addHistoryItem = useCopyHistoryStore((s) => s.addItem)

  // Form state
  const [technique, setTechnique] = useState<RichTextTechnique>('hidden-span')
  const [visibleText, setVisibleText] = useState(() => t('defaults.visible'))
  const [hiddenText, setHiddenText] = useState(() => t('defaults.hidden'))
  const [expectedText, setExpectedText] = useState('')

  // Output state
  const [payload, setPayload] = useState<RichTextPayload | null>(null)
  const [lastGeneratedAt, setLastGeneratedAt] = useState('')
  const [renderError, setRenderError] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showCompare, setShowCompare] = useState(false)

  // Upload state
  const [upload, setUpload] = useState<UploadState | null>(null)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTokenRef = useRef(0)

  const hasUpload = Boolean(upload?.source && upload?.name)

  // ----- Generation -----

  const generate = useCallback(
    (opts?: {
      technique?: RichTextTechnique
      visibleText?: string
      hiddenText?: string
      upload?: UploadState | null
      showToast?: boolean
    }) => {
      const activeUpload = opts?.upload !== undefined ? opts.upload : upload
      try {
        const next = activeUpload
          ? buildUploadPayload({
              fileName: activeUpload.name,
              kind: activeUpload.kind,
              source: activeUpload.source,
              expectedText,
            })
          : buildGeneratedPayload({
              technique: opts?.technique ?? technique,
              visibleText:
                (opts?.visibleText ?? visibleText).trim() ||
                t('defaults.visible'),
              hiddenText: opts?.hiddenText ?? hiddenText,
              expectedText,
            })
        setPayload(next)
        setLastGeneratedAt(new Date().toLocaleString())
        setRenderError('')
        if (opts?.showToast) {
          toast.success(
            next.mode === 'upload' ? t('toast.analyzed') : t('toast.generated'),
          )
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t('toast.failed')
        setRenderError(message)
        toast.error(message)
      }
    },
    [technique, visibleText, hiddenText, expectedText, upload, t],
  )

  // Generate once on mount
  useEffect(() => {
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyPreset = useCallback(
    (id: RichTextTechnique) => {
      setTechnique(id)
      generate({ technique: id })
    },
    [generate],
  )

  const applyExample = useCallback(
    (example: (typeof RICHTEXT_EXAMPLES)[number]) => {
      const nextTechnique = example.technique
      const nextVisible = t(example.visibleKey)
      const nextHidden = t(example.hiddenKey)
      setTechnique(nextTechnique)
      setVisibleText(nextVisible)
      setHiddenText(nextHidden)
      setExpectedText('')
      generate({
        technique: nextTechnique,
        visibleText: nextVisible,
        hiddenText: nextHidden,
      })
    },
    [generate, t],
  )

  // ----- Upload handling -----

  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target
      const file = input?.files?.[0] ?? null
      if (!file) return
      const token = ++uploadTokenRef.current
      setUploadError('')
      try {
        const ext = getExtension(file.name)
        if (!RICHTEXT_UPLOAD_EXTENSIONS.includes(ext)) {
          throw new Error(t('upload.errorExtension'))
        }
        if (file.size > RICHTEXT_UPLOAD_MAX_BYTES) {
          throw new Error(t('upload.errorSize', { size: 2 }))
        }
        const text = await file.text()
        if (token !== uploadTokenRef.current) return
        const next: UploadState = {
          name: file.name,
          size: file.size || 0,
          type: file.type || '',
          kind: detectUploadKind(file.name, file.type),
          source: String(text || ''),
        }
        setUpload(next)
        generate({ upload: next })
      } catch (err) {
        if (token !== uploadTokenRef.current) return
        const message =
          err instanceof Error ? err.message : t('upload.errorFailed')
        setUploadError(message)
        toast.error(message)
      } finally {
        if (input && token === uploadTokenRef.current) input.value = ''
      }
    },
    [generate, t],
  )

  const resetUpload = useCallback(() => {
    uploadTokenRef.current++
    setUpload(null)
    setUploadError('')
    generate({ upload: null })
  }, [generate])

  // ----- Copy / download -----

  const copyTargetText = useCallback(
    (target: CopyTarget): string => {
      if (!payload) return ''
      switch (target) {
        case 'html':
          return payload.html
        case 'markdown':
          return payload.markdown
        case 'plain':
          return payload.plain
        case 'expected':
          return expectedText.trim() || payload.plain
      }
    },
    [payload, expectedText],
  )

  const handleCopy = useCallback(
    async (target: CopyTarget) => {
      const text = copyTargetText(target).trim()
      if (!text) return
      const ok = await copyToClipboard(text)
      if (ok) {
        addHistoryItem(text, 'Rich Text Inject')
        setCopiedKey(target)
        setTimeout(() => setCopiedKey(null), 1200)
        toast.success(tc('copied'))
      }
    },
    [copyToClipboard, addHistoryItem, copyTargetText, tc],
  )

  // ----- Derived display data -----

  const techniqueLabel = useCallback(
    (id: string) => {
      const preset = RICHTEXT_PRESETS.find((p) => p.id === id)
      return preset ? t(preset.titleKey) : t('custom')
    },
    [t],
  )

  const channelLabel = useMemo(() => {
    if (!payload) return ''
    if (payload.hiddenChannels.length) {
      return payload.hiddenChannels
        .map((c) => t(`channel.${c}`))
        .join(' / ')
    }
    return payload.mode === 'manual' ? t('channel.notSet') : t('channel.none')
  }, [payload, t])

  const routeRows: RouteRow[] = useMemo(() => {
    if (!payload) return []
    const rows: RouteRow[] = []
    if (payload.upload && upload) {
      rows.push({
        title: t('route.uploadedFile'),
        value: `${upload.name} / ${formatBytes(upload.size)}`,
        description: t('route.uploadedFileDesc', {
          kind: t(`kind.${payload.upload.kind}`),
        }),
      })
    }
    rows.push(
      {
        title: t('route.pageSees'),
        value: shorten(payload.visibleOnly, 96) || t('notSet'),
        description: t('route.pageSeesDesc'),
      },
      {
        title: t('route.plainText'),
        value: shorten(payload.plain, 96) || t('notSet'),
        description: t('route.plainTextDesc'),
      },
      {
        title: t('route.hiddenChannel'),
        value: channelLabel,
        description: t(payload.channelHintKey),
      },
      {
        title: t('route.expected'),
        value: shorten(payload.expected, 96) || t('notSet'),
        description: t('route.expectedDesc'),
      },
    )
    return rows
  }, [payload, upload, channelLabel, t])

  const noteList = useMemo(() => {
    if (!payload) return []
    if (payload.mode === 'manual') {
      return payload.noteKeys.map((key) => t(key))
    }
    const channels = payload.hiddenChannels
      .map((c) => t(`channel.${c}`))
      .join(' / ')
    return [
      t('notes.upload.file', { name: payload.upload?.name ?? '' }),
      t('notes.upload.kind', {
        kind: t(`kind.${payload.upload?.kind ?? 'text'}`),
      }),
      channels
        ? t('notes.upload.channelsFound', { channels })
        : t('notes.upload.channelsNone'),
      t('notes.upload.clearHint'),
    ]
  }, [payload, t])

  const activePreset = RICHTEXT_PRESETS.find((p) => p.id === technique)

  const handleDownload = useCallback(
    (target: DownloadTarget) => {
      if (!payload) return
      const base = buildDownloadBaseName(technique)
      if (target === 'html') {
        downloadBlob(
          new Blob([payload.html], { type: 'text/html;charset=utf-8' }),
          `${base}.html`,
        )
        return
      }
      if (target === 'markdown') {
        downloadBlob(
          new Blob([payload.markdown], {
            type: 'text/markdown;charset=utf-8',
          }),
          `${base}.md`,
        )
        return
      }
      const bundle = {
        technique,
        source: payload.upload
          ? {
              name: payload.upload.name,
              kind: payload.upload.kind,
            }
          : {
              visibleText,
              hiddenText,
            },
        expectedText: expectedText || payload.plain,
        html: payload.html,
        markdown: payload.markdown,
        plain: payload.plain,
        summary: payload.summary,
        routeRows,
        generatedAt: lastGeneratedAt,
      }
      downloadBlob(
        new Blob([JSON.stringify(bundle, null, 2)], {
          type: 'application/json;charset=utf-8',
        }),
        `${base}.json`,
      )
    },
    [
      payload,
      technique,
      visibleText,
      hiddenText,
      expectedText,
      lastGeneratedAt,
      routeRows,
    ],
  )

  // ----- Render helpers -----

  const textareaClass = cn(
    'w-full p-2.5 rounded-md border resize-y text-sm font-mono',
    'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)]',
    'placeholder:text-[var(--muted-foreground)]',
    'focus:outline-none focus:ring-1 focus:ring-[var(--ring)]',
  )

  const actionButtonClass = cn(
    'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md',
    'border transition-colors',
    'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)]',
    'hover:bg-[var(--accent)] disabled:opacity-40 disabled:pointer-events-none',
  )

  const renderCopyButton = (target: CopyTarget, label: string) => (
    <button
      type="button"
      className={cn(
        actionButtonClass,
        copiedKey === target &&
          'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
      )}
      onClick={() => handleCopy(target)}
    >
      {copiedKey === target ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {t('title')}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {t('description')}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => generate({ showToast: true })}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md',
            'bg-[var(--primary)] text-[var(--primary-foreground)]',
            'hover:opacity-90 transition-opacity',
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t('generate')}
        </button>
        <button
          type="button" className={actionButtonClass}
          onClick={() => setShowCompare(true)}
        >
          <GitCompare className="h-3.5 w-3.5" />
          {t('compare')}
        </button>
        {renderCopyButton('html', t('copyHtml'))}
        <button
          type="button" className={actionButtonClass}
          onClick={() => handleDownload('html')}
        >
          <Download className="h-3.5 w-3.5" />
          {t('downloadSample')}
        </button>
      </div>

      {/* Status line */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]"
        role="status"
      >
        <span>{techniqueLabel(technique)}</span>
        <span>{hasUpload ? t('mode.upload') : t('mode.manual')}</span>
        <span>
          {t('lastGenerated')}: {lastGeneratedAt || t('notYetGenerated')}
        </span>
      </div>

      {/* Main grid: left rail + stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left rail */}
        <div className="flex flex-col gap-4">
          {/* Upload panel */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 flex flex-col gap-2.5">
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-[var(--primary)]" />
                {t('upload.title')}
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {t('upload.hint')}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={RICHTEXT_UPLOAD_ACCEPT}
              className="hidden"
              onChange={handleUpload}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={actionButtonClass}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                {t('upload.pick')}
              </button>
              <button
                type="button"
                className={actionButtonClass}
                disabled={!hasUpload}
                onClick={resetUpload}
              >
                <Eraser className="h-3.5 w-3.5" />
                {t('upload.clear')}
              </button>
            </div>
            {hasUpload && upload && (
              <div className="flex items-start gap-1.5 rounded-md border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 text-xs text-green-700 dark:text-green-400">
                <FileCode className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  {upload.name}，{formatBytes(upload.size)}，
                  {t(`kind.${upload.kind}`)}
                </span>
              </div>
            )}
            {uploadError && (
              <div
                className="flex items-start gap-1.5 rounded-md border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 px-2.5 py-1.5 text-xs text-[var(--destructive)]"
                role="alert"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}
            <p className="text-xs text-[var(--muted-foreground)]">
              {t('upload.note')}
            </p>
          </div>

          {/* Technique panel */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[var(--primary)]" />
              {t('technique.title')}
            </h3>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-[var(--muted-foreground)]">
                {t('technique.label')}
              </label>
              <select
                value={technique}
                onChange={(e) =>
                  applyPreset(e.target.value as RichTextTechnique)
                }
                className="rounded-md px-2 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              >
                {RICHTEXT_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {t(preset.titleKey)}
                  </option>
                ))}
              </select>
              {activePreset && (
                <small className="text-xs text-[var(--muted-foreground)]">
                  {t(activePreset.descriptionKey)}
                </small>
              )}
            </div>
            <details className="rounded-md border border-[var(--border)] px-2.5 py-1.5">
              <summary className="text-xs font-medium text-[var(--muted-foreground)] cursor-pointer select-none">
                {t('examples.title')}
              </summary>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {RICHTEXT_EXAMPLES.map((example) => (
                  <button
                    key={example.titleKey}
                    type="button"
                    className={cn(
                      'inline-flex items-center px-2 py-1 text-xs rounded-full',
                      'border border-[var(--border)] bg-[var(--background)]',
                      'text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors',
                    )}
                    onClick={() => applyExample(example)}
                  >
                    {t(example.titleKey)}
                  </button>
                ))}
              </div>
            </details>
          </div>

          {/* Text content panel */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-[var(--primary)]" />
              {t('content.title')}
            </h3>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                {t('content.visible')}
              </span>
              <textarea
                rows={5}
                className={textareaClass}
                placeholder={t('content.visiblePlaceholder')}
                value={visibleText}
                onChange={(e) => setVisibleText(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                {t('content.hidden')}
              </span>
              <textarea
                rows={5}
                className={textareaClass}
                placeholder={t('content.hiddenPlaceholder')}
                value={hiddenText}
                onChange={(e) => setHiddenText(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                {t('content.expected')}
              </span>
              <textarea
                rows={4}
                className={textareaClass}
                placeholder={t('content.expectedPlaceholder')}
                value={expectedText}
                onChange={(e) => setExpectedText(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* Stage column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Preview panel */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-[var(--primary)]" />
              {t('preview.title')}
            </h3>
            <div className="rounded-md border border-[var(--border)] bg-white overflow-hidden min-h-[160px]">
              <iframe
                title={t('preview.iframeTitle')}
                sandbox=""
                referrerPolicy="no-referrer"
                srcDoc={payload ? buildPreviewDocument(payload.html) : ''}
                className="w-full h-[220px] block"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  ['visibleChars', t('summary.visible')],
                  ['hiddenChars', t('summary.hidden')],
                  ['htmlChars', t('summary.html')],
                  ['markdownChars', t('summary.markdown')],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 flex flex-col gap-0.5"
                >
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {label}
                  </span>
                  <strong className="text-sm text-[var(--foreground)]">
                    {payload?.summary[key] ?? 0}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* Output panel */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5 mr-auto">
                <FileCode className="h-3.5 w-3.5 text-[var(--primary)]" />
                {t('output.title')}
              </h3>
              {renderCopyButton('markdown', t('copyMarkdown'))}
              {renderCopyButton('plain', t('copyPlain'))}
              <button
                type="button" className={actionButtonClass}
                onClick={() => handleDownload('markdown')}
              >
                <Download className="h-3.5 w-3.5" />
                {t('downloadMarkdown')}
              </button>
              <button
                type="button" className={actionButtonClass}
                onClick={() => handleDownload('json')}
              >
                <FileJson className="h-3.5 w-3.5" />
                {t('downloadJson')}
              </button>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                HTML
              </span>
              <textarea
                readOnly
                className={cn(textareaClass, 'min-h-[90px]')}
                value={payload?.html ?? ''}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                Markdown
              </span>
              <textarea
                readOnly
                className={cn(textareaClass, 'min-h-[90px]')}
                value={payload?.markdown ?? ''}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                text/plain
              </span>
              <textarea
                readOnly
                className={cn(textareaClass, 'min-h-[90px]')}
                value={payload?.plain ?? ''}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Notes + analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-[var(--primary)]" />
            {t('notes.title')}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t('notes.hint')}
          </p>
          <ul className="flex flex-col gap-1.5 text-xs text-[var(--foreground)] list-disc pl-4">
            {noteList.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          {renderError && (
            <div
              className="flex items-start gap-1.5 rounded-md border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 px-2.5 py-1.5 text-xs text-[var(--destructive)]"
              role="alert"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{renderError}</span>
            </div>
          )}
        </div>
        <div className="lg:col-span-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 text-[var(--primary)]" />
            {t('analysis.title')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {routeRows.map((row) => (
              <div
                key={row.title}
                className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 flex flex-col gap-0.5"
              >
                <strong className="text-xs text-[var(--foreground)]">
                  {row.title}
                </strong>
                <p className="text-xs text-[var(--foreground)] break-words">
                  {row.value}
                </p>
                <small className="text-xs text-[var(--muted-foreground)]">
                  {row.description}
                </small>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison overlay */}
      {showCompare && payload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {t('compareOverlay.title')}
              </h3>
              <button
                type="button"
                className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                onClick={() => setShowCompare(false)}
                title={tc('close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              <div className="p-3 border-b sm:border-b-0 sm:border-r border-[var(--border)] flex flex-col gap-1.5">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  {t('compareOverlay.left')}
                </span>
                <textarea
                  readOnly
                  className={cn(textareaClass, 'min-h-[200px]')}
                  value={payload.visibleOnly}
                />
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">
                  {t('compareOverlay.right')}
                </span>
                <textarea
                  readOnly
                  className={cn(textareaClass, 'min-h-[200px]')}
                  value={expectedText.trim() || payload.plain}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
