// @ts-nocheck
// reverse transform
import { BaseTransformer } from '../BaseTransformer';

export const reverse = new BaseTransformer({

        name: 'Reverse Text',
    priority: 40,
    func: function(text: string): string {
            return [...text].reverse().join('');
        },
        preview: function(text: string): string {
            return this.func(text);
        },
        reverse: function(text: string): string {
            return this.func(text); // Reversing is its own inverse
        }

});