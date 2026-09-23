// 7-segment display encoding (segment masks a-g)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    // Segment order: abcdefg (1 = lit)
    const MASK = {
        '0': '1111110', '1': '0110000', '2': '1101101', '3': '1111001', '4': '0110011',
        '5': '1011011', '6': '1011111', '7': '1110000', '8': '1111111', '9': '1111011',
        'A': '1110111', 'B': '0011111', 'C': '1001110', 'D': '0111101', 'E': '1001111',
        'F': '1000111', '-': '0000001', ' ': '0000000'
    };
    const REV = {};
    for (const [ch, mask] of Object.entries(MASK)) {
        if (!REV[mask]) REV[mask] = ch;
    }

    function toMask(ch) {
        const u = ch.toUpperCase();
        return MASK[u] || MASK[ch] || null;
    }

    return new BaseTransformer({
        name: '7-Segment Display',
        priority: 85,
        category: 'electronics',
        configurableOptions: [
            {
                id: 'separator',
                label: 'Separator between characters',
                type: 'select',
                default: 'space',
                options: [
                    { value: 'space', label: 'Space' },
                    { value: 'pipe', label: 'Pipe (|)' },
                    { value: 'none', label: 'None' }
                ]
            }
        ],
        func: function(text, options) {
            options = options || {};
            const sep = options.separator === 'pipe' ? '|' : (options.separator === 'none' ? '' : ' ');
            return [...text].map(c => toMask(c) || '0000000').join(sep);
        },
        reverse: function(text, options) {
            options = options || {};
            const parts = options.separator === 'pipe'
                ? text.split('|')
                : text.trim().split(/\s+/);
            return parts.map(p => {
                const mask = p.replace(/[^01]/g, '');
                if (mask.length !== 7) return '';
                return REV[mask] || '?';
            }).join('');
        },
        preview: function(text, options) {
            if (!text) return '[7seg]';
            return this.func(text.slice(0, 4), options) + '...';
        },
        detector: function(text) {
            const tokens = text.trim().split(/[\s|]+/);
            return tokens.length >= 2 && tokens.every(t => /^[01]{7}$/.test(t));
        }
    });
})();
