// @ts-nocheck
// rovarspraket transform
import { BaseTransformer } from '../BaseTransformer';

export const rovarspraket = new BaseTransformer({

        name: 'Rövarspråket',
    priority: 40,
    isConsonant: function(c) { return /[bcdfghjklmnpqrstvwxyz]/i.test(c); },
        func: function(text: string): string {
            return [...text].map(ch => this.isConsonant(ch) ? (ch + 'o' + ch) : ch).join('');
        },
        preview: function(text: string): string {
            if (!text) return 'totexxtot';
            return this.func(text.slice(0, 6)) + (text.length > 6 ? '...' : '');
        },
        reverse: function(text: string): string {
            // Collapse consonant-o-consonant patterns where the two consonants match
            return text.replace(/([bcdfghjklmnpqrstvwxyz])o\1/gi, '$1');
        }

});