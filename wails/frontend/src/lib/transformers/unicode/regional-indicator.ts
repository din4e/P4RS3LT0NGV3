// @ts-nocheck
// regional-indicator transform
import { BaseTransformer } from '../BaseTransformer';

export const regionalIndicator = new BaseTransformer({

        name: 'Regional Indicator Letters',
    priority: 70,
    func: function(text: string): string {
            const base = 0x1F1E6;
            return [...text].map(c => {
                const up = c.toUpperCase();
                if (up >= 'A' && up <= 'Z') {
                    const code = base + (up.charCodeAt(0) - 65);
                    return String.fromCodePoint(code);
                }
                return c;
            }).join('');
        },
        preview: function(text: string): string {
            if (!text) return '🇦🇧🇨';
            return this.func(text.slice(0, 4)) + (text.length > 4 ? '...' : '');
        },
        reverse: function(text: string): string {
            const base = 0x1F1E6;
            return [...text].map(ch => {
                const cp = ch.codePointAt(0);
                if (cp >= base && cp <= base + 25) {
                    return String.fromCharCode(65 + (cp - base));
                }
                return ch;
            }).join('');
        }

});