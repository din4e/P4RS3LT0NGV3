// Auto-generated barrel export - do not edit manually
import { BaseTransformer } from './BaseTransformer'
import { setTransformRegistry } from './transformRegistry'

export { BaseTransformer } from "./BaseTransformer"
export type { TransformerConfig, ConfigurableOption, TransformOptions, SelectOption } from "./BaseTransformer"

// ancient
import { elderFuthark } from './ancient/elder-futhark'
import { hieroglyphics } from './ancient/hieroglyphics'
import { ogham } from './ancient/ogham'
import { romanNumerals } from './ancient/roman-numerals'

// case
import { alternatingCase } from './case/alternating-case'
import { camelCase } from './case/camel-case'
import { kebabCase } from './case/kebab-case'
import { randomCase } from './case/random-case'
import { sentenceCase } from './case/sentence-case'
import { snakeCase } from './case/snake-case'
import { titleCase } from './case/title-case'

// cipher
import { acereCipher } from './cipher/acere-cipher'
import { adfgvx } from './cipher/adfgvx'
import { adfgx } from './cipher/adfgx'
import { affine } from './cipher/affine'
import { amsco } from './cipher/amsco'
import { atbash } from './cipher/atbash'
import { autokey } from './cipher/autokey'
import { baconian } from './cipher/baconian'
import { beaufort } from './cipher/beaufort'
import { bifid } from './cipher/bifid'
import { bookCipher } from './cipher/book-cipher'
import { caesar } from './cipher/caesar'
import { codons } from './cipher/codons'
import { columnarTransposition } from './cipher/columnar-transposition'
import { doubleTransposition } from './cipher/double-transposition'
import { fourSquare } from './cipher/four-square'
import { fractionatedMorse } from './cipher/fractionated-morse'
import { gronsfeld } from './cipher/gronsfeld'
import { hill } from './cipher/hill'
import { homophonic } from './cipher/homophonic'
import { keywordShift } from './cipher/keyword-shift'
import { monoalphabetic } from './cipher/monoalphabetic'
import { multiplicativeCipher } from './cipher/multiplicative-cipher'
import { nihilist } from './cipher/nihilist'
import { pigpen } from './cipher/pigpen'
import { playfair } from './cipher/playfair'
import { polybius } from './cipher/polybius'
import { porta } from './cipher/porta'
import { railFence } from './cipher/rail-fence'
import { rot128 } from './cipher/rot128'
import { rot13 } from './cipher/rot13'
import { rot18 } from './cipher/rot18'
import { rot47 } from './cipher/rot47'
import { rot5 } from './cipher/rot5'
import { rot8000 } from './cipher/rot8000'
import { routeCipher } from './cipher/route-cipher'
import { scytale } from './cipher/scytale'
import { trifid } from './cipher/trifid'
import { trithemius } from './cipher/trithemius'
import { twoSquare } from './cipher/two-square'
import { vernam } from './cipher/vernam'
import { vigenere } from './cipher/vigenere'
import { xor } from './cipher/xor'

// concealment
import { acrostic } from './concealment/acrostic'
import { cardanGrille } from './concealment/cardan-grille'
import { homoglyph } from './concealment/homoglyph'
import { nullCipher } from './concealment/null-cipher'
import { trevanion } from './concealment/trevanion'

// encoding
import { ascii85 } from './encoding/ascii85'
import { base122 } from './encoding/base122'
import { base32 } from './encoding/base32'
import { base36 } from './encoding/base36'
import { base45 } from './encoding/base45'
import { base58 } from './encoding/base58'
import { base62 } from './encoding/base62'
import { base64 } from './encoding/base64'
import { base64url } from './encoding/base64url'
import { base91 } from './encoding/base91'
import { baudot } from './encoding/baudot'
import { bcd } from './encoding/bcd'
import { bibiBinary } from './encoding/bibi-binary'
import { binary } from './encoding/binary'
import { decabit } from './encoding/decabit'
import { ebcdic } from './encoding/ebcdic'
import { emojiEncoding } from './encoding/emoji-encoding'
import { grayCode } from './encoding/gray-code'
import { hex } from './encoding/hex'
import { html } from './encoding/html'
import { invisibleText } from './encoding/invisible-text'
import { manchesterCode } from './encoding/manchester-code'
import { metaphone } from './encoding/metaphone'
import { quotedPrintable } from './encoding/quoted-printable'
import { shadoks } from './encoding/shadoks'
import { unicodePoints } from './encoding/unicode-points'
import { url } from './encoding/url'
import { uuencoding } from './encoding/uuencoding'
import { yenc } from './encoding/yenc'
import { z85 } from './encoding/z85'

