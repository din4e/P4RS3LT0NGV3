// @ts-nocheck
// numbers only transform (extract only numbers)
import { BaseTransformer } from '../BaseTransformer';

export const numbersOnly = new BaseTransformer({
    name: 'Numbers Only',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        return text.replace(/[^0-9]/g, '');
    },
    reverse: function(text: string): string {
        // Cannot reverse - non-numbers are lost
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[numbers]';
        return this.func(text.slice(0, 10));
    },
    canDecode: false,
    detector: function(text: string): boolean {
        // If text is only digits, might be extracted
        return /^\d+$/.test(text.trim()) && text.length >= 3;
    }
});

