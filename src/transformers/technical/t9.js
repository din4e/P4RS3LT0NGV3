// T9 / multi-tap cellphone encoding
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const KEYPAD = {
        '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL',
        '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ'
    };

    function letterToT9(ch) {
        const u = ch.toUpperCase();
        if (u < 'A' || u > 'Z') return ch;
        for (const [digit, letters] of Object.entries(KEYPAD)) {
            const idx = letters.indexOf(u);
            if (idx >= 0) return digit.repeat(idx + 1);
        }
        return ch;
    }

    return new BaseTransformer({
        name: 'T9 Multi-tap',
        priority: 70,
        category: 'technical',
        configurableOptions: [
            {
                id: 'spacing',
                label: 'Space between letters',
                type: 'boolean',
                default: true
            }
        ],
        func: function(text, options) {
            options = options || {};
            const parts = [...text].map(c => letterToT9(c));
            return options.spacing ? parts.join(' ') : parts.join('');
        },
        reverse: function(text) {
            const cleaned = text.replace(/\s/g, '');
            let out = '';
            let i = 0;
            while (i < cleaned.length) {
                const d = cleaned[i];
                if (!KEYPAD[d]) {
                    out += d;
                    i++;
                    continue;
                }
                let count = 0;
                while (i < cleaned.length && cleaned[i] === d) {
                    count++;
                    i++;
                }
                const letters = KEYPAD[d];
                out += letters[(count - 1) % letters.length];
            }
            return out;
        },
        preview: function(text, options) {
            if (!text) return '[t9]';
            return this.func(text.slice(0, 5), options) + '...';
        },
        detector: function(text) {
            const cleaned = text.replace(/\s/g, '');
            return cleaned.length >= 4 && /^[2-9]+$/.test(cleaned);
        }
    });
})();