// fantasy
import { aurebesh } from './fantasy/aurebesh'
import { dovahzul } from './fantasy/dovahzul'
import { klingon } from './fantasy/klingon'
import { quenya } from './fantasy/quenya'
import { tengwar } from './fantasy/tengwar'

// format
import { bitwiseNot } from './format/bitwise-not'
import { boustrophedon } from './format/boustrophedon'
import { capitalizeWords } from './format/capitalize-words'
import { groupLetters } from './format/group-letters'
import { indent } from './format/indent'
import { javanais } from './format/javanais'
import { latinGibberish } from './format/latin-gibberish'
import { leadingZeros } from './format/leading-zeros'
import { leetspeak } from './format/leetspeak'
import { lettersExtraction } from './format/letters-extraction'
import { lettersNumbersOnly } from './format/letters-numbers-only'
import { lineNumbers } from './format/line-numbers'
import { listDeduplicate } from './format/list-deduplicate'
import { louchebem } from './format/louchebem'
import { lowercaseAll } from './format/lowercase-all'
import { mirrorDigits } from './format/mirror-digits'
import { numbersOnly } from './format/numbers-only'
import { pigLatin } from './format/pigLatin'
import { qwertyShift } from './format/qwerty-shift'
import { removeAccents } from './format/remove-accents'
import { removeConsonants } from './format/remove-consonants'
import { removeDuplicates } from './format/remove-duplicates'
import { removeExtraSpaces } from './format/remove-extra-spaces'
import { removeHtmlTags } from './format/remove-html-tags'
import { removeNewlines } from './format/remove-newlines'
import { removeNumbers } from './format/remove-numbers'
import { removePunctuation } from './format/remove-punctuation'
import { removeTabs } from './format/remove-tabs'
import { removeZeroWidth } from './format/remove-zero-width'
import { reverseWords } from './format/reverse-words'
import { reverse } from './format/reverse'
import { shuffleCharacters } from './format/shuffle-characters'
import { shuffleWords } from './format/shuffle-words'
import { shuffledLetters } from './format/shuffled-letters'
import { spacesRemover } from './format/spaces-remover'
import { textJustify } from './format/text-justify'
import { typoglycemia } from './format/typoglycemia'
import { uppercaseAll } from './format/uppercase-all'
import { uppercaseLowercase } from './format/uppercase-lowercase'
import { whitespaceSteganography } from './format/whitespace-steganography'
import { wordLetterAdd } from './format/word-letter-add'
import { wordLetterChange } from './format/word-letter-change'
import { wordLetterRemove } from './format/word-letter-remove'
import { wordWrap } from './format/word-wrap'
import { zerowidthSteganography } from './format/zerowidth-steganography'

// signwriting
import { aslSignwriting } from './signwriting/asl-signwriting'
import { ipaLipreading } from './signwriting/ipa-lipreading'
import { jslSignwriting } from './signwriting/jsl-signwriting'
import { librasSignwriting } from './signwriting/libras-signwriting'
import { morseBlink } from './signwriting/morse-blink'
import { tactileSignwriting } from './signwriting/tactile-signwriting'

// special
import { randomizer } from './special/randomizer'

