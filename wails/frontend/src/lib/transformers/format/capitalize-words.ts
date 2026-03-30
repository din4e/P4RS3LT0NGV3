// @ts-nocheck
// capitalize words transform (first letter of each word uppercase)
import { BaseTransformer } from '../BaseTransformer';

export const capitalizeWords = new BaseTransformer({
    name: 'Capitalize Words',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        return text.replace(/\b\w/g, c => c.toUpperCase());
    },
    reverse: function(text: string): string {
        // Cannot reverse - original case is lost
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[Capitalized]';
        return this.func(text.slice(0, 15));
    },
    canDecode: false,
    detector: function(text: string): boolean {
        // Check if words start with uppercase (Title Case pattern)
        const words = text.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
        if (words.length < 2) return false;
        return words.every(w => /^[A-Z]/.test(w) || !/[a-zA-Z]/.test(w));
    }
});

