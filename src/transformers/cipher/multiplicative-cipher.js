// Multiplicative cipher (mod 26; key must be coprime with 26)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const COPRIMES = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];
    const INVERSES = { 1: 1, 3: 9, 5: 21, 7: 15, 9: 3, 11: 19, 15: 7, 17: 23, 19: 11, 21: 5, 23: 17, 25: 25 };

    return new BaseTransformer({
        name: 'Multiplicative Cipher',
        priority: 60,
        category: 'cipher',
        multiplier: 5,
        configurableOptions: [
            {
                id: 'multiplier',
                label: 'Multiplier (coprime with 26)',
                type: 'select',
                default: '5',
                options: COPRIMES.map(n => ({ value: String(n), label: String(n) }))
            }
        ],
        _mult: function(options) {
            const m = Number(options && options.multiplier != null ? options.multiplier : this.multiplier);
            return COPRIMES.includes(m) ? m : 5;
        },
        func: function(text, options) {
            const mult = this._mult(options || {});
            return [...text].map(c => {
                const code = c.charCodeAt(0);
                if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65) * mult % 26) + 65);
                if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97) * mult % 26) + 97);
                return c;
            }).join('');
        },
        reverse: function(text, options) {
            const mult = this._mult(options || {});
            const inv = INVERSES[mult] || 21;
            return [...text].map(c => {
                const code = c.charCodeAt(0);
                if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65) * inv % 26) + 65);
                if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97) * inv % 26) + 97);
                return c;
            }).join('');
        },
        preview: function(text, options) {
            if (!text) return '[mult]';
            return this.func(text.slice(0, 6), options) + '...';
        }
    });
})();
