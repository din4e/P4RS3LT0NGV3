/**
 * PDF sample generation for the PDF injection tool.
 *
 * Ported from icesky PdfInjectTool. Builds complete PDFs by hand: a page with
 * a rendered background image, visible text drawn with the STSong composite
 * font, plus payload text smuggled through whichever channels are enabled.
 * Human-readable notes are returned as LocalizedText entries resolved by the
 * UI layer.
 */

import {
  asciiBytes,
  distributeMachineText,
  estimateMaxChars,
  formatNumber,
  glyphName,
  pdfRgbOperator,
  safeFileName,
  utf16BeHex,
  utf16PdfHexString,
  wrapLines,
} from './bytes'
import {
  activeChannelIds,
  appearanceBgHex,
  appearanceInkHex,
  buildBackgroundImageAsset,
  buildToUnicodeCMap,
  createFooterGlyphAssets,
  resolveFinalAppearance,
  type TextureImageAsset,
} from './background'
import { findTexture, findTheme } from './config'
import { findChannelCard } from './scenarios'
import {
  PDF_CIDFONT_OBJECT,
  appendIncrementalPayload,
  assemblePdf,
  makePlainObject,
  makeStreamObject,
  type PdfObject,
} from './pdfObjects'
import { PDF_PAGE } from './types'
import type {
  ChannelId,
  LabelResolver,
  LocalizedText,
  PdfArtifact,
  PdfInjectConfig,
  PdfInjectMode,
} from './types'

// ---------------------------------------------------------------------------
// Text derivation helpers
// ---------------------------------------------------------------------------

/** Wrap body text into page lines at the current body size. */
export function plainLines(config: PdfInjectConfig, text: string, fontSize: number): string[] {
  return wrapLines(text, estimateMaxChars(PDF_PAGE.width, config.padding, fontSize)).filter(
    (line) => String(line || '').length || line === '',
  )
}

/** The payload text for the current mode (OCR layer / mismatch footer / hidden prompt). */
export function currentPayloadText(config: PdfInjectConfig, mode: PdfInjectMode = config.mode): string {
  if (config.sourceMode === 'imagepdf') return String(config.imageOcrText || '').trim()
  if (mode === 'tounicode') return String(config.mismatchMachineFooter || '').trim()
  return String(config.hiddenPrompt || '').trim()
}

/** Payload text with fallbacks (visible footer, then title). */
export function resolvedPayloadText(config: PdfInjectConfig, mode: PdfInjectMode = config.mode): string {
  const direct = currentPayloadText(config, mode)
  if (direct) return direct
  const footer = String(config.visibleFooter || '').trim()
  return footer || String(config.title || '').trim()
}

/** Read a technique extension field with a fallback value. */
export function techniqueOrFallback(config: PdfInjectConfig, key: string, fallback: string): string {
  const values = config.techniqueValues as Record<string, string>
  return String((key && values[key]) || '').trim() || String(fallback || '').trim()
}

/** Expected "what the page shows" text. */
export function buildVisibleText(config: PdfInjectConfig, lines?: string[]): string {
  const bodyLines =
    Array.isArray(lines) ? lines : plainLines(config, config.bodyText, config.bodySize)
  return [config.title, ...bodyLines, config.visibleFooter]
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .join('\n')
}

/** Expected "what an extractor reads" text. */
export function buildMachineText(config: PdfInjectConfig, mode: PdfInjectMode = config.mode, lines?: string[]): string {
  const bodyLines =
    Array.isArray(lines) ? lines : plainLines(config, config.bodyText, config.bodySize)
  const parts = [config.title, ...bodyLines]
    .map((line) => String(line || '').trim())
    .filter(Boolean)
  const channels = new Set(activeChannelIds(config))
  const payloadLines = plainLines(config, currentPayloadText(config, mode), 24).filter(Boolean)
  if (config.sourceMode === 'imagepdf') {
    parts.push(...plainLines(config, config.imageOcrText, 28))
  } else if (mode !== 'normal' || channels.size) {
    if (mode === 'tounicode') {
      parts.push(String(config.mismatchMachineFooter || '').trim())
    } else {
      parts.push(String(config.visibleFooter || '').trim())
      parts.push(...payloadLines)
    }
  } else {
    parts.push(String(config.visibleFooter || '').trim())
  }
  return parts.filter(Boolean).join('\n')
}

/** ToUnicode mismatch visualization pairs (visible char → machine text). */
export function toUnicodePairs(config: PdfInjectConfig): Array<{ index: number; visible: string; machine: string }> {
  const visible = Array.from(String(config.visibleFooter || ''))
  const machine = distributeMachineText(config.mismatchMachineFooter, visible.length)
  return visible.map((ch, i) => ({ index: i + 1, visible: ch, machine: machine[i] || '' }))
}

/** Resolve channel titles via i18n for notes. */
function channelTitlesText(channels: string[], resolve: LabelResolver): string {
  return channels
    .map((id) => findChannelCard(id))
    .filter(Boolean)
    .map((card) => resolve(card!.titleKey))
    .join(resolve('common.listSeparator'))
}

// ---------------------------------------------------------------------------
// Hidden content stream segments
// ---------------------------------------------------------------------------

/**
 * Build content-stream operators that smuggle the payload lines through the
 * enabled text-layer channels (white text, opacity 0, render mode 3, covered,
 * off-page, crop-hidden and OCG-wrapped text).
 */
