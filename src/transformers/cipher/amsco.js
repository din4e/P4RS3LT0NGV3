// AMSCO cipher (alternating 1/2 column heights + keyword transposition)
import BaseTransformer from '../BaseTransformer.js';

export default new BaseTransformer({
    name: 'AMSCO Cipher',
    priority: 60,
    category: 'cipher',
    key: 'KEY',
    configurableOptions: [
        { id: 'key', label: 'Keyword', type: 'text', default: 'KEY' }
    ],
    _key: function(options) {
        const k = options && options.key != null ? String(options.key) : null;
        return (k || this.key || 'KEY').toUpperCase().replace(/[^A-Z]/g, '');
    },
    _colCapacity: function(colIndex) {
        return colIndex % 2 === 0 ? 1 : 2;
    },
    _sortedColumns: function(key) {
        return key.split('').map((char, index) => ({ char, index }))
            .sort((a, b) => (a.char === b.char ? a.index - b.index : a.char.localeCompare(b.char)));
    },
    _columnLengths: function(textLen, numCols) {
        const lens = new Array(numCols).fill(0);
        let idx = 0;
        while (idx < textLen) {
            for (let col = 0; col < numCols && idx < textLen; col++) {
                const take = Math.min(this._colCapacity(col), textLen - idx);
                lens[col] += take;
                idx += take;
            }
        }
        return lens;
    },
    func: function(text, options) {
        const key = this._key(options);
        if (!key.length) return text;
        const cleaned = text.toUpperCase().replace(/[^A-Z]/g, '');
        if (!cleaned.length) return text;

        const numCols = key.length;
        const columns = Array.from({ length: numCols }, () => '');
        let idx = 0;
        while (idx < cleaned.length) {
            for (let col = 0; col < numCols && idx < cleaned.length; col++) {
                const take = Math.min(this._colCapacity(col), cleaned.length - idx);
                columns[col] += cleaned.slice(idx, idx + take);
                idx += take;
            }
        }

        let out = '';
        for (const item of this._sortedColumns(key)) out += columns[item.index];
        return out;
    },
    reverse: function(text, options) {
        const key = this._key(options);
        if (!key.length) return text;
        const cleaned = text.toUpperCase().replace(/[^A-Z]/g, '');
        if (!cleaned.length) return text;

        const numCols = key.length;
        const lens = this._columnLengths(cleaned.length, numCols);
        const columns = Array.from({ length: numCols }, () => '');
        let idx = 0;
        for (const item of this._sortedColumns(key)) {
            const len = lens[item.index];
            columns[item.index] = cleaned.slice(idx, idx + len);
            idx += len;
        }

        const colOffsets = new Array(numCols).fill(0);
        let out = '';
        let remaining = cleaned.length;
        while (remaining > 0) {
            for (let col = 0; col < numCols && remaining > 0; col++) {
                const take = Math.min(this._colCapacity(col), columns[col].length - colOffsets[col], remaining);
                if (take <= 0) continue;
                out += columns[col].slice(colOffsets[col], colOffsets[col] + take);
                colOffsets[col] += take;
                remaining -= take;
            }
        }
        return out;
    },
    preview: function(text, options) {
        if (!text) return '[amsco]';
        return this.func(text.slice(0, 8), options).slice(0, 12) + '...';
    }
});
