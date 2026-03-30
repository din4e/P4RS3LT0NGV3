// @ts-nocheck
// random-case transform
import { BaseTransformer } from '../BaseTransformer';

export const randomCase = new BaseTransformer({

        name: 'Random Case',
    priority: 40,
    func: function(text: string): string {
            return [...text].map(c => /[a-z]/i.test(c) ? (Math.random() < 0.5 ? c.toLowerCase() : c.toUpperCase()) : c).join('');
        },
        preview: function(text: string): string {
            if (!text) return '[RaNdOm]';
            return this.func(text.slice(0, 8)) + (text.length > 8 ? '...' : '');
        }

});