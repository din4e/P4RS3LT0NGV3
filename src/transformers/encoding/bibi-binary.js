// Bibi-binary (Boby Lapointe) — hex syllables for text via UTF-8 bytes
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    const HEX_TO_BIBI = {
        '0': 'HO', '1': 'HA', '2': 'HE', '3': 'HI', '4': 'BO', '5': 'BA',
        '6': 'BE', '7': 'BI', '8': 'KO', '9': 'KA', 'a': 'KE', 'b': 'KI',
        'c': 'DO', 'd': 'DA', 'e': 'DE', 'f': 'DI'
    };
    const BIBI_TO_HEX = {};
    for (const [h, b] of Object.entries(HEX_TO_BIBI)) BIBI_TO_HEX[b.toUpperCase()] = h;

    function parseBibiToken(t) {
        return BIBI_TO_HEX[t.toUpperCase()] || null;
    }

    return new BaseTransformer({
        name: 'Bibi-binary Code',
        priority: 85,
        category: 'encoding',
        configurableOptions: [
            {
                id: 'separator',
                label: 'Separator between syllable pairs',
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
            const bytes = new TextEncoder().encode(text);
            const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
            const pairs = [];
            for (let i = 0; i < hex.length; i += 2) {
                const pair = hex.slice(i, i + 2);
                pairs.push(HEX_TO_BIBI[pair[0]] + HEX_TO_BIBI[pair[1]]);
            }
            return pairs.join(sep);
        },
        reverse: function(text, options) {
            options = options || {};
            const tokens = options.separator === 'none'
                ? text.match(/[A-Za-z]{4}/g) || []
                : text.trim().split(/\s+/);
            let hex = '';
            for (const tok of tokens) {
                if (tok.length !== 4) continue;
                const h1 = parseBibiToken(tok.slice(0, 2));
                const h2 = parseBibiToken(tok.slice(2, 4));
                if (h1 && h2) hex += h1 + h2;
            }
            if (!hex || hex.length % 2 !== 0) return text;
            const bytes = new Uint8Array(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
            try {
                return new TextDecoder().decode(bytes);
            } catch (e) {
                return text;
            }
        },
        preview: function(text, options) {
            if (!text) return '[bibi]';
            return this.func(text.slice(0, 3), options);
        },
        detector: function(text) {
            const tokens = text.trim().split(/\s+/);
            return tokens.length >= 2 && tokens.every(t => /^[A-Za-z]{4}$/.test(t));
        }
    });
})();
