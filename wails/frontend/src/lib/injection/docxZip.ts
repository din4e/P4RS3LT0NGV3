/**
 * Minimal ZIP reader/writer for DOCX (OOXML) packages.
 *
 * Replaces the JSZip runtime dependency used by the upstream IceSky
 * DOCX Inject tool: reading relies on the central directory plus the
 * browser-native `DecompressionStream('deflate-raw')`, and writing
 * emits STORE (uncompressed) entries or passes original entries
 * through byte-for-byte, so no deflate encoder is required.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A raw entry parsed from an existing ZIP archive. */
export interface ZipRawEntry {
  /** Entry path, e.g. `word/document.xml`. */
  name: string
  /** Compression method: 0 = STORE, 8 = DEFLATE. */
  method: number
  /** CRC-32 of the uncompressed data. */
  crc32: number
  /** Byte length of the compressed payload. */
  compressedSize: number
  /** Byte length of the uncompressed data. */
  uncompressedSize: number
  /** Compressed payload exactly as stored in the archive. */
  compressedBytes: Uint8Array
}

/** An entry to write into a new ZIP archive. */
export interface ZipWriteEntry {
  /** Entry path. */
  name: string
  /** Uncompressed payload; stored with method 0 (STORE). */
  data?: Uint8Array
  /** Existing entry to copy through byte-for-byte (keeps its method/CRC). */
  raw?: ZipRawEntry
}

// ---------------------------------------------------------------------------
// CRC-32
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

/** Compute the CRC-32 checksum of a byte array. */
export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

// ---------------------------------------------------------------------------
// Little-endian helpers
// ---------------------------------------------------------------------------

class ByteWriter {
  private chunks: Uint8Array[] = []
  private length = 0

  get position(): number {
    return this.length
  }

  bytes(value: Uint8Array): this {
    this.chunks.push(value)
    this.length += value.length
    return this
  }

  u16(value: number): this {
    const b = new Uint8Array(2)
    b[0] = value & 0xff
    b[1] = (value >>> 8) & 0xff
    return this.bytes(b)
  }

  u32(value: number): this {
    const b = new Uint8Array(4)
    b[0] = value & 0xff
    b[1] = (value >>> 8) & 0xff
    b[2] = (value >>> 16) & 0xff
    b[3] = (value >>> 24) & 0xff
    return this.bytes(b)
  }

  toUint8Array(): Uint8Array {
    const out = new Uint8Array(this.length)
    let offset = 0
    for (const chunk of this.chunks) {
      out.set(chunk, offset)
      offset += chunk.length
    }
    return out
  }
}

function readU16(view: DataView, offset: number): number {
  return view.getUint16(offset, true)
}

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, true)
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

const EOCD_SIGNATURE = 0x06054b50
const CDE_SIGNATURE = 0x02014b50
const LFH_SIGNATURE = 0x04034b50
const MAX_EOCD_SCAN = 65536 + 22 // max EOCD size incl. comment

function findEocdOffset(view: DataView): number {
  const limit = Math.max(0, view.byteLength - MAX_EOCD_SCAN)
  for (let i = view.byteLength - 22; i >= limit; i--) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) return i
  }
  return -1
}

/**
 * Parse a ZIP archive into its raw entries.
 *
 * Entries are returned in central-directory order; compressed payloads are
 * sliced without decompression so untouched entries can be copied verbatim.
 */
export function readZipEntries(data: ArrayBuffer | Uint8Array): ZipRawEntry[] {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const eocd = findEocdOffset(view)
  if (eocd < 0) {
    throw new Error('Invalid ZIP archive: end-of-central-directory not found')
  }

  const entryCount = readU16(view, eocd + 10)
  let offset = readU32(view, eocd + 16)
  if (offset === 0xffffffff) {
    throw new Error('ZIP64 archives are not supported')
  }

  const text = new TextDecoder()
  const entries: ZipRawEntry[] = []
  for (let i = 0; i < entryCount; i++) {
    if (offset + 46 > bytes.byteLength || readU32(view, offset) !== CDE_SIGNATURE) {
      throw new Error('Invalid ZIP archive: corrupted central directory')
    }
    const method = readU16(view, offset + 10)
    const crc = readU32(view, offset + 16)
    const compressedSize = readU32(view, offset + 20)
    const uncompressedSize = readU32(view, offset + 24)
    const nameLen = readU16(view, offset + 28)
    const extraLen = readU16(view, offset + 30)
    const commentLen = readU16(view, offset + 32)
    const localOffset = readU32(view, offset + 42)
    const name = text.decode(bytes.subarray(offset + 46, offset + 46 + nameLen))

    // Local header name/extra lengths can differ from the central directory.
    if (localOffset + 30 > bytes.byteLength || readU32(view, localOffset) !== LFH_SIGNATURE) {
      throw new Error(`Invalid ZIP archive: bad local header for ${name}`)
    }
    const localNameLen = readU16(view, localOffset + 26)
    const localExtraLen = readU16(view, localOffset + 28)
    const dataStart = localOffset + 30 + localNameLen + localExtraLen
    const compressedBytes = bytes.slice(dataStart, dataStart + compressedSize)

    entries.push({
      name,
      method,
      crc32: crc,
      compressedSize,
      uncompressedSize,
      compressedBytes,
    })

    offset += 46 + nameLen + extraLen + commentLen
  }
  return entries
}

