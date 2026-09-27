/**
 * Shared types for the PDF injection tool.
 *
 * Ported from icesky PdfInjectTool. The tool generates PDF samples that carry
 * hidden payload text through many different PDF channels (invisible text,
 * render-mode tricks, ToUnicode mismatches, annotations, form fields,
 * structure trees, metadata, attachments, OCG layers, bookmarks, page labels,
 * incremental updates, open actions) and analyzes uploaded PDFs for the same
 * channels — used to test how document-parsing LLM pipelines treat content
 * that human readers never see.
 */

// ---------------------------------------------------------------------------
// Core option ids
// ---------------------------------------------------------------------------

/** Where the PDF comes from. */
export type PdfSourceMode = 'sample' | 'upload' | 'imagepdf'

/** Base generation mode. */
export type PdfInjectMode = 'normal' | 'hidden' | 'tounicode'

/** All injectable PDF channels. */
export type ChannelId =
  | 'white_text'
  | 'opacity_zero'
  | 'render_mode_3'
  | 'covered_text'
  | 'off_page'
  | 'crop_hidden'
  | 'actual_text'
  | 'annotation'
  | 'form_field'
  | 'form_mismatch'
  | 'structure_alt'
  | 'metadata'
  | 'attachment'
  | 'ocg_layer'
  | 'outline_bookmark'
  | 'page_labels'
  | 'incremental'
  | 'open_action_js'

/** Channel grouping shown in the technique tabs. */
export type ChannelGroup = 'text' | 'structure' | 'document' | 'action'

/** Usage scenario a channel fits (scenario tabs). */
export type ChannelScene = 'copy' | 'extract' | 'ocr' | 'structure' | 'document' | 'action'

/** Where inject pages are inserted when merging with an uploaded PDF. */
export type InjectPlacement = 'append' | 'prepend' | 'before' | 'after' | 'range'

/** Background theme preset id. */
export type BackgroundThemeId = 'white' | 'ivory' | 'kraft' | 'blueprint' | 'night' | 'custom'

/** Background texture preset id. */
export type BackgroundTextureId = 'none' | 'paper' | 'grid' | 'scan' | 'custom_image'

/** Custom texture placement. */
export type TexturePlacementId = 'tile' | 'stretch' | 'center'

/** UI density mode. */
export type PdfUiMode = 'simple' | 'pro'

/** Result panel tab id. */
export type ResultTabId = 'summary' | 'reader' | 'arena' | 'detector' | 'object' | 'output'

/** Technique extension field storage keys. */
export type TechniqueField =
  | 'actualText'
  | 'structureAltText'
  | 'bookmarkTitle'
  | 'pageLabelPrefix'
  | 'openActionScript'
  | 'formFieldValue'
  | 'formMismatchValue'
  | 'metadataSubject'
  | 'metadataKeywords'
  | 'attachmentName'
  | 'attachmentDescription'

export type TechniqueValues = Record<TechniqueField, string>

// ---------------------------------------------------------------------------
// Data shapes
// ---------------------------------------------------------------------------

export interface IdTitleNote {
  id: string
  /** i18n key (tool namespace) for the title. */
  titleKey: string
  /** i18n key (tool namespace) for the note/description. */
  noteKey: string
}

export interface BackgroundThemeDef {
  id: BackgroundThemeId
  titleKey: string
  noteKey: string
  bg: string
  ink: string
}

export interface SourceModeDef {
  id: PdfSourceMode
  titleKey: string
  descriptionKey: string
}

export interface ModeCardDef {
  id: PdfInjectMode
  titleKey: string
  shortKey: string
  descriptionKey: string
  noteKey: string
}

export interface InjectPlacementDef {
  id: InjectPlacement
  titleKey: string
  descriptionKey: string
}

export interface ResultTabDef {
  id: ResultTabId
  titleKey: string
  proOnly?: boolean
}

export interface ChannelCardDef {
  id: ChannelId
  group: ChannelGroup
  scenes: ChannelScene[]
  titleKey: string
  noteKey: string
}

export interface TechniqueGuideDef {
  channelId: ChannelId
  principleKey: string
  humanKey: string
  machineKey: string
  bestForKey: string
  avoidKey: string
}

export interface TechniqueFieldDef {
  channelId: ChannelId
  field: TechniqueField
  labelKey: string
  kind: 'input' | 'textarea'
  rows?: number
  placeholderKey: string
}

export interface PresetBundle {
  id: string
  titleKey: string
  descriptionKey: string
  mode: PdfInjectMode
  sourceMode: PdfSourceMode
  scenario: ChannelScene | 'all'
  channels: ChannelId[]
}

export interface SampleLibraryItem {
  titleKey: string
  sourceMode: PdfSourceMode
  mode: PdfInjectMode
  titleText: string
  bodyText: string
  visibleFooter: string
  hiddenPrompt: string
  mismatchFooter: string
}

// ---------------------------------------------------------------------------
// Runtime state shapes
// ---------------------------------------------------------------------------

/** A PDF selected for upload mode. */
export interface PdfUploadItem {
  name: string
  type: string
  ext: string
  size: number
  pageCount: number
  bytes: Uint8Array
}

/** An uploaded image (image-PDF source or custom texture). */
export interface ImageUpload {
  name: string
  type: string
  ext: string
  size: number
  width: number
  height: number
  dataUrl: string
  bytes: Uint8Array
}

