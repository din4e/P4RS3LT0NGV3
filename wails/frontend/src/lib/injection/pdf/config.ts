/**
 * Static configuration for the PDF injection tool.
 *
 * Ported from icesky js/tools/pdfinject/config.js. All display strings are
 * i18n keys resolved against the tool namespace (`pdfinject`).
 */

import type {
  BackgroundThemeDef,
  BackgroundThemeId,
  BackgroundTextureId,
  IdTitleNote,
  InjectPlacementDef,
  ModeCardDef,
  PdfUiMode,
  ResultTabDef,
  SourceModeDef,
  TexturePlacementId,
} from './types'

/** Default collapsed/open state of the workflow sections. */
export const SECTION_STATE_DEFAULTS: Record<string, boolean> = {
  source: true,
  preset: true,
  upload: true,
  mode: true,
  channels: false,
  conflicts: false,
  content: true,
  examples: true,
  config: true,
  layout: false,
}

/** Sections hidden in simple UI mode. */
export const PRO_ONLY_SECTIONS = ['channels', 'conflicts', 'config', 'layout']

/** UI density modes. */
export const UI_MODES: Array<{ id: PdfUiMode; titleKey: string; noteKey: string }> = [
  { id: 'simple', titleKey: 'uiMode.simple.title', noteKey: 'uiMode.simple.note' },
  { id: 'pro', titleKey: 'uiMode.pro.title', noteKey: 'uiMode.pro.note' },
]

/** Background theme presets. */
export const BACKGROUND_THEMES: BackgroundThemeDef[] = [
  { id: 'white', titleKey: 'theme.white.title', noteKey: 'theme.white.note', bg: '#FFFFFF', ink: '#111827' },
  { id: 'ivory', titleKey: 'theme.ivory.title', noteKey: 'theme.ivory.note', bg: '#F6F1E6', ink: '#2C2418' },
  { id: 'kraft', titleKey: 'theme.kraft.title', noteKey: 'theme.kraft.note', bg: '#EADBC3', ink: '#3A2B18' },
  { id: 'blueprint', titleKey: 'theme.blueprint.title', noteKey: 'theme.blueprint.note', bg: '#E8EFF8', ink: '#162235' },
  { id: 'night', titleKey: 'theme.night.title', noteKey: 'theme.night.note', bg: '#151B24', ink: '#EEF3FF' },
  { id: 'custom', titleKey: 'theme.custom.title', noteKey: 'theme.custom.note', bg: '#F4EFE6', ink: '#1E293B' },
]

/** Background texture presets. */
export const BACKGROUND_TEXTURES: IdTitleNote[] = [
  { id: 'none', titleKey: 'texture.none.title', noteKey: 'texture.none.note' },
  { id: 'paper', titleKey: 'texture.paper.title', noteKey: 'texture.paper.note' },
  { id: 'grid', titleKey: 'texture.grid.title', noteKey: 'texture.grid.note' },
  { id: 'scan', titleKey: 'texture.scan.title', noteKey: 'texture.scan.note' },
  { id: 'custom_image', titleKey: 'texture.customImage.title', noteKey: 'texture.customImage.note' },
]

/** Custom texture placements. */
export const TEXTURE_PLACEMENTS: Array<{
  id: TexturePlacementId
  titleKey: string
  noteKey: string
}> = [
  { id: 'tile', titleKey: 'placement.tile.title', noteKey: 'placement.tile.note' },
  { id: 'stretch', titleKey: 'placement.stretch.title', noteKey: 'placement.stretch.note' },
  { id: 'center', titleKey: 'placement.center.title', noteKey: 'placement.center.note' },
]

/** Result panel tabs (pro-only tabs hidden in simple mode). */
export const RESULT_TABS: ResultTabDef[] = [
  { id: 'summary', titleKey: 'resultTab.summary' },
  { id: 'reader', titleKey: 'resultTab.reader' },
  { id: 'arena', titleKey: 'resultTab.arena' },
  { id: 'detector', titleKey: 'resultTab.detector', proOnly: true },
  { id: 'object', titleKey: 'resultTab.object', proOnly: true },
  { id: 'output', titleKey: 'resultTab.output' },
]