// symbol
import { alchemical } from './symbol/alchemical'
import { babylonianNumerals } from './symbol/babylonian-numerals'
import { celestial } from './symbol/celestial'
import { daedric } from './symbol/daedric'
import { dancingMen } from './symbol/dancing-men'
import { dominosInDigits } from './symbol/dominos-in-digits'
import { egyptianNumerals } from './symbol/egyptian-numerals'
import { enochian } from './symbol/enochian'
import { eyeOfHorus } from './symbol/eye-of-horus'
import { fridericiWindows } from './symbol/friderici-windows'
import { malachim } from './symbol/malachim'
import { maryStuart } from './symbol/mary-stuart'
import { mayanNumerals } from './symbol/mayan-numerals'
import { moonAlphabet } from './symbol/moon-alphabet'
import { passingTheRiver } from './symbol/passing-the-river'
import { periodicTable } from './symbol/periodic-table'
import { rosicrucian } from './symbol/rosicrucian'
import { sevenSegment } from './symbol/seven-segment'
import { standardGalactic } from './symbol/standard-galactic'
import { templars } from './symbol/templars'
import { theban } from './symbol/theban'
import { youngerFuthark } from './symbol/younger-futhark'

// technical
import { a1z26 } from './technical/a1z26'
import { braille } from './technical/braille'
import { brainfuck } from './technical/brainfuck'
import { dtmf } from './technical/dtmf'
import { icao } from './technical/icao'
import { itu } from './technical/itu'
import { maritimeFlags } from './technical/maritime-flags'
import { morse } from './technical/morse'
import { nato } from './technical/nato'
import { navajoCode } from './technical/navajo-code'
import { phoneKeypad } from './technical/phone-keypad'
import { semaphore } from './technical/semaphore'
import { t9 } from './technical/t9'
import { tapCode } from './technical/tap-code'

// unicode
import { boldItalic } from './unicode/bold-italic'
import { bold } from './unicode/bold'
import { bubble } from './unicode/bubble'
import { chemical } from './unicode/chemical'
import { circled } from './unicode/circled'
import { cursive } from './unicode/cursive'
import { cyrillicStylized } from './unicode/cyrillic-stylized'
import { dashedUnderline } from './unicode/dashed-underline'
import { dottedUnderline } from './unicode/dotted-underline'
import { doubleStruck } from './unicode/doubleStruck'
import { fraktur } from './unicode/fraktur'
import { fullwidth } from './unicode/fullwidth'
import { greek } from './unicode/greek'
import { hiragana } from './unicode/hiragana'
import { italic } from './unicode/italic'
import { katakana } from './unicode/katakana'
import { mathematical } from './unicode/mathematical'
import { medieval } from './unicode/medieval'
import { mirror } from './unicode/mirror'
import { monospace } from './unicode/monospace'
import { negativeSquared } from './unicode/negative-squared'
import { overline } from './unicode/overline'
import { parenthesized } from './unicode/parenthesized'
import { regionalIndicator } from './unicode/regional-indicator'
import { smallCaps } from './unicode/small-caps'
import { squared } from './unicode/squared'
import { strikethrough } from './unicode/strikethrough'
import { subscript } from './unicode/subscript'
import { superscript } from './unicode/superscript'
import { underline } from './unicode/underline'
import { upsideDown } from './unicode/upside-down'
import { vaporwave } from './unicode/vaporwave'
import { wavyUnderline } from './unicode/wavy-underline'
import { wideSpacing } from './unicode/wide-spacing'
import { wingdings } from './unicode/wingdings'
import { zalgo } from './unicode/zalgo'

// visual
import { disemvowel } from './visual/disemvowel'
import { emojiSpeak } from './visual/emoji-speak'
import { rovarspraket } from './visual/rovarspraket'
import { ubbiDubbi } from './visual/ubbi-dubbi'

