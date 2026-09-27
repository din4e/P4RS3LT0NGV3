/**
 * Byte, color and text helpers for the PDF injection tool.
 *
 * Ported from icesky PdfInjectTool (pdfi* utility functions).
 */

import { PDF_PAGE } from './types'

// ---------------------------------------------------------------------------
// Byte helpers
// ---------------------------------------------------------------------------

const TEXT_ENCODER = new TextEncoder()

/** Encode a string as ASCII/UTF-8 bytes. */
export function asciiBytes(text: string): Uint8Array {
  return TEXT_ENCODER.encode(String(text || ''))
}

/** Concatenate byte arrays (nullish entries skipped). */
export function concatBytes(chunks: Array<Uint8Array | null | undefined>): Uint8Array {
  const list = (Array.isArray(chunks) ? chunks : []).filter(Boolean) as Uint8Array[]
  const total = list.reduce((sum, chunk) => sum + (chunk.length || 0), 0)
  const out = new Uint8Array(total)
  let offset = 0
  list.forEach((chunk) => {
    out.set(chunk, offset)
    offset += chunk.length || 0
  })
  return out
}

/** Decode a base64 string into bytes. */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = window.atob(String(base64 || ''))
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i)
  return out
}

/** Interpret raw bytes as a Latin-1 string (PDF syntax scanning). */
export function bytesToLatin1(bytes: Uint8Array | ArrayBuffer | null | undefined): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || [])
  let out = ''
  for (let i = 0; i < view.length; i += 4096) {
    const slice = view.subarray(i, i + 4096)
    out += String.fromCharCode(...slice)
  }
  return out
}

/** Check the %PDF- magic bytes. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  return (
    !!bytes &&
    bytes.length >= 5 &&
    bytes[0] === 37 &&
    bytes[1] === 80 &&
    bytes[2] === 68 &&
    bytes[3] === 70 &&
    bytes[4] === 45
  )
}

// ---------------------------------------------------------------------------
// File / DOM helpers
// ---------------------------------------------------------------------------

/** Read a File as an ArrayBuffer. */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('fileReadFailed'))
    reader.readAsArrayBuffer(file)
  })
}

/** Read a File as a data URL. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('fileReadFailed'))
    reader.readAsDataURL(file)
  })
}

/** Trigger a browser download for a blob. */
export function downloadBlob(fileName: string, blob: Blob): void {
  const anchor = document.createElement('a')
  const url = URL.createObjectURL(blob)
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/** Extract the lower-cased extension (with dot) of a file name. */
export function getExtension(name: string): string {
  const match = String(name || '')
    .trim()
    .match(/(\.[^.]+)$/)
  return match ? match[1].toLowerCase() : ''
}

/** Sanitize a file name for embedding into PDF structures. */
export function safeFileName(name: string, fallback = 'payload.txt'): string {
  return (
    String(name || '')
      .trim()
      .replace(/[\\/:*?"<>|(){}\[\]]+/g, '-')
      .replace(/\s+/g, ' ')
      .slice(0, 64) || fallback
  )
}

/** Human-readable byte size. */
export function formatFileSize(size: number): string {
  const value = Number(size) || 0
  if (value < 1024) return `${value} B`
  if (value < 1048576) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1048576).toFixed(2)} MB`
}

// ---------------------------------------------------------------------------
// Number / color helpers
// ---------------------------------------------------------------------------

/** Format a number with fixed precision, trimmed of trailing zeros. */
export function formatNumber(value: number, digits = 2): string {
  const num = Number(value)
  return Number.isFinite(num) ? Number(num.toFixed(digits)).toString() : '0'
}

/** Normalize a hex color to #RRGGBB form. */
export function normalizeHexColor(color: string, fallback = '#FFFFFF'): string {
  const raw = String(color || '').trim()
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)
    ? raw.replace(/^#/, '')
    : String(fallback || '#FFFFFF').replace(/^#/, '')
  if (hex.length === 3) {
    return `#${hex
      .split('')
      .map((ch) => `${ch}${ch}`)
      .join('')
      .toUpperCase()}`
  }
  return `#${hex.toUpperCase()}`
}

/** Parse a hex color into 0-255 rgb bytes. */
export function hexToRgbBytes(color: string, fallback = '#FFFFFF'): [number, number, number] {
  const hex = normalizeHexColor(color, fallback).slice(1)
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ]
}

/** Parse a hex color into 0-1 rgb floats. */
export function hexToRgbFloats(color: string, fallback = '#FFFFFF'): [number, number, number] {
  return hexToRgbBytes(color, fallback).map((v) => v / 255) as [number, number, number]
}

