/**
 * Background appearance, texture rendering and Type3 footer glyph generation.
 *
 * Ported from icesky PdfInjectTool. Textures and glyphs are rendered on a
 * Canvas, then embedded as raw RGB image XObjects in the generated PDF.
 */

import {
  asciiBytes,
  base64ToBytes,
  clamp,
  hexToRgbFloats,
  mixRgb,
  normalizeHexColor,
  rgbFloatsToHex,
  utf16BeHex,
} from './bytes'
import { findTexture, findTheme } from './config'
import { PDF_PAGE } from './types'
import type {
  BackgroundAppearance,
  BackgroundThemeId,
  BackgroundTextureId,
  LabelResolver,
  LocalizedText,
  PdfInjectConfig,
  TexturePlacementId,
} from './types'

// ---------------------------------------------------------------------------
// Appearance resolution
// ---------------------------------------------------------------------------

/** Resolve theme colors and derived texture/ink blends. */
export function resolveBackgroundAppearance(config: PdfInjectConfig): BackgroundAppearance {
  const theme = findTheme(config.backgroundTheme)
  const bg =
    theme.id === 'custom'
      ? normalizeHexColor(config.customBackgroundColor, theme.bg)
      : normalizeHexColor(theme.bg, '#FFFFFF')
  const ink =
    theme.id === 'custom'
      ? normalizeHexColor(config.customInkColor, theme.ink)
      : normalizeHexColor(theme.ink, '#111827')
  const bgRgb = hexToRgbFloats(bg, '#FFFFFF')
  const inkRgb = hexToRgbFloats(ink, '#111827')
  const isDark = 0.2126 * bgRgb[0] + 0.7152 * bgRgb[1] + 0.0722 * bgRgb[2] < 0.45
  return {
    id: theme.id,
    titleKey: theme.titleKey,
    bg,
    ink,
    bgRgb,
    inkRgb,
    hiddenRgb: bgRgb.slice() as [number, number, number],
    textureLineRgb: mixRgb(bgRgb, inkRgb, isDark ? 0.2 : 0.1),
    textureSoftRgb: mixRgb(bgRgb, inkRgb, isDark ? 0.12 : 0.06),
    isDark,
  }
}

/**
 * Resolve the final appearance after the opacity slider: the theme color is
 * blended toward white/black and ink is re-anchored when contrast collapses.
 */
export function resolveFinalAppearance(config: PdfInjectConfig): BackgroundAppearance {
  const base = resolveBackgroundAppearance(config)
  const opacity = clamp((Number(config.backgroundOpacity) || 0) / 100, 0, 1)
  const bgRgb = mixRgb(base.isDark ? [0.06, 0.08, 0.11] : [1, 1, 1], base.bgRgb, opacity)
  let inkRgb = base.inkRgb.slice() as [number, number, number]
  const bgLuma = 0.2126 * bgRgb[0] + 0.7152 * bgRgb[1] + 0.0722 * bgRgb[2]
  const inkLuma = 0.2126 * inkRgb[0] + 0.7152 * inkRgb[1] + 0.0722 * inkRgb[2]
  if (Math.abs(bgLuma - inkLuma) < 0.38) {
    inkRgb = hexToRgbFloats(bgLuma > 0.56 ? '#1F2937' : '#F8FAFC')
  }
  const isDark = bgLuma < 0.45
  return {
    ...base,
    bgRgb,
    hiddenRgb: bgRgb.slice() as [number, number, number],
    inkRgb,
    textureLineRgb: mixRgb(bgRgb, inkRgb, isDark ? 0.2 : 0.1),
    textureSoftRgb: mixRgb(bgRgb, inkRgb, isDark ? 0.12 : 0.06),
    isDark,
  }
}