// Re-export all transformers
export { elderFuthark }
export { hieroglyphics }
export { ogham }
export { romanNumerals }
export { alternatingCase }
export { camelCase }
export { kebabCase }
export { randomCase }
export { sentenceCase }
export { snakeCase }
export { titleCase }
export { acereCipher }
export { adfgvx }
export { adfgx }
export { affine }
export { amsco }
export { atbash }
export { autokey }
export { baconian }
export { beaufort }
export { bifid }
export { bookCipher }
export { caesar }
export { codons }
export { columnarTransposition }
export { doubleTransposition }
export { fourSquare }
export { fractionatedMorse }
export { gronsfeld }
export { hill }
export { homophonic }
export { keywordShift }
export { monoalphabetic }
export { multiplicativeCipher }
export { nihilist }
export { pigpen }
export { playfair }
export { polybius }
export { porta }
export { railFence }
export { rot128 }
export { rot13 }
export { rot18 }
export { rot47 }
export { rot5 }
export { rot8000 }
export { routeCipher }
export { scytale }
export { trifid }
export { trithemius }
export { twoSquare }
export { vernam }
export { vigenere }
export { xor }
export { acrostic }
export { cardanGrille }
export { homoglyph }
export { nullCipher }
export { trevanion }
export { ascii85 }
export { base122 }
export { base32 }
export { base36 }
export { base45 }
export { base58 }
export { base62 }
export { base64 }
export { base64url }
export { base91 }
export { baudot }
export { bcd }
export { bibiBinary }
export { binary }
export { decabit }
export { ebcdic }
export { emojiEncoding }
export { grayCode }
export { hex }
export { html }
export { invisibleText }
export { manchesterCode }
export { metaphone }
export { quotedPrintable }
export { shadoks }
export { unicodePoints }
export { url }
export { uuencoding }
export { yenc }
export { z85 }
export { aurebesh }
export { dovahzul }
export { klingon }
export { quenya }
export { tengwar }
export { bitwiseNot }
export { boustrophedon }
export { capitalizeWords }
export { groupLetters }
export { indent }
export { javanais }
export { latinGibberish }
export { leadingZeros }
export { leetspeak }
export { lettersExtraction }
export { lettersNumbersOnly }
export { lineNumbers }
export { listDeduplicate }
export { louchebem }
export { lowercaseAll }
export { mirrorDigits }
export { numbersOnly }
export { pigLatin }
export { qwertyShift }
export { removeAccents }
export { removeConsonants }
export { removeDuplicates }
export { removeExtraSpaces }
export { removeHtmlTags }
export { removeNewlines }
export { removeNumbers }
export { removePunctuation }
export { removeTabs }
export { removeZeroWidth }
export { reverseWords }
export { reverse }
export { shuffleCharacters }
export { shuffleWords }
export { shuffledLetters }
export { spacesRemover }
export { textJustify }
export { typoglycemia }
export { uppercaseAll }
export { uppercaseLowercase }
export { whitespaceSteganography }
export { wordLetterAdd }
export { wordLetterChange }
export { wordLetterRemove }
export { wordWrap }
export { zerowidthSteganography }
export { aslSignwriting }
export { ipaLipreading }
export { jslSignwriting }
export { librasSignwriting }
export { morseBlink }
export { tactileSignwriting }
export { randomizer }
export { alchemical }
export { babylonianNumerals }
export { celestial }
export { daedric }
export { dancingMen }
export { dominosInDigits }
export { egyptianNumerals }
export { enochian }
export { eyeOfHorus }
export { fridericiWindows }
export { malachim }
export { maryStuart }
export { mayanNumerals }
export { moonAlphabet }
export { passingTheRiver }
export { periodicTable }
export { rosicrucian }
export { sevenSegment }
export { standardGalactic }
export { templars }
export { theban }
export { youngerFuthark }
export { a1z26 }
export { braille }
export { brainfuck }
export { dtmf }
export { icao }
export { itu }
export { maritimeFlags }
export { morse }
export { nato }
export { navajoCode }
export { phoneKeypad }
export { semaphore }
export { t9 }
export { tapCode }
export { boldItalic }
export { bold }
export { bubble }
export { chemical }
export { circled }
export { cursive }
export { cyrillicStylized }
export { dashedUnderline }
export { dottedUnderline }
export { doubleStruck }
export { fraktur }
export { fullwidth }
export { greek }
export { hiragana }
export { italic }
export { katakana }
export { mathematical }
export { medieval }
export { mirror }
export { monospace }
export { negativeSquared }
export { overline }
export { parenthesized }
export { regionalIndicator }
export { smallCaps }
export { squared }
export { strikethrough }
export { subscript }
export { superscript }
export { underline }
export { upsideDown }
export { vaporwave }
export { wavyUnderline }
export { wideSpacing }
export { wingdings }
export { zalgo }
export { disemvowel }
export { emojiSpeak }
export { rovarspraket }
export { ubbiDubbi }

