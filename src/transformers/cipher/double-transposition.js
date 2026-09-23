// Double columnar transposition cipher
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    function columnarEncode(text, key, pad) {
        pad = pad || 'X';
        const numCols = key.length;
        const numRows = Math.ceil(text.length / numCols);
        const grid = [];
        let idx = 0;
        for (let row = 0; row < numRows; row++) {
            grid[row] = [];
            for (let col = 0; col < numCols; col++) {
                grid[row][col] = idx < text.length ? text[idx++] : pad;
            }
        }
        const order = key.split('').map((char, index) => ({ char, index }))
            .sort((a, b) => (a.char === b.char ? a.index - b.index : a.char.localeCompare(b.char)));
        let out = '';
        for (const item of order) {
            for (let row = 0; row < numRows; row++) out += grid[row][item.index];
        }
        return out;
    }

    function columnarDecode(text, key, pad) {
        pad = pad || 'X';
        const numCols = key.length;
        const numRows = Math.ceil(text.length / numCols);
        const order = key.split('').map((char, index) => ({ char, index }))
            .sort((a, b) => (a.char === b.char ? a.index - b.index : a.char.localeCompare(b.char)));
        const grid = Array.from({ length: numRows }, () => new Array(numCols));
        let textIdx = 0;
        for (const item of order) {
            for (let row = 0; row < numRows && textIdx < text.length; row++) {
                grid[row][item.index] = text[textIdx++];
            }
        }
        let out = '';
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                if (grid[row][col]) out += grid[row][col];
            }
        }
        return out.replace(new RegExp((pad || 'X').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '+$'), '');
    }

    return new BaseTransformer({
        name: 'Double Transposition',
        priority: 60,
        category: 'cipher',
        key1: 'FIRST',
        key2: 'SECOND',
        configurableOptions: [
            { id: 'key1', label: 'First keyword', type: 'text', default: 'FIRST' },
            { id: 'key2', label: 'Second keyword', type: 'text', default: 'SECOND' },
            {
                id: 'padChar',
                label: 'Padding character',
                type: 'text',
                default: 'X'
            }
        ],
        _keys: function(options) {
            options = options || {};
            const k1 = String(options.key1 != null ? options.key1 : this.key1).toUpperCase().replace(/[^A-Z]/g, '');
            const k2 = String(options.key2 != null ? options.key2 : this.key2).toUpperCase().replace(/[^A-Z]/g, '');
            const padChar = String(options.padChar != null ? options.padChar : 'X').charAt(0) || 'X';
            return { k1: k1 || 'FIRST', k2: k2 || 'SECOND', padChar };
        },
        func: function(text, options) {
            const { k1, k2, padChar } = this._keys(options);
            const cleaned = text.replace(/\s/g, '').toUpperCase();
            if (!cleaned.length) return text;
            return columnarEncode(columnarEncode(cleaned, k1, padChar), k2, padChar);
        },
        reverse: function(text, options) {
            const { k1, k2, padChar } = this._keys(options);
            const cleaned = text.replace(/\s/g, '').toUpperCase();
            if (!cleaned.length) return text;
            const esc = padChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return columnarDecode(columnarDecode(cleaned, k2, padChar), k1, padChar).replace(new RegExp(esc + '+$'), '');
        },
        preview: function(text, options) {
            if (!text) return '[double-trans]';
            return this.func(text.slice(0, 8), options).slice(0, 12) + '...';
        }
    });
})();
