// @ts-nocheck
// wide spacing transform (adds spaces between characters)
import { BaseTransformer } from '../BaseTransformer';

export const wideSpacing = new BaseTransformer({
    name: 'Wide Spacing',
    priority: 100,
    category: 'unicode',
    func: function(text: string): string {
        // Add space between each character
        return [...text].join(' ');
    },
    reverse: function(text: string): string {
        // Remove all spaces
        return text.replace(/\s+/g, '');
    },
    preview: function(text: string): string {
        if (!text) return '[wide-spacing]';
        return this.func(text.slice(0, 8));
    },
    detector: function(text: string): boolean {
        // Check if text has spaces between most characters
        // At least 50% of characters should be followed by a space
        if (text.length < 3) return false;
        const spaceCount = (text.match(/\s/g) || []).length;
        const charCount = text.replace(/\s/g, '').length;
        return charCount > 0 && spaceCount / (charCount + spaceCount) > 0.3;
    }
});

