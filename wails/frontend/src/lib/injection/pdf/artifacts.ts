/**
 * Source-mode artifact builders, extractor arena and export packages.
 *
 * Ported from icesky PdfInjectTool. The image-PDF and upload-merge builders
 * go through the lazily loaded pdf-lib runtime; sample generation stays
 * hand-written (see writer.ts).
 */

import { asciiBytes, base64ToBytes, bytesToLatin1, downloadBlob, safeFileName } from './bytes'
import {
  activeChannelIds,
  buildBackgroundImageAsset,
  resolveFinalAppearance,
  type TextureImageAsset,
} from './background'
import { findTexture, findTheme } from './config'
import { CHANNEL_CARDS, findChannelCard } from './scenarios'
import { appendIncrementalPayload } from './pdfObjects'
import { buildSampleArtifact, techniqueOrFallback } from './writer'
import {
  ensureJsZip,
  ensurePdfLib,
  ensurePdfJs,
  ensureTesseract,
} from './runtime'
import { PDF_PAGE } from './types'
import type {
  ArenaResult,
  ChannelId,
  ImageUpload,
  LabelResolver,
  LocalizedText,
  PdfArtifact,
  PdfInjectConfig,
  PdfInjectMode,
  PdfUploadItem,
} from './types'

// ---------------------------------------------------------------------------
// Image-PDF artifact (pdf-lib)
// ---------------------------------------------------------------------------