/** WCAG-style contrast assessment of the current bg/ink pair. */
export function contrastSummary(config: PdfInjectConfig): {
  ratio: string
  tone: 'good' | 'warn' | 'alert'
  titleKey: string
  detailKey: string
} {
  const appearance = resolveFinalAppearance(config)
  const toLinear = (v: number) => {
    const c = clamp(v)
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const luminance = (rgb: [number, number, number]) =>
    0.2126 * toLinear(rgb[0]) + 0.7152 * toLinear(rgb[1]) + 0.0722 * toLinear(rgb[2])
  const l1 = luminance(appearance.bgRgb)
  const l2 = luminance(appearance.inkRgb)
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  if (ratio >= 7) {
    return { ratio: ratio.toFixed(2), tone: 'good', titleKey: 'contrast.good.title', detailKey: 'contrast.good.detail' }
  }
  if (ratio >= 4.5) {
    return { ratio: ratio.toFixed(2), tone: 'warn', titleKey: 'contrast.warn.title', detailKey: 'contrast.warn.detail' }
  }
  return { ratio: ratio.toFixed(2), tone: 'alert', titleKey: 'contrast.alert.title', detailKey: 'contrast.alert.detail' }
}

// ---------------------------------------------------------------------------
// Background recommendation
// ---------------------------------------------------------------------------

/** A recommended background combo (all ids + a human reason). */
export interface BackgroundRecommendation {
  theme: BackgroundThemeId
  texture: BackgroundTextureId
  placement: TexturePlacementId
  rotation: number
  scale: number
  opacity: number
  strength: number
  reasonKey: string
}

/** Recommend a background combo for the current channels / uploads. */
export function recommendBackgroundCombo(
  config: PdfInjectConfig,
  textureUpload: { width: number; height: number } | null,
): BackgroundRecommendation {
  const enabled = new Set(activeChannelIds(config))
  const rec: BackgroundRecommendation = {
    theme: 'ivory',
    texture: 'paper',
    placement: 'tile',
    rotation: 0,
    scale: 100,
    opacity: 94,
    strength: 26,
    reasonKey: 'backgroundRecommend.default',
  }
  if (textureUpload) {
    const width = Number(textureUpload.width) || 0
    const height = Number(textureUpload.height) || 0
    const aspect = width && height ? width / height : 1
    const placement: TexturePlacementId =
      aspect > 1.8 || aspect < 0.55 ? 'center' : width >= 1200 || height >= 1200 ? 'stretch' : 'tile'
    return {
      ...rec,
      texture: 'custom_image',
      placement,
      rotation: placement === 'tile' ? -8 : 0,
      scale: placement === 'stretch' ? 108 : placement === 'center' ? 88 : 64,
      opacity: 92,
      strength: 38,
      reasonKey: 'backgroundRecommend.customTexture',
    }
  }
  if (config.sourceMode === 'imagepdf') {
    return { ...rec, texture: 'scan', opacity: 88, strength: 24, reasonKey: 'backgroundRecommend.imagePdf' }
  }
  if (config.sourceMode === 'upload') {
    return { ...rec, opacity: 92, strength: 24, reasonKey: 'backgroundRecommend.upload' }
  }
  if (config.mode === 'tounicode' || enabled.has('actual_text') || enabled.has('structure_alt')) {
    return { ...rec, theme: 'blueprint', texture: 'grid', opacity: 90, strength: 30, reasonKey: 'backgroundRecommend.structure' }
  }
  if (config.mode === 'hidden' || enabled.has('white_text') || enabled.has('opacity_zero')) {
    return { ...rec, opacity: 95, strength: 20, reasonKey: 'backgroundRecommend.hidden' }
  }
  if (enabled.has('open_action_js') || enabled.has('incremental')) {
    return { ...rec, theme: 'kraft', texture: 'scan', opacity: 90, strength: 30, reasonKey: 'backgroundRecommend.action' }
  }
  return rec
}

/** Channels active for a config (hidden/imagepdf imply white_text). */
export function activeChannelIds(config: PdfInjectConfig): string[] {
  const set = new Set<string>(Array.isArray(config.enabledChannels) ? config.enabledChannels : [])
  if (config.sourceMode === 'imagepdf' || config.mode === 'hidden') set.add('white_text')
  return Array.from(set)
}

// ---------------------------------------------------------------------------
// Canvas rendering
// ---------------------------------------------------------------------------

function canvasFont(size: number, weight = 600): string {
  return `${weight} ${size}px "Noto Serif SC", "PingFang SC", "Microsoft YaHei", serif`
}

function rgbCss(rgb: [number, number, number]): string {
  return `rgb(${rgb.map((v) => Math.round(255 * clamp(v))).join(',')})`
}

/** A rendered glyph strip for one footer character. */
export interface GlyphAsset {
  bytes: Uint8Array
  pixelWidth: number
  pixelHeight: number
  widthUnits: number
}

/** Canvas-rendered footer glyph assets (per unique character). */
export interface FooterGlyphAssets {
  source: string
  chars: string[]
  assets: Record<string, GlyphAsset>
}

const DEFAULT_FOOTER_TEXT = '机密评审副本，仅作演示请勿转发。'

/**
 * Render the visible footer text onto a canvas and slice it into one RGB
 * image XObject per character (the Type3 font's CharProcs).
 */
export function createFooterGlyphAssets(
  footerText: string,
  opts: { background: string; foreground: string },
): FooterGlyphAssets {
  const text = String(footerText || '').trim() || DEFAULT_FOOTER_TEXT
  const chars = Array.from(text)
  const bg = normalizeHexColor(opts.background, '#FFFFFF')
  const fg = normalizeHexColor(opts.foreground, '#000000')
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('canvasUnsupported')
  ctx.font = canvasFont(160, 600)
  ctx.textBaseline = 'top'
  const advances: number[] = [0]
  let pen = 0
  chars.forEach((ch) => {
    pen += Math.max(1, ctx.measureText(ch).width)
    advances.push(pen)
  })
  const width = Math.ceil(pen) + 24 + 8
  const height = 204
  canvas.width = width
  canvas.height = height
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)
  ctx.font = canvasFont(160, 600)
  ctx.textBaseline = 'top'
  ctx.fillStyle = fg
  ctx.fillText(text, 12, 18)
  const assets: Record<string, GlyphAsset> = {}
  chars.forEach((ch, i) => {
    if (assets[ch]) return
    const x0 = Math.max(0, Math.floor(12 + advances[i]) - 1)
    const x1 = Math.min(width, Math.ceil(12 + advances[i + 1]) + 1)
    const glyphWidth = Math.max(1, x1 - x0)
    const imageData = ctx.getImageData(x0, 0, glyphWidth, height)
    const rgb = new Uint8Array(glyphWidth * height * 3)
    for (let p = 0; p < glyphWidth * height; p += 1) {
      rgb[3 * p] = imageData.data[4 * p]
      rgb[3 * p + 1] = imageData.data[4 * p + 1]
      rgb[3 * p + 2] = imageData.data[4 * p + 2]
    }
    assets[ch] = {
      bytes: rgb,
      pixelWidth: glyphWidth,
      pixelHeight: height,
      widthUnits: Math.max(1, Math.round((glyphWidth / Math.max(height, 1)) * 1000 * 1.12)),
    }
  })
  return { source: text, chars, assets }
}

