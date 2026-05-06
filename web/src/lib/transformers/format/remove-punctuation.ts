// @ts-nocheck
// remove punctuation transform
import { BaseTransformer } from '../BaseTransformer';

export const removePunctuation = new BaseTransformer({
    name: 'Remove Punctuation',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        return text.replace(/[.,!?;:'"()\-_\[\]{}@#$%^&*+=|\\\/<>~`]/g, '');
    },
    reverse: function(text: string): string {
        // Cannot reverse - punctuation is lost
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[no-punct]';
        return this.func(text.slice(0, 10));
    },
    canDecode: false,
    detector: function(text: string): boolean {
        // Hard to detect - would need to check if text should have punctuation
        return false;
    }
});