// All transforms as a map
export const allTransforms: Record<string, BaseTransformer> = {
  elderFuthark,
  hieroglyphics,
  ogham,
  romanNumerals,
  alternatingCase,
  camelCase,
  kebabCase,
  randomCase,
  sentenceCase,
  snakeCase,
  titleCase,
  acereCipher,
  adfgvx,
  adfgx,
  affine,
  amsco,
  atbash,
  autokey,
  baconian,
  beaufort,
  bifid,
  bookCipher,
  caesar,
  codons,
  columnarTransposition,
  doubleTransposition,
  fourSquare,
  fractionatedMorse,
  gronsfeld,
  hill,
  homophonic,
  keywordShift,
  monoalphabetic,
  multiplicativeCipher,
  nihilist,
  pigpen,
  playfair,
  polybius,
  porta,
  railFence,
  rot128,
  rot13,
  rot18,
  rot47,
  rot5,
  rot8000,
  routeCipher,
  scytale,
  trifid,
  trithemius,
  twoSquare,
  vernam,
  vigenere,
  xor,
  acrostic,
  cardanGrille,
  homoglyph,
  nullCipher,
  trevanion,
  ascii85,
  base122,
  base32,
  base36,
  base45,
  base58,
  base62,
  base64,
  base64url,
  base91,
  baudot,
  bcd,
  bibiBinary,
  binary,
  decabit,
  ebcdic,
  emojiEncoding,
  grayCode,
  hex,
  html,
  invisibleText,
  manchesterCode,
  metaphone,
  quotedPrintable,
  shadoks,
  unicodePoints,
  url,
  uuencoding,
  yenc,
  z85,
  aurebesh,
  dovahzul,
  klingon,
  quenya,
  tengwar,
  bitwiseNot,
  boustrophedon,
  capitalizeWords,
  groupLetters,
  indent,
  javanais,
  latinGibberish,
  leadingZeros,
  leetspeak,
  lettersExtraction,
  lettersNumbersOnly,
  lineNumbers,
  listDeduplicate,
  louchebem,
  lowercaseAll,
  mirrorDigits,
  numbersOnly,
  pigLatin,
  qwertyShift,
  removeAccents,
  removeConsonants,
  removeDuplicates,
  removeExtraSpaces,
  removeHtmlTags,
  removeNewlines,
  removeNumbers,
  removePunctuation,
  removeTabs,
  removeZeroWidth,
  reverseWords,
  reverse,
  shuffleCharacters,
  shuffleWords,
  shuffledLetters,
  spacesRemover,
  textJustify,
  typoglycemia,
  uppercaseAll,
  uppercaseLowercase,
  whitespaceSteganography,
  wordLetterAdd,
  wordLetterChange,
  wordLetterRemove,
  wordWrap,
  zerowidthSteganography,
  aslSignwriting,
  ipaLipreading,
  jslSignwriting,
  librasSignwriting,
  morseBlink,
  tactileSignwriting,
  randomizer,
  alchemical,
  babylonianNumerals,
  celestial,
  daedric,
  dancingMen,
  dominosInDigits,
  egyptianNumerals,
  enochian,
  eyeOfHorus,
  fridericiWindows,
  malachim,
  maryStuart,
  mayanNumerals,
  moonAlphabet,
  passingTheRiver,
  periodicTable,
  rosicrucian,
  sevenSegment,
  standardGalactic,
  templars,
  theban,
  youngerFuthark,
  a1z26,
  braille,
  brainfuck,
  dtmf,
  icao,
  itu,
  maritimeFlags,
  morse,
  nato,
  navajoCode,
  phoneKeypad,
  semaphore,
  t9,
  tapCode,
  boldItalic,
  bold,
  bubble,
  chemical,
  circled,
  cursive,
  cyrillicStylized,
  dashedUnderline,
  dottedUnderline,
  doubleStruck,
  fraktur,
  fullwidth,
  greek,
  hiragana,
  italic,
  katakana,
  mathematical,
  medieval,
  mirror,
  monospace,
  negativeSquared,
  overline,
  parenthesized,
  regionalIndicator,
  smallCaps,
  squared,
  strikethrough,
  subscript,
  superscript,
  underline,
  upsideDown,
  vaporwave,
  wavyUnderline,
  wideSpacing,
  wingdings,
  zalgo,
  disemvowel,
  emojiSpeak,
  rovarspraket,
  ubbiDubbi,
}

