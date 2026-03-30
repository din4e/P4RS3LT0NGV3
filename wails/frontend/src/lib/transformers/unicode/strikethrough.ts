// @ts-nocheck
// strikethrough transform
import { BaseTransformer } from '../BaseTransformer';

export const strikethrough = new BaseTransformer({

        name: 'Strikethrough',
    priority: 85,
    func: function(text: string): string {
            // Use proper Unicode combining characters for strikethrough
            const segments = window.EmojiUtils.splitEmojis(text);
            return segments.map(c => c + '\u0336').join('');
        },
        preview: function(text: string): string {
            if (!text) return '[hieroglyphics]';
            return this.func(text.slice(0, 3)) + '...';
        },
        reverse: function(text: string): string {
            // Remove combining strikethrough characters
            return text.replace(/\u0336/g, '');
        },
        detector: function(text: string): boolean {
            // Check for combining strikethrough character (U+0336)
            return /\u0336/.test(text);
        }

});