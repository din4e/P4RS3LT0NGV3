/**
 * Rich text injection sample builder.
 *
 * Generates HTML / Markdown / plain-text samples that carry a hidden payload
 * alongside visible text (hidden nodes, HTML comments, data-* attributes,
 * <details> folds, zero-size layers) and analyzes uploaded HTML / Markdown /
 * plain-text files for the same channels. Used to test how multimodal LLM
 * input pipelines and rich-text extractors treat invisible content.
 *
 * Ported from icesky RichTextInjectTool (js/tools/RichTextInjectTool.js).
 * Display strings are exposed as i18n machine keys; the component resolves
 * them via next-intl.
 */

// --- Upload constraints ------------------------------------------------------

/** Maximum accepted upload size (2 MB). */
export const RICHTEXT_UPLOAD_MAX_BYTES = 2_097_152

/** Allowed upload extensions. */
export const RICHTEXT_UPLOAD_EXTENSIONS: readonly string[] = Object.freeze([
  '.html',
  '.htm',
  '.md',
  '.markdown',
  '.txt',
])

/** `accept` value for the file input. */
export const RICHTEXT_UPLOAD_ACCEPT =
  '.html,.htm,.md,.markdown,.txt,text/html,text/markdown,text/plain'

// --- Types -------------------------------------------------------------------

/** Hiding techniques available in manual generation mode. */
export type RichTextTechnique =
  | 'hidden-span'
  | 'html-comment'
  | 'data-attribute'
  | 'details'
  | 'zero-size'

/** Detected kind of an uploaded file. */
export type RichTextUploadKind = 'html' | 'markdown' | 'text'

/** Machine key of a hidden channel (i18n: `channel.<key>`). */
export type HiddenChannelKey =
  | 'html-comment'
  | 'data-attribute'
  | 'hidden-style'
  | 'fold-region'
  | 'hidden-node'
  | 'zero-size'

export interface RichTextPreset {
  id: RichTextTechnique
  /** i18n key for the preset title. */
  titleKey: string
  /** i18n key for the preset description. */
  descriptionKey: string
}

export interface RichTextExample {
  /** i18n key for the example title. */
  titleKey: string
  /** i18n key holding the sample visible text. */
  visibleKey: string
  /** i18n key holding the sample hidden text. */
  hiddenKey: string
  technique: RichTextTechnique
}

export interface RichTextSummary {
  visibleChars: number
  hiddenChars: number
  htmlChars: number
  markdownChars: number
}

export interface RichTextPayload {
  html: string
  markdown: string
  plain: string
  visibleOnly: string
  expected: string
  /** Hidden channels present in the sample (empty = none). */
  hiddenChannels: HiddenChannelKey[]
  /** i18n key (tool namespace) explaining how the channel behaves. */
  channelHintKey: string
  /** i18n keys (tool namespace) for the guidance notes (manual mode only). */
  noteKeys: string[]
  /** 'manual' when built from the form, 'upload' when analyzing a file. */
  mode: 'manual' | 'upload'
  /** Present when mode === 'upload'. */
  upload?: { name: string; kind: RichTextUploadKind }
  summary: RichTextSummary
}

/** Input for manual sample generation. */
export interface RichTextGenerateInput {
  technique: RichTextTechnique
  visibleText: string
  hiddenText: string
  expectedText: string
}

/** Input for upload analysis. */
export interface RichTextUploadInput {
  fileName: string
  kind: RichTextUploadKind
  source: string
  expectedText: string
}

// --- Presets & examples ------------------------------------------------------

export const RICHTEXT_PRESETS: RichTextPreset[] = [
  {
    id: 'hidden-span',
    titleKey: 'presets.hiddenSpan.title',
    descriptionKey: 'presets.hiddenSpan.description',
  },
  {
    id: 'html-comment',
    titleKey: 'presets.htmlComment.title',
    descriptionKey: 'presets.htmlComment.description',
  },
  {
    id: 'data-attribute',
    titleKey: 'presets.dataAttribute.title',
    descriptionKey: 'presets.dataAttribute.description',
  },
  {
    id: 'details',
    titleKey: 'presets.details.title',
    descriptionKey: 'presets.details.description',
  },
  {
    id: 'zero-size',
    titleKey: 'presets.zeroSize.title',
    descriptionKey: 'presets.zeroSize.description',
  },
]

