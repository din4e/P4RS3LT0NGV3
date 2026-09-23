// Friderici window cipher — 4-pane window symbols per letter (1685 Fensterchiffre)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    // Pane order TL TR BL BR — B=black ▓, W=white □, D=dotted ◉
    // 24-letter Latin (J→I, V→U). Pane map from Friderici Cryptographia (1685).
    const MAP = {
        'A': 'WWBW', 'B': 'BBWW', 'C': 'BWWB', 'D': 'WBBB', 'E': 'WBWW', 'F': 'BBBW',
        'G': 'WWBB', 'H': 'WWWB', 'I': 'WBBW', 'K': 'BBWB', 'L': 'BWDB', 'M': 'BWBW',
        'N': 'BWBB', 'O': 'BWWW', 'P': 'WBWB', 'Q': 'DWWB', 'R': 'BBBB', 'S': 'BWWD',
        'T': 'BBBD', 'U': 'WBBD', 'W': 'BBDB', 'X': 'WWWW', 'Y': 'BBWD', 'Z': 'BBDW'
    };
    const REV = {};
    for (const [k, v] of Object.entries(MAP)) REV[v] = k;

    function normalizeLatin24(text) {
        return text.toUpperCase().replace(/J/g, 'I').replace(/V/g, 'U');
    }

    function paneChar(code) {
        if (code === 'B') return '\u2593';
        if (code === 'D') return '\u25C9';
        return '\u25A1';
    }

    function encodeWindow(code) {
        return [...code].map(paneChar).join('');
    }

    function decodeWindow(symbol) {
        let code = '';
        for (const ch of symbol) {
            if (ch === '\u2593') code += 'B';
            else if (ch === '\u25C9') code += 'D';
            else code += 'W';
        }
        return code.length === 4 ? REV[code] || '' : '';
    }

    return new BaseTransformer({
        name: 'Friderici Cipher (Windows)',
        priority: 95,
        category: 'symbol',
        description: 'Friderici Fensterchiffre (1685): 4-pane windows (▓ □ ◉). J→I, V→U. Pane map from Cryptographia key.',
        configurableOptions: [
            {
                id: 'separator',
                label: 'Separator between windows',
                type: 'select',
                default: 'space',
                options: [
                    { value: 'space', label: 'Space' },
                    { value: 'none', label: 'None' }
                ]
            }
        ],
        func: function(text, options) {
            options = options || {};
            const sep = options.separator === 'none' ? '' : ' ';
            return [...normalizeLatin24(text)].map(function(c) {
                const code = MAP[c];
                return code ? encodeWindow(code) : c;
            }).join(sep);
        },
        reverse: function(text, options) {
            options = options || {};
            const parts = options.separator === 'none'
                ? text.match(/[\u2593\u25C9\u25A1]{4}/g) || []
                : text.trim().split(/\s+/);
            return parts.map(decodeWindow).join('');
        },
        preview: function(text, options) {
            if (!text) return '[friderici]';
            return this.func(text.slice(0, 4), options);
        },
        detector: function(text) {
            return /([\u2593\u25C9\u25A1]{4}\s*){2,}/.test(text);
        }
    });
})();