function buildHiddenContentSegments(
  config: PdfInjectConfig,
  payloadLines: string[],
  channels: Set<string>,
  appearance: ReturnType<typeof resolveFinalAppearance>,
): string[] {
  const segments: string[] = []
  const hiddenSize = Number(config.hiddenSize) || 1
  const lineStep = Math.max(1.2, 1.5 * hiddenSize)
  const hiddenX = Number(config.hiddenX) || 72
  const hiddenY = Number(config.hiddenY) || 18
  const hiddenColor = pdfRgbOperator(appearance.hiddenRgb, 'rg')
  const inkColor = pdfRgbOperator(appearance.inkRgb, 'rg')
  const bgColor = pdfRgbOperator(appearance.bgRgb, 'rg')
  const textOps = payloadLines.map((line) => `<${utf16BeHex(line)}> Tj`)
  const pushTextBlock = (
    prefix: string[],
    perLine: (op: string, index: number) => string[],
    suffix: string[],
  ) => {
    segments.push(...prefix)
    textOps.forEach((op, index) => {
      segments.push(...perLine(op, index))
    })
    segments.push(...suffix)
  }

  if (channels.has('white_text')) {
    pushTextBlock(
      ['BT', hiddenColor, `/F1 ${formatNumber(hiddenSize)} Tf`],
      (op, index) => [
        `1 0 0 1 ${formatNumber(hiddenX)} ${formatNumber(hiddenY + index * lineStep)} Tm`,
        op,
      ],
      [inkColor, 'ET'],
    )
  }
  if (channels.has('opacity_zero')) {
    pushTextBlock(
      ['q', '/GS0 gs', 'BT', hiddenColor, `/F1 ${formatNumber(Math.max(5, 6 * hiddenSize))} Tf`],
      (op, index) => [
        `1 0 0 1 ${formatNumber(hiddenX)} ${formatNumber(Math.max(24, hiddenY + index * Math.max(8, 8 * lineStep)))} Tm`,
        op,
      ],
      ['ET', 'Q'],
    )
  }
  if (channels.has('render_mode_3')) {
    pushTextBlock(
      ['BT', inkColor, '3 Tr', `/F1 ${formatNumber(Math.max(7, 8 * hiddenSize))} Tf`],
      (op, index) => [
        `1 0 0 1 ${formatNumber(hiddenX)} ${formatNumber(hiddenY + index * Math.max(12, 8 * lineStep))} Tm`,
        op,
      ],
      ['0 Tr', 'ET'],
    )
  }
  if (channels.has('covered_text')) {
    const coverWidth = Math.min(
      PDF_PAGE.width - hiddenX - 12,
      Math.max(180, PDF_PAGE.width - hiddenX - 24),
    )
    const coverHeight = Math.max(18, textOps.length * Math.max(12, 8 * lineStep))
    pushTextBlock(
      ['BT', inkColor, `/F1 ${formatNumber(Math.max(7, 8 * hiddenSize))} Tf`],
      (op, index) => [
        `1 0 0 1 ${formatNumber(hiddenX)} ${formatNumber(hiddenY + index * Math.max(12, 8 * lineStep))} Tm`,
        op,
      ],
      ['ET'],
    )
    segments.push(
      'q',
      bgColor,
      `${formatNumber(hiddenX - 4)} ${formatNumber(Math.max(0, hiddenY - 4))} ${formatNumber(Math.max(80, coverWidth))} ${formatNumber(coverHeight)} re`,
      'f',
      'Q',
    )
  }
  if (channels.has('off_page')) {
    pushTextBlock(
      ['BT', hiddenColor, `/F1 ${formatNumber(Math.max(8, 8 * hiddenSize))} Tf`],
      (op, index) => [
        `1 0 0 1 ${formatNumber(PDF_PAGE.width + 24)} ${formatNumber(hiddenY + 14 * index)} Tm`,
        op,
      ],
      ['ET'],
    )
  }
  if (channels.has('crop_hidden')) {
    pushTextBlock(
      ['BT', hiddenColor, `/F1 ${formatNumber(Math.max(8, 8 * hiddenSize))} Tf`],
      (op, index) => [
        `1 0 0 1 ${formatNumber(hiddenX)} ${formatNumber(hiddenY + 14 * index)} Tm`,
        op,
      ],
      ['ET'],
    )
  }
  if (channels.has('ocg_layer')) {
    pushTextBlock(
      ['/OC /OC1 BDC', 'BT', hiddenColor, `/F1 ${formatNumber(Math.max(8, 8 * hiddenSize))} Tf`],
      (op, index) => [
        `1 0 0 1 ${formatNumber(hiddenX)} ${formatNumber(hiddenY + 14 * index)} Tm`,
        op,
      ],
      ['ET', 'EMC'],
    )
  }
  return segments
}

// ---------------------------------------------------------------------------
// Normal / hidden builder
// ---------------------------------------------------------------------------

interface BuildResult {
  bytes: Uint8Array
  objectCount: number
  pageCount: number
}