export const RICHTEXT_EXAMPLES: RichTextExample[] = [
  {
    titleKey: 'examples.webPage.title',
    visibleKey: 'examples.webPage.visible',
    hiddenKey: 'examples.webPage.hidden',
    technique: 'hidden-span',
  },
  {
    titleKey: 'examples.sourceNote.title',
    visibleKey: 'examples.sourceNote.visible',
    hiddenKey: 'examples.sourceNote.hidden',
    technique: 'html-comment',
  },
  {
    titleKey: 'examples.foldedNote.title',
    visibleKey: 'examples.foldedNote.visible',
    hiddenKey: 'examples.foldedNote.hidden',
    technique: 'details',
  },
]

// --- Text helpers ------------------------------------------------------------

/** Escape a string for safe interpolation into HTML text content. */
export function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Escape a string for use inside a double-quoted HTML attribute. */
export function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/\r?\n/g, '&#10;')
}

/** Normalize line endings and blank-line runs, then trim. */
export function normalizeText(text: string): string {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Collapse whitespace and truncate for one-line display ('' when empty). */
export function shorten(text: string, max = 88): string {
  const collapsed = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!collapsed) return ''
  return collapsed.length > max ? `${collapsed.slice(0, max - 3)}...` : collapsed
}

/** Lowercase extension (with dot) of a file name, or ''. */
export function getExtension(fileName: string): string {
  const match = String(fileName || '')
    .toLowerCase()
    .match(/\.[a-z0-9]+$/)
  return match ? match[0] : ''
}

/** Detect whether an upload is HTML, Markdown or plain text. */
export function detectUploadKind(
  fileName: string,
  mimeType: string,
): RichTextUploadKind {
  const ext = getExtension(fileName)
  const type = String(mimeType || '').toLowerCase()
  if (ext === '.html' || ext === '.htm' || type.includes('html')) return 'html'
  if (ext === '.md' || ext === '.markdown' || type.includes('markdown')) {
    return 'markdown'
  }
  return 'text'
}

/** Format a byte count for display (B / KB / MB). */
export function formatBytes(bytes: number): string {
  const value = Math.max(0, Number(bytes) || 0)
  if (value < 1024) return `${value} B`
  if (value < 1_048_576) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1_048_576).toFixed(2)} MB`
}

// --- Markdown / HTML conversion ----------------------------------------------

/** Convert inline Markdown (bold / italic / code / links) to HTML. */
function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
}

/**
 * Minimal block-level Markdown → HTML converter covering headings, lists,
 * fenced code blocks and paragraphs.
 */
export function markdownToHtml(text: string): string {
  return String(text || '')
    .replace(/\r/g, '')
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n').filter((line) => line.length > 0)
      if (!lines.length) return ''
      if (/^#{1,6}\s+/.test(lines[0])) {
        const level = Math.min(
          6,
          (lines[0].match(/^#+/) || ['#'])[0].length,
        )
        return `<h${level}>${inlineMarkdown(lines[0].replace(/^#{1,6}\s+/, ''))}</h${level}>`
      }
      if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
        return `<ul>${lines
          .map(
            (line) =>
              `<li>${inlineMarkdown(line.replace(/^\s*[-*]\s+/, ''))}</li>`,
          )
          .join('')}</ul>`
      }
      if (lines.every((line) => /^\s*\d+\.\s+/.test(line))) {
        return `<ol>${lines
          .map(
            (line) =>
              `<li>${inlineMarkdown(line.replace(/^\s*\d+\.\s+/, ''))}</li>`,
          )
          .join('')}</ol>`
      }
      if (lines[0].startsWith('```')) {
        return `<pre><code>${escapeHtml(
          block.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, ''),
        )}</code></pre>`
      }
      return `<p>${lines.map((line) => inlineMarkdown(line)).join('<br>')}</p>`
    })
    .join('\n')
}

/**
 * Extract visible text from an HTML string via DOMParser.
 *
 * When `stripHidden` is set, removes script/style/template/hidden elements,
 * collapsed `<details>` bodies and elements hidden with inline styles first —
 * approximating what a user actually sees on the page.
 */
