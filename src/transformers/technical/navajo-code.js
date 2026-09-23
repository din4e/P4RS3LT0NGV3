// Navajo code — WWII code talker alphabet (letter → Navajo word)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const ALPHA = {
        'A': 'WOL-LA-CHEE', 'B': 'SHUSH', 'C': 'MOASI', 'D': 'BE', 'E': 'DZEH',
        'F': 'MA-E', 'G': 'KLIZZIE', 'H': 'LIN', 'I': 'TKIN', 'J': 'TKELE-CHO-G',
        'K': 'KLIZZIE-YAZZIE', 'L': 'DIBEH-YAZZIE', 'M': 'NA-AS-TSO-SI', 'N': 'NESH-CHEE',
        'O': 'NE-AHS-JAH', 'P': 'BI-SO-DIH', 'Q': 'CA-YEILTH', 'R': 'GAH', 'S': 'DIBEH',
        'T': 'THAN-ZIE', 'U': 'NO-DA-IH', 'V': 'A-KEH-DI-GLINI', 'W': 'GLOE-IH',
        'X': 'AL-NA-AS-DZOH', 'Y': 'TSAH-AS-ZIH', 'Z': 'BESH-DO-TLIZ'
    };
    const REV = {};
    for (const [k, v] of Object.entries(ALPHA)) {
        REV[v.toUpperCase()] = k;
    }

    function normalizeToken(t) {
        return t.toUpperCase().replace(/\s/g, '-');
    }

    return new BaseTransformer({
        name: 'Navajo Code',
        priority: 88,
        category: 'cipher',
        configurableOptions: [
            {
                id: 'separator',
                label: 'Separator between words',
                type: 'select',
                default: 'space',
                options: [
                    { value: 'space', label: 'Space' },
                    { value: 'newline', label: 'New line' }
                ]
            }
        ],
        func: function(text, options) {
            options = options || {};
            const sep = options.separator === 'newline' ? '\n' : ' ';
            return [...text].filter(c => /[A-Za-z]/.test(c)).map(c => {
                return ALPHA[c.toUpperCase()] || c.toUpperCase();
            }).join(sep);
        },
        reverse: function(text, options) {
            options = options || {};
            const splitRe = options.separator === 'newline' ? /\n+/ : /\s+/;
            return text.trim().split(splitRe).filter(Boolean).map(t => {
                return REV[normalizeToken(t)] || '';
            }).join('');
        },
        preview: function(text, options) {
            if (!text) return '[navajo]';
            return this.func(text.slice(0, 6), options);
        },
        detector: function(text) {
            const upper = text.toUpperCase();
            const hits = (upper.match(/WOL-LA-CHEE|DZEH|KLIZZIE|NE-AHS-JAH|DIBEH/g) || []).length;
            return hits >= 2;
        }
    });
})();
