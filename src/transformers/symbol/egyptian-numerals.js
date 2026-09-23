// Egyptian hieroglyph numerals — A1Z26 letters to additive hieroglyph counts (1–26)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const ONE = '\u{133E4}';
    const TEN = '\u{13386}';
    const SEP = '\u2063';

    function letterValue(ch) {
        const code = ch.toUpperCase().charCodeAt(0);
        if (code >= 65 && code <= 90) return code - 64;
        return 0;
    }

    function egyptianGlyph(n) {
        if (n < 1 || n > 99) return '';
        const tens = Math.floor(n / 10);
        const units = n % 10;
        return TEN.repeat(tens) + ONE.repeat(units);
    }

    function parseEgyptian(text) {
        let n = 0;
        for (const ch of text) {
            if (ch === ONE) n += 1;
            else if (ch === TEN) n += 10;
            else break;
        }
        return n;
    }

    return new BaseTransformer({
        name: 'Egyptian Numerals',
        priority: 100,
        category: 'symbol',
        description: 'A1Z26 (A=1 … Z=26) as Egyptian hieroglyph stroke (1) and hobble (10) numerals',
        func: function(text) {
            let out = '';
            let prevGlyph = false;
            for (const ch of text) {
                const n = letterValue(ch);
                if (n) {
                    if (prevGlyph) out += SEP;
                    out += egyptianGlyph(n);
                    prevGlyph = true;
                } else {
                    out += ch;
                    prevGlyph = false;
                }
            }
            return out;
        },
        reverse: function(text) {
            return text.split(SEP).map(function(token) {
                if (!token) return '';
                let run = '';
                let out = '';
                for (const ch of token) {
                    if (ch === ONE || ch === TEN) {
                        run += ch;
                    } else {
                        if (run) {
                            const n = parseEgyptian(run);
                            out += (n >= 1 && n <= 26) ? String.fromCharCode(64 + n) : run;
                            run = '';
                        }
                        out += ch;
                    }
                }
                if (run) {
                    const n = parseEgyptian(run);
                    out += (n >= 1 && n <= 26) ? String.fromCharCode(64 + n) : run;
                }
                return out;
            }).join('');
        },
        preview: function(text) {
            if (!text) return '[egyptian-numerals]';
            return this.func(text.slice(0, 4)) + (text.length > 4 ? '…' : '');
        },
        detector: function(text) {
            return /[\u{133E4}\u{13386}]/u.test(text);
        }
    });
})();