export const transformList: BaseTransformer[] = Object.values(allTransforms)

// Inject the registry for lazy consumers (decoder etc.)
setTransformRegistry(allTransforms)

export const transformsByCategory: Record<string, BaseTransformer[]> = {
  'ancient': [elderFuthark, hieroglyphics, ogham, romanNumerals],
  'case': [alternatingCase, camelCase, kebabCase, randomCase, sentenceCase, snakeCase, titleCase],
  'cipher': [acereCipher, adfgvx, adfgx, affine, amsco, atbash, autokey, baconian, beaufort, bifid, bookCipher, caesar, codons, columnarTransposition, doubleTransposition, fourSquare, fractionatedMorse, gronsfeld, hill, homophonic, keywordShift, monoalphabetic, multiplicativeCipher, nihilist, pigpen, playfair, polybius, porta, railFence, rot128, rot13, rot18, rot47, rot5, rot8000, routeCipher, scytale, trifid, trithemius, twoSquare, vernam, vigenere, xor],
  'concealment': [acrostic, cardanGrille, homoglyph, nullCipher, trevanion],
  'encoding': [ascii85, base122, base32, base36, base45, base58, base62, base64, base64url, base91, baudot, bcd, bibiBinary, binary, decabit, ebcdic, emojiEncoding, grayCode, hex, html, invisibleText, manchesterCode, metaphone, quotedPrintable, shadoks, unicodePoints, url, uuencoding, yenc, z85],
  'fantasy': [aurebesh, dovahzul, klingon, quenya, tengwar],
  'format': [bitwiseNot, boustrophedon, capitalizeWords, groupLetters, indent, javanais, latinGibberish, leadingZeros, leetspeak, lettersExtraction, lettersNumbersOnly, lineNumbers, listDeduplicate, louchebem, lowercaseAll, mirrorDigits, numbersOnly, pigLatin, qwertyShift, removeAccents, removeConsonants, removeDuplicates, removeExtraSpaces, removeHtmlTags, removeNewlines, removeNumbers, removePunctuation, removeTabs, removeZeroWidth, reverseWords, reverse, shuffleCharacters, shuffleWords, shuffledLetters, spacesRemover, textJustify, typoglycemia, uppercaseAll, uppercaseLowercase, whitespaceSteganography, wordLetterAdd, wordLetterChange, wordLetterRemove, wordWrap, zerowidthSteganography],
  'signwriting': [aslSignwriting, ipaLipreading, jslSignwriting, librasSignwriting, morseBlink, tactileSignwriting],
  'special': [randomizer],
  'symbol': [alchemical, babylonianNumerals, celestial, daedric, dancingMen, dominosInDigits, egyptianNumerals, enochian, eyeOfHorus, fridericiWindows, malachim, maryStuart, mayanNumerals, moonAlphabet, passingTheRiver, periodicTable, rosicrucian, sevenSegment, standardGalactic, templars, theban, youngerFuthark],
  'technical': [a1z26, braille, brainfuck, dtmf, icao, itu, maritimeFlags, morse, nato, navajoCode, phoneKeypad, semaphore, t9, tapCode],
  'unicode': [boldItalic, bold, bubble, chemical, circled, cursive, cyrillicStylized, dashedUnderline, dottedUnderline, doubleStruck, fraktur, fullwidth, greek, hiragana, italic, katakana, mathematical, medieval, mirror, monospace, negativeSquared, overline, parenthesized, regionalIndicator, smallCaps, squared, strikethrough, subscript, superscript, underline, upsideDown, vaporwave, wavyUnderline, wideSpacing, wingdings, zalgo],
  'visual': [disemvowel, emojiSpeak, rovarspraket, ubbiDubbi],
}