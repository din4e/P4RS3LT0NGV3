// @ts-nocheck
// dashed underline transform (using combining characters)
import { BaseTransformer } from '../BaseTransformer';

export const dashedUnderline = new BaseTransformer({
    name: 'Dashed Underline',
    priority: 100,
    category: 'unicode',
    func: function(text: string): string {
        // Add dashed underline combining character (U+0320) after each character
        return [...text].map(c => c + '\u0320').join('');
    },
    reverse: function(text: string): string {
        // Remove combining dashed below character
        return text.replace(/\u0320/g, '');
    },
    preview: function(text: string): string {
        if (!text) return '[dashed-underline]';
        return this.func(text.slice(0, 8));
    },
    detector: function(text: string): boolean {
        // Check for dashed below combining character
        return /\u0320/.test(text);
    }
});