/** Build the ToUnicode CMap stream bytes mapping glyph codes to machine text. */
export function buildToUnicodeCMap(machineChars: string[]): Uint8Array {
  const chars = Array.isArray(machineChars) ? machineChars : []
  const lines = [
    '/CIDInit /ProcSet findresource begin',
    '12 dict begin',
    'begincmap',
    '/CIDSystemInfo',
    '<< /Registry (Adobe)',
    '/Ordering (UCS)',
    '/Supplement 0',
    '>> def',
    '/CMapName /F2ToUnicode def',
    '/CMapType 2 def',
    '1 begincodespacerange',
    '<01> <FF>',
    'endcodespacerange',
    `${chars.length} beginbfchar`,
  ]
  chars.forEach((ch, i) => {
    const code = String(i + 1)
      .padStart(2, '0')
      .toUpperCase()
    const unicode = utf16BeHex(ch || '​') || utf16BeHex('​')
    lines.push(`<${code}> <${unicode}>`)
  })
  lines.push(
    'endbfchar',
    'endcmap',
    'CMapName currentdict /CMap defineresource pop',
    'end',
    'end',
  )
  return asciiBytes(lines.join('\n'))
}

/** A full-page background rendered to raw RGB + PNG bytes. */
export interface BackgroundImageAsset {
  width: number
  height: number
  rgbBytes: Uint8Array
  pngBytes: Uint8Array
  dataUrl: string
  background: BackgroundAppearance
}

/** Custom texture pixel data captured from an uploaded image. */
export interface TextureImageAsset {
  width: number
  height: number
  pixels: Uint8ClampedArray
}

