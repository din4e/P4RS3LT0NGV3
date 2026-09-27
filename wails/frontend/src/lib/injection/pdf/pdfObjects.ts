/**
 * Low-level PDF object assembly and raw-byte analysis.
 *
 * Ported from icesky PdfInjectTool. All PDF generation here is hand-written —
 * objects, streams, the xref table and incremental updates are assembled
 * directly as bytes, with no PDF library involved.
 */

import {
  asciiBytes,
  bytesToLatin1,
  concatBytes,
  utf16PdfHexString,
} from './bytes'
import type { DetectorFinding, PdfObjectEntry } from './types'

// ---------------------------------------------------------------------------
// Fixed PDF fragments
// ---------------------------------------------------------------------------

/**
 * Binary comment marker (%PDF-1.4 with high-bit comment bytes) that makes
 * tools treat the file as binary.
 */
export const PDF_BINARY_COMMENT = new Uint8Array([
  37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 226, 227, 207, 211, 10,
])

/** CIDFont descriptor for the STSong-Light composite font used for body text. */
export const PDF_CIDFONT_OBJECT =
  '<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light\n' +
  '/CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 0 >>\n' +
  '/FontDescriptor << /Type /FontDescriptor /FontName /STSongStd-Light /Flags 6\n' +
  '/FontBBox [-25 -254 1000 880] /ItalicAngle 0 /Ascent 752 /Descent -271\n' +
  '/CapHeight 737 /StemV 58 /StemH 91 /Leading 148 /XHeight 553\n' +
  '/MissingWidth 500 /MaxWidth 1000 >>\n' +
  '/DW 1000\n' +
  '/W [1 [207 270 342 467 462 797 710 239 374]\n' +
  '10 [374 423 605 238 375 238 334 462]\n' +
  '18 26 462\n' +
  '27 28 238\n' +
  '29 31 605\n' +
  '32 [344 748 684 560 695 739 563 511 729 793 318 312 666 526 896 758 772 544 772 628 465 607 753 711 972 647 620 607 374 333 374 606 500 239 417 503 427 529 415 264 444 518 241 230 495 228 793 527 524]\n' +
  '81 [524 504 338 336 277 517 450 652 466 452 407 370 258 370 605]]\n' +
  '>>'

// ---------------------------------------------------------------------------
// Object builders
// ---------------------------------------------------------------------------

/** A numbered indirect object with pre-rendered bytes. */
export interface PdfObject {
  id: number
  bytes: Uint8Array
}

/** Build a plain (non-stream) indirect object. */
export function makePlainObject(id: number, body: string): PdfObject {
  return { id, bytes: asciiBytes(`${id} 0 obj\n${body}\nendobj\n`) }
}

/** Build a stream indirect object. */
export function makeStreamObject(id: number, dict: string, data: Uint8Array): PdfObject {
  return {
    id,
    bytes: concatBytes([
      asciiBytes(`${id} 0 obj\n${dict}\nstream\n`),
      data,
      asciiBytes('\nendstream\nendobj\n'),
    ]),
  }
}

/**
 * Assemble objects into a complete PDF file: binary comment, objects sorted
 * by id, classic xref table and trailer.
 */
export function assemblePdf(
  objects: PdfObject[],
  opts?: { rootId?: number; infoId?: number },
): Uint8Array {
  const rootId = Number(opts?.rootId) || 1
  const infoId = Number.isFinite(Number(opts?.infoId)) ? Number(opts?.infoId) : 0
  const sorted = (Array.isArray(objects) ? objects.slice() : []).sort((a, b) => a.id - b.id)
  const maxId = sorted.reduce((max, obj) => Math.max(max, Number(obj.id) || 0), 0)
  const offsets = new Array(maxId + 1).fill(0)
  const chunks: Uint8Array[] = [PDF_BINARY_COMMENT]
  let offset = PDF_BINARY_COMMENT.length
  sorted.forEach((obj) => {
    offsets[obj.id] = offset
    chunks.push(obj.bytes)
    offset += obj.bytes.length
  })
  const startxref = offset
  let xref = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= maxId; i += 1) {
    xref += `${String(offsets[i] || 0).padStart(10, '0')} 00000 n \n`
  }
  chunks.push(asciiBytes(xref))
  chunks.push(
    asciiBytes(
      `trailer\n<< /Size ${maxId + 1} /Root ${rootId} 0 R${infoId ? ` /Info ${infoId} 0 R` : ''} >>\nstartxref\n${startxref}\n%%EOF`,
    ),
  )
  return concatBytes(chunks)
}

/**
 * Append an incremental-update segment carrying payload text in its /Info
 * object (visible to object-level scans and repair-style parsers).
 */