/** Build the one-page PDF for normal and hidden modes (all channels). */
function buildNormalOrHiddenPdfBytes(
  config: PdfInjectConfig,
  mode: PdfInjectMode,
  bodyLines: string[],
  textureAsset: TextureImageAsset | null,
): BuildResult {
  const channels = new Set<string>(activeChannelIds(config))
  const appearance = resolveFinalAppearance(config)
  const backgroundAsset = buildBackgroundImageAsset(config, appearance, textureAsset)
  const inkColor = pdfRgbOperator(appearance.inkRgb, 'rg')
  const payloadLines = plainLines(config, currentPayloadText(config, mode), 24).filter(Boolean)
  const resolvedPayload = resolvedPayloadText(config, mode)
  const joinedPayload = payloadLines.join('\n') || resolvedPayload || 'payload'
  const actualTextValue = techniqueOrFallback(config, 'actualText', resolvedPayload || config.visibleFooter || '')
  const structureAltValue = techniqueOrFallback(config, 'structureAltText', resolvedPayload || config.visibleFooter || '')
  const bookmarkTitle = techniqueOrFallback(
    config,
    'bookmarkTitle',
    resolvedPayload || config.title || config.visibleFooter || 'Payload Bookmark',
  ).slice(0, 48)
  const pageLabelPrefix = techniqueOrFallback(config, 'pageLabelPrefix', 'SEC-').slice(0, 16) || 'SEC-'
  const openActionScript = techniqueOrFallback(config, 'openActionScript', joinedPayload)
  const formFieldValue = techniqueOrFallback(config, 'formFieldValue', joinedPayload)
  const formMismatchValue = techniqueOrFallback(config, 'formMismatchValue', joinedPayload)
  const metadataSubject = techniqueOrFallback(config, 'metadataSubject', joinedPayload)
  const metadataKeywords = techniqueOrFallback(
    config,
    'metadataKeywords',
    joinedPayload.split('\n').join(' | '),
  )
  const attachmentName = safeFileName(techniqueOrFallback(config, 'attachmentName', 'payload.txt'))
  const attachmentDescription = techniqueOrFallback(config, 'attachmentDescription', joinedPayload)

  let nextId = 6
  const backgroundId = nextId++
  const extGStateId = channels.has('opacity_zero') ? nextId++ : 0
  const annotationId = channels.has('annotation') ? nextId++ : 0
  const formFieldId = channels.has('form_field') ? nextId++ : 0
  const formMismatchId = channels.has('form_mismatch') ? nextId++ : 0
  const acroFormId = channels.has('form_field') || channels.has('form_mismatch') ? nextId++ : 0
  const embeddedFileId = channels.has('attachment') ? nextId++ : 0
  const filespecId = channels.has('attachment') ? nextId++ : 0
  const embeddedNamesId = channels.has('attachment') ? nextId++ : 0
  const ocgId = channels.has('ocg_layer') ? nextId++ : 0
  const outlinesId = channels.has('outline_bookmark') ? nextId++ : 0
  const outlineItemId = channels.has('outline_bookmark') ? nextId++ : 0
  const pageLabelsId = channels.has('page_labels') ? nextId++ : 0
  const openActionId = channels.has('open_action_js') ? nextId++ : 0
  const structTreeRootId = channels.has('structure_alt') ? nextId++ : 0
  const structElemId = channels.has('structure_alt') ? nextId++ : 0
  const parentTreeId = channels.has('structure_alt') ? nextId++ : 0
  const metadataId = channels.has('metadata') ? nextId++ : 0
  const contentId = nextId++

  const catalogDict = ['<< /Type /Catalog /Pages 2 0 R']
  if (acroFormId) catalogDict.push(`/AcroForm ${acroFormId} 0 R`)
  if (embeddedNamesId) catalogDict.push(`/Names << /EmbeddedFiles ${embeddedNamesId} 0 R >>`)
  if (ocgId) {
    catalogDict.push(
      `/OCProperties << /OCGs [${ocgId} 0 R] /D << /Order [${ocgId} 0 R] /OFF [${ocgId} 0 R] >> >>`,
    )
  }
  if (outlinesId) catalogDict.push(`/Outlines ${outlinesId} 0 R /PageMode /UseOutlines`)
  if (pageLabelsId) catalogDict.push(`/PageLabels ${pageLabelsId} 0 R`)
  if (openActionId) catalogDict.push(`/OpenAction ${openActionId} 0 R`)
  if (structTreeRootId) {
    catalogDict.push(`/StructTreeRoot ${structTreeRootId} 0 R /MarkInfo << /Marked true >>`)
  }
  catalogDict.push('>>')

  const pageDict = ['<< /Type /Page /Parent 2 0 R']
  const resources = [
    '/ProcSet [/PDF /Text /ImageC]',
    '/Font << /F1 4 0 R >>',
    `/XObject << /ImBg ${backgroundId} 0 R >>`,
  ]
  if (extGStateId) resources.push(`/ExtGState << /GS0 ${extGStateId} 0 R >>`)
  if (ocgId) resources.push(`/Properties << /OC1 ${ocgId} 0 R >>`)
  pageDict.push(`/Resources << ${resources.join(' ')} >>`)
  pageDict.push(`/MediaBox [0 0 ${PDF_PAGE.width} ${PDF_PAGE.height}]`)
  if (channels.has('crop_hidden')) {
    pageDict.push(`/CropBox [0 42 ${PDF_PAGE.width} ${PDF_PAGE.height}]`)
  }
  if (structTreeRootId) pageDict.push('/StructParents 0')
  const annots = [annotationId, formFieldId, formMismatchId].filter(Boolean)
  if (annots.length) {
    pageDict.push(`/Annots [${annots.map((id) => `${id} 0 R`).join(' ')}]`)
  }
  pageDict.push(`/Contents ${contentId} 0 R >>`)

  const objects: PdfObject[] = [
    makePlainObject(1, catalogDict.join('\n')),
    makePlainObject(2, '<< /Type /Pages /Count 1 /Kids [3 0 R] >>'),
    makePlainObject(3, pageDict.join('\n')),
    makePlainObject(
      4,
      '<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [5 0 R] >>',
    ),
    makePlainObject(5, PDF_CIDFONT_OBJECT),
    makeStreamObject(
      backgroundId,
      `<< /Type /XObject /Subtype /Image /Width ${backgroundAsset.width} /Height ${backgroundAsset.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${backgroundAsset.rgbBytes.length} >>`,
      backgroundAsset.rgbBytes,
    ),
  ]

  const padding = Number(config.padding) || 72
  const topY = PDF_PAGE.height - padding
  const footerX = Number(config.visibleX) || padding
  let cursorY = topY - 48
  const bodyLineStep = Math.max(16, 1.7 * (Number(config.bodySize) || 12))
  const contentOps = [
    'q',
    `${formatNumber(PDF_PAGE.width)} 0 0 ${formatNumber(PDF_PAGE.height)} 0 0 cm`,
    '/ImBg Do',
    'Q',
    'BT',
    inkColor,
    `/F1 ${formatNumber(config.titleSize)} Tf`,
    `1 0 0 1 ${formatNumber(padding)} ${formatNumber(topY)} Tm`,
    `<${utf16BeHex(config.title)}> Tj`,
    `/F1 ${formatNumber(config.bodySize)} Tf`,
  ]
  bodyLines.forEach((line) => {
    contentOps.push(`1 0 0 1 ${formatNumber(padding)} ${formatNumber(cursorY)} Tm`)
    contentOps.push(`<${utf16BeHex(line)}> Tj`)
    cursorY -= bodyLineStep
  })
  contentOps.push('ET')

  const footerText = String(config.visibleFooter || '')
  if (channels.has('structure_alt')) {
    const spanDict = ['/MCID 0']
    if (channels.has('actual_text') && actualTextValue) {
      spanDict.push(`/ActualText ${utf16PdfHexString(actualTextValue)}`)
    }
    contentOps.push(`/Span << ${spanDict.join(' ')} >> BDC`)
  } else if (channels.has('actual_text') && actualTextValue) {
    contentOps.push(`/Span << /ActualText ${utf16PdfHexString(actualTextValue)} >> BDC`)
  }
  contentOps.push('BT', inkColor)
  if (channels.has('render_mode_3')) contentOps.push('3 Tr')
  contentOps.push(
    `/F1 ${formatNumber(config.footerSize)} Tf`,
    `1 0 0 1 ${formatNumber(footerX)} ${formatNumber(config.footerY)} Tm`,
    `<${utf16BeHex(footerText)}> Tj`,
  )
  if (channels.has('render_mode_3')) contentOps.push('0 Tr')
  contentOps.push('ET')
  if (channels.has('structure_alt') || channels.has('actual_text')) contentOps.push('EMC')
  if (payloadLines.length && channels.size) {
    contentOps.push(...buildHiddenContentSegments(config, payloadLines, channels, appearance))
  }
  const contentBytes = asciiBytes(contentOps.join('\n'))
  objects.push(makeStreamObject(contentId, `<< /Length ${contentBytes.length} >>`, contentBytes))

  if (extGStateId) {
    objects.push(makePlainObject(extGStateId, '<< /Type /ExtGState /CA 0 /ca 0 >>'))
  }
  if (annotationId) {
    objects.push(
      makePlainObject(
        annotationId,
        `<< /Type /Annot /Subtype /Text /Rect [18 18 34 34] /Contents ${utf16PdfHexString(joinedPayload)} /Name /Comment /F 28 >>`,
      ),
    )
  }
  if (formFieldId) {
    objects.push(
      makePlainObject(
        formFieldId,
        `<< /Type /Annot /Subtype /Widget /FT /Tx /T ${utf16PdfHexString('payload_field')} /V ${utf16PdfHexString(formFieldValue)} /DV ${utf16PdfHexString(formFieldValue)} /Rect [0 0 0 0] /F 6 /P 3 0 R >>`,
      ),
    )
  }
  if (formMismatchId) {
    objects.push(
      makePlainObject(
        formMismatchId,
        `<< /Type /Annot /Subtype /Widget /FT /Tx /T ${utf16PdfHexString('footer_mismatch_field')} /TU ${utf16PdfHexString(config.visibleFooter || 'visible footer')} /V ${utf16PdfHexString(formMismatchValue)} /DV ${utf16PdfHexString(formMismatchValue)} /Rect [${formatNumber(footerX)} ${formatNumber(config.footerY)} ${formatNumber(footerX + 2)} ${formatNumber((Number(config.footerY) || 32) + 2)}] /F 6 /P 3 0 R >>`,
      ),
    )
  }
  if (acroFormId) {
    const fields = [formFieldId, formMismatchId].filter(Boolean)
    objects.push(
      makePlainObject(acroFormId, `<< /Fields [${fields.map((id) => `${id} 0 R`).join(' ')}] /NeedAppearances false >>`),
    )
  }
  if (embeddedFileId) {
    const attachmentBytes = asciiBytes(attachmentDescription || joinedPayload || 'attachment payload')
    objects.push(
      makeStreamObject(
        embeddedFileId,
        `<< /Type /EmbeddedFile /Subtype /text#2Fplain /Length ${attachmentBytes.length} >>`,
        attachmentBytes,
      ),
    )
    objects.push(
      makePlainObject(
        filespecId,
        `<< /Type /Filespec /F (${attachmentName}) /UF ${utf16PdfHexString(attachmentName)} /Desc ${utf16PdfHexString(attachmentDescription)} /EF << /F ${embeddedFileId} 0 R >> >>`,
      ),
    )
    objects.push(makePlainObject(embeddedNamesId, `<< /Names [(${attachmentName}) ${filespecId} 0 R] >>`))
  }
  if (ocgId) {
    objects.push(
      makePlainObject(ocgId, `<< /Type /OCG /Name ${utf16PdfHexString('Hidden Payload Layer')} >>`),
    )
  }
  if (outlinesId) {
    objects.push(
      makePlainObject(outlinesId, `<< /Type /Outlines /First ${outlineItemId} 0 R /Last ${outlineItemId} 0 R /Count 1 >>`),
    )
    objects.push(
      makePlainObject(
        outlineItemId,
        `<< /Title ${utf16PdfHexString(bookmarkTitle)} /Parent ${outlinesId} 0 R /Dest [3 0 R /Fit] >>`,
      ),
    )
  }
  if (pageLabelsId) {
    objects.push(
      makePlainObject(pageLabelsId, `<< /Nums [0 << /S /D /P ${utf16PdfHexString(pageLabelPrefix)} >>] >>`),
    )
  }
  if (openActionId) {
    objects.push(
      makePlainObject(
        openActionId,
        `<< /Type /Action /S /JavaScript /JS ${utf16PdfHexString(openActionScript)} >>`,
      ),
    )
  }
  if (structTreeRootId) {
    objects.push(makePlainObject(parentTreeId, `<< /Nums [0 [${structElemId} 0 R]] >>`))
    objects.push(
      makePlainObject(
        structElemId,
        `<< /Type /StructElem /S /Figure /Alt ${utf16PdfHexString(structureAltValue)} /P ${structTreeRootId} 0 R /Pg 3 0 R /K 0 >>`,
      ),
    )
    objects.push(
      makePlainObject(
        structTreeRootId,
        `<< /Type /StructTreeRoot /K [${structElemId} 0 R] /ParentTree ${parentTreeId} 0 R >>`,
      ),
    )
  }
  if (metadataId) {
    objects.push(
      makePlainObject(
        metadataId,
        `<< /Producer ${utf16PdfHexString('pdfinject metadata carrier')} /Subject ${utf16PdfHexString(metadataSubject)} /Keywords ${utf16PdfHexString(metadataKeywords)} >>`,
      ),
    )
  }

  let bytes = assemblePdf(objects, { rootId: 1, infoId: metadataId })
  if (channels.has('incremental') && joinedPayload) {
    bytes = appendIncrementalPayload(bytes, joinedPayload)
  }
  return { bytes, objectCount: objects.length + (channels.has('incremental') ? 1 : 0), pageCount: 1 }
}

