// @ts-nocheck
// shuffle characters transform
import { BaseTransformer } from '../BaseTransformer';

export const shuffleCharacters = new BaseTransformer({
    name: 'Shuffle Characters',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        // Fisher-Yates shuffle
        const chars = [...text];
        for (let i = chars.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        return chars.join('');
    },
    reverse: function(text: string): string {
        // Cannot reverse - order is randomized
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[shuffled]';
        return this.func(text.slice(0, 10));
    },
    canDecode: false,
    detector: function(text: string): boolean {
        // Cannot detect - random order
        return false;
    }
});

