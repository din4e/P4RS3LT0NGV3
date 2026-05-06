// @ts-nocheck
// ubbi-dubbi transform
import { BaseTransformer } from '../BaseTransformer';

export const ubbiDubbi = new BaseTransformer({

        name: 'Ubbi Dubbi',
    priority: 40,
    func: function(text: string): string {
            // Insert 'ub' before vowels (simple, reversible scheme)
            return text.replace(/([AEIOUaeiou])/g, 'ub$1');
        },
        preview: function(text: string): string {
            if (!text) return 'hubellubo';
            return this.func(text.slice(0, 8)) + (text.length > 8 ? '...' : '');
        },
        reverse: function(text: string): string {
            return text.replace(/ub([AEIOUaeiou])/g, '$1');
        }

});