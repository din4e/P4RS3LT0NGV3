// @ts-nocheck
// letters and numbers only transform
import { BaseTransformer } from '../BaseTransformer';

export const lettersNumbersOnly = new BaseTransformer({
    name: 'Letters & Numbers Only',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        return text.replace(/[^a-zA-Z0-9]/g, '');
    },
    reverse: function(text: string): string {
        // Cannot reverse - other characters are lost
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[alphanum]';
        return this.func(text.slice(0, 10));
    },
    canDecode: false,
    detector: function(text: string): boolean {
        // Check if text is only alphanumeric
        return /^[a-zA-Z0-9]+$/.test(text.trim()) && text.length >= 5;
    }
});