export function extractVisibleTextFromHtml(
  html: string,
  stripHidden = false,
): string {
  if (
    typeof window === 'undefined' ||
    typeof window.DOMParser === 'undefined'
  ) {
    return normalizeText(String(html || '').replace(/<[^>]+>/g, ' '))
  }
  const doc = new window.DOMParser().parseFromString(
    String(html || ''),
    'text/html',
  )
  if (stripHidden) {
    doc.querySelectorAll('script, style, template').forEach((el) => el.remove())
    doc.querySelectorAll('[hidden]').forEach((el) => el.remove())
    doc.querySelectorAll('*').forEach((el) => {
      const style = String(el.getAttribute('style') || '').toLowerCase()
      if (
        /display\s*:\s*none/.test(style) ||
        /visibility\s*:\s*hidden/.test(style) ||
        /opacity\s*:\s*0(?:[;)]|$)/.test(style) ||
        /font-size\s*:\s*0/.test(style)
      ) {
        el.remove()
      } else if (
        el.tagName &&
        el.tagName.toLowerCase() === 'details' &&
        !el.hasAttribute('open')
      ) {
        const summary = el.querySelector('summary')
        el.innerHTML = summary ? summary.outerHTML : ''
      }
    })
  }
  return normalizeText(doc.body ? doc.body.textContent : '')
}

/**
 * Infer which hidden channels a source document (original source and/or
 * rendered HTML) appears to use.
 */
export function inferHiddenChannels(
  source: string,
  html: string,
): HiddenChannelKey[] {
  const raw = String(source || '')
  const rendered = String(html || '')
  const channels: HiddenChannelKey[] = []
  const has = (re: RegExp) => re.test(raw) || re.test(rendered)
  if (has(/<!--[\s\S]*?-->/)) channels.push('html-comment')
  if (has(/data-[a-z0-9_-]+\s*=/)) channels.push('data-attribute')
  if (
    has(/display\s*:\s*none/i) ||
    has(/font-size\s*:\s*0/i) ||
    has(/opacity\s*:\s*0/i)
  ) {
    channels.push('hidden-style')
  }
  if (has(/<details[\s>]/i)) channels.push('fold-region')
  return Array.from(new Set(channels))
}

// --- Payload builders --------------------------------------------------------

/**
 * Build a payload from the manual form: wraps the visible text and hides the
 * hidden text using the selected technique.
 */
