// @ts-nocheck
// fullwidth transform
import { BaseTransformer } from '../BaseTransformer';

export const fullwidth = new BaseTransformer({

        name: 'Full Width',
    priority: 85,
    func: function(text: string): string {
            return [...text].map(c => {
                const code = c.charCodeAt(0);
                // Convert ASCII to full-width equivalents
                if (code >= 33 && code <= 126) {
                    return String.fromCharCode(code + 0xFEE0);
                } else if (code === 32) { // Space
                    return '　'; // Full-width space
                } else {
                    return c;
                }
            }).join('');
        },
        preview: function(text: string): string {
            if (!text) return '[tengwar]';
            return this.func(text.slice(0, 3)) + '...';
        },
        reverse: function(text: string): string {
            return [...text].map(c => {
                const code = c.charCodeAt(0);
                // Convert full-width back to ASCII
                if (code >= 0xFF01 && code <= 0xFF5E) {
                    return String.fromCharCode(code - 0xFEE0);
                } else if (code === 0x3000) { // Full-width space
                    return ' '; // ASCII space
                } else {
                    return c;
                }
            }).join('');
        }

});