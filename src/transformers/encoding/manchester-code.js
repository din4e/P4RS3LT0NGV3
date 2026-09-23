// Manchester line code (IEEE 802.3: 0=10, 1=01)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    function toBits(text) {
        const bytes = new TextEncoder().encode(text);
        return Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join('');
    }

    function fromBits(bits) {
        const bytes = [];
        for (let i = 0; i + 8 <= bits.length; i += 8) {
            bytes.push(parseInt(bits.slice(i, i + 8), 2));
        }
        try {
            return new TextDecoder().decode(new Uint8Array(bytes));
        } catch (e) {
            return bits;
        }
    }

    return new BaseTransformer({
        name: 'Manchester Code',
        priority: 95,
        category: 'technical',
        configurableOptions: [
            {
                id: 'spacing',
                label: 'Space between bit pairs',
                type: 'boolean',
                default: true
            }
        ],
        func: function(text, options) {
            options = options || {};
            const pairs = [...toBits(text)].map(b => (b === '0' ? '10' : '01'));
            return options.spacing ? pairs.join(' ') : pairs.join('');
        },
        reverse: function(text, options) {
            options = options || {};
            const cleaned = text.replace(/\s/g, '');
            if (!/^[01]+$/.test(cleaned) || cleaned.length % 2 !== 0) return text;
            let bits = '';
            for (let i = 0; i < cleaned.length; i += 2) {
                const pair = cleaned.slice(i, i + 2);
                if (pair === '10') bits += '0';
                else if (pair === '01') bits += '1';
                else return text;
            }
            return fromBits(bits);
        },
        preview: function(text, options) {
            if (!text) return '[manchester]';
            const out = this.func(text.slice(0, 2), options);
            return out.length > 24 ? out.slice(0, 24) + '...' : out;
        },
        detector: function(text) {
            const cleaned = text.replace(/\s/g, '');
            return cleaned.length >= 16 && /^[01]+$/.test(cleaned) && cleaned.length % 2 === 0
                && /^((10|01)+)$/.test(cleaned);
        }
    });
})();