/** Source modes. */
export const SOURCE_MODES: SourceModeDef[] = [
  { id: 'sample', titleKey: 'sourceMode.sample.title', descriptionKey: 'sourceMode.sample.description' },
  { id: 'upload', titleKey: 'sourceMode.upload.title', descriptionKey: 'sourceMode.upload.description' },
  { id: 'imagepdf', titleKey: 'sourceMode.imagepdf.title', descriptionKey: 'sourceMode.imagepdf.description' },
]

/** Base mode cards. */
export const MODE_CARDS: ModeCardDef[] = [
  {
    id: 'normal',
    titleKey: 'modeCard.normal.title',
    shortKey: 'modeCard.normal.short',
    descriptionKey: 'modeCard.normal.description',
    noteKey: 'modeCard.normal.note',
  },
  {
    id: 'hidden',
    titleKey: 'modeCard.hidden.title',
    shortKey: 'modeCard.hidden.short',
    descriptionKey: 'modeCard.hidden.description',
    noteKey: 'modeCard.hidden.note',
  },
  {
    id: 'tounicode',
    titleKey: 'modeCard.tounicode.title',
    shortKey: 'modeCard.tounicode.short',
    descriptionKey: 'modeCard.tounicode.description',
    noteKey: 'modeCard.tounicode.note',
  },
]

/** Inject page placements for upload mode. */
export const INJECT_PLACEMENTS: InjectPlacementDef[] = [
  { id: 'append', titleKey: 'injectPlacement.append.title', descriptionKey: 'injectPlacement.append.description' },
  { id: 'prepend', titleKey: 'injectPlacement.prepend.title', descriptionKey: 'injectPlacement.prepend.description' },
  { id: 'before', titleKey: 'injectPlacement.before.title', descriptionKey: 'injectPlacement.before.description' },
  { id: 'after', titleKey: 'injectPlacement.after.title', descriptionKey: 'injectPlacement.after.description' },
  { id: 'range', titleKey: 'injectPlacement.range.title', descriptionKey: 'injectPlacement.range.description' },
]

/** Technique category tabs. */
export const TECHNIQUE_TABS: Array<{ id: string; titleKey: string }> = [
  { id: 'all', titleKey: 'techniqueTab.all' },
  { id: 'text', titleKey: 'techniqueTab.text' },
  { id: 'structure', titleKey: 'techniqueTab.structure' },
  { id: 'document', titleKey: 'techniqueTab.document' },
  { id: 'action', titleKey: 'techniqueTab.action' },
]

/** Scenario filter tabs. */
export const SCENARIO_TABS: Array<{
  id: string
  titleKey: string
  descriptionKey: string
}> = [
  { id: 'all', titleKey: 'scenarioTab.all.title', descriptionKey: 'scenarioTab.all.description' },
  { id: 'copy', titleKey: 'scenarioTab.copy.title', descriptionKey: 'scenarioTab.copy.description' },
  { id: 'extract', titleKey: 'scenarioTab.extract.title', descriptionKey: 'scenarioTab.extract.description' },
  { id: 'ocr', titleKey: 'scenarioTab.ocr.title', descriptionKey: 'scenarioTab.ocr.description' },
  { id: 'structure', titleKey: 'scenarioTab.structure.title', descriptionKey: 'scenarioTab.structure.description' },
  { id: 'document', titleKey: 'scenarioTab.document.title', descriptionKey: 'scenarioTab.document.description' },
  { id: 'action', titleKey: 'scenarioTab.action.title', descriptionKey: 'scenarioTab.action.description' },
]

/** Look up a theme definition by id (first entry as fallback). */
export function findTheme(id: BackgroundThemeId | string): BackgroundThemeDef {
  return BACKGROUND_THEMES.find((theme) => theme.id === id) ?? BACKGROUND_THEMES[0]
}

/** Look up a texture definition by id. */
export function findTexture(id: BackgroundTextureId | string): IdTitleNote {
  return BACKGROUND_TEXTURES.find((texture) => texture.id === id) ?? BACKGROUND_TEXTURES[0]
}
