// @ts-nocheck
// atbash transform
import { BaseTransformer } from '../BaseTransformer';

export const atbash = new BaseTransformer({
    name: 'Atbash Cipher',
    priority: 60,
    // Detector: Check if text is mostly letters (atbash is hard to detect specifically)
    detector: function(text: string): boolean {
        // Remove punctuation, numbers, and common symbols for the ratio check
        const cleaned = text.replace(/[\s.,!?;:'"()\-&0-9]/g, '');
        if (cleaned.length < 5) return false;
        const letterCount = (cleaned.match(/[a-zA-Z]/g) || []).length;
        // Must be mostly letters (at least 70%)
        return letterCount / cleaned.length > 0.7;
    },
    func: function(text: string): string {
        const a = 'a'.charCodeAt(0), z = 'z'.charCodeAt(0);
        const A = 'A'.charCodeAt(0), Z = 'Z'.charCodeAt(0);
        return [...text].map(c => {
            const code = c.charCodeAt(0);
            if (code >= A && code <= Z) return String.fromCharCode(Z - (code - A));
            if (code >= a && code <= z) return String.fromCharCode(z - (code - a));
            return c;
        }).join('');
    },
    preview: function(text: string): string {
        if (!text) return '[atbash]';
        return this.func(text.slice(0, 6)) + (text.length > 6 ? '...' : '');
    },
    reverse: function(text: string): string {
        // Atbash is its own inverse
        return this.func(text);
    }
});