/** Build the image-PDF artifact: uploaded image page + OCR text layer. */
export async function buildImagePdfArtifact(
  config: PdfInjectConfig,
  image: ImageUpload | null,
  resolve: LabelResolver,
  textureAsset: TextureImageAsset | null,
): Promise<PdfArtifact> {
  if (!image?.bytes || !image?.dataUrl) throw new Error('errors.imageRequired')
  const lib = await ensurePdfLib()
  const doc = await lib.PDFDocument.create()
  const page = doc.addPage([PDF_PAGE.width, PDF_PAGE.height])
  const appearance = resolveFinalAppearance(config)
  const backgroundAsset = buildBackgroundImageAsset(config, appearance, textureAsset)
  const channels = new Set<string>(activeChannelIds(config))
  const backgroundImage = await doc.embedPng(backgroundAsset.pngBytes)
  page.drawImage(backgroundImage, {
    x: 0,
    y: 0,
    width: PDF_PAGE.width,
    height: PDF_PAGE.height,
  })
  const embed =
    String(image.ext || '').toLowerCase() === '.png'
      ? await doc.embedPng(image.bytes)
      : await doc.embedJpg(image.bytes)
  const natural = embed.scale(1)
  const fit = Math.min(
    (PDF_PAGE.width - 32) / Math.max(natural.width, 1),
    (PDF_PAGE.height - 32) / Math.max(natural.height, 1),
  )
  const drawWidth = natural.width * fit
  const drawHeight = natural.height * fit
  page.drawImage(embed, {
    x: (PDF_PAGE.width - drawWidth) / 2,
    y: (PDF_PAGE.height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  })
  const ocrText = String(config.imageOcrText || '').trim()
  const metadataSubject = techniqueOrFallback(config, 'metadataSubject', ocrText || 'ocr payload')
  const metadataKeywords = techniqueOrFallback(config, 'metadataKeywords', ocrText || 'ocr payload')
  const attachmentName = safeFileName(
    techniqueOrFallback(config, 'attachmentName', 'ocr-layer.txt'),
    'ocr-layer.txt',
  )
  const attachmentDescription = techniqueOrFallback(config, 'attachmentDescription', ocrText || 'ocr payload')
  const formFieldValue = techniqueOrFallback(config, 'formFieldValue', ocrText || 'ocr payload')
  const hiddenX = channels.has('off_page') ? PDF_PAGE.width + 20 : Number(config.hiddenX) || 32
  const hiddenY = Number(config.hiddenY) || 18
  page.drawText(ocrText || 'OCR payload', {
    x: hiddenX,
    y: hiddenY,
    size: Math.max(1, Number(config.hiddenSize) || 1),
    color: lib.rgb(appearance.hiddenRgb[0], appearance.hiddenRgb[1], appearance.hiddenRgb[2]),
    opacity: channels.has('opacity_zero') ? 0 : 1,
  })
  if (channels.has('metadata')) {
    doc.setSubject(metadataSubject)
    doc.setKeywords([metadataKeywords, 'image-pdf'].filter(Boolean))
  }
  if (channels.has('attachment') && typeof doc.attach === 'function') {
    await doc.attach(asciiBytes(attachmentDescription || ocrText || 'ocr payload'), attachmentName, {
      mimeType: 'text/plain',
      description: attachmentDescription,
    })
  }
  if (channels.has('form_field')) {
    const field = doc.getForm().createTextField('ocr_layer_field')
    field.setText(formFieldValue)
    field.addToPage(page, { x: 0, y: 0, width: 1, height: 1 })
  }
  let bytes: Uint8Array = new Uint8Array(await doc.save({ useObjectStreams: false }))
  if (channels.has('incremental') && ocrText) {
    bytes = appendIncrementalPayload(bytes, ocrText)
  }
  const channelList = Array.from(channels)
    .map((id) => findChannelCard(id))
    .filter(Boolean)
    .map((card) => resolve(card!.titleKey))
    .join(resolve('common.listSeparator'))
  return {
    sourceMode: 'imagepdf',
    mode: 'hidden',
    fileName: `${String(image.name || 'image-pdf').replace(/\.[^.]+$/i, '')}-ocr-layer.pdf`,
    visibleText: resolve('reasons.imageVisible', {
      name: image.name || resolve('common.unnamed'),
      width: image.width || 0,
      height: image.height || 0,
    }),
    machineText: ocrText || resolve('common.emptyParens'),
    reasons: [
      {
        key: 'reasons.backgroundTheme',
        params: {
          theme: resolve(findTheme(config.backgroundTheme).titleKey),
          texture: resolve(findTexture(config.backgroundTexture).titleKey),
        },
      },
      { key: 'reasons.imageOcrLayer' },
      ...(channelList ? [{ key: 'reasons.extraChannels', params: { channels: channelList } }] : []),
    ],
    riskTone: 'warn',
    objectCount: 0,
    pageCount: 1,
    bytes,
  }
}

// ---------------------------------------------------------------------------
// Upload merge (pdf-lib)
// ---------------------------------------------------------------------------

/** Merge an inject page PDF into an uploaded document at the configured placement. */
export async function mergeUploadedWithAppendix(
  config: PdfInjectConfig,
  appendixBytes: Uint8Array,
  upload: PdfUploadItem,
): Promise<Uint8Array> {
  if (!upload?.bytes) throw new Error('errors.uploadRequired')
  const lib = await ensurePdfLib()
  const source = await lib.PDFDocument.load(upload.bytes, { updateMetadata: false })
  const appendix = await lib.PDFDocument.load(appendixBytes, { updateMetadata: false })
  const merged = await lib.PDFDocument.create()
  const sourcePages = await merged.copyPages(source, source.getPageIndices())
  const addAppendixPages = async () => {
    const pages = await merged.copyPages(appendix, appendix.getPageIndices())
    pages.forEach((page) => merged.addPage(page))
  }
  if (config.injectPlacement === 'prepend') await addAppendixPages()
  const targetPage = Math.max(
    1,
    Math.min(sourcePages.length || 1, Number(config.injectPageNumber) || 1),
  )
  const rangePages =
    config.injectPlacement === 'range'
      ? parsePageRangeLocal(config.injectPageRange, sourcePages.length || 1)
      : []
  for (let i = 0; i < sourcePages.length; i += 1) {
    const pageNumber = i + 1
    if (config.injectPlacement === 'before' && pageNumber === targetPage) await addAppendixPages()
    merged.addPage(sourcePages[i])
    if (config.injectPlacement === 'after' && pageNumber === targetPage) await addAppendixPages()
    if (config.injectPlacement === 'range' && rangePages.includes(pageNumber)) {
      await addAppendixPages()
    }
  }
  if (config.injectPlacement === 'append') await addAppendixPages()
  return new Uint8Array(await merged.save({ useObjectStreams: false }))
}

function parsePageRangeLocal(expression: string, pageCount: number): number[] {
  const max = Math.max(1, Number(pageCount) || 1)
  const pages = new Set<number>()
  String(expression || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const range = part.match(/^(\d+)\s*-\s*(\d+)$/)
      if (range) {
        const from = Math.max(1, Math.min(max, Number(range[1]) || 1))
        const to = Math.max(1, Math.min(max, Number(range[2]) || 1))
        for (let i = Math.min(from, to); i <= Math.max(from, to); i += 1) pages.add(i)
        return
      }
      const single = Math.max(1, Math.min(max, Number(part) || 0))
      if (single) pages.add(single)
    })
  return Array.from(pages).sort((a, b) => a - b)
}

