// @ts-nocheck
// mirror transform
import { BaseTransformer } from '../BaseTransformer';

export const mirror = new BaseTransformer({

        name: 'Mirror Text',
    priority: 85,
    func: function(text: string): string {
            return [...text].reverse().join('');
        },
        preview: function(text: string): string {
            if (!text) return '[math]';
            return this.func(text.slice(0, 3)) + '...';
        },
        reverse: function(text: string): string {
            return this.func(text); // Mirror is its own inverse
        }

});