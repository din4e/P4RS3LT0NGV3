// Shadoks numeral system — GA BU ZO MEU (base 4) for text via UTF-8 bytes
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const DIGITS = ['GA', 'BU', 'ZO', 'MEU'];
    const REV = { GA: 0, BU: 1, ZO: 2, MEU: 3 };

    function toShadoks(n) {
        if (n === 0) return 'GA';
        let x = n;
        let out = '';
        while (x > 0) {
            out = DIGITS[x % 4] + (out ? ' ' + out : '');
            x = Math.floor(x / 4);
        }
        return out;
    }

    function fromShadoks(tokens) {
        let n = 0;
        for (const t of tokens) {
            const v = REV[t.toUpperCase()];
            if (v === undefined) return null;
            n = n * 4 + v;
        }
        return n;
    }

    return new BaseTransformer({
        name: 'Shadoks Numeral System',
        priority: 82,
        category: 'encoding',
        configurableOptions: [
            {
                id: 'separator',
                label: 'Separator between bytes',
                type: 'select',
                default: 'pipe',
                options: [
                    { value: 'pipe', label: 'Pipe (|)' },
                    { value: 'space', label: 'Space' }
                ]
            }
        ],
        func: function(text, options) {
            options = options || {};
            const sep = options.separator === 'space' ? ' ' : ' | ';
            const bytes = new TextEncoder().encode(text);
            return Array.from(bytes).map(b => toShadoks(b)).join(sep);
        },
        reverse: function(text, options) {
            options = options || {};
            const groups = options.separator === 'space'
                ? text.trim().split(/\s{2,}|\|/)
                : text.split('|');
            const bytes = [];
            for (const g of groups) {
                const tokens = g.trim().split(/\s+/).filter(Boolean);
                const n = fromShadoks(tokens);
                if (n === null || n > 255) return text;
                bytes.push(n);
            }
            try {
                return new TextDecoder().decode(new Uint8Array(bytes));
            } catch (e) {
                return text;
            }
        },
        preview: function(text, options) {
            if (!text) return '[shadok]';
            return this.func(text.slice(0, 2), options);
        },
        detector: function(text) {
            return /\b(GA|BU|ZO|MEU)(\s+(GA|BU|ZO|MEU))+\b/i.test(text);
        }
    });
})();