// ---------------------------------------------------------------------------
// Upload artifact
// ---------------------------------------------------------------------------

/** Build the upload-mode artifact (original file + inserted inject pages). */
export async function buildUploadArtifact(
  config: PdfInjectConfig,
  resolve: LabelResolver,
  upload: PdfUploadItem | null,
  mode: PdfInjectMode = config.mode,
  textureAsset: TextureImageAsset | null = null,
): Promise<PdfArtifact> {
  if (!upload?.bytes) throw new Error('errors.uploadRequired')
  const baseName = String(upload.name || 'uploaded.pdf').replace(/\.pdf$/i, '')
  const originalSummary = resolve('reasons.uploadOriginal', {
    name: upload.name,
    pages: upload.pageCount || 0,
  })
  const placementTitle = resolve(`injectPlacement.${config.injectPlacement}.title`)
  if (mode === 'normal') {
    return {
      sourceMode: 'upload',
      mode,
      fileName: `${baseName}-original.pdf`,
      visibleText: originalSummary,
      machineText: originalSummary,
      reasons: [{ key: 'reasons.uploadPreserve' }, { key: 'reasons.uploadControl' }],
      riskTone: 'good',
      objectCount: 0,
      pageCount: upload.pageCount || 0,
      bytes: new Uint8Array(upload.bytes),
    }
  }
  const sample = buildSampleArtifact(config, resolve, mode, textureAsset)
  const merged = await mergeUploadedWithAppendix(config, sample.bytes, upload)
  const rangeCount =
    config.injectPlacement === 'range'
      ? Math.max(1, parsePageRangeLocal(config.injectPageRange, upload.pageCount || 1).length)
      : 1
  return {
    sourceMode: 'upload',
    mode,
    fileName: `${baseName}-${mode}-${config.injectPlacement}.pdf`,
    visibleText: `${originalSummary}\n\n${resolve('reasons.appendixVisibleHeading')}\n${sample.visibleText}`,
    machineText: `${originalSummary}\n\n${resolve('reasons.appendixMachineHeading')}\n${sample.machineText}`,
    reasons: [
      {
        key: 'reasons.backgroundTheme',
        params: {
          theme: resolve(findTheme(config.backgroundTheme).titleKey),
          texture: resolve(findTexture(config.backgroundTexture).titleKey),
        },
      },
      { key: 'reasons.uploadPlacement', params: { placement: placementTitle } },
      ...(mode === 'hidden'
        ? [{ key: 'reasons.uploadHiddenNote' }]
        : [{ key: 'reasons.uploadTounicodeNote' }]),
      ...(config.injectPlacement === 'range'
        ? [{ key: 'reasons.uploadRangeCount', params: { count: rangeCount } }]
        : []),
    ],
    riskTone: sample.riskTone,
    objectCount: 0,
    pageCount: (upload.pageCount || 0) + (sample.pageCount || 1) * rangeCount,
    bytes: merged,
  }
}