/**
 * Render the full page background (theme color + texture, or a custom
 * uploaded texture) into raw RGB bytes and a PNG.
 */
export function buildBackgroundImageAsset(
  config: PdfInjectConfig,
  appearance: BackgroundAppearance,
  textureAsset: TextureImageAsset | null,
): BackgroundImageAsset {
  const texture = findTexture(config.backgroundTexture)
  const strength = clamp((Number(config.textureStrength) || 0) / 100, 0, 1)
  const canvas = document.createElement('canvas')
  canvas.width = PDF_PAGE.width
  canvas.height = PDF_PAGE.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('canvasUnsupported')
  ctx.fillStyle = rgbCss(appearance.bgRgb)
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  if (strength > 0) {
    if (texture.id === 'paper') {
      ctx.save()
      ctx.globalAlpha = 0.16 + 0.36 * strength
      ctx.strokeStyle = rgbCss(appearance.textureSoftRgb)
      ctx.lineWidth = 0.8
      for (let y = 56; y < canvas.height - 24; y += 68) {
        const jitter = (y / 4) % 26
        ctx.beginPath()
        ctx.moveTo(24 + jitter, y)
        ctx.lineTo(canvas.width - 26 - 0.3 * jitter, y + 1.4)
        ctx.stroke()
      }
      ctx.fillStyle = rgbCss(mixRgb(appearance.bgRgb, appearance.inkRgb, appearance.isDark ? 0.18 : 0.08))
      for (let i = 0; i < 18; i += 1) {
        const x = 28 + ((67 * i) % Math.max(120, canvas.width - 56))
        const y = 36 + ((91 * i) % Math.max(120, canvas.height - 72))
        const size = i % 3 === 0 ? 2.2 : 1.4
        ctx.fillRect(x, y, size, size)
      }
      ctx.restore()
    } else if (texture.id === 'grid') {
      ctx.save()
      ctx.globalAlpha = 0.12 + 0.4 * strength
      ctx.strokeStyle = rgbCss(appearance.textureLineRgb)
      ctx.lineWidth = 0.7
      for (let x = 24; x < canvas.width; x += 36) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 24; y < canvas.height; y += 36) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
      ctx.restore()
    } else if (texture.id === 'scan') {
      ctx.save()
      ctx.globalAlpha = 0.16 + 0.42 * strength
      ctx.fillStyle = rgbCss(mixRgb(appearance.bgRgb, appearance.inkRgb, appearance.isDark ? 0.22 : 0.08))
      ctx.fillRect(0, canvas.height - 72, canvas.width, 44)
      ctx.fillRect(0, 0, canvas.width, 30)
      ctx.strokeStyle = rgbCss(appearance.textureLineRgb)
      ctx.lineWidth = 0.8
      for (let y = 48; y < canvas.height - 18; y += 94) {
        ctx.beginPath()
        ctx.moveTo(18, y)
        ctx.lineTo(canvas.width - 18, y + 0.8)
        ctx.stroke()
      }
      ctx.fillStyle = rgbCss(appearance.textureSoftRgb)
      for (let i = 0; i < 22; i += 1) {
        const x = 14 + ((83 * i) % Math.max(120, canvas.width - 28))
        const y = 18 + ((57 * i) % Math.max(120, canvas.height - 36))
        ctx.fillRect(x, y, 1.5, 1.5)
      }
      ctx.restore()
    } else if (texture.id === 'custom_image' && textureAsset) {
      const sourceCanvas = document.createElement('canvas')
      sourceCanvas.width = textureAsset.width
      sourceCanvas.height = textureAsset.height
      const sourceCtx = sourceCanvas.getContext('2d')
      if (sourceCtx) {
        const imageData = sourceCtx.createImageData(textureAsset.width, textureAsset.height)
        imageData.data.set(textureAsset.pixels)
        sourceCtx.putImageData(imageData, 0, 0)
        const placement = config.texturePlacement
        const alpha = 0.1 + 0.75 * strength
        const radians = ((Number(config.textureRotation) || 0) * Math.PI) / 180
        const scale = Math.max(0.1, (Number(config.textureScale) || 100) / 100)
        const cos = Math.cos(radians)
        const sin = Math.sin(radians)
        const makeRotatedCanvas = (w: number, h: number): HTMLCanvasElement | null => {
          const rotated = document.createElement('canvas')
          const rw = Math.max(1, w)
          const rh = Math.max(1, h)
          rotated.width = Math.max(1, Math.ceil(Math.abs(cos) * rw + Math.abs(sin) * rh))
          rotated.height = Math.max(1, Math.ceil(Math.abs(sin) * rw + Math.abs(cos) * rh))
          const rotatedCtx = rotated.getContext('2d')
          if (!rotatedCtx) return null
          rotatedCtx.translate(rotated.width / 2, rotated.height / 2)
          rotatedCtx.rotate(radians)
          rotatedCtx.drawImage(sourceCanvas, -rw / 2, -rh / 2, rw, rh)
          return rotated
        }
        if (placement === 'stretch') {
          const stretched = makeRotatedCanvas(canvas.width * scale, canvas.height * scale)
          if (stretched) {
            ctx.save()
            ctx.globalAlpha = alpha
            ctx.drawImage(stretched, (canvas.width - stretched.width) / 2, (canvas.height - stretched.height) / 2, stretched.width, stretched.height)
            ctx.restore()
          }
        } else if (placement === 'center') {
          const fit = Math.min(
            canvas.width / Math.max(sourceCanvas.width, 1),
            canvas.height / Math.max(sourceCanvas.height, 1),
            1,
          )
          const centered = makeRotatedCanvas(sourceCanvas.width * fit * scale, sourceCanvas.height * fit * scale)
          if (centered) {
            ctx.save()
            ctx.globalAlpha = alpha
            ctx.drawImage(centered, (canvas.width - centered.width) / 2, (canvas.height - centered.height) / 2, centered.width, centered.height)
            ctx.restore()
          }
        } else {
          const tiled = makeRotatedCanvas(sourceCanvas.width * scale, sourceCanvas.height * scale)
          const pattern = tiled ? ctx.createPattern(tiled, 'repeat') : null
          if (pattern) {
            ctx.save()
            ctx.globalAlpha = alpha
            ctx.fillStyle = pattern
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.restore()
          }
        }
      }
    }
  }
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const rgbBytes = new Uint8Array(canvas.width * canvas.height * 3)
  for (let p = 0; p < canvas.width * canvas.height; p += 1) {
    rgbBytes[3 * p] = imageData.data[4 * p]
    rgbBytes[3 * p + 1] = imageData.data[4 * p + 1]
    rgbBytes[3 * p + 2] = imageData.data[4 * p + 2]
  }
  const dataUrl = canvas.toDataURL('image/png')
  const pngBytes = base64ToBytes(String(dataUrl).split(',')[1] || '')
  return { width: canvas.width, height: canvas.height, rgbBytes, pngBytes, dataUrl, background: appearance }
}

