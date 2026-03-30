// @ts-nocheck
// qwerty-shift transform
import { BaseTransformer } from '../BaseTransformer';

export const qwertyShift = new BaseTransformer({

        name: 'QWERTY Right Shift',
    priority: 40,
    rows: [
            'qwertyuiop',
            'asdfghjkl',
            'zxcvbnm'
        ],
        buildMap: function() {
            if (this._map) return this._map;
            const map = {};
            for (const row of this.rows) {
                for (let i=0;i<row.length;i++) {
                    const from = row[i], to = row[(i+1)%row.length];
                    map[from] = to;
                    map[from.toUpperCase()] = to.toUpperCase();
                }
            }
            this._map = map; return map;
        },
        func: function(text: string): string {
            const m = this.buildMap();
            return [...text].map(c => m[c] || c).join('');
        },
        preview: function(text: string): string {
            if (!text) return '[qwerty]';
            return this.func(text.slice(0,8)) + (text.length>8?'...':'');
        },
        reverse: function(text: string): string {
            const m = this.buildMap();
            const inv = {};
            Object.keys(m).forEach(k => inv[m[k]] = k);
            return [...text].map(c => inv[c] || c).join('');
        }

});