/** Build the artifact for the current source mode. */
export async function buildArtifact(
  config: PdfInjectConfig,
  resolve: LabelResolver,
  opts?: {
    mode?: PdfInjectMode
    upload?: PdfUploadItem | null
    image?: ImageUpload | null
    textureAsset?: TextureImageAsset | null
  },
): Promise<PdfArtifact> {
  const mode = opts?.mode ?? config.mode
  const textureAsset = opts?.textureAsset ?? null
  if (config.sourceMode === 'imagepdf') {
    return buildImagePdfArtifact(config, opts?.image ?? null, resolve, textureAsset)
  }
  if (config.sourceMode === 'upload') {
    return buildUploadArtifact(config, resolve, opts?.upload ?? null, mode, textureAsset)
  }
  return buildSampleArtifact(config, resolve, mode, textureAsset)
}

// ---------------------------------------------------------------------------
// Extractor arena
// ---------------------------------------------------------------------------

/** Extract per-page text with pdf.js. */
export async function extractPdfJsText(bytes: Uint8Array): Promise<Array<{ pageNumber: number; text: string }>> {
  const lib = await ensurePdfJs()
  const task = lib.getDocument({
    data: new Uint8Array(bytes),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/standard_fonts/',
  })
  const doc = await task.promise
  try {
    const pages: Array<{ pageNumber: number; text: string }> = []
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i)
      const text = ((await page.getTextContent()).items || [])
        .map((item) => String(item.str || '').trim())
        .filter(Boolean)
        .join(' ')
      pages.push({ pageNumber: i, text })
    }
    return pages
  } finally {
    await doc.destroy()
  }
}

/** Run OCR over the current preview image with tesseract.js. */
export async function runOcrOnPreview(previewDataUrl: string): Promise<string> {
  if (!previewDataUrl) return ''
  const tesseract = await ensureTesseract()
  const result = await tesseract.recognize(previewDataUrl, 'chi_sim+eng')
  return result?.data?.text ? String(result.data.text).trim() : ''
}

/** Assemble the extractor-arena result cards (labels resolved via i18n). */
export async function runArena(
  bytes: Uint8Array,
  resolve: LabelResolver,
  opts: {
    visibleText: string
    machineText: string
    previewDataUrl: string
    ocrEnabled: boolean
  },
): Promise<ArenaResult[]> {
  const pdfJsPages = await extractPdfJsText(bytes)
  const pdfJsText = pdfJsPages
    .map((page) => resolve('arena.pageLine', { page: page.pageNumber, text: page.text }))
    .join('\n')
  const ocrText = opts.ocrEnabled ? await runOcrOnPreview(opts.previewDataUrl) : ''
  const latin = bytesToLatin1(bytes)
  const metadataKeys: string[] = []
  ;['/Subject', '/Keywords', '/Producer', '/Contents'].forEach((key) => {
    if (latin.includes(key)) metadataKeys.push(key)
  })
  return [
    { id: 'visible', titleKey: 'arena.visible', body: opts.visibleText || resolve('common.emptyParens'), tone: 'good' },
    { id: 'machine', titleKey: 'arena.machine', body: opts.machineText || resolve('common.emptyParens'), tone: 'warn' },
    { id: 'pdfjs', titleKey: 'arena.pdfjs', body: pdfJsText || resolve('common.emptyParens'), tone: 'notice' },
    {
      id: 'ocr',
      titleKey: 'arena.ocr',
      body: opts.ocrEnabled ? ocrText || resolve('arena.ocrNoResult') : resolve('arena.ocrDisabled'),
      tone: 'notice',
    },
    {
      id: 'metadata',
      titleKey: 'arena.metadata',
      body: metadataKeys.length ? metadataKeys.join('，') : resolve('arena.metadataNone'),
      tone: 'notice',
    },
  ]
}