// ---------------------------------------------------------------------------
// ToUnicode mismatch builder
// ---------------------------------------------------------------------------

/** Build the one-page PDF with a Type3 footer font whose ToUnicode map carries the machine footer. */
function buildToUnicodePdfBytes(
  config: PdfInjectConfig,
  bodyLines: string[],
  textureAsset: TextureImageAsset | null,
): BuildResult {
  const appearance = resolveFinalAppearance(config)
  const backgroundAsset = buildBackgroundImageAsset(config, appearance, textureAsset)
  const inkColor = pdfRgbOperator(appearance.inkRgb, 'rg')
  const glyphs = createFooterGlyphAssets(config.visibleFooter, {
    background: appearanceBgHex(appearance),
    foreground: appearanceInkHex(appearance),
  })
  const chars = glyphs.chars
  const toUnicodeBytes = buildToUnicodeCMap(
    distributeMachineText(config.mismatchMachineFooter, chars.length),
  )
  const footerHexString = chars.map((_, i) => String(i + 1).padStart(2, '0')).join('')
  const channels = new Set<string>(activeChannelIds(config))
  const hiddenLines = plainLines(config, config.hiddenPrompt, 24).filter(Boolean)
  const resolvedPayload = resolvedPayloadText(config, 'tounicode')
  const joinedPayload = hiddenLines.join('\n') || resolvedPayload || config.mismatchMachineFooter || 'payload'
  const actualTextValue = techniqueOrFallback(config, 'actualText', resolvedPayload || config.visibleFooter || '')
  const structureAltValue = techniqueOrFallback(config, 'structureAltText', resolvedPayload || config.visibleFooter || '')
  const bookmarkTitle = techniqueOrFallback(
    config,
    'bookmarkTitle',
    resolvedPayload || config.title || config.visibleFooter || 'Payload Bookmark',
  ).slice(0, 48)
  const pageLabelPrefix = techniqueOrFallback(config, 'pageLabelPrefix', 'SEC-').slice(0, 16) || 'SEC-'
  const openActionScript = techniqueOrFallback(config, 'openActionScript', joinedPayload)
  const formFieldValue = techniqueOrFallback(config, 'formFieldValue', joinedPayload)
  const formMismatchValue = techniqueOrFallback(config, 'formMismatchValue', joinedPayload)
  const metadataSubject = techniqueOrFallback(config, 'metadataSubject', joinedPayload)
  const metadataKeywords = techniqueOrFallback(
    config,
    'metadataKeywords',
    joinedPayload.split('\n').join(' | '),
  )
  const attachmentName = safeFileName(techniqueOrFallback(config, 'attachmentName', 'payload.txt'))
  const attachmentDescription = techniqueOrFallback(config, 'attachmentDescription', joinedPayload)

  const uniqueChars: string[] = []
  chars.forEach((ch) => {
    if (!uniqueChars.includes(ch)) uniqueChars.push(ch)
  })

  const CATALOG = 1
  const PAGES = 2
  const PAGE = 3
  const FONT0 = 4
  const CIDFONT = 5
  const TYPE3 = 6
  const BACKGROUND = 7
  const CONTENT = 8
  const TOUNICODE = 9
  let nextId = 10
  const glyphImageIds: Record<string, number> = {}
  const glyphProcIds: Record<string, number> = {}
  uniqueChars.forEach((ch) => {
    glyphImageIds[ch] = nextId++
  })
  uniqueChars.forEach((ch) => {
    glyphProcIds[ch] = nextId++
  })
  const extGStateId = channels.has('opacity_zero') ? nextId++ : 0
  const annotationId = channels.has('annotation') ? nextId++ : 0
  const formFieldId = channels.has('form_field') ? nextId++ : 0
  const formMismatchId = channels.has('form_mismatch') ? nextId++ : 0
  const acroFormId = channels.has('form_field') || channels.has('form_mismatch') ? nextId++ : 0
  const embeddedFileId = channels.has('attachment') ? nextId++ : 0
  const filespecId = channels.has('attachment') ? nextId++ : 0
  const embeddedNamesId = channels.has('attachment') ? nextId++ : 0
  const ocgId = channels.has('ocg_layer') ? nextId++ : 0
  const outlinesId = channels.has('outline_bookmark') ? nextId++ : 0
  const outlineItemId = channels.has('outline_bookmark') ? nextId++ : 0
  const pageLabelsId = channels.has('page_labels') ? nextId++ : 0
  const openActionId = channels.has('open_action_js') ? nextId++ : 0
  const structTreeRootId = channels.has('structure_alt') ? nextId++ : 0
  const structElemId = channels.has('structure_alt') ? nextId++ : 0
  const parentTreeId = channels.has('structure_alt') ? nextId++ : 0
  const metadataId = channels.has('metadata') ? nextId++ : 0

  const encodingDifferences = chars.map((ch) => `/${glyphName(ch)}`).join(' ')
  const widths = chars.map((ch) => glyphs.assets[ch].widthUnits).join(' ')
  const charProcs = uniqueChars.map((ch) => `/${glyphName(ch)} ${glyphProcIds[ch]} 0 R`).join(' ')
  const glyphImages = uniqueChars.map((ch) => `/Im${glyphName(ch)} ${glyphImageIds[ch]} 0 R`).join(' ')

  const padding = Number(config.padding) || 72
  const footerX = Number(config.visibleX) || padding
  const topY = PDF_PAGE.height - padding
  let cursorY = topY - 48
  const bodyLineStep = Math.max(16, 1.7 * (Number(config.bodySize) || 12))
  const contentOps = [
    'q',
    `${formatNumber(PDF_PAGE.width)} 0 0 ${formatNumber(PDF_PAGE.height)} 0 0 cm`,
    '/ImBg Do',
    'Q',
    'BT',
    inkColor,
    `/F1 ${formatNumber(config.titleSize)} Tf`,
    `1 0 0 1 ${formatNumber(padding)} ${formatNumber(topY)} Tm`,
    `<${utf16BeHex(config.title)}> Tj`,
    `/F1 ${formatNumber(config.bodySize)} Tf`,
  ]
  bodyLines.forEach((line) => {
    contentOps.push(`1 0 0 1 ${formatNumber(padding)} ${formatNumber(cursorY)} Tm`)
    contentOps.push(`<${utf16BeHex(line)}> Tj`)
    cursorY -= bodyLineStep
  })
  contentOps.push('ET')
  if (channels.has('structure_alt')) {
    const spanDict = ['/MCID 0']
    if (channels.has('actual_text') && actualTextValue) {
      spanDict.push(`/ActualText ${utf16PdfHexString(actualTextValue)}`)
    }
    contentOps.push(`/Span << ${spanDict.join(' ')} >> BDC`)
  } else if (channels.has('actual_text') && actualTextValue) {
    contentOps.push(`/Span << /ActualText ${utf16PdfHexString(actualTextValue)} >> BDC`)
  }
  contentOps.push(
    'BT',
    inkColor,
    `/F2 ${formatNumber(config.footerSize)} Tf`,
    `1 0 0 1 ${formatNumber(footerX)} ${formatNumber(config.footerY)} Tm`,
    `<${footerHexString}> Tj`,
    'ET',
  )
  if (channels.has('structure_alt') || channels.has('actual_text')) contentOps.push('EMC')
  if (hiddenLines.length && channels.size) {
    contentOps.push(...buildHiddenContentSegments(config, hiddenLines, channels, appearance))
  }
  const contentBytes = asciiBytes(contentOps.join('\n'))

  const catalogDict = ['<< /Type /Catalog /Pages 2 0 R']
  if (acroFormId) catalogDict.push(`/AcroForm ${acroFormId} 0 R`)
  if (embeddedNamesId) catalogDict.push(`/Names << /EmbeddedFiles ${embeddedNamesId} 0 R >>`)
  if (ocgId) {
    catalogDict.push(
      `/OCProperties << /OCGs [${ocgId} 0 R] /D << /Order [${ocgId} 0 R] /OFF [${ocgId} 0 R] >> >>`,
    )
  }
  if (outlinesId) catalogDict.push(`/Outlines ${outlinesId} 0 R /PageMode /UseOutlines`)
  if (pageLabelsId) catalogDict.push(`/PageLabels ${pageLabelsId} 0 R`)
  if (openActionId) catalogDict.push(`/OpenAction ${openActionId} 0 R`)
  if (structTreeRootId) {
    catalogDict.push(`/StructTreeRoot ${structTreeRootId} 0 R /MarkInfo << /Marked true >>`)
  }
  catalogDict.push('>>')

  const pageDict = ['<< /Type /Page /Parent 2 0 R']
  const resources = [
    '/ProcSet [/PDF /Text /ImageC]',
    '/Font << /F1 4 0 R /F2 6 0 R >>',
    `/XObject << /ImBg ${BACKGROUND} 0 R >>`,
  ]
  if (extGStateId) resources.push(`/ExtGState << /GS0 ${extGStateId} 0 R >>`)
  if (ocgId) resources.push(`/Properties << /OC1 ${ocgId} 0 R >>`)
  pageDict.push(`/Resources << ${resources.join(' ')} >>`)
  pageDict.push(`/MediaBox [0 0 ${PDF_PAGE.width} ${PDF_PAGE.height}]`)
  if (channels.has('crop_hidden')) {
    pageDict.push(`/CropBox [0 42 ${PDF_PAGE.width} ${PDF_PAGE.height}]`)
  }
  if (structTreeRootId) pageDict.push('/StructParents 0')
  const annots = [annotationId, formFieldId, formMismatchId].filter(Boolean)
  if (annots.length) {
    pageDict.push(`/Annots [${annots.map((id) => `${id} 0 R`).join(' ')}]`)
  }
  pageDict.push(`/Contents ${CONTENT} 0 R >>`)

  const objects: PdfObject[] = [
    makePlainObject(CATALOG, catalogDict.join('\n')),
    makePlainObject(PAGES, '<< /Type /Pages /Count 1 /Kids [3 0 R] >>'),
    makePlainObject(PAGE, pageDict.join('\n')),
    makePlainObject(
      FONT0,
      '<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [5 0 R] >>',
    ),
    makePlainObject(CIDFONT, PDF_CIDFONT_OBJECT),
    makePlainObject(
      TYPE3,
      [
        '<< /Type /Font /Subtype /Type3 /Name /F2',
        '/FontBBox [0 0 1200 1000] /FontMatrix [0.001 0 0 0.001 0 0]',
        `/Encoding << /Type /Encoding /Differences [1 ${encodingDifferences}] >>`,
        `/FirstChar 1 /LastChar ${chars.length} /Widths [${widths}]`,
        `/Resources << /ProcSet [/PDF /ImageB] /XObject << ${glyphImages} >> >>`,
        `/CharProcs << ${charProcs} >>`,
        `/ToUnicode ${TOUNICODE} 0 R >>`,
      ].join('\n'),
    ),
    makeStreamObject(
      BACKGROUND,
      `<< /Type /XObject /Subtype /Image /Width ${backgroundAsset.width} /Height ${backgroundAsset.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${backgroundAsset.rgbBytes.length} >>`,
      backgroundAsset.rgbBytes,
    ),
    makeStreamObject(CONTENT, `<< /Length ${contentBytes.length} >>`, contentBytes),
    makeStreamObject(TOUNICODE, `<< /Length ${toUnicodeBytes.length} >>`, toUnicodeBytes),
  ]

  uniqueChars.forEach((ch) => {
    const asset = glyphs.assets[ch]
    objects.push(
      makeStreamObject(
        glyphImageIds[ch],
        `<< /Type /XObject /Subtype /Image /Width ${asset.pixelWidth} /Height ${asset.pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${asset.bytes.length} >>`,
        asset.bytes,
      ),
    )
    const procBytes = asciiBytes(
      `${asset.widthUnits} 0 d0\nq\n${asset.widthUnits} 0 0 1000 0 0 cm\n/Im${glyphName(ch)} Do\nQ`,
    )
    objects.push(makeStreamObject(glyphProcIds[ch], `<< /Length ${procBytes.length} >>`, procBytes))
  })

  if (extGStateId) {
    objects.push(makePlainObject(extGStateId, '<< /Type /ExtGState /CA 0 /ca 0 >>'))
  }
  if (annotationId) {
    objects.push(
      makePlainObject(
        annotationId,
        `<< /Type /Annot /Subtype /Text /Rect [18 18 34 34] /Contents ${utf16PdfHexString(joinedPayload)} /Name /Comment /F 28 >>`,
      ),
    )
  }
  if (formFieldId) {
    objects.push(
      makePlainObject(
        formFieldId,
        `<< /Type /Annot /Subtype /Widget /FT /Tx /T ${utf16PdfHexString('payload_field')} /V ${utf16PdfHexString(formFieldValue)} /DV ${utf16PdfHexString(formFieldValue)} /Rect [0 0 0 0] /F 6 /P 3 0 R >>`,
      ),
    )
  }
  if (formMismatchId) {
    objects.push(
      makePlainObject(
        formMismatchId,
        `<< /Type /Annot /Subtype /Widget /FT /Tx /T ${utf16PdfHexString('footer_mismatch_field')} /TU ${utf16PdfHexString(config.visibleFooter || 'visible footer')} /V ${utf16PdfHexString(formMismatchValue)} /DV ${utf16PdfHexString(formMismatchValue)} /Rect [${formatNumber(footerX)} ${formatNumber(config.footerY)} ${formatNumber(footerX + 2)} ${formatNumber((Number(config.footerY) || 32) + 2)}] /F 6 /P 3 0 R >>`,
      ),
    )
  }
  if (acroFormId) {
    const fields = [formFieldId, formMismatchId].filter(Boolean)
    objects.push(
      makePlainObject(acroFormId, `<< /Fields [${fields.map((id) => `${id} 0 R`).join(' ')}] /NeedAppearances false >>`),
    )
  }
  if (embeddedFileId) {
    const attachmentBytes = asciiBytes(attachmentDescription || joinedPayload || 'attachment payload')
    objects.push(
      makeStreamObject(
        embeddedFileId,
        `<< /Type /EmbeddedFile /Subtype /text#2Fplain /Length ${attachmentBytes.length} >>`,
        attachmentBytes,
      ),
    )
    objects.push(
      makePlainObject(
        filespecId,
        `<< /Type /Filespec /F (${attachmentName}) /UF ${utf16PdfHexString(attachmentName)} /Desc ${utf16PdfHexString(attachmentDescription)} /EF << /F ${embeddedFileId} 0 R >> >>`,
      ),
    )
    objects.push(makePlainObject(embeddedNamesId, `<< /Names [(${attachmentName}) ${filespecId} 0 R] >>`))
  }
  if (ocgId) {
    objects.push(
      makePlainObject(ocgId, `<< /Type /OCG /Name ${utf16PdfHexString('Hidden Payload Layer')} >>`),
    )
  }
  if (outlinesId) {
    objects.push(
      makePlainObject(outlinesId, `<< /Type /Outlines /First ${outlineItemId} 0 R /Last ${outlineItemId} 0 R /Count 1 >>`),
    )
    objects.push(
      makePlainObject(
        outlineItemId,
        `<< /Title ${utf16PdfHexString(bookmarkTitle)} /Parent ${outlinesId} 0 R /Dest [3 0 R /Fit] >>`,
      ),
    )
  }
  if (pageLabelsId) {
    objects.push(
      makePlainObject(pageLabelsId, `<< /Nums [0 << /S /D /P ${utf16PdfHexString(pageLabelPrefix)} >>] >>`),
    )
  }
  if (openActionId) {
    objects.push(
      makePlainObject(
        openActionId,
        `<< /Type /Action /S /JavaScript /JS ${utf16PdfHexString(openActionScript)} >>`,
      ),
    )
  }
  if (structTreeRootId) {
    objects.push(makePlainObject(parentTreeId, `<< /Nums [0 [${structElemId} 0 R]] >>`))
    objects.push(
      makePlainObject(
        structElemId,
        `<< /Type /StructElem /S /Figure /Alt ${utf16PdfHexString(structureAltValue)} /P ${structTreeRootId} 0 R /Pg 3 0 R /K 0 >>`,
      ),
    )
    objects.push(
      makePlainObject(
        structTreeRootId,
        `<< /Type /StructTreeRoot /K [${structElemId} 0 R] /ParentTree ${parentTreeId} 0 R >>`,
      ),
    )
  }
  if (metadataId) {
    objects.push(
      makePlainObject(
        metadataId,
        `<< /Producer ${utf16PdfHexString('pdfinject metadata carrier')} /Subject ${utf16PdfHexString(metadataSubject)} /Keywords ${utf16PdfHexString(metadataKeywords)} >>`,
      ),
    )
  }

  let bytes = assemblePdf(objects, { rootId: 1, infoId: metadataId })
  if (channels.has('incremental') && joinedPayload) {
    bytes = appendIncrementalPayload(bytes, joinedPayload)
  }
  return { bytes, objectCount: objects.length + (channels.has('incremental') ? 1 : 0), pageCount: 1 }
}