export function appendIncrementalPayload(bytes: Uint8Array, payload: string): Uint8Array {
  const latin = bytesToLatin1(bytes)
  const prevMatch = latin.match(/startxref\s+(\d+)\s+%%EOF\s*$/)
  const prevStartxref = (prevMatch && Number(prevMatch[1])) || 0
  const nextId =
    buildPdfObjectTree(bytes).reduce((max, obj) => Math.max(max, Number(obj.id) || 0), 0) + 1
  const segmentOffset = bytes.length
  const infoBytes = asciiBytes(
    `${[
      `${nextId} 0 obj`,
      `<< /Producer ${utf16PdfHexString('pdfinject incremental carrier')} /Subject ${utf16PdfHexString(payload || 'incremental payload')} >>`,
      'endobj',
    ].join('\n')}\n`,
  )
  const newStartxref = segmentOffset + infoBytes.length
  return concatBytes([
    bytes,
    infoBytes,
    asciiBytes(`xref\n${nextId} 1\n${String(segmentOffset).padStart(10, '0')} 00000 n \n`),
    asciiBytes(
      `trailer\n<< /Size ${nextId + 1} /Root 1 0 R /Prev ${prevStartxref} /Info ${nextId} 0 R >>\nstartxref\n${newStartxref}\n%%EOF`,
    ),
  ])
}

// ---------------------------------------------------------------------------
// Raw-byte analysis
// ---------------------------------------------------------------------------

/** Parse `N 0 obj … endobj` entries out of the raw bytes (object list tab). */
export function buildPdfObjectTree(bytes: Uint8Array): PdfObjectEntry[] {
  const latin = bytesToLatin1(bytes)
  const entries: PdfObjectEntry[] = []
  const objectPattern = /(\d+)\s+0\s+obj([\s\S]*?)endobj/g
  let match: RegExpExecArray | null
  while ((match = objectPattern.exec(latin))) {
    const id = Number(match[1]) || 0
    const body = match[2] || ''
    const type = body.match(/\/Type\s*\/([A-Za-z0-9]+)/)
    const subtype = body.match(/\/Subtype\s*\/([A-Za-z0-9]+)/)
    const length = body.match(/\/Length\s+(\d+)/)
    entries.push({
      id,
      type: type ? type[1] : 'Object',
      subtype: subtype ? subtype[1] : '',
      length: length ? Number(length[1]) : 0,
      preview: body.trim().slice(0, 320),
    })
  }
  return entries
}

interface DetectorRule {
  id: string
  pattern: RegExp
  severity: 'high' | 'medium' | 'low'
}

/** Structure-scan rules; titles/details resolve via i18n keys. */
const DETECTOR_RULES: DetectorRule[] = [
  { id: 'type3', pattern: /\/Subtype\s*\/Type3/, severity: 'high' },
  { id: 'tounicode', pattern: /\/ToUnicode\b/, severity: 'high' },
  { id: 'annotation', pattern: /\/Type\s*\/Annot\b/, severity: 'medium' },
  { id: 'acroform', pattern: /\/AcroForm\b|\/FT\s*\/Tx\b/, severity: 'medium' },
  { id: 'attachment', pattern: /\/EmbeddedFile\b|\/Filespec\b/, severity: 'medium' },
  { id: 'ocg', pattern: /\/OCProperties\b|\/Type\s*\/OCG\b/, severity: 'medium' },
  { id: 'actualtext', pattern: /\/ActualText\b/, severity: 'high' },
  { id: 'structure', pattern: /\/StructTreeRoot\b|\/MarkInfo\b/, severity: 'medium' },
  { id: 'alttext', pattern: /\/Alt\b/, severity: 'medium' },
  { id: 'outlines', pattern: /\/Outlines\b/, severity: 'low' },
  { id: 'pagelabels', pattern: /\/PageLabels\b/, severity: 'low' },
  { id: 'openaction', pattern: /\/OpenAction\b/, severity: 'medium' },
  { id: 'javascript', pattern: /\/JavaScript\b|\/JS\b/, severity: 'high' },
  { id: 'metadata', pattern: /\/Subject\b|\/Keywords\b|\/Producer\b/, severity: 'low' },
  { id: 'opacity', pattern: /\/ca\s+0\b|\/CA\s+0\b/, severity: 'medium' },
  { id: 'renderMode3', pattern: /\b3\s+Tr\b/, severity: 'medium' },
  { id: 'cropbox', pattern: /\/CropBox\b/, severity: 'medium' },
  { id: 'incremental', pattern: /\/Prev\s+\d+\b/, severity: 'medium' },
]

/**
 * Scan raw PDF bytes for structures typical of hidden-payload samples.
 * Titles and details resolve from the `detector.<id>.title/detail` i18n keys.
 */
export function buildDetectorFindings(bytes: Uint8Array): DetectorFinding[] {
  const latin = bytesToLatin1(bytes)
  const findings: DetectorFinding[] = []
  DETECTOR_RULES.forEach((rule) => {
    if (rule.pattern.test(latin)) {
      findings.push({
        id: rule.id,
        titleKey: `detector.${rule.id}.title`,
        severity: rule.severity,
        detailKey: `detector.${rule.id}.detail`,
      })
    }
  })
  const textOps = (latin.match(/ Tf/g) || []).length
  if (textOps) {
    findings.push({
      id: 'textops',
      titleKey: 'detector.textops.title',
      severity: 'low',
      detailKey: 'detector.textops.detail',
      params: { count: textOps },
    })
  }
  return findings
}

/**
 * Parse a page range expression like `1-3,5,8` against a page count into a
 * sorted, de-duplicated list of page numbers.
 */
export function parsePageRange(expression: string, pageCount: number): number[] {
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