// ---------------------------------------------------------------------------
// Export packages (JSZip)
// ---------------------------------------------------------------------------

/** Result package contents produced for the export button. */
export async function exportPackage(
  config: PdfInjectConfig,
  state: {
    fileName: string
    pdfBytes: Uint8Array
    visibleText: string
    machineText: string
    detectorFindingsJson: string
    objectTreeJson: string
    toUnicodeMapJson: string
    arenaJson: string
    previewDataUrl: string
    thumbs: Array<{ pageNumber: number; url: string }>
    lastBuiltAt: string
    riskLabel: string
    reasons: LocalizedText[]
    resolve: LabelResolver
    sourceOriginalName?: string
    sourceOriginalBytes?: Uint8Array | null
  },
): Promise<void> {
  const ZipCtor = await ensureJsZip()
  const zip = new ZipCtor()
  zip.file(state.fileName || 'pdfinject-output.pdf', state.pdfBytes)
  if (state.sourceOriginalName && state.sourceOriginalBytes) {
    zip.file(`original/${state.sourceOriginalName}`, state.sourceOriginalBytes)
  }
  zip.file('texts/visible.txt', state.visibleText || '')
  zip.file('texts/machine.txt', state.machineText || '')
  zip.file('analysis/detector.json', state.detectorFindingsJson)
  zip.file('analysis/object-tree.json', state.objectTreeJson)
  zip.file('analysis/tounicode-map.json', state.toUnicodeMapJson)
  if (state.arenaJson) zip.file('analysis/extractor-arena.json', state.arenaJson)
  const addDataUrlFile = (name: string, dataUrl: string) => {
    const match = String(dataUrl || '').match(/^data:.*?;base64,(.+)$/)
    if (match) zip.file(name, base64ToBytes(match[1]))
  }
  addDataUrlFile('preview/current-page.png', state.previewDataUrl)
  state.thumbs.forEach((thumb) => {
    addDataUrlFile(`preview/thumb-page-${thumb.pageNumber}.png`, thumb.url)
  })
  const report = [
    '# PDF注入结果包',
    '',
    `-来源模式：${config.sourceMode}`,
    `-当前模式：${config.mode}`,
    `-文件名：${state.fileName || '未命名'}`,
    `-最近生成：${state.lastBuiltAt || '未知'}`,
    `-风险状态：${state.riskLabel}`,
    '',
    '## 说明',
    ...state.reasons.map((reason) => `- ${state.resolve(reason.key, reason.params)}`),
    '',
    '## 批注',
    '- texts/目录包含页面文字与提取文字',
    '- analysis/目录包含结构检测、对象列表和ToUnicode映射',
    '- preview/目录包含当前页和缩略图截图',
  ].join('\n')
  zip.file('report.md', report)
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(
    `${String(state.fileName || 'pdfinject').replace(/\.pdf$/i, '')}-repro.zip`,
    blob,
  )
}

/** One batch entry (file name + artifact). */
export interface BatchEntry {
  path: string
  artifact: PdfArtifact
}

/**
 * Build every batch artifact (modes × uploads + channel/position variants)
 * without mutating the config; returns entries plus manifest text.
 */
