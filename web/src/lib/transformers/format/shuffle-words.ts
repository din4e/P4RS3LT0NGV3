// @ts-nocheck
// shuffle words transform
import { BaseTransformer } from '../BaseTransformer';

export const shuffleWords = new BaseTransformer({
    name: 'Shuffle Words',
    priority: 50,
    category: 'format',
    func: function(text: string): string {
        // Split by whitespace, shuffle, rejoin
        const words = text.split(/(\s+)/);
        const wordOnly = words.filter((_, i) => i % 2 === 0);
        const spaces = words.filter((_, i) => i % 2 === 1);
        
        // Fisher-Yates shuffle words
        for (let i = wordOnly.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [wordOnly[i], wordOnly[j]] = [wordOnly[j], wordOnly[i]];
        }
        
        // Recombine
        let result = '';
        for (let i = 0; i < wordOnly.length; i++) {
            result += wordOnly[i];
            if (i < spaces.length) result += spaces[i];
        }
        
        return result;
    },
    reverse: function(text: string): string {
        // Cannot reverse - order is randomized
        return text;
    },
    preview: function(text: string): string {
        if (!text) return '[shuffled-words]';
        return this.func(text.slice(0, 20));
    },
    canDecode: false,
    detector: function(text: string): boolean {
        // Cannot detect - random order
        return false;
    }
});