/** i18n note describing the current background combo (resolved by caller). */
export function backgroundComboNote(
  config: PdfInjectConfig,
  resolve: LabelResolver,
): LocalizedText {
  const theme = findTheme(config.backgroundTheme)
  const texture = findTexture(config.backgroundTexture)
  if (texture.id === 'custom_image') {
    return {
      key: 'backgroundComboNote.custom',
      params: {
        theme: resolve(theme.titleKey),
        texture: resolve(texture.titleKey),
        placement: resolve(`placement.${config.texturePlacement}.title`),
      },
    }
  }
  return {
    key: 'backgroundComboNote.default',
    params: { theme: resolve(theme.titleKey), texture: resolve(texture.titleKey) },
  }
}

/** Hex string of a resolved appearance's background (for glyph rendering). */
export function appearanceBgHex(appearance: BackgroundAppearance): string {
  return rgbFloatsToHex(appearance.bgRgb, appearance.bg)
}

/** Hex string of a resolved appearance's ink. */
export function appearanceInkHex(appearance: BackgroundAppearance): string {
  return rgbFloatsToHex(appearance.inkRgb, appearance.ink)
}

/** Format a pdf coordinate pair for display. */
export function formatCoords(x: number, y: number): string {
  return `X ${Math.round(Number(x) || 0)} / Y ${Math.round(Number(y) || 0)}`
}
