// Babylonian numerals — A1Z26 letters to cuneiform sexagesimal digits (1–59)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const UNITS = ['', '\u{12415}', '\u{12416}', '\u{12417}', '\u{12418}', '\u{12419}',
        '\u{1241A}', '\u{1241B}', '\u{1241C}', '\u{1241D}'];
    const TENS = ['', '\u{1248B}', '\u{12499}', '\u{1240D}', '\u{1240F}', '\u{12410}'];

    function letterValue(ch) {
        const code = ch.toUpperCase().charCodeAt(0);
        if (code >= 65 && code <= 90) return code - 64;
        return 0;
    }

    function babylonianGlyph(n) {
        if (n < 1 || n > 59) return '';
        const tens = Math.floor(n / 10);
        const units = n % 10;
        return (TENS[tens] || '') + (UNITS[units] || '');
    }

    const GLYPHS = [];
    for (let n = 1; n <= 26; n++) {
        GLYPHS.push({ glyph: babylonianGlyph(n), letter: String.fromCharCode(64 + n) });
    }
    GLYPHS.sort(function(a, b) { return b.glyph.length - a.glyph.length; });

    return new BaseTransformer({
        name: 'Babylonian Numerals',
        priority: 100,
        category: 'symbol',
        description: 'A1Z26 (A=1 … Z=26) as Babylonian cuneiform numerals (Unicode sexagesimal signs)',
        func: function(text) {
            return [...text].map(function(ch) {
                const n = letterValue(ch);
                return n ? babylonianGlyph(n) : ch;
            }).join('');
        },
        reverse: function(text) {
            let out = '';
            let i = 0;
            while (i < text.length) {
                let hit = null;
                for (let g = 0; g < GLYPHS.length; g++) {
                    const entry = GLYPHS[g];
                    if (text.startsWith(entry.glyph, i)) {
                        hit = entry;
                        break;
                    }
                }
                if (hit) {
                    out += hit.letter;
                    i += hit.glyph.length;
                } else {
                    const cp = text.codePointAt(i);
                    out += String.fromCodePoint(cp);
                    i += cp > 0xFFFF ? 2 : 1;
                }
            }
            return out;
        },
        preview: function(text) {
            if (!text) return '[babylonian-numerals]';
            return this.func(text.slice(0, 6)) + (text.length > 6 ? '…' : '');
        },
        detector: function(text) {
            return /[\u{12415}-\u{1241D}\u{1248B}\u{12499}\u{1240D}-\u{12410}]/u.test(text);
        }
    });
})();