/** Convert 0-1 rgb floats back to a #RRGGBB hex string. */
export function rgbFloatsToHex(rgb: [number, number, number], fallback = '#FFFFFF'): string {
  return `#${(Array.isArray(rgb) && rgb.length >= 3 ? rgb : hexToRgbFloats(fallback, fallback))
    .slice(0, 3)
    .map((v) =>
      Math.round(255 * clamp(v))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`
}

/** Clamp a number into [min, max]. */
export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, Number(value) || 0))
}

/** Linear blend of two rgb float colors. */
export function mixRgb(
  from: [number, number, number],
  to: [number, number, number],
  ratio = 0.5,
): [number, number, number] {
  const t = clamp(ratio, 0, 1)
  const a = Array.isArray(from) ? from : [1, 1, 1]
  const b = Array.isArray(to) ? to : [0, 0, 0]
  return a.map((v, i) =>
    clamp((Number(v) || 0) * (1 - t) + (Number(b[i]) || 0) * t, 0, 1),
  ) as [number, number, number]
}

/** Build a PDF color-fill operator (`rg`/`RG`) from rgb floats. */
export function pdfRgbOperator(rgb: [number, number, number], op: 'rg' | 'RG' = 'rg'): string {
  const c = Array.isArray(rgb) ? rgb : [1, 1, 1]
  return `${formatNumber(c[0], 4)} ${formatNumber(c[1], 4)} ${formatNumber(c[2], 4)} ${op}`
}

// ---------------------------------------------------------------------------
// PDF text encoding
// ---------------------------------------------------------------------------

/** Encode a string as uppercase UTF-16BE hex (PDF text-showing hex strings). */
export function utf16BeHex(text: string): string {
  const str = String(text || '')
  let out = ''
  for (const ch of str) {
    const code = ch.codePointAt(0)
    if (code === undefined || !Number.isFinite(code)) continue
    if (code <= 65535) {
      out += code.toString(16).padStart(4, '0')
    } else {
      const offset = code - 65536
      out += (55296 + (offset >> 10)).toString(16).padStart(4, '0')
      out += (56320 + (offset & 1023)).toString(16).padStart(4, '0')
    }
  }
  return out.toUpperCase()
}

/** Wrap a UTF-16BE hex string as a PDF hex string with BOM. */
export function utf16PdfHexString(text: string): string {
  return `<FEFF${utf16BeHex(String(text || ''))}>`
}

/** Type3 glyph name for a character (uniXXXX / uXXXXXX). */
export function glyphName(char: string): string {
  const code = String(char || '').codePointAt(0) || 0
  return code <= 65535
    ? `uni${code.toString(16).toUpperCase().padStart(4, '0')}`
    : `u${code.toString(16).toUpperCase().padStart(6, '0')}`
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

/**
 * Wrap text into fixed-width lines. CJK-friendly: hard-wraps on grapheme
 * count (no word splitting), preserving explicit newlines and blank lines.
 */
export function wrapLines(text: string, maxChars: number): string[] {
  const source = String(text || '').replace(/\r/g, '')
  const width = Math.max(8, Number(maxChars) || 26)
  const lines: string[] = []
  source.split('\n').forEach((line) => {
    const str = String(line || '')
    if (!str.trim()) {
      lines.push('')
      return
    }
    if (str.length <= width) {
      lines.push(str)
      return
    }
    let current = ''
    Array.from(str).forEach((ch) => {
      current += ch
      if (current.length >= width) {
        lines.push(current)
        current = ''
      }
    })
    if (current) lines.push(current)
  })
  return lines.filter((line, idx, all) => line.trim() || idx === all.length - 1)
}

/** Rough per-line character budget for a font size and page padding. */
export function estimateMaxChars(pageWidth = PDF_PAGE.width, padding = 72, fontSize = 12): number {
  const usable = Math.max(180, Number(pageWidth) - 2 * Number(padding || 72))
  const size = Math.max(10, Number(fontSize) || 12)
  return Math.max(12, Math.floor((usable / size) * 1.7))
}

/** Split a payload string evenly across N slots (ToUnicode mismatch pairs). */
export function distributeMachineText(text: string, slots: number): string[] {
  const chars = Array.from(String(text || ''))
  if (slots <= 0) return []
  if (!chars.length) return Array(slots).fill('​')
  const out: string[] = []
  let cursor = 0
  for (let i = 0; i < slots; i += 1) {
    const remainingSlots = slots - i
    const remainingChars = chars.length - cursor
    if (remainingChars <= 0) {
      out.push('​')
      continue
    }
    const take = Math.max(1, Math.ceil(remainingChars / remainingSlots))
    out.push(chars.slice(cursor, cursor + take).join(''))
    cursor += take
  }
  return out
}
