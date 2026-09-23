// @ts-nocheck
// Periodic table cipher — letters to element symbols
import { BaseTransformer } from '../BaseTransformer';

export const periodicTable = (function() {
    const MAP = {
        'A': 'Ag', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'Es', 'F': 'F', 'G': 'Ge',
        'H': 'H', 'I': 'I', 'J': 'Jr', 'K': 'K', 'L': 'Li', 'M': 'Mg', 'N': 'N',
        'O': 'O', 'P': 'P', 'Q': 'Qu', 'R': 'Ra', 'S': 'S', 'T': 'Ti', 'U': 'U',
        'V': 'V', 'W': 'W', 'X': 'Xe', 'Y': 'Y', 'Z': 'Zn'
    };
    const REV = {};
    for (const [k, v] of Object.entries(MAP)) REV[v] = k;

    return new BaseTransformer({
        name: 'Periodic Table Cipher',
        priority: 86,
        category: 'cipher',
        configurableOptions: [
            {
                id: 'separator',
                label: 'Separator between symbols',
                type: 'select',
                default: 'space',
                options: [
                    { value: 'space', label: 'Space' },
                    { value: 'none', label: 'None' }
                ]
            }
        ],
        func: function(text: string, options?: TransformOptions): string {
            options = options || {};
            const sep = options.separator === 'none' ? '' : ' ';
            return [...text.toUpperCase()].filter(c => /[A-Z]/.test(c)).map(c => MAP[c] || c).join(sep);
        },
        reverse: function(text: string, options?: TransformOptions): string {
            options = options || {};
            const tokens = options.separator === 'none'
                ? text.match(/[A-Z][a-z]?/g) || []
                : text.trim().split(/\s+/);
            return tokens.map(t => REV[t] || '').join('');
        },
        preview: function(text: string, options?: TransformOptions): string {
            if (!text) return '[periodic]';
            return this.func(text.slice(0, 8), options);
        },
        detector: function(text: string): boolean {
            const tokens = text.trim().split(/\s+/);
            return tokens.length >= 2 && tokens.every(t => REV[t] !== undefined);
        }
    });
})();
