// @ts-nocheck
// rot13 transform
import { BaseTransformer } from '../BaseTransformer';

export const rot13 = new BaseTransformer({
    name: 'ROT13',
    priority: 60,
    func: function(text: string): string {
        return [...text].map(c => {
            const code = c.charCodeAt(0);
            if (code >= 65 && code <= 90) { // Uppercase letters
                return String.fromCharCode(((code - 65 + 13) % 26) + 65);
            } else if (code >= 97 && code <= 122) { // Lowercase letters
                return String.fromCharCode(((code - 97 + 13) % 26) + 97);
            } else {
                return c;
            }
        }).join('');
    },
    preview: function(text: string): string {
        if (!text) return '[rot13]';
        return this.func(text.slice(0, 3)) + '...';
    },
    reverse: function(text: string): string {
        // ROT13 is its own inverse
        return this.func(text);
    },
    // Detector: Check if text is letters-only (potential ROT13)
    detector: function(text: string): boolean {
        // ROT13 only affects letters, so check if text contains mostly letters
        // Remove punctuation, numbers, and common symbols for the ratio check
        const cleaned = text.replace(/[\s.,!?;:'"()\-&0-9]/g, '');
        // Must be mostly letters (at least 70%) and have some length
        if (cleaned.length < 5) return false;
        const letterCount = (cleaned.match(/[a-zA-Z]/g) || []).length;
        return letterCount / cleaned.length > 0.7;
    }
});
