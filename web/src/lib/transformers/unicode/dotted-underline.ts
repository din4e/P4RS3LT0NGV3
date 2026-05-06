// @ts-nocheck
// dotted underline transform (using combining characters)
import { BaseTransformer } from '../BaseTransformer';

export const dottedUnderline = new BaseTransformer({
    name: 'Dotted Underline',
    priority: 100,
    category: 'unicode',
    func: function(text: string): string {
        // Add dotted underline combining character (U+0324) after each character
        return [...text].map(c => c + '\u0324').join('');
    },
    reverse: function(text: string): string {
        // Remove combining dotted below character
        return text.replace(/\u0324/g, '');
    },
    preview: function(text: string): string {
        if (!text) return '[dotted-underline]';
        return this.func(text.slice(0, 8));
    },
    detector: function(text: string): boolean {
        // Check for dotted below combining character
        return /\u0324/.test(text);
    }
});

