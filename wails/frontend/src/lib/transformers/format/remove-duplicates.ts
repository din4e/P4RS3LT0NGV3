// @ts-nocheck
// remove duplicate characters transform
import { BaseTransformer } from '../BaseTransformer';

export const removeDuplicates = new BaseTransformer({
    name: 'Remove Duplicates',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        const seen = new Set();
        return [...text].filter(c => {
            if (seen.has(c)) {
                return false;
            }
            seen.add(c);
            return true;
        }).join('');
    },
    reverse: function(text: string): string {
        // Cannot reverse - duplicates are lost
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[no-dupes]';
        return this.func(text.slice(0, 10));
    },
    canDecode: false,
    detector: function(text: string): boolean {
        // Check if text has no duplicate characters
        const chars = [...text];
        const unique = new Set(chars);
        return chars.length === unique.size && text.length >= 5;
    }
});

