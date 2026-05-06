// @ts-nocheck
// rot5 transform
import { BaseTransformer } from '../BaseTransformer';

export const rot5 = new BaseTransformer({

        name: 'ROT5',
    priority: 60,
    func: function(text: string): string {
            return [...text].map(c => {
                if (c >= '0' && c <= '9') {
                    const n = c.charCodeAt(0) - 48;
                    return String.fromCharCode(48 + ((n + 5) % 10));
                }
                return c;
            }).join('');
        },
        preview: function(text: string): string {
            if (!text) return '[rot5]';
            return this.func(text.slice(0, 6)) + (text.length > 6 ? '...' : '');
        },
        reverse: function(text: string): string {
            // ROT5 is its own inverse
            return this.func(text);
        }

});