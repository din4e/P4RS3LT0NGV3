// Mayan numerals — A1Z26 letters to Unicode Mayan numeral glyphs (positional for 20+)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const ZERO = '\u{124E0}';
    const SEP = '\u2063';

    function letterValue(ch) {
        const code = ch.toUpperCase().charCodeAt(0);
        if (code >= 65 && code <= 90) return code - 64;
        return 0;
    }

    function mayanDigit(n) {
        if (n < 0 || n > 19) return '';
        if (n === 0) return ZERO;
        return String.fromCodePoint(0x124E0 + n);
    }

    function mayanGlyph(n) {
        if (n < 1 || n > 26) return '';
        if (n <= 19) return mayanDigit(n);
        const hi = Math.floor(n / 20);
        const lo = n % 20;
        return mayanDigit(hi) + mayanDigit(lo);
    }

    function codePointLen(text, index) {
        const cp = text.codePointAt(index);
        return cp > 0xFFFF ? 2 : 1;
    }

    function decodeMayanToken(token) {
        let out = '';
        let i = 0;
        while (i < token.length) {
            const cp = token.codePointAt(i);
            if (cp >= 0x124E0 && cp <= 0x124F3) {
                const len = codePointLen(token, i);
                const cp2 = token.codePointAt(i + len);
                if (cp2 >= 0x124E0 && cp2 <= 0x124F3) {
                    const pair = (cp - 0x124E0) * 20 + (cp2 - 0x124E0);
                    if (pair >= 20 && pair <= 26) {
                        out += String.fromCharCode(64 + pair);
                        i += len + codePointLen(token, i + len);
                        continue;
                    }
                }
                const single = cp - 0x124E0;
                if (single >= 1 && single <= 19) {
                    out += String.fromCharCode(64 + single);
                }
                i += len;
            } else {
                out += String.fromCodePoint(cp);
                i += cp > 0xFFFF ? 2 : 1;
            }
        }
        return out;
    }

    return new BaseTransformer({
        name: 'Mayan Numerals',
        priority: 100,
        category: 'symbol',
        description: 'A1Z26 (A=1 … Z=26) as Unicode Mayan numerals (0–19 glyphs; 20+ uses positional pairs)',
        func: function(text) {
            let out = '';
            let prevMayan = false;
            for (const ch of text) {
                const n = letterValue(ch);
                if (n) {
                    if (prevMayan) out += SEP;
                    out += mayanGlyph(n);
                    prevMayan = true;
                } else {
                    out += ch;
                    prevMayan = false;
                }
            }
            return out;
        },
        reverse: function(text) {
            return text.split(SEP).map(decodeMayanToken).join('');
        },
        preview: function(text) {
            if (!text) return '[mayan-numerals]';
            return this.func(text.slice(0, 6)) + (text.length > 6 ? '…' : '');
        },
        detector: function(text) {
            return /[\u{124E0}-\u{124F3}]/u.test(text);
        }
    });
})();
