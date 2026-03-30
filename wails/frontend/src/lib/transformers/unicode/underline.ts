// @ts-nocheck
// underline transform
import { BaseTransformer } from '../BaseTransformer';

export const underline = new BaseTransformer({

        name: 'Underline',
    priority: 85,
    func: function(text: string): string {
            // Use proper Unicode combining characters for underline
            const segments = window.EmojiUtils.splitEmojis(text);
            return segments.map(c => c + '\u0332').join('');
        },
        preview: function(text: string): string {
            if (!text) return '[ogham]';
            return this.func(text.slice(0, 3)) + '...';
        },
        reverse: function(text: string): string {
            // Remove combining underline characters
            return text.replace(/\u0332/g, '');
        },
        detector: function(text: string): boolean {
            // Check for combining underline character (U+0332)
            return /\u0332/.test(text);
        }

});