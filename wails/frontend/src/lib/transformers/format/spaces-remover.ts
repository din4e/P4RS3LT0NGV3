// @ts-nocheck
// spaces remover transform
import { BaseTransformer } from '../BaseTransformer';

export const spacesRemover = new BaseTransformer({
    name: 'Spaces Remover',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        return text.replace(/\s+/g, '');
    },
    reverse: function(text: string): string {
        // Cannot reverse - spaces are lost
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[no-spaces]';
        return this.func(text.slice(0, 10));
    },
    canDecode: false
});

