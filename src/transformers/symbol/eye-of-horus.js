// Eye of Horus (Wedjat) — A1Z26 mapped to the seven Wedjat fraction hieroglyphs
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const PARTS = [
        '\u{13080}',
        '\u{13081}',
        '\u{13082}',
        '\u{13083}',
        '\u{13084}',
        '\u{13085}',
        '\u{13086}'
    ];

    function letterValue(ch) {
        const code = ch.toUpperCase().charCodeAt(0);
        if (code >= 65 && code <= 90) return code - 64;
        return 0;
    }

    const REV = {};
    for (let n = 1; n <= 26; n++) {
        const glyph = PARTS[(n - 1) % PARTS.length];
        if (!REV[glyph]) REV[glyph] = String.fromCharCode(64 + n);
    }

    return new BaseTransformer({
        name: 'Eye of Horus (Wedjat)',
        priority: 100,
        category: 'symbol',
        description: 'A1Z26 cycles through the seven Eye of Horus (Wedjat) fraction hieroglyphs',
        func: function(text) {
            return [...text].map(function(ch) {
                const n = letterValue(ch);
                return n ? PARTS[(n - 1) % PARTS.length] : ch;
            }).join('');
        },
        reverse: function(text) {
            return [...text].map(function(ch) {
                return REV[ch] || ch;
            }).join('');
        },
        preview: function(text) {
            if (!text) return '[eye-of-horus]';
            return this.func(text.slice(0, 6)) + (text.length > 6 ? '…' : '');
        },
        detector: function(text) {
            return /[\u{13080}-\u{13086}]/u.test(text);
        }
    });
})();
