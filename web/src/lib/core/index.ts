// @ts-nocheck
/**
 * Core library barrel export.
 */
export { universalDecode } from './decoder'
export {
  setEmojiData as setStegEmojiData,
  setStegOptions,
  getStegOptions,
  hasEmojiInText,
  carriers,
  encodeEmoji,
  decodeEmoji,
  encodeInvisible,
  decodeInvisible,
} from './steganography'
export {
  getMergedTransformOptions,
  getMergedTransformOptionsForName,
} from './transformOptions'
