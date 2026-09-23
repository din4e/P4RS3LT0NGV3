// Route / path cipher (grid + reading route)
import BaseTransformer from '../BaseTransformer.js';

export default (function() {
    function buildGrid(text, cols, pad) {
        const cleaned = text.replace(/\s/g, '').toUpperCase();
        const rows = Math.ceil(cleaned.length / cols);
        const grid = [];
        let idx = 0;
        for (let r = 0; r < rows; r++) {
            grid[r] = [];
            for (let c = 0; c < cols; c++) {
                grid[r][c] = idx < cleaned.length ? cleaned[idx++] : pad;
            }
        }
        return { grid, rows, cols, len: cleaned.length };
    }

    function readSpiral(grid, rows, cols) {
        const out = [];
        let top = 0;
        let bottom = rows - 1;
        let left = 0;
        let right = cols - 1;
        while (top <= bottom && left <= right) {
            for (let c = left; c <= right; c++) out.push(grid[top][c]);
            top++;
            for (let r = top; r <= bottom; r++) out.push(grid[r][right]);
            right--;
            if (top <= bottom) {
                for (let c = right; c >= left; c--) out.push(grid[bottom][c]);
                bottom--;
            }
            if (left <= right) {
                for (let r = bottom; r >= top; r--) out.push(grid[r][left]);
                left++;
            }
        }
        return out.join('');
    }

    function stripPad(text, pad) {
        const esc = pad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return text.replace(new RegExp(esc + '+$'), '');
    }

    function writeSpiral(text, rows, cols, pad) {
        const grid = Array.from({ length: rows }, () => new Array(cols).fill(pad));
        let top = 0;
        let bottom = rows - 1;
        let left = 0;
        let right = cols - 1;
        let idx = 0;
        while (top <= bottom && left <= right && idx < text.length) {
            for (let c = left; c <= right && idx < text.length; c++) grid[top][c] = text[idx++];
            top++;
            for (let r = top; r <= bottom && idx < text.length; r++) grid[r][right] = text[idx++];
            right--;
            if (top <= bottom) {
                for (let c = right; c >= left && idx < text.length; c--) grid[bottom][c] = text[idx++];
                bottom--;
            }
            if (left <= right) {
                for (let r = bottom; r >= top && idx < text.length; r--) grid[r][left] = text[idx++];
                left++;
            }
        }
        return grid;
    }

    return new BaseTransformer({
        name: 'Route Cipher',
        priority: 60,
        category: 'cipher',
        configurableOptions: [
            { id: 'cols', label: 'Grid columns', type: 'number', default: 5, min: 2, max: 20, step: 1 },
            {
                id: 'route',
                label: 'Reading route',
                type: 'select',
                default: 'spiral',
                options: [
                    { value: 'spiral', label: 'Spiral (clockwise)' },
                    { value: 'rows', label: 'Row by row' },
                    { value: 'cols', label: 'Column by column' },
                    { value: 'snake', label: 'Snake rows' }
                ]
            },
            {
                id: 'padChar',
                label: 'Padding character',
                type: 'text',
                default: 'X'
            }
        ],
        _opts: function(options) {
            options = options || {};
            const cols = Math.max(2, Number(options.cols != null ? options.cols : 5) || 5);
            const route = options.route || 'spiral';
            const padChar = String(options.padChar != null ? options.padChar : 'X').charAt(0) || 'X';
            return { cols, route, padChar };
        },
        _readRoute: function(grid, rows, cols, route) {
            if (route === 'rows') return grid.flat().join('');
            if (route === 'cols') {
                let out = '';
                for (let c = 0; c < cols; c++) {
                    for (let r = 0; r < rows; r++) out += grid[r][c];
                }
                return out;
            }
            if (route === 'snake') {
                return grid.map((row, i) => (i % 2 ? [...row].reverse() : row).join('')).join('');
            }
            return readSpiral(grid, rows, cols);
        },
        func: function(text, options) {
            const { cols, route, padChar } = this._opts(options);
            const { grid, rows } = buildGrid(text, cols, padChar);
            const raw = this._readRoute(grid, rows, cols, route);
            return stripPad(raw, padChar);
        },
        reverse: function(text, options) {
            const { cols, route, padChar } = this._opts(options);
            const cleaned = text.replace(/\s/g, '').toUpperCase();
            if (!cleaned.length) return text;
            const rows = Math.ceil(cleaned.length / cols);
            if (route === 'spiral') {
                const grid = writeSpiral(cleaned, rows, cols, padChar);
                let out = '';
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) out += grid[r][c];
                }
                return stripPad(out, padChar);
            }
            if (route === 'rows') return cleaned;
            if (route === 'cols') {
                const grid = Array.from({ length: rows }, () => new Array(cols).fill(padChar));
                let idx = 0;
                for (let c = 0; c < cols; c++) {
                    for (let r = 0; r < rows && idx < cleaned.length; r++) grid[r][c] = cleaned[idx++];
                }
                return stripPad(grid.flat().join(''), padChar);
            }
            if (route === 'snake') {
                const grid = Array.from({ length: rows }, () => new Array(cols).fill(padChar));
                let idx = 0;
                for (let r = 0; r < rows; r++) {
                    const order = r % 2 ? [...Array(cols).keys()].reverse() : [...Array(cols).keys()];
                    for (const c of order) {
                        if (idx < cleaned.length) grid[r][c] = cleaned[idx++];
                    }
                }
                return stripPad(grid.flat().join(''), padChar);
            }
            return cleaned;
        },
        preview: function(text, options) {
            if (!text) return '[route]';
            return this.func(text.slice(0, 10), options).slice(0, 12) + '...';
        }
    });
})();
