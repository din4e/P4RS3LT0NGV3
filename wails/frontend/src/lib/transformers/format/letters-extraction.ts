// @ts-nocheck
// letters extraction transform (extract only letters)
import { BaseTransformer } from '../BaseTransformer';

export const lettersExtraction = new BaseTransformer({
    name: 'Letters Only',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        return text.replace(/[^a-zA-Z]/g, '');
    },
    reverse: function(text: string): string {
        // Cannot reverse - non-letters are lost
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[letters]';
        return this.func(text.slice(0, 10));
    },
    canDecode: false
});

