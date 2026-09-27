/**
 * Runtime dependency loading for the PDF injection tool.
 *
 * Ported from icesky PdfInjectTool. Heavy runtimes (pdf-lib for page merging,
 * pdf.js for preview rendering, JSZip for result packages, tesseract.js for
 * OCR) are lazy-loaded as UMD scripts from public CDNs with fallbacks —
 * exactly like the upstream tool, so no npm dependency is added. All loaders
 * cache their promise; a failed load is retried on the next call.
 */

type RuntimeGlobal = Record<string, unknown>

const RUNTIME_CACHE: Record<string, Promise<unknown> | undefined> = Object.create(null)

function runtimeRoot(): RuntimeGlobal {
  return (typeof window !== 'undefined' ? window : globalThis) as RuntimeGlobal
}

/**
 * Load a UMD script (with fallback URLs) and return its global export.
 * Resolves immediately when the global is already present.
 */
export async function loadRuntimeScript<T>(
  urls: string[],
  globalName: string,
  cacheKey: string,
): Promise<T> {
  const root = runtimeRoot()
  if (root[globalName]) return root[globalName] as T
  if (RUNTIME_CACHE[cacheKey]) return RUNTIME_CACHE[cacheKey] as Promise<T>
  const candidates = Array.isArray(urls) ? urls : [urls]
  RUNTIME_CACHE[cacheKey] = (async () => {
    for (const url of candidates) {
      try {
        await new Promise<void>((resolve, reject) => {
          const existing = Array.from(document.querySelectorAll('script')).find(
            (script) => script.src === url,
          )
          const el = existing ?? document.createElement('script')
          const cleanup = () => {
            el.removeEventListener('load', onLoad)
            el.removeEventListener('error', onError)
          }
          const onError = () => {
            cleanup()
            el.remove()
            reject(new Error(`Failed to load ${url}`))
          }
          const onLoad = () => {
            if (runtimeRoot()[globalName]) {
              cleanup()
              resolve()
            } else {
              onError()
            }
          }
          el.addEventListener('load', onLoad, { once: true })
          el.addEventListener('error', onError, { once: true })
          if (!existing) {
            el.src = url
            el.async = true
            document.head.appendChild(el)
          }
        })
        if (runtimeRoot()[globalName]) {
          return runtimeRoot()[globalName] as T
        }
      } catch (err) {
        console.warn(`[PdfInjectTool] runtime dependency load failed: ${url}`, err)
      }
    }
    throw new Error(`runtimeLoadFailed:${globalName}`)
  })()
  const pending = RUNTIME_CACHE[cacheKey]
  try {
    return (await pending) as T
  } catch (err) {
    if (RUNTIME_CACHE[cacheKey] === pending) delete RUNTIME_CACHE[cacheKey]
    throw err
  }
}

// ---------------------------------------------------------------------------
// pdf-lib — uploaded-PDF page counting / merging and image-PDF building
// ---------------------------------------------------------------------------

/** Minimal structural typing of the pdf-lib pieces this tool uses. */
export interface PdfLibFont {
  scale(factor: number): { width: number; height: number }
}

export interface PdfLibPage {
  drawImage(image: PdfLibImage, options: Record<string, unknown>): void
  drawText(text: string, options: Record<string, unknown>): void
}

export interface PdfLibImage {
  scale(factor: number): { width: number; height: number }
}

export interface PdfLibDocument {
  addPage(size: [number, number] | PdfLibPage): PdfLibPage
  embedPng(bytes: Uint8Array): Promise<PdfLibImage>
  embedJpg(bytes: Uint8Array): Promise<PdfLibImage>
  setSubject(subject: string): void
  setKeywords(keywords: string[]): void
  attach(data: Uint8Array, name: string, options: Record<string, unknown>): Promise<void>
  getForm(): { createTextField(name: string): { setText(text: string): void; addToPage(page: PdfLibPage, options: Record<string, unknown>): void } }
  save(options?: Record<string, unknown>): Promise<Uint8Array>
  getPageCount(): number
  getPageIndices(): number[]
  copyPages(doc: PdfLibDocument, indices: number[]): Promise<PdfLibPage[]>
}

export interface PdfLibRuntime {
  PDFDocument: {
    create(): Promise<PdfLibDocument>
    load(bytes: Uint8Array, options?: Record<string, unknown>): Promise<PdfLibDocument>
  }
  rgb(r: number, g: number, b: number): unknown
}

/** Lazy-load pdf-lib from CDN. */
export function ensurePdfLib(): Promise<PdfLibRuntime> {
  return loadRuntimeScript<PdfLibRuntime>(
    [
      'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js',
      'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
    ],
    'PDFLib',
    'pdf-lib',
  )
}

// ---------------------------------------------------------------------------
// pdf.js — preview rendering and extractor text
// ---------------------------------------------------------------------------

export interface PdfJsViewport {
  width: number
  height: number
}

export interface PdfJsPage {
  getViewport(options: { scale: number }): PdfJsViewport
  render(options: { canvasContext: CanvasRenderingContext2D; viewport: PdfJsViewport; background?: string }): { promise: Promise<void> }
  getTextContent(): Promise<{ items: Array<{ str?: string }> }>
}

export interface PdfJsDocument {
  numPages: number
  getPage(pageNumber: number): Promise<PdfJsPage>
  destroy(): Promise<void>
}

export interface PdfJsRuntime {
  getDocument(options: Record<string, unknown>): { promise: Promise<PdfJsDocument> }
  GlobalWorkerOptions: { workerSrc: string }
}

/** Lazy-load pdf.js from CDN (worker configured). */
export async function ensurePdfJs(): Promise<PdfJsRuntime> {
  const lib = await loadRuntimeScript<PdfJsRuntime>(
    [
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js',
      'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.min.js',
    ],
    'pdfjsLib',
    'pdfjs',
  )
  if (lib?.GlobalWorkerOptions) {
    lib.GlobalWorkerOptions.workerSrc =
      lib.GlobalWorkerOptions.workerSrc ||
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js'
  }
  return lib
}

// ---------------------------------------------------------------------------
// JSZip — result packages and batch exports
// ---------------------------------------------------------------------------

export interface JsZipFile {
  file(name: string, data: string | Uint8Array): JsZipFile
  generateAsync(options: { type: 'blob' }): Promise<Blob>
}

/** Lazy-load JSZip from CDN. */
export function ensureJsZip(): Promise<new () => JsZipFile> {
  return loadRuntimeScript<new () => JsZipFile>(
    [
      'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
      'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js',
    ],
    'JSZip',
    'jszip',
  )
}

// ---------------------------------------------------------------------------
// tesseract.js — OCR arena
// ---------------------------------------------------------------------------

export interface TesseractRuntime {
  recognize(image: string, langs: string): Promise<{ data: { text?: string } }>
}

/** Lazy-load tesseract.js from CDN. */
export function ensureTesseract(): Promise<TesseractRuntime> {
  return loadRuntimeScript<TesseractRuntime>(
    [
      'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
      'https://unpkg.com/tesseract.js@5/dist/tesseract.min.js',
    ],
    'Tesseract',
    'tesseract',
  )
}
