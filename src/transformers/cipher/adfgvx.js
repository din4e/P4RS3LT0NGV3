// ADFGVX cipher (WWI extension of ADFGX with digits)
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'ADFGVX Cipher',
    priority: 60,
    category: 'cipher',
    key: 'KEYWORD',
    coords: ['A', 'D', 'F', 'G', 'V', 'X'],
    square: [
        ['A', 'B', 'C', 'D', 'E', 'F'],
        ['G', 'H', 'I', 'J', 'K', 'L'],
        ['M', 'N', 'O', 'P', 'Q', 'R'],
        ['S', 'T', 'U', 'V', 'W', 'X'],
        ['Y', 'Z', '0', '1', '2', '3'],
        ['4', '5', '6', '7', '8', '9']
    ],
    configurableOptions: [
        {
            id: 'polybiusKey',
            label: 'Polybius square keyword',
            type: 'text',
            default: ''
        },
        {
            id: 'key',
            label: 'Transposition keyword',
            type: 'text',
            default: 'KEYWORD'
        }
    ],
    _buildSquare: function(polybiusKey) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const key = String(polybiusKey || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/J/g, 'I');
        const seen = new Set();
        let cells = '';
        for (let i = 0; i < key.length; i++) {
            const c = key[i];
            if (!seen.has(c)) {
                seen.add(c);
                cells += c;
            }
        }
        for (let i = 0; i < alphabet.length; i++) {
            const c = alphabet[i];
            if (!seen.has(c)) {
                seen.add(c);
                cells += c;
            }
        }
        cells = cells.padEnd(36, 'X').slice(0, 36);
        const square = [];
        for (let row = 0; row < 6; row++) {
            square.push(cells.slice(row * 6, row * 6 + 6).split(''));
        }
        return square;
    },
    _squareFor: function(options) {
        options = options || {};
        const polybiusKey = String(options.polybiusKey || '').trim();
        return polybiusKey ? this._buildSquare(polybiusKey) : this.square;
    },
    _transKey: function(options) {
        const k = options && options.key !== undefined && options.key !== null
            ? String(options.key)
            : null;
        return (k || this.key || 'KEYWORD').toUpperCase().replace(/[^A-Z]/g, '');
    },
    _charToPair: function(char, square) {
        const c = char === 'J' ? 'I' : char;
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                if (square[row][col] === c) {
                    return this.coords[row] + this.coords[col];
                }
            }
        }
        return '';
    },
    _pairToChar: function(pair, square) {
        if (pair.length !== 2) return '';
        const row = this.coords.indexOf(pair[0]);
        const col = this.coords.indexOf(pair[1]);
        if (row < 0 || col < 0) return '';
        return square[row][col];
    },
    _columnarEncode: function(text, transKey) {
        const numCols = transKey.length;
        const numRows = Math.ceil(text.length / numCols);
        const grid = [];
        let idx = 0;
        for (let row = 0; row < numRows; row++) {
            grid[row] = [];
            for (let col = 0; col < numCols; col++) {
                grid[row][col] = idx < text.length ? text[idx++] : '';
            }
        }
        const keyOrder = transKey.split('').map((char, index) => ({ char, index }))
            .sort((a, b) => (a.char === b.char ? a.index - b.index : a.char.localeCompare(b.char)));
        let result = '';
        for (const item of keyOrder) {
            for (let row = 0; row < numRows; row++) {
                if (grid[row][item.index]) result += grid[row][item.index];
            }
        }
        return result;
    },
    _columnarDecode: function(text, transKey) {
        const numCols = transKey.length;
        const numRows = Math.ceil(text.length / numCols);
        const keyOrder = transKey.split('').map((char, index) => ({ char, index }))
            .sort((a, b) => (a.char === b.char ? a.index - b.index : a.char.localeCompare(b.char)));
        const grid = Array.from({ length: numRows }, () => new Array(numCols));
        let textIdx = 0;
        for (const item of keyOrder) {
            const colLen = Math.ceil((text.length - item.index) / numCols);
            for (let row = 0; row < colLen && textIdx < text.length; row++) {
                grid[row][item.index] = text[textIdx++];
            }
        }
        let out = '';
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < numCols; col++) {
                if (grid[row][col]) out += grid[row][col];
            }
        }
        return out;
    },
    func: function(text, options) {
        options = options || {};
        const transKey = this._transKey(options);
        if (!transKey.length) return text;
        const square = this._squareFor(options);
        const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/J/g, 'I');
        if (!cleaned.length) return text;
        let pairs = '';
        for (const char of cleaned) pairs += this._charToPair(char, square);
        return this._columnarEncode(pairs, transKey);
    },
    reverse: function(text, options) {
        options = options || {};
        const transKey = this._transKey(options);
        if (!transKey.length) return text;
        const square = this._squareFor(options);
        const cleaned = text.toUpperCase().replace(/[^ADFGVX]/g, '');
        if (!cleaned.length || cleaned.length % 2 !== 0) return text;
        const pairs = this._columnarDecode(cleaned, transKey);
        let result = '';
        for (let i = 0; i < pairs.length; i += 2) {
            result += this._pairToChar(pairs.slice(i, i + 2), square);
        }
        return result;
    },
    preview: function(text, options) {
        if (!text) return '[adfgvx]';
        return this.func(text.slice(0, 4), options).slice(0, 12) + '...';
    },
    detector: function(text) {
        const cleaned = text.replace(/\s/g, '').toUpperCase();
        return cleaned.length >= 10 && cleaned.length % 2 === 0 && /^[ADFGVX]+$/.test(cleaned);
    }
});