export async function buildBatchArtifacts(
  config: PdfInjectConfig,
  resolve: LabelResolver,
  opts: {
    uploads: PdfUploadItem[]
    image: ImageUpload | null
    textureAsset: TextureImageAsset | null
    variantCount: number
    manifestLine: (path: string, artifact: PdfArtifact, variant?: { index: number; mode: PdfInjectMode; channels: ChannelId[]; visibleX: number; footerY: number; hiddenX: number; hiddenY: number; sourceKind: string }) => string
  },
): Promise<{ entries: BatchEntry[]; manifest: string }> {
  const entries: BatchEntry[] = []
  const manifestLines: string[] = []
  const modeList: PdfInjectMode[] =
    config.sourceMode === 'imagepdf' ? ['hidden'] : ['normal', 'hidden', 'tounicode']
  const uploadTargets: Array<PdfUploadItem | null> =
    config.sourceMode === 'upload'
      ? opts.uploads.length
        ? opts.uploads
        : [null]
      : [null]
  const channelCardIds = CHANNEL_CARDS.map((card) => card.id)
  for (const upload of uploadTargets) {
    for (const mode of modeList) {
      const artifact = await buildArtifact(config, resolve, {
        mode,
        upload,
        image: opts.image,
        textureAsset: opts.textureAsset,
      })
      const prefix = upload ? `${String(upload.name || 'upload').replace(/\.pdf$/i, '')}/` : ''
      const path = `${prefix}${artifact.fileName}`
      entries.push({ path, artifact })
      manifestLines.push(opts.manifestLine(path, artifact))
    }
    const variantCount = Math.max(0, Number(opts.variantCount) || 0)
    for (let v = 1; v <= variantCount; v += 1) {
      const variantConfig: PdfInjectConfig = {
        ...config,
        footerY: config.footerY + 6 * ((v % 3) - 1),
        hiddenY: config.hiddenY + (v % 4) * 4,
        visibleX: config.visibleX + (v % 2 ? 10 : -10),
        hiddenX: config.hiddenX + 12 * ((v % 3) - 1),
        enabledChannels: Array.from(new Set([...config.enabledChannels, channelCardIds[v % channelCardIds.length]])),
      }
      if (config.sourceMode === 'upload' && upload) {
        const placements = ['append', 'prepend', 'after', 'before', 'range'] as const
        variantConfig.injectPlacement = placements[v % placements.length]
        variantConfig.injectPageNumber = Math.max(1, Math.min(upload.pageCount || 1, v))
        variantConfig.injectPageRange = `1-${Math.max(1, Math.min(upload.pageCount || 1, (v % Math.max(1, upload.pageCount || 1)) + 1))}`
      }
      const artifact = await buildArtifact(variantConfig, resolve, {
        upload,
        image: opts.image,
        textureAsset: opts.textureAsset,
      })
      const prefix = upload
        ? `${String(upload.name || 'upload').replace(/\.pdf$/i, '')}/variants/`
        : 'variants/'
      const path = `${prefix}${artifact.fileName.replace(/\.pdf$/i, `-variant-${v}.pdf`)}`
      entries.push({ path, artifact })
      manifestLines.push(
        opts.manifestLine(path, artifact, {
          index: v,
          mode: variantConfig.mode,
          channels: variantConfig.enabledChannels,
          visibleX: variantConfig.visibleX,
          footerY: variantConfig.footerY,
          hiddenX: variantConfig.hiddenX,
          hiddenY: variantConfig.hiddenY,
          sourceKind: config.sourceMode === 'upload' ? 'upload' : 'current',
        }),
      )
    }
  }
  return { entries, manifest: manifestLines.join('\n') }
}

/** Zip and download batch artifacts. */
export async function exportBatch(
  config: PdfInjectConfig,
  batch: { entries: BatchEntry[]; manifest: string },
): Promise<void> {
  const ZipCtor = await ensureJsZip()
  const zip = new ZipCtor()
  batch.entries.forEach((entry) => zip.file(entry.path, entry.artifact.bytes))
  zip.file('manifest.txt', batch.manifest)
  const blob = await zip.generateAsync({ type: 'blob' })
  const baseName =
    config.sourceMode === 'upload'
      ? 'pdfinject-upload-batch'
      : config.sourceMode === 'imagepdf'
        ? 'pdfinject-image-batch'
        : 'pdfinject-samples'
  downloadBlob(`${baseName}-batch.zip`, blob)
}
