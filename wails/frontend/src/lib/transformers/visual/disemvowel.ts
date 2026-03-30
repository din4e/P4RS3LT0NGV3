// @ts-nocheck
// disemvowel transform
import { BaseTransformer } from '../BaseTransformer';

export const disemvowel = new BaseTransformer({

        name: 'Disemvowel',
    priority: 40,
    func: function(text: string): string {
            return text.replace(/[aeiouAEIOU]/g, '');
        },
        preview: function(text: string): string {
            if (!text) return '[dsmvwl]';
            return this.func(text.slice(0, 12)) + (text.length > 12 ? '...' : '');
        }

});