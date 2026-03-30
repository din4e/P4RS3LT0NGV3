// @ts-nocheck
// uppercase lowercase toggle transform
import { BaseTransformer } from '../BaseTransformer';

export const uppercaseLowercase = new BaseTransformer({
    name: 'Toggle Case',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        return [...text].map(c => {
            if (c >= 'A' && c <= 'Z') {
                return c.toLowerCase();
            } else if (c >= 'a' && c <= 'z') {
                return c.toUpperCase();
            }
            return c;
        }).join('');
    },
    reverse: function(text: string): string {
        // Toggle case is its own inverse
        return this.func(text);
    },
    preview: function(text: string): string {
        if (!text) return '[toggle]';
        return this.func(text.slice(0, 10));
    },
    detector: function(text: string): boolean {
        // Hard to detect - would need pattern analysis
        return false;
    }
});