/**
 * Decompress a raw entry and decode it as UTF-8 text.
 *
 * DEFLATE entries require the browser-native `DecompressionStream`
 * (Chromium 80+, so Wails WebView2 qualifies).
 */
export async function zipEntryText(entry: ZipRawEntry): Promise<string> {
  if (entry.method !== 0 && entry.method !== 8) {
    throw new Error(`Unsupported ZIP compression method ${entry.method} for ${entry.name}`)
  }
  if (entry.method === 0) {
    return new TextDecoder().decode(entry.compressedBytes)
  }
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This environment cannot inflate DEFLATE ZIP entries (DecompressionStream unavailable)')
  }
  const copy = new Uint8Array(entry.compressedBytes)
  const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  const buffer = await new Response(stream).arrayBuffer()
  return new TextDecoder().decode(buffer)
}

/** Find a raw entry by exact path, or `null` when absent. */
export function findZipEntry(entries: ZipRawEntry[], name: string): ZipRawEntry | null {
  return entries.find((entry) => entry.name === name) ?? null
}

/** Read one entry as UTF-8 text; returns `null` when the entry is missing. */
export async function readZipText(entries: ZipRawEntry[], name: string): Promise<string | null> {
  const entry = findZipEntry(entries, name)
  return entry ? zipEntryText(entry) : null
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

const textEncoder = new TextEncoder()

/** Encode a string as UTF-8 bytes. */
export function utf8Bytes(value: string): Uint8Array {
  return textEncoder.encode(value)
}

/** Fixed DOS timestamp (1980-01-01 00:00) used for generated entries. */
const DOS_TIME = 0x0000
const DOS_DATE = 0x0021

/**
 * Build a ZIP archive from the given entries.
 *
 * New data is written uncompressed (STORE, legal for Word/WPS); `raw`
 * entries are copied through with their original method and checksum.
 */
export function buildZip(entries: ZipWriteEntry[], mimeType = 'application/zip'): Blob {
  const local = new ByteWriter()
  const central = new ByteWriter()
  let count = 0

  for (const entry of entries) {
    const nameBytes = utf8Bytes(entry.name)
    const stored = entry.raw
    const data = stored ? stored.compressedBytes : (entry.data ?? new Uint8Array(0))
    const method = stored ? stored.method : 0
    const crc = stored ? stored.crc32 : crc32(data)
    const compressedSize = stored ? stored.compressedSize : data.length
    const uncompressedSize = stored ? stored.uncompressedSize : data.length
    const localOffset = local.position

    // Local file header
    local.u32(LFH_SIGNATURE)
    local.u16(0x0014) // version needed: 2.0
    local.u16(0) // flags
    local.u16(method)
    local.u16(DOS_TIME)
    local.u16(DOS_DATE)
    local.u32(crc)
    local.u32(compressedSize)
    local.u32(uncompressedSize)
    local.u16(nameBytes.length)
    local.u16(0) // extra length
    local.bytes(nameBytes)
    local.bytes(data)

    // Central directory record
    central.u32(CDE_SIGNATURE)
    central.u16(0x0014) // version made by: 2.0, MS-DOS
    central.u16(0x0014) // version needed
    central.u16(0) // flags
    central.u16(method)
    central.u16(DOS_TIME)
    central.u16(DOS_DATE)
    central.u32(crc)
    central.u32(compressedSize)
    central.u32(uncompressedSize)
    central.u16(nameBytes.length)
    central.u16(0) // extra length
    central.u16(0) // comment length
    central.u16(0) // disk number start
    central.u16(0) // internal attributes
    central.u32(0) // external attributes
    central.u32(localOffset)
    central.bytes(nameBytes)

    count++
  }

  const centralOffset = local.position
  const centralBytes = central.toUint8Array()

  const eocd = new ByteWriter()
  eocd.u32(EOCD_SIGNATURE)
  eocd.u16(0) // disk number
  eocd.u16(0) // disk with central directory
  eocd.u16(count)
  eocd.u16(count)
  eocd.u32(centralBytes.length)
  eocd.u32(centralOffset)
  eocd.u16(0) // comment length

  const parts = [local.toUint8Array(), centralBytes, eocd.toUint8Array()]
  return new Blob(parts as BlobPart[], { type: mimeType })
}

/** Build a ZIP from a path → UTF-8 text map (all entries STORE). */
export function buildTextZip(files: Record<string, string>, mimeType = 'application/zip'): Blob {
  return buildZip(
    Object.entries(files).map(([name, content]) => ({ name, data: utf8Bytes(content) })),
    mimeType,
  )
}