// ---------------------------------------------------------------------------
// Sample artifact
// ---------------------------------------------------------------------------

/** Build the standalone sample artifact for the given mode. */
export function buildSampleArtifact(
  config: PdfInjectConfig,
  resolve: LabelResolver,
  mode: PdfInjectMode = config.mode,
  textureAsset: TextureImageAsset | null = null,
): PdfArtifact {
  const theme = findTheme(config.backgroundTheme)
  const texture = findTexture(config.backgroundTexture)
  const bodyLines = plainLines(config, config.bodyText, config.bodySize)
  const visibleText = buildVisibleText(config, bodyLines)
  const machineText = buildMachineText(config, mode, bodyLines)
  const channels = activeChannelIds(config)
  const channelList = channelTitlesText(channels, resolve)
  const backgroundNote: LocalizedText = {
    key: 'reasons.backgroundTheme',
    params: { theme: resolve(theme.titleKey), texture: resolve(texture.titleKey) },
  }
  let result: BuildResult
  let reasons: LocalizedText[]
  let riskTone: PdfArtifact['riskTone']
  if (mode === 'normal') {
    result = buildNormalOrHiddenPdfBytes(config, 'normal', bodyLines, textureAsset)
    reasons = [
      backgroundNote,
      channels.length
        ? { key: 'reasons.normalChannels', params: { channels: channelList } }
        : { key: 'reasons.normalBaseline' },
      channels.length ? { key: 'reasons.normalChannelCaveat' } : { key: 'reasons.normalConsistent' },
    ]
    riskTone = channels.length ? 'warn' : 'good'
  } else if (mode === 'hidden') {
    result = buildNormalOrHiddenPdfBytes(config, 'hidden', bodyLines, textureAsset)
    reasons = [
      backgroundNote,
      { key: 'reasons.hiddenWhiteText' },
      { key: 'reasons.hiddenExtractors' },
      ...(channels.length ? [{ key: 'reasons.extraChannels', params: { channels: channelList } }] : []),
    ]
    riskTone = 'warn'
  } else {
    result = buildToUnicodePdfBytes(config, bodyLines, textureAsset)
    reasons = [
      backgroundNote,
      { key: 'reasons.tounicodeType3' },
      { key: 'reasons.tounicodeSplit' },
      ...(channels.length ? [{ key: 'reasons.extraChannels', params: { channels: channelList } }] : []),
    ]
    riskTone = 'alert'
  }
  return {
    sourceMode: 'sample',
    mode,
    fileName: `pdfinject-${mode}.pdf`,
    visibleText,
    machineText,
    reasons,
    riskTone,
    objectCount: result.objectCount || 0,
    pageCount: result.pageCount || 1,
    bytes: result.bytes,
  }
}