export function buildGeneratedPayload(
  input: RichTextGenerateInput,
): RichTextPayload {
  // When visible text is empty the caller is expected to substitute its own
  // localized default before calling (see component).
  const visible = String(input.visibleText || '').trim()
  const hidden = String(input.hiddenText || '').trim()
  const technique = String(
    input.technique || 'hidden-span',
  ) as RichTextTechnique
  const expected = String(input.expectedText || '').trim()

  let html = `<p>${escapeHtml(visible)}</p>`
  let markdown = visible
  let plain = visible
  let visibleOnly = visible
  let channels: HiddenChannelKey[] = []
  let channelHintKey = 'hint.onlyVisible'
  let noteKeys: string[] = []
  const spaceJoined = [visible, hidden].filter(Boolean).join(' ')

  switch (technique) {
    case 'html-comment':
      html = `<p>${escapeHtml(visible)}</p>\n<!-- ${escapeHtml(hidden)} -->`
      markdown = `${visible}\n\n<!-- ${hidden} -->`
      channels = hidden ? ['html-comment'] : []
      channelHintKey = 'hint.html-comment'
      noteKeys = [
        'notes.html-comment.1',
        'notes.html-comment.2',
        'notes.html-comment.3',
      ]
      break
    case 'data-attribute':
      html = `<p class="richtextinject-attr-preview" data-note="${escapeAttr(hidden)}">${escapeHtml(visible)}</p>`
      markdown = `${visible}\n\n<p data-note="${escapeAttr(hidden)}">${escapeHtml(visible)}</p>`
      channels = hidden ? ['data-attribute'] : []
      channelHintKey = 'hint.data-attribute'
      noteKeys = [
        'notes.data-attribute.1',
        'notes.data-attribute.2',
        'notes.data-attribute.3',
      ]
      break
    case 'details':
      html = `<details><summary>${escapeHtml(visible)}</summary><div class="richtextinject-fold-body">${escapeHtml(hidden || '')}</div></details>`
      markdown = `<details>\n<summary>${visible}</summary>\n\n${hidden}\n\n</details>`
      plain = [visible, hidden].filter(Boolean).join('\n')
      visibleOnly = visible
      channels = hidden ? ['fold-region'] : []
      channelHintKey = 'hint.details'
      noteKeys = ['notes.details.1', 'notes.details.2', 'notes.details.3']
      break
    case 'zero-size':
      html = `<p>${escapeHtml(visible)}<span style="font-size:0;line-height:0;opacity:0">${escapeHtml(hidden)}</span></p>`
      markdown = `${visible}\n\n<span style="font-size:0;line-height:0;opacity:0">${escapeHtml(hidden)}</span>`
      plain = spaceJoined
      channels = hidden ? ['zero-size'] : []
      channelHintKey = 'hint.zero-size'
      noteKeys = ['notes.zero-size.1', 'notes.zero-size.2', 'notes.zero-size.3']
      break
    case 'hidden-span':
    default:
      html = `<p>${escapeHtml(visible)}<span style="display:none">${escapeHtml(hidden)}</span></p>`
      markdown = `${visible}\n\n<span style="display:none">${escapeHtml(hidden)}</span>`
      plain = spaceJoined
      channels = hidden ? ['hidden-node'] : []
      channelHintKey = 'hint.hidden-span'
      noteKeys = [
        'notes.hidden-span.1',
        'notes.hidden-span.2',
        'notes.hidden-span.3',
      ]
      break
  }

  return {
    html,
    markdown,
    plain,
    visibleOnly,
    expected: expected || plain || visible,
    hiddenChannels: channels,
    channelHintKey,
    noteKeys,
    mode: 'manual',
    summary: {
      visibleChars: Array.from(visibleOnly).length,
      hiddenChars: Array.from(hidden).length,
      htmlChars: Array.from(html).length,
      markdownChars: Array.from(markdown).length,
    },
  }
}

/**
 * Build a payload by analyzing an uploaded HTML / Markdown / plain-text
 * file: converts to HTML, extracts visible and plain text, and infers which
 * hidden channels the file uses.
 */
export function buildUploadPayload(
  input: RichTextUploadInput,
): RichTextPayload {
  const kind = input.kind || 'text'
  const source = String(input.source || '')
  const html =
    kind === 'html'
      ? source
      : kind === 'markdown'
        ? markdownToHtml(source)
        : `<pre>${escapeHtml(source)}</pre>`
  const markdown = kind === 'markdown' ? source : ''
  const visibleOnly = extractVisibleTextFromHtml(html, true)
  const plain =
    kind === 'text'
      ? normalizeText(source)
      : extractVisibleTextFromHtml(html, false) || visibleOnly
  const hiddenChannels = inferHiddenChannels(source, html)

  return {
    html,
    markdown,
    plain,
    visibleOnly,
    expected:
      String(input.expectedText || '').trim() || plain || visibleOnly,
    hiddenChannels,
    channelHintKey: 'hint.upload',
    noteKeys: [],
    mode: 'upload',
    upload: { name: input.fileName, kind },
    summary: {
      visibleChars: Array.from(visibleOnly).length,
      hiddenChars: 0,
      htmlChars: Array.from(html).length,
      markdownChars: Array.from(markdown).length,
    },
  }
}

// --- Preview & download ------------------------------------------------------

/**
 * Wrap generated HTML in a sandboxed preview document with a restrictive CSP
 * (no script execution, inline styles only, data: images only).
 */
export function buildPreviewDocument(html: string): string {
  return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'"><style>body{font-family:sans-serif;overflow-wrap:anywhere}</style>${html || ''}`
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 1200)
}

/** Build the base file name (without extension) for sample downloads. */
export function buildDownloadBaseName(technique: string): string {
  return `richtext-inject-${technique}-${Date.now()}`
}
