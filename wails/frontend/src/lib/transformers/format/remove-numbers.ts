// @ts-nocheck
// remove numbers transform
import { BaseTransformer } from '../BaseTransformer';

export const removeNumbers = new BaseTransformer({
    name: 'Remove Numbers',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        return text.replace(/[0-9]/g, '');
    },
    reverse: function(text: string): string {
        // Cannot reverse - numbers are lost
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[no-numbers]';
        return this.func(text.slice(0, 10));
    },
    canDecode: false,
    detector: function(text: string): boolean {
        // Hard to detect - would need context
        return false;
    }
});

