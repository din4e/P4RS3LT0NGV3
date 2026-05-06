// @ts-nocheck
// remove newlines transform
import { BaseTransformer } from '../BaseTransformer';

export const removeNewlines = new BaseTransformer({
    name: 'Remove Newlines',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        return text.replace(/[\r\n]+/g, ' ');
    },
    reverse: function(text: string): string {
        // Cannot reverse - newline positions are lost
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[no-newlines]';
        return this.func(text.slice(0, 20));
    },
    canDecode: false,
    detector: function(text: string): boolean {
        // Check if text should have newlines (has long lines)
        return !/[\r\n]/.test(text) && text.length > 50 && text.split(/\s+/).some(w => w.length > 20);
    }
});