/** Fully-resolved background appearance (colors as 0-1 rgb floats). */
export interface BackgroundAppearance {
  id: BackgroundThemeId
  titleKey: string
  bg: string
  ink: string
  bgRgb: [number, number, number]
  inkRgb: [number, number, number]
  hiddenRgb: [number, number, number]
  textureLineRgb: [number, number, number]
  textureSoftRgb: [number, number, number]
  isDark: boolean
}

/** Generated result artifact. */
export interface PdfArtifact {
  sourceMode: PdfSourceMode
  mode: PdfInjectMode
  fileName: string
  visibleText: string
  machineText: string
  reasons: LocalizedText[]
  riskTone: 'good' | 'warn' | 'alert' | 'notice'
  objectCount: number
  pageCount: number
  bytes: Uint8Array
}

/** A human-readable string produced by lib code, resolved via i18n. */
export interface LocalizedText {
  key: string
  params?: Record<string, string | number>
}

/** Resolves LocalizedText keys (the component passes its next-intl `t`). */
export type LabelResolver = (key: string, params?: Record<string, string | number>) => string

/** A detector finding over the generated/uploaded bytes. */
export interface DetectorFinding {
  id: string
  titleKey: string
  severity: 'high' | 'medium' | 'low'
  detailKey: string
  /** Extra param for the one parametrized finding. */
  params?: Record<string, string | number>
}

/** A parsed indirect object from the object tree. */
export interface PdfObjectEntry {
  id: number
  type: string
  subtype: string
  length: number
  preview: string
}

/** A "who reads what" row on the reader tab. */
export interface ReaderRow {
  readerKey: string
  value: string
  noteKey: string
}

/** An extractor-arena result card. */
export interface ArenaResult {
  id: 'visible' | 'machine' | 'pdfjs' | 'ocr' | 'metadata'
  titleKey: string
  body: string
  tone: 'good' | 'warn' | 'notice'
}

/** A channel-combination warning. */
export interface ConflictWarning {
  id: string
  tone: 'warn' | 'notice'
  titleKey: string
  detailKey: string
}

/** One page of preview rendering. */
export interface PreviewThumb {
  pageNumber: number
  url: string
  width: number
  height: number
  active: boolean
}

// ---------------------------------------------------------------------------
// Serializable tool configuration (recipe)
// ---------------------------------------------------------------------------

/** The complete generation configuration; exported/imported as JSON recipes. */
export interface PdfInjectConfig {
  sourceMode: PdfSourceMode
  mode: PdfInjectMode
  backgroundTheme: BackgroundThemeId
  backgroundTexture: BackgroundTextureId
  texturePlacement: TexturePlacementId
  textureRotation: number
  textureScale: number
  customBackgroundColor: string
  customInkColor: string
  backgroundOpacity: number
  textureStrength: number
  title: string
  bodyText: string
  visibleFooter: string
  hiddenPrompt: string
  mismatchMachineFooter: string
  imageOcrText: string
  padding: number
  titleSize: number
  bodySize: number
  footerSize: number
  hiddenSize: number
  visibleX: number
  footerY: number
  hiddenX: number
  hiddenY: number
  injectPlacement: InjectPlacement
  injectPageNumber: number
  injectPageRange: string
  batchVariantCount: number
  enabledChannels: ChannelId[]
  techniqueValues: TechniqueValues
}

/** Recipe file payload (config + ui state). */
export interface PdfInjectRecipe {
  version: number
  exportedAt: string
  uiMode: PdfUiMode
  sourceMode: PdfSourceMode
  mode: PdfInjectMode
  backgroundTheme: BackgroundThemeId
  backgroundTexture: BackgroundTextureId
  texturePlacement: TexturePlacementId
  textureRotation: number
  textureScale: number
  customBackgroundColor: string
  customInkColor: string
  backgroundOpacity: number
  textureStrength: number
  title: string
  bodyText: string
  visibleFooter: string
  hiddenPrompt: string
  mismatchMachineFooter: string
  imageOcrText: string
  padding: number
  titleSize: number
  bodySize: number
  footerSize: number
  hiddenSize: number
  visibleX: number
  footerY: number
  hiddenX: number
  hiddenY: number
  previewOverlayEnabled: boolean
  arenaOcrEnabled: boolean
  injectPlacement: InjectPlacement
  injectPageNumber: number
  injectPageRange: string
  batchVariantCount: number
  enabledChannels: ChannelId[]
  techniqueValues: TechniqueValues
}

// ---------------------------------------------------------------------------
// Fixed constants
// ---------------------------------------------------------------------------

/** A4 page size used for all generated pages. */
export const PDF_PAGE = Object.freeze({ width: 595, height: 842 })

/** Maximum accepted PDF upload size (30 MB). */
export const PDF_UPLOAD_MAX_BYTES = 31_457_280

/** Accepted PDF upload extensions and mime types. */
export const PDF_UPLOAD_ALLOWLIST = Object.freeze({
  extensions: Object.freeze<Record<string, string>>({ '.pdf': 'application/pdf' }),
  mimes: Object.freeze(['application/pdf']),
})

/** Accepted image upload extensions and mime types (PNG / JPEG). */
export const IMAGE_UPLOAD_ALLOWLIST = Object.freeze({
  extensions: Object.freeze<Record<string, string>>({
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
  }),
  mimes: Object.freeze(['image/png', 'image/jpeg']),
})

export const PDF_UPLOAD_ACCEPT = '.pdf,application/pdf'
export const IMAGE_UPLOAD_ACCEPT = '.png,.jpg,.jpeg,image/png,image/jpeg'
