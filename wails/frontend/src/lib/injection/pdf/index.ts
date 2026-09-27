/**
 * PDF injection tool library barrel.
 *
 * - bytes.ts        byte/color/text helpers, file readers, downloads
 * - types.ts        shared types, constants, upload allowlists
 * - config.ts       UI/theme/texture/mode metadata
 * - scenarios.ts    channel catalog, guides, presets, sample library
 * - background.ts   appearance resolution, canvas textures, Type3 glyphs
 * - pdfObjects.ts   hand-written PDF object assembly + raw-byte analysis
 * - writer.ts       hand-written PDF sample generation (normal/hidden/tounicode)
 * - artifacts.ts    image-PDF/upload-merge builders, extractor arena, exports
 * - runtime.ts      lazy CDN loaders (pdf-lib, pdf.js, JSZip, tesseract.js)
 */

export * from './types'
export * from './bytes'
export * from './config'
export * from './scenarios'
export * from './background'
export * from './pdfObjects'
export * from './writer'
export * from './artifacts'
export * from './runtime'
