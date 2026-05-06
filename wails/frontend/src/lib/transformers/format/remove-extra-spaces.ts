// @ts-nocheck
// remove extra spaces transform
import { BaseTransformer } from '../BaseTransformer';

export const removeExtraSpaces = new BaseTransformer({
    name: 'Remove Extra Spaces',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        return text.replace(/[ \t]+/g, ' ').trim();
    },
    reverse: function(text: string): string {
        // Cannot reverse - original spacing is lost
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[no-extra-spaces]';
        return this.func(text.slice(0, 10));
    },
    canDecode: false,
    detector: function(text: string): boolean {
        // Check if text has multiple consecutive spaces
        return /  +/.test(text);
    }
});

