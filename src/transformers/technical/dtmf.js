// DTMF (Dual-Tone Multi-Frequency) telephone tone codes
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const DTMF = {
        '1': '697+1209', '2': '697+1336', '3': '697+1477',
        '4': '770+1209', '5': '770+1336', '6': '770+1477',
        '7': '852+1209', '8': '852+1336', '9': '852+1477',
        '*': '941+1209', '0': '941+1336', '#': '941+1477'
    };
    const REV = Object.fromEntries(Object.entries(DTMF).map(([k, v]) => [v, k]));

    return new BaseTransformer({
        name: 'DTMF Code',
        priority: 70,
        category: 'technical',
        configurableOptions: [
            {
                id: 'format',
                label: 'Output format',
                type: 'select',
                default: 'freq',
                options: [
                    { value: 'freq', label: '697+1209 (Hz pairs)' },
                    { value: 'compact', label: '697-1209' }
                ]
            },
            {
                id: 'spacing',
                label: 'Space between tone codes',
                type: 'boolean',
                default: true
            }
        ],
        func: function(text, options) {
            options = options || {};
            const compact = options.format === 'compact';
            const spaced = options.spacing !== false;
            const sep = compact ? '-' : '+';
            const parts = [...text].map(function(c) {
                const code = DTMF[c];
                if (!code) {
                    return c;
                }
                return compact ? code.replace('+', sep) : code;
            });
            return spaced ? parts.join(' ') : parts.join('');
        },
        reverse: function(text, options) {
            options = options || {};
            const spaced = options.spacing !== false;
            const tokens = spaced ? text.trim().split(/\s+/) : text.split('');
            return tokens.map(function(tok) {
                const norm = tok.replace(/-/g, '+');
                return REV[norm] || tok;
            }).join('');
        },
        preview: function(text, options) {
            if (!text) return '[dtmf]';
            return this.func(text.slice(0, 4), options) + '...';
        },
        detector: function(text) {
            return /\d{3}[+\-]\d{4}/.test(text);
        }
    });
})();
